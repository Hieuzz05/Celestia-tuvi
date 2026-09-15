/**
 * Supabase là tuỳ chọn: khi chưa khai báo biến môi trường, toàn bộ tính năng
 * cần tài khoản sẽ hiển thị trạng thái "chưa cấu hình" thay vì làm hỏng app.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

export const supabaseDaCauHinh = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Email được phép vào trang quản trị, khai báo dạng: ADMIN_EMAILS=a@x.com,b@y.com */
export function laAdmin(email: string | null | undefined): boolean {
  const ds = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (ds.length === 0) return true; // chưa khai báo admin -> chế độ mở, dùng khi phát triển
  return Boolean(email && ds.includes(email.toLowerCase()));
}
