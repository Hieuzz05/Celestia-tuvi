'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';
import { taoSupabaseClient } from '@/lib/supabase/client';

type Che = 'dang-nhap' | 'dang-ky';

export default function DangNhapPage() {
  const router = useRouter();
  const [che, setChe] = useState<Che>('dang-nhap');
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [thongBao, setThongBao] = useState<{ loai: 'loi' | 'ok'; noiDung: string } | null>(null);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [coGoogle, setCoGoogle] = useState(false);

  const supabase = taoSupabaseClient();

  // Chỉ hiện nút Google khi provider thực sự được bật trong Supabase — bằng
  // không người dùng bấm vào chỉ nhận về lỗi khó hiểu.
  useEffect(() => {
    if (!SUPABASE_URL) return;
    fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } })
      .then((r) => r.json())
      .then((d) => setCoGoogle(Boolean(d?.external?.google)))
      .catch(() => setCoGoogle(false));
  }, []);

  if (!supabase) {
    return (
      <main className="mx-auto w-full max-w-[560px] px-[24px] py-[96px]">
        <h1 className="heading">Chưa bật đăng nhập</h1>
        <p className="body-text mt-[24px]" style={{ color: 'var(--fg-body)' }}>
          Tính năng tài khoản cần Supabase. Thêm hai biến môi trường{' '}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> và <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> rồi
          khởi động lại ứng dụng. Xem hướng dẫn chi tiết trong tệp <code>HUONG-DAN.md</code>.
        </p>
      </main>
    );
  }

  const guiForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setDangXuLy(true);
    setThongBao(null);
    try {
      if (che === 'dang-ky') {
        const { error } = await supabase.auth.signUp({ email, password: matKhau });
        if (error) throw error;
        setThongBao({
          loai: 'ok',
          noiDung: 'Đã tạo tài khoản. Kiểm tra email để xác nhận (nếu Supabase bật xác nhận email).',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: matKhau });
        if (error) throw error;
        router.push('/ho-so');
        router.refresh();
      }
    } catch (err) {
      setThongBao({ loai: 'loi', noiDung: err instanceof Error ? err.message : 'Có lỗi xảy ra' });
    } finally {
      setDangXuLy(false);
    }
  };

  const dangNhapGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <main className="mx-auto w-full max-w-[520px] px-[24px] py-[60px]">
      <h1 className="heading">{che === 'dang-nhap' ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
      <p className="body-text mt-[18px]" style={{ color: 'var(--fg-body)' }}>
        Đăng nhập để lưu lá số và xem lại các bản luận giải đã tạo.
      </p>

      <form onSubmit={guiForm} className="mt-[36px] flex flex-col gap-[24px]">
        <label className="flex flex-col gap-[6px]">
          <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input"
            autoComplete="email"
          />
        </label>
        <label className="flex flex-col gap-[6px]">
          <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
            Mật khẩu
          </span>
          <input
            type="password"
            required
            minLength={6}
            value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)}
            className="field-input"
            autoComplete={che === 'dang-ky' ? 'new-password' : 'current-password'}
          />
        </label>

        {thongBao && (
          <p
            className="text-[13px]"
            style={{
              color: thongBao.loai === 'loi' ? 'var(--chart-hung)' : 'var(--chart-cat)',
            }}
          >
            {thongBao.noiDung}
          </p>
        )}

        <button type="submit" disabled={dangXuLy} className="btn-primary self-start">
          {dangXuLy ? 'Đang xử lý…' : che === 'dang-nhap' ? 'Đăng nhập' : 'Đăng ký'}
        </button>
      </form>

      <div className="mt-[30px] flex flex-col gap-[12px]">
        {coGoogle && (
          <button onClick={dangNhapGoogle} className="link-text self-start">
            Đăng nhập bằng Google
          </button>
        )}
        <button
          onClick={() => {
            setChe(che === 'dang-nhap' ? 'dang-ky' : 'dang-nhap');
            setThongBao(null);
          }}
          className="link-text self-start"
        >
          {che === 'dang-nhap' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </div>
    </main>
  );
}
