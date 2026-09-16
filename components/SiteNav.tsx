'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';
import { Shell } from '@/components/ui';
import { taiTaiKhoan, type HoSoTaiKhoan } from '@/lib/store/profile';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { ThemeToggle } from './ThemeToggle';

const LIEN_KET = [
  { href: '/', nhan: 'Lá số' },
  { href: '/gioi-thieu', nhan: 'Giới thiệu' },
  { href: '/luan-giai', nhan: 'Luận giải chi tiết' },
  { href: '/hoi-dap', nhan: 'Hỏi đáp' },
  { href: '/hop-tuoi', nhan: 'Hợp tuổi' },
  { href: '/ho-so', nhan: 'Hồ sơ' },
  { href: '/admin', nhan: 'Quản trị' },
];

/**
 * Thanh điều hướng dính đỉnh trang: nền canvas, một đường hairline dưới đáy,
 * logo trái — liên kết giữa — tài khoản phải. Không mega-menu, đúng lối phẳng
 * mà design system mô tả.
 */
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
    <header
      className="no-print sticky top-0 z-30 border-b"
      style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}
    >
      <Shell>
        <nav className="flex flex-wrap items-center justify-between gap-[16px] py-[16px]">
          <Link href="/" aria-label="Celestia — trang chu" style={{ color: 'var(--fg)' }}>
            <Logo />
          </Link>

          <div className="flex flex-wrap items-center gap-[20px]">
            {LIEN_KET.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="nav-link"
                data-active={pathname === l.href}
              >
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
                  className="nav-link"
                  data-active={pathname === '/tai-khoan'}
                  title={taiKhoan.email ?? undefined}
                >
                  {taiKhoan.tenHienThi}
                </Link>
                <button onClick={dangXuat} className="btn-outline btn-sm">
                  Đăng xuất
                </button>
              </>
            ) : daCauHinhAuth ? (
              /* Đang đứng ngay trên trang đăng nhập thì giấu cặp nút này đi: hệ chỉ
                 cho phép một nút hồng mỗi khung nhìn, mà nút chính lúc đó là nút
                 gửi form ở giữa trang. */
              pathname !== '/dang-nhap' && (
                <>
                  <Link href="/dang-nhap" className="link-text">
                    Đăng nhập
                  </Link>
                  <Link href="/dang-nhap?che=dang-ky" className="btn-primary btn-sm">
                    Tạo tài khoản
                  </Link>
                </>
              )
            ) : (
              <span className="caption" title="Thêm biến môi trường Supabase để bật đăng nhập">
                Chưa bật đăng nhập
              </span>
            )}
          </div>
        </nav>
      </Shell>
    </header>
  );
}
