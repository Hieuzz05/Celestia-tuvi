'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';
import { taiTaiKhoan, type HoSoTaiKhoan } from '@/lib/store/profile';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { ThemeToggle } from './ThemeToggle';

const LIEN_KET = [
  { href: '/', nhan: 'Lá số' },
  { href: '/luan-giai', nhan: 'Luận giải chi tiết' },
  { href: '/hoi-dap', nhan: 'Hỏi đáp' },
  { href: '/hop-tuoi', nhan: 'Hợp tuổi' },
  { href: '/ho-so', nhan: 'Hồ sơ' },
  { href: '/admin', nhan: 'Quản trị' },
];

export function SiteNav() {
  const pathname = usePathname();
  const [taiKhoan, setTaiKhoan] = useState<HoSoTaiKhoan | null>(null);
  const [daCauHinhAuth, setDaCauHinhAuth] = useState(false);

  useEffect(() => {
    const supabase = taoSupabaseClient();
    if (!supabase) return;
    setDaCauHinhAuth(true);

    taiTaiKhoan().then(setTaiKhoan);
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      taiTaiKhoan().then(setTaiKhoan);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const dangXuat = async () => {
    const supabase = taoSupabaseClient();
    await supabase?.auth.signOut();
    setTaiKhoan(null);
  };

  return (
    <nav
      className="no-print flex flex-wrap items-center justify-between gap-[16px] border-b py-[18px]"
      style={{ borderColor: 'var(--line)' }}
    >
      <Link href="/" aria-label="Celestia — trang chu">
        <Logo />
      </Link>

      <div className="flex flex-wrap items-center gap-[20px]">
        {LIEN_KET.map((l) => (
          <Link key={l.href} href={l.href} className="nav-link" data-active={pathname === l.href}>
            {l.nhan}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-[12px]">
        <ThemeToggle />
        {taiKhoan ? (
          <>
            <Link
              href="/tai-khoan"
              className="text-[13px] font-medium"
              style={{ color: 'var(--fg)' }}
              title={taiKhoan.email ?? undefined}
            >
              {taiKhoan.tenHienThi}
            </Link>
            <button onClick={dangXuat} className="nav-link">
              Đăng xuất
            </button>
          </>
        ) : daCauHinhAuth ? (
          <Link href="/dang-nhap" className="btn-outline">
            Đăng nhập
          </Link>
        ) : (
          <span
            className="text-[13px]"
            style={{ color: 'var(--fg-subtle)' }}
            title="Thêm biến môi trường Supabase để bật đăng nhập"
          >
            Chưa bật đăng nhập
          </span>
        )}
      </div>
    </nav>
  );
}
