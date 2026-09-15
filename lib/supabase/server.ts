import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseDaCauHinh } from './config';

export async function taoSupabaseServer() {
  if (!supabaseDaCauHinh) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Được gọi từ Server Component — session sẽ được middleware làm mới
        }
      },
    },
  });
}

/** Người dùng hiện tại, hoặc null nếu chưa đăng nhập / chưa cấu hình Supabase */
export async function nguoiDungHienTai() {
  const supabase = await taoSupabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
