'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';
import { taoSupabaseClient } from '@/lib/supabase/client';

type Che = 'dang-nhap' | 'dang-ky';

/** Các nhà cung cấp SSO hỗ trợ sẵn — nút chỉ hiện khi bật trong Supabase */
const SSO = [
  { id: 'google', nhan: 'Google' },
  { id: 'facebook', nhan: 'Facebook' },
  { id: 'github', nhan: 'GitHub' },
  { id: 'azure', nhan: 'Microsoft' },
  { id: 'apple', nhan: 'Apple' },
] as const;

type SsoId = (typeof SSO)[number]['id'];

export default function DangNhapPage() {
  const router = useRouter();
  const [che, setChe] = useState<Che>('dang-nhap');
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [tenHienThi, setTenHienThi] = useState('');
  const [thongBao, setThongBao] = useState<{ loai: 'loi' | 'ok'; noiDung: string } | null>(null);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [ssoDangBat, setSsoDangBat] = useState<SsoId[]>([]);

  const supabase = taoSupabaseClient();

  // Chỉ hiện nút SSO của provider thực sự được bật trong Supabase — bằng không
  // người dùng bấm vào chỉ nhận về lỗi khó hiểu.
  useEffect(() => {
    if (!SUPABASE_URL) return;
    fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } })
      .then((r) => r.json())
      .then((d) => setSsoDangBat(SSO.filter((s) => d?.external?.[s.id]).map((s) => s.id)))
      .catch(() => setSsoDangBat([]));
  }, []);

  if (!supabase) {
    return (
      <main className="mx-auto w-full max-w-[560px] py-[60px]">
        <h1 className="heading">Chưa bật đăng nhập</h1>
        <p className="body-text mt-[20px]" style={{ color: 'var(--fg-muted)' }}>
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
        const { error } = await supabase.auth.signUp({
          email,
          password: matKhau,
          options: { data: { full_name: tenHienThi.trim() || email.split('@')[0] } },
        });
        if (error) throw error;
        setThongBao({
          loai: 'ok',
          noiDung:
            'Đã tạo tài khoản. Nếu Supabase bật xác nhận email, hãy mở hộp thư và bấm liên kết xác nhận trước khi đăng nhập.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: matKhau });
        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setThongBao({ loai: 'loi', noiDung: err instanceof Error ? err.message : 'Có lỗi xảy ra' });
    } finally {
      setDangXuLy(false);
    }
  };

  const dangNhapSSO = async (provider: SsoId) => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <main className="mx-auto w-full max-w-[460px] py-[40px]">
      <h1 className="heading">{che === 'dang-nhap' ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
      <p className="body-text mt-[14px]" style={{ color: 'var(--fg-muted)' }}>
        Đăng nhập để lưu lá số và xem lại các bản luận giải đã tạo.
      </p>

      {ssoDangBat.length > 0 && (
        <div className="mt-[28px] flex flex-col gap-[10px]">
          {ssoDangBat.map((id) => (
            <button
              key={id}
              onClick={() => dangNhapSSO(id)}
              className="btn-outline w-full"
              type="button"
            >
              Tiếp tục với {SSO.find((s) => s.id === id)!.nhan}
            </button>
          ))}
          <div className="my-[6px] flex items-center gap-[12px]">
            <span className="h-px flex-1" style={{ background: 'var(--line)' }} />
            <span className="text-[12px]" style={{ color: 'var(--fg-subtle)' }}>
              hoặc dùng email
            </span>
            <span className="h-px flex-1" style={{ background: 'var(--line)' }} />
          </div>
        </div>
      )}

      <form onSubmit={guiForm} className="mt-[20px] flex flex-col gap-[18px]">
        {che === 'dang-ky' && (
          <label className="flex flex-col gap-[6px]">
            <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
              Tên hiển thị
            </span>
            <input
              value={tenHienThi}
              onChange={(e) => setTenHienThi(e.target.value)}
              maxLength={60}
              placeholder="Tên bạn muốn hiện trên thanh điều hướng"
              className="field-input"
              autoComplete="nickname"
            />
          </label>
        )}

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
            style={{ color: thongBao.loai === 'loi' ? 'var(--chart-hung)' : 'var(--chart-cat)' }}
          >
            {thongBao.noiDung}
          </p>
        )}

        <button type="submit" disabled={dangXuLy} className="btn-primary self-start">
          {dangXuLy ? 'Đang xử lý…' : che === 'dang-nhap' ? 'Đăng nhập' : 'Đăng ký'}
        </button>
      </form>

      <button
        onClick={() => {
          setChe(che === 'dang-nhap' ? 'dang-ky' : 'dang-nhap');
          setThongBao(null);
        }}
        className="link-text mt-[24px]"
      >
        {che === 'dang-nhap' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
      </button>
    </main>
  );
}
