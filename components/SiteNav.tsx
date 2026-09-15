'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { ThemeToggle } from './ThemeToggle';

const LIEN_KET = [
  { href: '/', nhan: 'Lá số' },
  { href: '/luan-giai', nhan: 'Luận giải' },
  { href: '/ho-so', nhan: 'Hồ sơ' },
  { href: '/lich', nhan: 'Lịch âm' },
  { href: '/admin', nhan: 'Quản trị' },
];

export function SiteNav() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [daCauHinhAuth, setDaCauHinhAuth] = useState(false);

  useEffect(() => {
    const supabase = taoSupabaseClient();
    if (!supabase) return;
    setDaCauHinhAuth(true);
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user?.email ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const dangXuat = async () => {
    const supabase = taoSupabaseClient();
    await supabase?.auth.signOut();
    setEmail(null);
  };

  return (
    <nav
      className="no-print flex flex-wrap items-center justify-between gap-[16px] border-b py-[20px]"
      style={{ borderColor: 'var(--line)' }}
    >
      <Link href="/" className="flex items-baseline gap-[8px]">
        <span className="heading-sm" style={{ fontSize: 28, lineHeight: 1 }}>
          Tử Vi
        </span>
        <span className="text-[13px] font-medium" style={{ color: 'var(--accent)' }}>
          AI
        </span>
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
        {email ? (
          <>
            <span className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
              {email}
            </span>
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
