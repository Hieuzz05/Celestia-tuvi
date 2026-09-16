import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './config';

/**
 * Client dùng service role — BỎ QUA toàn bộ Row Level Security.
 * Chỉ được import trong mã chạy phía server. Kho tri thức cố tình không mở
 * policy nào cho anon key, nên mọi thao tác với nó phải đi qua đây.
 */
export function taoSupabaseAdmin(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!SUPABASE_URL || !serviceKey) return null;

  return createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const LOI_CHUA_CAU_HINH =
  'Kho tri thức cần SUPABASE_SERVICE_ROLE_KEY (Supabase > Project Settings > API Keys). ' +
  'Thêm biến này vào .env.local và Vercel rồi thử lại.';
