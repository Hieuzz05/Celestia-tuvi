import { NextResponse } from 'next/server';
import { nguoiDungHienTai, taoSupabaseServer } from '@/lib/supabase/server';

/**
 * Lịch sử ủng hộ của chính người đang đăng nhập.
 *
 * Đọc bằng phiên người dùng chứ không phải service role: RLS trên
 * `support_payments` chỉ cho xem dòng của mình, nên chính sách đó làm luôn việc
 * phân quyền. Dùng service role ở đây là tự bỏ lớp bảo vệ rồi phải tự viết lại
 * nó bằng tay.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await nguoiDungHienTai();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 });

  const supabase = await taoSupabaseServer();
  if (!supabase) return NextResponse.json({ don: [] });

  const { data } = await supabase
    .from('support_payments')
    .select('id, amount_vnd, reason, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  // Không gửi ra ngoài: mã đơn của nhà cung cấp, payload thô, thông tin ngân hàng
  return NextResponse.json(
    {
      don: (data ?? []).map((d) => ({
        id: d.id,
        soTien: Number(d.amount_vnd),
        lyDo: d.reason,
        trangThai: d.status,
        luc: d.created_at,
      })),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
