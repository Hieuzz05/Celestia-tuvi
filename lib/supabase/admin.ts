import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './config';

/**
 * Gọi lại khi đường truyền đứt, trước khi bỏ cuộc.
 *
 * Một lượt nạp sách ghi vài nghìn dòng liên tiếp. Qua đường truyền dân dụng thì
 * kiểu gì cũng có lần `fetch failed` — đo được trong một lượt nạp 15 cuốn: 5 cuốn
 * hỏng, cả 5 cùng một lý do đó, và bốn trong số đó đã sinh xong phần lớn vector
 * rồi mới đứt. Tức là đã trả tiền cho embedding rồi vứt đi vì một cú nghẽn mạng
 * vài giây.
 *
 * Chỉ thử lại khi `fetch` NÉM lỗi, tức là lỗi mạng. Lỗi có mã trả về — 400, 409,
 * 404 — thì không thử lại: chúng là lỗi thật, và thử lại chỉ làm chậm việc báo
 * lỗi cho người dùng.
 *
 * Đặt ở đây chứ không ở từng nơi gọi, vì mọi thao tác phía máy chủ với kho tri
 * thức đều đi qua client này.
 */
async function fetchCoThuLai(
  input: RequestInfo | URL,
  init?: RequestInit,
  lanThu = 0
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (e) {
    if (lanThu >= 4) throw e;
    // Giãn dần 1s, 2s, 4s, 8s — nghẽn mạng thường qua trong vài giây
    await new Promise((r) => setTimeout(r, 2 ** lanThu * 1000));
    return fetchCoThuLai(input, init, lanThu + 1);
  }
}

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
    global: { fetch: fetchCoThuLai },
  });
}

export const LOI_CHUA_CAU_HINH =
  'Kho tri thức cần SUPABASE_SERVICE_ROLE_KEY (Supabase > Project Settings > API Keys). ' +
  'Thêm biến này vào .env.local và Vercel rồi thử lại.';
