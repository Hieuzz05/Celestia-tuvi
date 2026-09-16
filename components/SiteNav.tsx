'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/Logo';
import { IconNguoiDung, Shell } from '@/components/ui';
import { taiTaiKhoan, type HoSoTaiKhoan } from '@/lib/store/profile';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { ThemeToggle } from './ThemeToggle';

/**
 * Điều hướng chính — tối đa 5 mục.
 *
 * Trước đây thanh này trộn lẫn đối tượng (Lá số, Hồ sơ), hành động (Luận giải),
 * tình huống dùng (Hợp tuổi) và cả trang quản trị nội bộ. Giờ chia lại: việc
 * người dùng muốn làm thì ở ngoài, thứ thuộc về tài khoản nằm trong menu avatar,
 * còn trang quản trị không xuất hiện ở đâu cả — vào thẳng bằng địa chỉ, và server
 * vẫn chặn theo quyền như cũ.
 */
const LIEN_KET = [
  { href: '/la-so', nhan: 'Lá số' },
  { href: '/luan-giai', nhan: 'Khám phá sâu hơn' },
  { href: '/hoi-dap', nhan: 'Hỏi Celestia' },
  { href: '/hop-tuoi', nhan: 'Kết nối' },
  { href: '/gioi-thieu', nhan: 'Cách hoạt động' },
];

const MUC_TAI_KHOAN = [
  { href: '/ho-so', nhan: 'Người của tôi' },
  { href: '/tai-khoan', nhan: 'Tài khoản' },
];

export function SiteNav() {
  const pathname = usePathname();
  const [taiKhoan, setTaiKhoan] = useState<HoSoTaiKhoan | null>(null);
  const [daCauHinhAuth, setDaCauHinhAuth] = useState(false);
  const [moMenu, setMoMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Bấm ra ngoài thì đóng menu — bằng không nó dính lại khi chuyển trang
  useEffect(() => {
    if (!moMenu) return;
    const dong = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMoMenu(false);
    };
    document.addEventListener('mousedown', dong);
    return () => document.removeEventListener('mousedown', dong);
  }, [moMenu]);

  const dangXuat = async () => {
    const supabase = taoSupabaseClient();
    await supabase?.auth.signOut();
    setTaiKhoan(null);
    setMoMenu(false);
  };

  // Trang đăng nhập rút gọn hết mức: chỉ logo và đường quay lại, để người dùng
  // tập trung vào đúng một việc đang làm dở.
  if (pathname === '/dang-nhap') {
    return (
      <header
        className="no-print border-b"
        style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}
      >
        <Shell>
          <nav className="flex items-center justify-between gap-[16px] py-[16px]">
            <Link href="/" aria-label="Celestia — trang chu" style={{ color: 'var(--fg)' }}>
              <Logo />
            </Link>
            <Link href="/" className="link-text">
              Quay lại
            </Link>
          </nav>
        </Shell>
      </header>
    );
  }

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
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMoMenu((v) => !v)}
                  className="pill-tag flex items-center gap-[6px]"
                  aria-expanded={moMenu}
                  aria-haspopup="menu"
                  title={taiKhoan.email ?? undefined}
                >
                  <IconNguoiDung size={14} />
                  {taiKhoan.tenHienThi}
                </button>

                {moMenu && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] z-40 flex min-w-[200px] flex-col gap-[4px] rounded-[var(--radius-cards)] p-[8px]"
                    style={{
                      background: 'var(--surface-card)',
                      boxShadow: 'var(--shadow-elevated)',
                    }}
                  >
                    {MUC_TAI_KHOAN.map((m) => (
                      <Link
                        key={m.href}
                        href={m.href}
                        role="menuitem"
                        onClick={() => setMoMenu(false)}
                        className="link-text rounded-[var(--radius-buttons)] px-[10px] py-[8px] text-left"
                      >
                        {m.nhan}
                      </Link>
                    ))}
                    <span className="my-[4px] h-px" style={{ background: 'var(--line)' }} />
                    <button
                      onClick={dangXuat}
                      role="menuitem"
                      className="link-text rounded-[var(--radius-buttons)] px-[10px] py-[8px] text-left"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Chưa cấu hình đăng nhập là chuyện của người vận hành, không phải
                    thông tin người dùng cần thấy — chỉ ẩn nút, vẫn tạo lá số được. */}
                {daCauHinhAuth && (
                  <Link href="/dang-nhap" className="link-text">
                    Đăng nhập
                  </Link>
                )}
                {/* Đang ở ngay trang tạo lá số thì nút này thừa, mà lại thành nút
                    hồng thứ hai đối đầu với nút chính giữa màn. */}
                {pathname !== '/la-so' && (
                  <Link href="/la-so" className="btn-primary btn-sm">
                    Tạo lá số miễn phí
                  </Link>
                )}
              </>
            )}
          </div>
        </nav>
      </Shell>
    </header>
  );
}
