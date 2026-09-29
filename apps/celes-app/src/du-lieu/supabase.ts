import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

/**
 * Kết nối tài khoản của app — CÙNG dự án Supabase với web, nên một người đăng
 * nhập bằng email trên app và bằng Google trên web (cùng địa chỉ) là một tài khoản.
 *
 * Chỉ nhúng khoá công khai (anon/publishable): khoá này vốn nằm trong mọi trang
 * web gửi xuống trình duyệt, quyền thật do RLS và máy chủ quyết. Khoá quản trị
 * (service role) KHÔNG BAO GIỜ được đưa vào app — ai tải app về cũng rút được ra.
 *
 * Khác máy chủ web (tắt tự làm mới vì mỗi yêu cầu một client mới), app giữ phiên
 * lâu nên BẬT tự làm mới token, và chỉ chạy việc đó khi app đang ở trước mặt
 * người dùng — chạy nền trên di động là tốn pin mà hệ điều hành cũng chặn.
 */

const URL_SUPABASE = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KHOA_CONG_KHAI = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Thiếu cấu hình thì app vẫn chạy phần không cần tài khoản, chỉ ẩn lối đăng nhập */
export const taiKhoanDaCauHinh = Boolean(URL_SUPABASE && KHOA_CONG_KHAI);

export const supabase: SupabaseClient | null = taiKhoanDaCauHinh
  ? createClient(URL_SUPABASE!, KHOA_CONG_KHAI!, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        // App không nhận phiên qua đường dẫn — đăng nhập bằng mã gõ tay
        detectSessionInUrl: false,
      },
    })
  : null;

if (supabase) {
  AppState.addEventListener('change', (trangThai) => {
    if (trangThai === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Token để gắn vào header khi gọi máy chủ; null nếu chưa đăng nhập */
export async function tokenHienTai(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
