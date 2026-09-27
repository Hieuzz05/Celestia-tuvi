'use client';

import { useEffect, useState } from 'react';
import { taiTaiKhoan, type HoSoTaiKhoan } from '@/lib/store/profile';
import { laySupabaseClient } from '@/lib/supabase/client';
import { supabaseDaCauHinh } from '@/lib/supabase/config';

/**
 * Trạng thái đăng nhập dùng chung cho các màn có cổng.
 *
 * Trả về `dangDoc` riêng biệt vì rất quan trọng: lúc chưa đọc xong phiên mà đã
 * vẽ cổng đăng nhập thì người đã đăng nhập sẽ thấy chớp một cái "bạn cần tài
 * khoản" rồi mới biến mất — trông như sản phẩm chưa xong.
 */
export function useTaiKhoan() {
  const coAuth = supabaseDaCauHinh;
  const [taiKhoan, setTaiKhoan] = useState<HoSoTaiKhoan | null>(null);
  // Chưa cấu hình Supabase thì không có phiên nào để đọc — khỏi chờ vòng nào cả
  const [dangDoc, setDangDoc] = useState(coAuth);

  useEffect(() => {
    if (!coAuth) return;
    let huy = false;
    let boTheoDoi: (() => void) | null = null;

    taiTaiKhoan()
      .then((tk) => {
        if (!huy) setTaiKhoan(tk);
      })
      .finally(() => {
        if (!huy) setDangDoc(false);
      });

    // Supabase nạp khi cần — đăng ký theo dõi phiên sau khi thư viện về
    laySupabaseClient().then((supabase) => {
      if (huy || !supabase) return;
      const { data: sub } = supabase.auth.onAuthStateChange(() => {
        taiTaiKhoan().then((tk) => {
          if (!huy) setTaiKhoan(tk);
        });
      });
      boTheoDoi = () => sub.subscription.unsubscribe();
    });

    return () => {
      huy = true;
      boTheoDoi?.();
    };
  }, [coAuth]);

  return {
    taiKhoan,
    dangDoc,
    /** true khi được phép dùng tính năng sâu: đã đăng nhập, hoặc sản phẩm chưa bật tài khoản */
    duocVao: !coAuth || Boolean(taiKhoan),
  };
}
