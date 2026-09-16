'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { Shell } from '@/components/ui';

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

  // Callback OAuth chuyển về đây kèm lý do khi đăng nhập thất bại.
  // Nút "Tạo tài khoản" trên thanh điều hướng mở thẳng chế độ đăng ký qua ?che=
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const loi = q.get('loi');
    if (loi) setThongBao({ loai: 'loi', noiDung: loi });
    if (q.get('che') === 'dang-ky') setChe('dang-ky');
  }, []);

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
      <Shell className="py-[60px]">
        <div className="mx-auto w-full max-w-[560px]">
        <h1 className="heading">Chưa bật đăng nhập</h1>
        <p className="body-text mt-[20px]" style={{ color: 'var(--fg-muted)' }}>
          Tính năng tài khoản cần Supabase. Thêm hai biến môi trường{' '}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> và <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> rồi
          khởi động lại ứng dụng. Xem hướng dẫn chi tiết trong tệp <code>HUONG-DAN.md</code>.
        </p>
      </div>
      </Shell>
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
            'Đã tạo tài khoản. Nếu hộp thư của bạn nhận được email xác nhận, hãy bấm liên kết trong đó trước khi đăng nhập.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: matKhau });
        if (error) throw error;
        const next = new URLSearchParams(window.location.search).get('next');
        router.push(next && next.startsWith('/') && !next.startsWith('//') ? next : '/la-so');
        router.refresh();
      }
    } catch (err) {
      setThongBao({ loai: 'loi', noiDung: err instanceof Error ? err.message : 'Có lỗi xảy ra' });
    } finally {
      setDangXuLy(false);
    }
  };

  const quenMatKhau = async () => {
    if (!email.trim()) {
      setThongBao({ loai: 'loi', noiDung: 'Điền email của bạn ở trên trước đã nhé.' });
      return;
    }
    setDangXuLy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/dang-nhap`,
    });
    setDangXuLy(false);
    setThongBao(
      error
        ? { loai: 'loi', noiDung: 'Chưa gửi được email đặt lại — thử lại sau một chút.' }
        : {
            loai: 'ok',
            noiDung: 'Đã gửi email đặt lại mật khẩu. Mở hộp thư và bấm liên kết trong đó.',
          }
    );
  };

  const dangNhapSSO = async (provider: SsoId) => {
    setThongBao(null);
    const quayVe = new URLSearchParams(window.location.search).get('next') ?? '/';
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(quayVe)}`,
      },
    });
    if (error) setThongBao({ loai: 'loi', noiDung: error.message });
  };

  return (
    <Shell className="py-[40px]">
      {/* Hai cột: form bên trái, panel nhắc lại thứ người dùng sắp giữ lại bên phải.
          Đăng nhập ở đây không phải cổng chặn mà là bước lưu giá trị vừa nhận. */}
      <div className="mx-auto grid w-full max-w-[940px] gap-[40px] lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="w-full">
      <h1 className="heading-sm">{che === 'dang-nhap' ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
      <p className="body-text mt-[14px]" style={{ color: 'var(--fg-muted)' }}>
        Giữ mọi lá số và góc nhìn của bạn ở một nơi — để lần sau tiếp tục đúng chỗ đang dở.
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

        {che === 'dang-nhap' && (
          <button type="button" onClick={quenMatKhau} className="link-text self-start">
            Quên mật khẩu?
          </button>
        )}

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
        {che === 'dang-nhap' ? 'Mới dùng Celestia? Tạo tài khoản miễn phí.' : 'Đã có tài khoản? Đăng nhập'}
      </button>
      </div>

      <aside className="hero-band hidden flex-col justify-center gap-[16px] rounded-[var(--radius-cards)] p-[40px] lg:flex">
        <p className="eyebrow">BẠN SẼ GIỮ LẠI ĐƯỢC</p>
        <p className="text-[24px] font-semibold leading-[1.25]" style={{ color: 'var(--fg)' }}>
          Lá số, góc nhìn và các cuộc trò chuyện của bạn ở một nơi.
        </p>
        <ul className="flex flex-col gap-[10px]">
          {[
            'Lưu lá số của bạn và người thân, không phải nhập lại ngày sinh mỗi lần.',
            'Xem lại những gì đã đọc, trên máy nào cũng thấy.',
            'Tiếp tục cuộc trò chuyện đang dở với Celestia.',
          ].map((d) => (
            <li key={d} className="body-sm flex gap-[8px]" style={{ color: 'var(--fg)' }}>
              <span aria-hidden>·</span>
              {d}
            </li>
          ))}
        </ul>
      </aside>
      </div>
    </Shell>
  );
}
