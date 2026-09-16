import { NextResponse } from 'next/server';
import { LOI_CHUA_CAU_HINH, taoSupabaseAdmin } from '@/lib/supabase/admin';
import { laAdmin, supabaseDaCauHinh } from '@/lib/supabase/config';
import { nguoiDungHienTai } from '@/lib/supabase/server';

/**
 * Danh sách tài khoản kèm lá số của từng người — chỉ quản trị viên xem được.
 * Dữ liệu này rất nhạy cảm (ngày giờ sinh của người khác) nên chặn quyền ở đây
 * là bắt buộc, không chỉ ẩn ở giao diện.
 */
async function chanQuyen(): Promise<string | null> {
  if (!supabaseDaCauHinh) return 'Chưa bật đăng nhập nên chưa có dữ liệu tài khoản';
  const user = await nguoiDungHienTai();
  if (!user) return 'Cần đăng nhập';
  if (!laAdmin(user.email)) return 'Tài khoản không có quyền quản trị';
  return null;
}

export async function GET() {
  const loiQuyen = await chanQuyen();
  if (loiQuyen) return NextResponse.json({ loi: loiQuyen }, { status: 403 });

  const supabase = taoSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ loi: LOI_CHUA_CAU_HINH, chuaCauHinh: true }, { status: 503 });
  }

  const { data: dsAuth, error: loiAuth } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (loiAuth) return NextResponse.json({ loi: loiAuth.message }, { status: 500 });

  const [{ data: profiles }, { data: charts }, { data: readings }] = await Promise.all([
    supabase.from('profiles').select('id, ten_hien_thi'),
    supabase.from('charts').select('*').order('tao_luc', { ascending: false }),
    supabase.from('readings').select('user_id'),
  ]);

  const tenTheoId = new Map(
    (profiles ?? []).map((p: { id: string; ten_hien_thi: string | null }) => [p.id, p.ten_hien_thi])
  );
  const soLuanGiai = new Map<string, number>();
  for (const r of (readings ?? []) as { user_id: string }[]) {
    soLuanGiai.set(r.user_id, (soLuanGiai.get(r.user_id) ?? 0) + 1);
  }

  const laSoTheoUser = new Map<string, unknown[]>();
  for (const c of (charts ?? []) as { user_id: string }[]) {
    if (!laSoTheoUser.has(c.user_id)) laSoTheoUser.set(c.user_id, []);
    laSoTheoUser.get(c.user_id)!.push(c);
  }

  const nguoiDung = dsAuth.users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    tenHienThi: tenTheoId.get(u.id) ?? null,
    taoLuc: u.created_at,
    dangNhapCuoi: u.last_sign_in_at ?? null,
    laQuanTri: laAdmin(u.email),
    soLuanGiai: soLuanGiai.get(u.id) ?? 0,
    laSo: (laSoTheoUser.get(u.id) ?? []).map((c) => {
      const d = c as {
        id: string;
        ho_ten: string;
        ngay: number;
        thang: number;
        nam: number;
        gio: number;
        gioi_tinh: string;
        tao_luc: string;
      };
      return {
        id: d.id,
        hoTen: d.ho_ten,
        ngay: d.ngay,
        thang: d.thang,
        nam: d.nam,
        gio: d.gio,
        gioiTinh: d.gioi_tinh,
        taoLuc: d.tao_luc,
      };
    }),
  }));

  return NextResponse.json({ nguoiDung, tongSo: nguoiDung.length });
}
