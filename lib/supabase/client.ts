'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseDaCauHinh } from './config';

let dangNap: Promise<SupabaseClient | null> | null = null;

/**
 * Supabase phía trình duyệt, NẠP KHI CẦN (dynamic import).
 *
 * Bản cũ import tĩnh `@supabase/ssr` nên ~67KB (nén) nằm trong gói JS ban đầu của
 * MỌI trang — cả trang chủ cho khách — vì thanh điều hướng cần biết đã đăng nhập
 * chưa. Đo Lighthouse 27/09/2026: số byte JS tải trước khi vẽ chữ chính kéo LCP
 * trên điện thoại lên 2,6–4s. Nạp khi cần thì gói này về sau lần vẽ đầu.
 *
 * Kiểm "có bật tài khoản không" lúc render thì dùng `supabaseDaCauHinh`, không gọi hàm này.
 */
export function laySupabaseClient(): Promise<SupabaseClient | null> {
  if (!supabaseDaCauHinh) return Promise.resolve(null);
  dangNap ??= import('@supabase/ssr').then(({ createBrowserClient }) =>
    createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  );
  return dangNap;
}
