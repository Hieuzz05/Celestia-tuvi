import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GioiTinh } from '@tuvi/ansao';
import { supabase } from './supabase';

/**
 * Những lá số người dùng đã lưu — CÙNG bảng `charts` với web.
 *
 * Mô phỏng `lib/store/hoso.ts` + `lib/store/la-so-mac-dinh.ts` của web, chỉ đổi
 * client Supabase sang bản của app. Đã đăng nhập thì đọc/ghi bảng; chưa đăng
 * nhập thì nằm trong máy và được đẩy lên khi đăng nhập, giống web.
 *
 * Bảng không có phút sinh, độ chắc giờ hay điều bận tâm — mấy thứ đó chỉ sống
 * trong hồ sơ trên máy (`ho-so.tsx`). Giờ ở đây là GIỜ THẬT 0–23 như web lưu.
 */

export interface NguoiLuu {
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

export type NguoiMoi = Omit<NguoiLuu, 'id' | 'taoLuc'>;

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

const tuDong = (d: DongCharts): NguoiLuu => ({
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

const sangDong = (userId: string, n: NguoiMoi) => ({
  user_id: userId,
  ho_ten: n.hoTen,
  ngay: n.ngay,
  thang: n.thang,
  nam: n.nam,
  gio: n.gio,
  gioi_tinh: n.gioiTinh,
  ghi_chu: n.ghiChu ?? null,
});

/** Khung giờ (12 chi) của một giờ thật — hai giờ cùng khung cho cùng một lá số */
export function khungGio(gio: number): number {
  return Math.floor(((gio + 1) % 24) / 2);
}

/** Hai bộ thông tin sinh có dựng ra cùng một lá số không */
export function cungLaSo(a: NguoiMoi, b: NguoiMoi): boolean {
  return (
    a.ngay === b.ngay &&
    a.thang === b.thang &&
    a.nam === b.nam &&
    a.gioiTinh === b.gioiTinh &&
    khungGio(a.gio) === khungGio(b.gio)
  );
}

// ---------- Trên máy (chưa đăng nhập) ----------

const KHOA_KHACH = 'celestia:nguoi-cua-toi';

export async function docCucBo(): Promise<NguoiLuu[]> {
  try {
    const v = await AsyncStorage.getItem(KHOA_KHACH);
    return v ? (JSON.parse(v) as NguoiLuu[]) : [];
  } catch {
    return [];
  }
}

export async function ghiCucBo(ds: NguoiLuu[]): Promise<void> {
  await AsyncStorage.setItem(KHOA_KHACH, JSON.stringify(ds)).catch(() => {});
}

function maMoi(): string {
  return `may-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function taoCucBo(n: NguoiMoi): NguoiLuu {
  return { ...n, id: maMoi(), taoLuc: Date.now() };
}

// ---------- Trên tài khoản ----------

export async function docCharts(): Promise<NguoiLuu[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('charts')
    .select('*')
    .order('tao_luc', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as DongCharts[]).map(tuDong);
}

export async function themChart(userId: string, n: NguoiMoi): Promise<NguoiLuu> {
  if (!supabase) throw new Error('chua-cau-hinh');
  const { data, error } = await supabase
    .from('charts')
    .insert(sangDong(userId, n))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return tuDong(data as DongCharts);
}

export async function xoaChart(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('charts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Lá số mặc định ("Lá số của tôi") — `profiles.la_so_mac_dinh`, cột web dùng.
 * Thiếu cột (project chưa chạy lại schema) thì coi như chưa chọn, không làm hỏng gì.
 */
export async function docMacDinh(userId: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('la_so_mac_dinh')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return (data?.la_so_mac_dinh as string | null) ?? null;
}

export async function datMacDinh(userId: string, chartId: string): Promise<void> {
  if (!supabase) return;
  // Lỗi thiếu cột bỏ qua: lựa chọn vẫn đúng trên máy này, chỉ chưa theo sang web
  await supabase.from('profiles').upsert({ id: userId, la_so_mac_dinh: chartId });
}
