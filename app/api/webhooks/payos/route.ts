import { NextResponse } from 'next/server';
import { chuKyWebhookHopLe, payosDaCauHinh } from '@/lib/payments/payos';
import { CAU_HINH_UNG_HO } from '@/lib/support/config';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Webhook payOS — nguồn sự thật DUY NHẤT để mở quyền.
 *
 * Endpoint này công khai với payOS nhưng mọi lời gọi đều phải qua chữ ký. Thứ
 * tự kiểm tra ở đây không được đảo: chữ ký trước, rồi mới tìm đơn, rồi mới đối
 * chiếu số tiền, rồi mới cấp quyền.
 *
 * Trả 200 cho những trường hợp "không làm gì" (không tìm thấy đơn, đã cấp rồi):
 * trả lỗi ở đó chỉ khiến payOS gửi lại mãi mà kết quả vẫn thế.
 */
export const dynamic = 'force-dynamic';

interface Payload {
  code?: string;
  success?: boolean;
  data?: Record<string, unknown>;
  signature?: string;
}

export async function POST(req: Request) {
  if (!payosDaCauHinh) return NextResponse.json({ ok: true });

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  // payOS gọi thử một lần khi đăng ký URL, không kèm dữ liệu đơn
  if (!body.data || !body.signature) return NextResponse.json({ ok: true });

  if (!chuKyWebhookHopLe(body.data, body.signature)) {
    console.warn('[ung-ho] webhook chữ ký sai, bỏ qua');
    return NextResponse.json({ error: 'bad_signature' }, { status: 400 });
  }

  const db = taoSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true });

  const orderCode = Number(body.data.orderCode);
  const soTien = Number(body.data.amount);
  if (!Number.isInteger(orderCode)) return NextResponse.json({ ok: true });

  const { data: don } = await db
    .from('support_payments')
    .select('*')
    .eq('order_code', orderCode)
    .maybeSingle();

  if (!don) {
    console.warn('[ung-ho] webhook cho đơn không có trong hệ thống:', orderCode);
    return NextResponse.json({ ok: true });
  }

  const thanhCong = body.code === '00' || body.success === true;
  if (!thanhCong) {
    await db
      .from('support_payments')
      .update({
        status: 'cancelled',
        provider_payload: body.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', don.id);
    return NextResponse.json({ ok: true });
  }

  // Số tiền lệch là dấu hiệu bất thường: đánh dấu để soát tay, tuyệt đối không cấp
  if (Number(don.amount_vnd) !== soTien) {
    console.warn('[ung-ho] số tiền lệch với đơn:', orderCode, don.amount_vnd, soTien);
    await db
      .from('support_payments')
      .update({
        status: 'verification_failed',
        provider_payload: body.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', don.id);
    return NextResponse.json({ ok: true });
  }

  await db
    .from('support_payments')
    .update({
      status: 'paid',
      provider_reference: String(body.data.reference ?? ''),
      provider_paid_at: new Date().toISOString(),
      provider_payload: body.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', don.id);

  // Toàn bộ việc cộng quyền nằm trong một hàm chạy nguyên khối ở Postgres, và
  // `unique(payment_id)` bên trong làm cho gọi lại lần hai không cộng thêm gì.
  const { data: kq, error } = await db.rpc('cap_quyen_ung_ho', {
    p_payment_id: don.id,
    p_gio_hieu_luc: CAU_HINH_UNG_HO.supporterDurationHours,
    p_so_cau: CAU_HINH_UNG_HO.supporterAskQuotaPerPayment,
    p_so_bao_cao: CAU_HINH_UNG_HO.supporterLongReportsPerPayment,
  });

  if (error) {
    console.error('[ung-ho] cấp quyền hỏng:', error.message);
    return NextResponse.json({ error: 'grant_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, duplicate: (kq as { duplicate?: boolean })?.duplicate ?? false });
}
