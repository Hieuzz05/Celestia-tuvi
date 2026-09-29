import type { AuthError, Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase, taiKhoanDaCauHinh } from './supabase';

/**
 * Tài khoản trên app — đăng nhập bằng MÃ gửi qua email (chốt 28/09/2026).
 *
 * Chọn mã 6 số thay vì đường dẫn "magic link": bấm đường dẫn trong thư sẽ mở
 * trình duyệt chứ không mở app (nhất là khi chạy thử trong Expo Go, địa chỉ app
 * đổi theo wifi), còn mã thì gõ lại được ở bất kỳ đâu. Google/Apple làm sau.
 *
 * Lỗi được quy về vài loại người dùng hiểu được — màn hình không bao giờ hiện
 * nguyên văn lỗi của nhà cung cấp.
 */

export type LoiTaiKhoan = 'email-sai' | 'qua-nhieu' | 'ma-sai' | 'mang' | 'khac';

function phanLoai(loi: AuthError): LoiTaiKhoan {
  const ma = loi.code ?? '';
  if (loi.status === 429 || ma.includes('rate_limit')) return 'qua-nhieu';
  if (ma === 'otp_expired' || ma === 'otp_disabled') return 'ma-sai';
  if (ma === 'email_address_invalid' || ma === 'validation_failed') return 'email-sai';
  if (!loi.status || loi.name === 'AuthRetryableFetchError') return 'mang';
  return 'khac';
}

interface BoiCanhTaiKhoan {
  /** false khi app dựng thiếu cấu hình Supabase — ẩn mọi lối đăng nhập */
  coTaiKhoan: boolean;
  /** true trong lúc đọc phiên đã lưu lúc mở app */
  dangNap: boolean;
  phien: Session | null;
  email: string | null;
  guiMa: (email: string) => Promise<LoiTaiKhoan | null>;
  xacNhanMa: (email: string, ma: string) => Promise<LoiTaiKhoan | null>;
  dangXuat: () => Promise<void>;
}

const BoiCanh = createContext<BoiCanhTaiKhoan | null>(null);

export function TaiKhoanProvider({ children }: { children: ReactNode }) {
  const [phien, setPhien] = useState<Session | null>(null);
  const [dangNap, setDangNap] = useState(taiKhoanDaCauHinh);

  useEffect(() => {
    if (!supabase) return;
    let conSong = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!conSong) return;
      setPhien(data.session);
      setDangNap(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_suKien, moi) => setPhien(moi));
    return () => {
      conSong = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const giaTri = useMemo<BoiCanhTaiKhoan>(
    () => ({
      coTaiKhoan: taiKhoanDaCauHinh,
      dangNap,
      phien,
      email: phien?.user.email ?? null,

      async guiMa(email) {
        if (!supabase) return 'khac';
        try {
          const { error } = await supabase.auth.signInWithOtp({
            email: email.trim().toLowerCase(),
            options: { shouldCreateUser: true },
          });
          return error ? phanLoai(error) : null;
        } catch {
          return 'mang';
        }
      },

      async xacNhanMa(email, ma) {
        if (!supabase) return 'khac';
        try {
          const { error } = await supabase.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token: ma.trim(),
            type: 'email',
          });
          if (!error) return null;
          // Mã gõ sai cũng trả 403 "otp_expired" — với người dùng đều là "mã không đúng"
          return error.status === 403 ? 'ma-sai' : phanLoai(error);
        } catch {
          return 'mang';
        }
      },

      async dangXuat() {
        if (!supabase) return;
        // scope 'local': chỉ đăng xuất máy này, không đá phiên web của cùng người
        await supabase.auth.signOut({ scope: 'local' });
      },
    }),
    [dangNap, phien]
  );

  return <BoiCanh.Provider value={giaTri}>{children}</BoiCanh.Provider>;
}

export function useTaiKhoan() {
  const v = useContext(BoiCanh);
  if (!v) throw new Error('useTaiKhoan phải nằm trong TaiKhoanProvider');
  return v;
}
