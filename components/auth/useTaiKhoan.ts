'use client';

import { useEffect, useState } from 'react';
import { taiTaiKhoan, type HoSoTaiKhoan } from '@/lib/store/profile';
import { taoSupabaseClient } from '@/lib/supabase/client';

/**
 * Trạng thái đăng nhập dùng chung cho các màn có cổng.
 *
 * Trả về `dangDoc` riêng biệt vì rất quan trọng: lúc chưa đọc xong phiên mà đã
 * vẽ cổng đăng nhập thì người đã đăng nhập sẽ thấy chớp một cái "bạn cần tài
 * khoản" rồi mới biến mất — trông như sản phẩm chưa xong.
 */
export function useTaiKhoan() {
  const coAuth = Boolean(taoSupabaseClient());
  const [taiKhoan, setTaiKhoan] = useState<HoSoTaiKhoan | null>(null);
  // Chưa cấu hình Supabase thì không có phiên nào để đọc — khỏi chờ vòng nào cả
  const [dangDoc, setDangDoc] = useState(coAuth);

  useEffect(() => {
    const supabase = taoSupabaseClient();
    if (!supabase) return;

    taiTaiKhoan()
      .then(setTaiKhoan)
      .finally(() => setDangDoc(false));

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      taiTaiKhoan().then(setTaiKhoan);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    taiKhoan,
    dangDoc,
    /** true khi được phép dùng tính năng sâu: đã đăng nhập, hoặc sản phẩm chưa bật tài khoản */
    duocVao: !coAuth || Boolean(taiKhoan),
  };
}
