'use client';

import { taoSupabaseClient } from '@/lib/supabase/client';
import type { GioiTinh } from '@/lib/tuvi/ansao';

export interface HoSo {
  id: string;
  hoTen: string;
  ngay: number;
  thang: number;
  nam: number;
  gio: number;
  gioiTinh: GioiTinh;
  ghiChu?: string;
  taoLuc: number;
}

export type NguonLuu = 'tai-khoan' | 'trinh-duyet';

const KHOA = 'tuvi-ai:ho-so';

/**
 * Hồ sơ lưu ở hai nơi tuỳ trạng thái đăng nhập:
 *  - Đã đăng nhập  -> bảng `charts` trên Supabase, dùng được trên mọi thiết bị.
 *  - Chưa đăng nhập -> localStorage của chính trình duyệt đang mở.
 * Giao diện chỉ gọi 4 hàm dưới đây nên không cần biết dữ liệu nằm ở đâu.
 */

// ---------- localStorage ----------
function docLocal(): HoSo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KHOA);
    return raw ? (JSON.parse(raw) as HoSo[]) : [];
  } catch {
    return [];
  }
}

function ghiLocal(ds: HoSo[]) {
  try {
    window.localStorage.setItem(KHOA, JSON.stringify(ds));
  } catch {
    // Trình duyệt ở chế độ riêng tư có thể chặn localStorage
  }
}

// ---------- Supabase ----------
interface DongCharts {
  id: string;
  ho_ten: string;
  ngay: number;
  thang: number;
  nam: number;
  gio: number;
  gioi_tinh: GioiTinh;
  ghi_chu: string | null;
  tao_luc: string;
}

const tuDong = (d: DongCharts): HoSo => ({
  id: d.id,
  hoTen: d.ho_ten,
  ngay: d.ngay,
  thang: d.thang,
  nam: d.nam,
  gio: d.gio,
  gioiTinh: d.gioi_tinh,
  ghiChu: d.ghi_chu ?? undefined,
  taoLuc: new Date(d.tao_luc).getTime(),
});

/** Đổi lỗi Postgres khó hiểu thành hướng dẫn hành động được */
function dichLoi(message: string, viec: string): Error {
  if (/schema cache|does not exist|Could not find the table/i.test(message)) {
    return new Error(
      `Chưa tạo bảng dữ liệu trên Supabase. Mở SQL Editor của project, dán toàn bộ file ` +
        `supabase/schema.sql rồi bấm Run. (Chi tiết: ${message})`
    );
  }
  return new Error(`${viec}: ${message}`);
}

/** Client Supabase kèm user hiện tại, hoặc null nếu chưa đăng nhập/chưa cấu hình */
async function phienDangNhap() {
  const supabase = taoSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, userId: data.user.id } : null;
}

// ---------- API dùng chung ----------
export async function nguonLuuHienTai(): Promise<NguonLuu> {
  return (await phienDangNhap()) ? 'tai-khoan' : 'trinh-duyet';
}

export async function danhSachHoSo(): Promise<HoSo[]> {
  const phien = await phienDangNhap();
  if (!phien) return docLocal();

  const { data, error } = await phien.supabase
    .from('charts')
    .select('*')
    .order('tao_luc', { ascending: false });
  if (error) throw dichLoi(error.message, 'Không đọc được hồ sơ');
  return (data as DongCharts[]).map(tuDong);
}

export async function luuHoSo(hoSo: Omit<HoSo, 'id' | 'taoLuc'>): Promise<HoSo> {
  const phien = await phienDangNhap();
  if (!phien) {
    const moi: HoSo = { ...hoSo, id: crypto.randomUUID(), taoLuc: Date.now() };
    ghiLocal([moi, ...docLocal()]);
    return moi;
  }

  const { data, error } = await phien.supabase
    .from('charts')
    .insert({
      user_id: phien.userId,
      ho_ten: hoSo.hoTen,
      ngay: hoSo.ngay,
      thang: hoSo.thang,
      nam: hoSo.nam,
      gio: hoSo.gio,
      gioi_tinh: hoSo.gioiTinh,
      ghi_chu: hoSo.ghiChu ?? null,
    })
    .select()
    .single();
  if (error) throw dichLoi(error.message, 'Không lưu được hồ sơ');
  return tuDong(data as DongCharts);
}

export async function xoaHoSo(id: string): Promise<void> {
  const phien = await phienDangNhap();
  if (!phien) {
    ghiLocal(docLocal().filter((h) => h.id !== id));
    return;
  }
  const { error } = await phien.supabase.from('charts').delete().eq('id', id);
  if (error) throw dichLoi(error.message, 'Không xoá được hồ sơ');
}

/**
 * Đẩy hồ sơ đang nằm trong trình duyệt lên tài khoản — gọi sau khi đăng nhập
 * để những lá số lưu lúc chưa có tài khoản không bị bỏ lại.
 */
export async function chuyenHoSoLenTaiKhoan(): Promise<number> {
  const phien = await phienDangNhap();
  const cucBo = docLocal();
  if (!phien || cucBo.length === 0) return 0;

  const { error } = await phien.supabase.from('charts').insert(
    cucBo.map((h) => ({
      user_id: phien.userId,
      ho_ten: h.hoTen,
      ngay: h.ngay,
      thang: h.thang,
      nam: h.nam,
      gio: h.gio,
      gioi_tinh: h.gioiTinh,
      ghi_chu: h.ghiChu ?? null,
    }))
  );
  if (error) throw dichLoi(error.message, 'Không chuyển được hồ sơ lên tài khoản');
  ghiLocal([]);
  return cucBo.length;
}
