import { NextResponse } from 'next/server';
import { CAU_HINH_UNG_HO, duongDanNoiBo, lyDoHopLe } from '@/lib/support/config';
import { LoiPayos, payosDaCauHinh, taoDonPayos } from '@/lib/payments/payos';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { nguoiDungHienTai } from '@/lib/supabase/server';

/**
 * Tạo một đơn ủng hộ.
 *
 * Ba thứ tuyệt đối không nhận từ client: userId (lấy từ phiên), orderCode (máy
 * chủ sinh), và trạng thái đã trả (chỉ webhook đã xác thực mới đặt được).
 */
export const dynamic = 'force-dynamic';

function loi(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
  const user = await nguoiDungHienTai();
  if (!user) return loi('UNAUTHENTICATED', 'Phần này cần tài khoản.', 401);

  const db = taoSupabaseAdmin();
  if (!db || !payosDaCauHinh) {
    return loi(
      'PAYMENT_NOT_CONFIGURED',
      'Chưa bật nhận ủng hộ trên bản triển khai này.',
      503
    );
  }

  let body: { amount?: unknown; reason?: unknown; returnTo?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return loi('BAD_REQUEST', 'Body không hợp lệ');
  }

  if (!lyDoHopLe(body.reason)) return loi('BAD_REASON', 'Lý do ủng hộ không hợp lệ');

  const amount = Number(body.amount);
  if (
    !Number.isInteger(amount) ||
    amount < CAU_HINH_UNG_HO.minSupportAmount ||
    amount > CAU_HINH_UNG_HO.maxSupportAmount
  ) {
    return loi(
      'BAD_AMOUNT',
      `Số tiền phải từ ${CAU_HINH_UNG_HO.minSupportAmount.toLocaleString('vi-VN')}đ đến ${CAU_HINH_UNG_HO.maxSupportAmount.toLocaleString('vi-VN')}đ.`
    );
  }

  // Chống spam link: dùng lại đơn đang chờ cùng số tiền và cùng lý do thay vì
  // đẻ thêm một đơn mới mỗi lần bấm.
  const { data: dangCho } = await db
    .from('support_payments')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .eq('amount_vnd', amount)
    .eq('reason', body.reason)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dangCho) {
    return NextResponse.json({
      paymentId: dangCho.id,
      orderCode: Number(dangCho.order_code),
      amount,
      status: 'pending',
      checkoutUrl: dangCho.checkout_url,
      qrCode: dangCho.qr_code,
      expiresAt: dangCho.expires_at,
    });
  }

  // Chỉ giữ lại đường dẫn nội bộ: returnTo đi thẳng vào router sau khi trả xong
  const returnTo = {
    path: duongDanNoiBo(body.returnTo?.path) ?? '/home',
    profileId: typeof body.returnTo?.profileId === 'string' ? body.returnTo.profileId : null,
    draftMessage:
      typeof body.returnTo?.draftMessage === 'string'
        ? body.returnTo.draftMessage.slice(0, 800)
        : null,
    year: Number(body.returnTo?.year) || null,
    month: Number(body.returnTo?.month) || null,
  };

  // orderCode phải là số nguyên duy nhất. Dùng mốc thời gian giây + 3 số ngẫu
  // nhiên: Date.now() trần thì hai người bấm cùng mili giây là trùng, mà cột
  // order_code có ràng buộc unique nên trùng là hỏng đơn.
  const orderCode = Number(`${Math.floor(Date.now() / 1000)}${Math.floor(Math.random() * 900 + 100)}`);
  const expiresAt = new Date(Date.now() + CAU_HINH_UNG_HO.paymentTtlMinutes * 60_000);

  const { data: don, error: loiTao } = await db
    .from('support_payments')
    .insert({
      user_id: user.id,
      order_code: orderCode,
      amount_vnd: amount,
      reason: body.reason,
      status: 'creating',
      return_to: returnTo,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (loiTao || !don) {
    return loi('PAYMENT_CREATE_FAILED', 'Chưa tạo được phiên thanh toán. Thử lại sau một chút.', 502);
  }

  const goc = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? new URL(req.url).origin;

  try {
    const kq = await taoDonPayos({
      orderCode,
      amount,
      // payOS giới hạn độ dài mô tả; mã đơn ngắn là đủ để đối soát
      description: `CELES${String(orderCode).slice(-6)}`,
      returnUrl: `${goc}/support/checkout/${don.id}`,
      cancelUrl: `${goc}/support/checkout/${don.id}?huy=1`,
      expiredAt: Math.floor(expiresAt.getTime() / 1000),
    });

    await db
      .from('support_payments')
      .update({
        payment_link_id: kq.paymentLinkId,
        checkout_url: kq.checkoutUrl,
        qr_code: kq.qrCode,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', don.id);

    return NextResponse.json({
      paymentId: don.id,
      orderCode,
      amount,
      status: 'pending',
      checkoutUrl: kq.checkoutUrl,
      qrCode: kq.qrCode,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (e) {
    await db
      .from('support_payments')
      .update({ status: 'create_failed', updated_at: new Date().toISOString() })
      .eq('id', don.id);
    // Không hé chi tiết lỗi của nhà cung cấp ra ngoài
    console.error('[ung-ho] tạo đơn payOS hỏng:', e instanceof LoiPayos ? e.message : e);
    return loi('PAYMENT_CREATE_FAILED', 'Chưa tạo được phiên thanh toán. Thử lại sau một chút.', 502);
  }
}
