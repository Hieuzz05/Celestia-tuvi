import { NextResponse } from 'next/server';
import { chuKyWebhookHopLe, nhanDangCauHinh, payosDaCauHinh } from '@/lib/payments/payos';
import { CAU_HINH_UNG_HO } from '@/lib/support/config';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Webhook payOS — nguồn sự thật DUY NHẤT để mở quyền.
 *
 * Endpoint này công khai với payOS nhưng mọi lời gọi đều phải qua chữ ký. Thứ
 * tự kiểm tra ở đây không được đảo: chữ ký trước, rồi mới tìm đơn, rồi mới đối
 * chiếu số tiền, rồi mới cấp quyền.
 *
 * Endpoint này LUÔN trả 2XX, kể cả khi chữ ký sai.
 *
 * Nghe ngược đời nhưng đúng: payOS gọi thử URL ngay lúc bạn bấm lưu, và nó coi
 * bất cứ mã lỗi nào là "webhook không hoạt động" rồi từ chối nhận URL. Trả 400
 * cho chữ ký sai nghĩa là không bao giờ khai được webhook.
 *
 * An toàn không mất gì: chữ ký sai thì KHÔNG đụng vào đơn, KHÔNG cấp quyền, chỉ
 * ghi log. Điều bảo vệ hệ thống là chỗ đó, không phải mã trạng thái trả về.
 */
export const dynamic = 'force-dynamic';

interface Payload {
  code?: string;
  success?: boolean;
  data?: Record<string, unknown>;
  signature?: string;
}

/**
 * Chẩn đoán cấu hình — không lộ nội dung khoá, chỉ độ dài và cờ khoảng trắng.
 * Dùng để trả lời câu "khoá đã vào chưa, có dính dấu cách thừa không".
 */
export async function GET() {
  return NextResponse.json(
    { payosDaCauHinh, ...nhanDangCauHinh() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(req: Request) {
  if (!payosDaCauHinh) return NextResponse.json({ ok: true });

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    // Lời gọi thử lúc đăng ký URL có thể không kèm JSON hợp lệ. Trả lỗi ở đây
    // cũng làm payOS từ chối URL, nên chỉ ghi nhận rồi cho qua.
    return NextResponse.json({ ok: true, bo_qua: 'bad_json' });
  }

  // payOS gọi thử một lần khi đăng ký URL, không kèm dữ liệu đơn
  if (!body.data || !body.signature) return NextResponse.json({ ok: true });

  if (!chuKyWebhookHopLe(body.data, body.signature)) {
    console.warn('[ung-ho] webhook chữ ký sai, bỏ qua', nhanDangCauHinh());
    return NextResponse.json({ ok: true, bo_qua: 'bad_signature' });
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
    // Đây là lỗi phía mình, nên để payOS gửi lại: 500 là mã duy nhất trong tệp
    // này đáng trả, vì lần gửi sau có thể thành công.
    console.error('[ung-ho] cấp quyền hỏng:', error.message);
    return NextResponse.json({ error: 'grant_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, duplicate: (kq as { duplicate?: boolean })?.duplicate ?? false });
}
