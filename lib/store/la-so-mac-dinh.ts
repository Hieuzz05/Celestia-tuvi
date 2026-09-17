'use client';

import { taoSupabaseClient } from '@/lib/supabase/client';

/**
 * "Lá số của tôi" — lá số mặc định của một tài khoản.
 *
 * Lưu ở cột `profiles.la_so_mac_dinh`. Cột này được thêm vào `supabase/schema.sql`
 * sau khi sản phẩm đã chạy, nên có những project chưa chạy lại file đó. Trường
 * hợp ấy không được làm hỏng gì: mọi lỗi "thiếu cột" đều rơi về localStorage của
 * chính máy đang dùng, và sản phẩm vẫn hoạt động — chỉ là lựa chọn không theo
 * người dùng sang máy khác cho tới khi chạy SQL.
 */

const KHOA_LOCAL = 'celestia:la-so-mac-dinh';

function thieuCot(message: string) {
  return /la_so_mac_dinh|schema cache|column .* does not exist/i.test(message);
}

function docLocal(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const bang = JSON.parse(window.localStorage.getItem(KHOA_LOCAL) ?? '{}') as Record<string, string>;
    return bang[userId] ?? null;
  } catch {
    return null;
  }
}

function ghiLocal(userId: string, id: string) {
  try {
    const bang = JSON.parse(window.localStorage.getItem(KHOA_LOCAL) ?? '{}') as Record<string, string>;
    bang[userId] = id;
    window.localStorage.setItem(KHOA_LOCAL, JSON.stringify(bang));
  } catch {
    // Chế độ riêng tư chặn localStorage — bỏ qua
  }
}

async function phien() {
  const supabase = taoSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, userId: data.user.id } : null;
}

export async function docLaSoMacDinh(): Promise<string | null> {
  const p = await phien();
  // Chưa đăng nhập: hồ sơ nằm ở trình duyệt, lá số mặc định cũng vậy
  if (!p) {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(`${KHOA_LOCAL}:khach`);
    } catch {
      return null;
    }
  }

  const { data, error } = await p.supabase
    .from('profiles')
    .select('la_so_mac_dinh')
    .eq('id', p.userId)
    .maybeSingle();

  if (error) {
    if (thieuCot(error.message)) return docLocal(p.userId);
    return null;
  }
  return (data?.la_so_mac_dinh as string | null) ?? docLocal(p.userId);
}

export async function datLaSoMacDinh(chartId: string): Promise<void> {
  const p = await phien();
  if (!p) {
    try {
      window.localStorage.setItem(`${KHOA_LOCAL}:khach`, chartId);
    } catch {
      // bỏ qua
    }
    return;
  }

  const { error } = await p.supabase
    .from('profiles')
    .upsert({ id: p.userId, la_so_mac_dinh: chartId });

  if (error) {
    if (!thieuCot(error.message)) throw new Error(`Chưa đặt được lá số của tôi: ${error.message}`);
    ghiLocal(p.userId, chartId);
  }
}
