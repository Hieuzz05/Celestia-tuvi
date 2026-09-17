import { NextResponse } from 'next/server';
import { doiSoatDon } from '@/lib/support/doi-soat';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Đối soát định kỳ các đơn còn treo.
 *
 * Đây là LƯỚI AN TOÀN, không phải luồng chính. Luồng chính là webhook, rồi tới
 * lớp đối soát chạy khi người dùng mở trang thanh toán. Tác vụ này lo nốt trường
 * hợp cuối: người dùng trả tiền xong đóng luôn trình duyệt và không quay lại,
 * mà webhook thì không tới. Không có nó, đơn đó treo vĩnh viễn và người đã trả
 * tiền không bao giờ nhận được quyền.
 *
 * Bảo vệ bằng CRON_SECRET để không ai gọi tuỳ tiện. Vercel Cron gửi kèm header
 * `Authorization: Bearer <CRON_SECRET>`.
 *
 * Chỉ đụng tới đơn tạo trong 7 ngày gần đây: cũ hơn thì payOS cũng đã đóng, và
 * quét cả bảng mỗi 15 phút là việc vô ích.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const bem = process.env.CRON_SECRET?.trim();
  if (!bem) return NextResponse.json({ loi: 'Chưa đặt CRON_SECRET' }, { status: 503 });

  if (req.headers.get('authorization') !== `Bearer ${bem}`) {
    return NextResponse.json({ loi: 'Không có quyền' }, { status: 401 });
  }

  const db = taoSupabaseAdmin();
  if (!db) return NextResponse.json({ loi: 'Chưa cấu hình' }, { status: 503 });

  const bayGio = Date.now();
  const { data: dons } = await db
    .from('support_payments')
    .select('id, order_code, payment_link_id, amount_vnd, status')
    .in('status', ['pending', 'paid'])
    .gte('created_at', new Date(bayGio - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })
    .limit(50);

  const dem: Record<string, number> = {};
  for (const don of dons ?? []) {
    const kq = await doiSoatDon(don);
    dem[kq] = (dem[kq] ?? 0) + 1;
  }

  return NextResponse.json({ daXet: dons?.length ?? 0, ketQua: dem });
}
