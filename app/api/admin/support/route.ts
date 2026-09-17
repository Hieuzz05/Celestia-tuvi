import { NextResponse } from 'next/server';
import { laAdmin, supabaseDaCauHinh } from '@/lib/supabase/config';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { nguoiDungHienTai } from '@/lib/supabase/server';

/**
 * Số liệu vận hành của Support Celes.
 *
 * Quyền admin đọc từ biến môi trường phía máy chủ, không bao giờ suy ra từ thứ
 * trình duyệt gửi lên. Trang /admin chỉ ẩn nút; chặn thật nằm ở đây.
 *
 * Endpoint này CHỈ ĐỌC. Spec cho phép admin đối soát tay hoặc cấp/thu quyền,
 * nhưng mỗi thao tác như vậy phải có nhật ký riêng — chưa làm thì không mở,
 * hơn là mở một đường sửa tiền mà không ai lần lại được.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  if (supabaseDaCauHinh) {
    const user = await nguoiDungHienTai();
    if (!user || !laAdmin(user.email)) {
      return NextResponse.json({ loi: 'Không có quyền' }, { status: 403 });
    }
  }

  const db = taoSupabaseAdmin();
  if (!db) return NextResponse.json({ loi: 'Chưa cấu hình' }, { status: 503 });

  const [don, capQuyen, quyen] = await Promise.all([
    db.from('support_payments').select('amount_vnd, reason, status, created_at').order('created_at', { ascending: false }).limit(200),
    db.from('entitlement_grants').select('payment_id, ask_quota_granted, created_at').order('created_at', { ascending: false }).limit(200),
    db.from('user_entitlements').select('supporter_expires_at, lifetime_support_amount_vnd, support_count'),
  ]);

  const ds = don.data ?? [];
  const theoTrangThai: Record<string, number> = {};
  const theoNguon: Record<string, number> = {};
  let tongTien = 0;

  for (const d of ds) {
    theoTrangThai[d.status] = (theoTrangThai[d.status] ?? 0) + 1;
    if (d.status === 'entitlement_granted') {
      theoNguon[d.reason] = (theoNguon[d.reason] ?? 0) + 1;
      tongTien += Number(d.amount_vnd);
    }
  }

  const nay = Date.now();
  const dangConHan = (quyen.data ?? []).filter(
    (q) => q.supporter_expires_at && new Date(q.supporter_expires_at).getTime() > nay
  ).length;

  return NextResponse.json(
    {
      tongTienDaNhan: tongTien,
      soLanCapQuyen: capQuyen.data?.length ?? 0,
      soNguoiDangLaSupporter: dangConHan,
      theoTrangThai,
      theoNguon,
      // Đơn cần người nhìn vào: số tiền lệch, hoặc tạo hỏng
      canSoat: ds.filter((d) => d.status === 'verification_failed' || d.status === 'create_failed').length,
      donGanDay: ds.slice(0, 20).map((d) => ({
        soTien: Number(d.amount_vnd),
        lyDo: d.reason,
        trangThai: d.status,
        luc: d.created_at,
      })),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
