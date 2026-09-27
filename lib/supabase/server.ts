import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseDaCauHinh } from './config';

/**
 * Token đăng nhập từ header `Authorization: Bearer …` — đường của APP DI ĐỘNG.
 *
 * App không có cookie của web: nó giữ phiên Supabase trong máy và gửi access token
 * theo từng request. Web vẫn đi đường cookie như cũ — trình duyệt không tự gửi
 * header này, và web không bật CORS nên trang lạ cũng không gửi được nó sang đây.
 *
 * Token KHÔNG được tin ngay: `auth.getUser(token)` hỏi Supabase xác thực chữ ký và
 * hạn dùng. Client dựng từ token chạy mọi truy vấn dưới đúng người dùng đó, nên
 * RLS giữ nguyên tác dụng như với cookie.
 */
async function tokenTuHeader(): Promise<string | null> {
  try {
    const h = await headers();
    const m = h.get('authorization')?.match(/^Bearer\s+(.+)$/i);
    return m?.[1]?.trim() || null;
  } catch {
    // Gọi ngoài phạm vi request (script, build) — không có header nào
    return null;
  }
}

export async function taoSupabaseServer() {
  if (!supabaseDaCauHinh) return null;
  const token = await tokenTuHeader();
  if (token) {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
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
  const token = await tokenTuHeader();
  // Có token thì phải xác thực CHÍNH token đó — client dựng từ token không có phiên nội bộ để đọc
  const { data } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();
  return data.user ?? null;
}
