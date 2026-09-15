'use client';

import { taoSupabaseClient } from '@/lib/supabase/client';

export interface HoSoTaiKhoan {
  id: string;
  email: string | null;
  tenHienThi: string;
}

/**
 * Tên hiển thị lấy theo thứ tự ưu tiên:
 *   1. Cột `ten_hien_thi` trong bảng profiles (người dùng tự đặt)
 *   2. Tên từ nhà cung cấp SSO (Google trả về full_name)
 *   3. Phần trước dấu @ của email
 * Nhờ vậy nav luôn có tên gọn để hiện thay vì địa chỉ email dài.
 */
export async function taiTaiKhoan(): Promise<HoSoTaiKhoan | null> {
  const supabase = taoSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;

  const tuSSO =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined);
  const tuEmail = user.email?.split('@')[0] ?? 'Người dùng';

  const { data: profile } = await supabase
    .from('profiles')
    .select('ten_hien_thi')
    .eq('id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    tenHienThi: profile?.ten_hien_thi?.trim() || tuSSO?.trim() || tuEmail,
  };
}

export async function datTenHienThi(tenMoi: string): Promise<void> {
  const supabase = taoSupabaseClient();
  if (!supabase) throw new Error('Chưa cấu hình đăng nhập');

  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Chưa đăng nhập');

  const ten = tenMoi.trim().slice(0, 60);
  if (!ten) throw new Error('Tên hiển thị không được để trống');

  // upsert vì trigger có thể chưa kịp tạo dòng profiles cho tài khoản mới
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: data.user.id, ten_hien_thi: ten });
  if (error) throw new Error(`Không lưu được tên hiển thị: ${error.message}`);
}
