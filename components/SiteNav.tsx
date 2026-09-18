'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChuyenNgonNgu } from '@/components/ChuyenNgonNgu';
import { Logo } from '@/components/Logo';
import { IconNguoiDung, Shell } from '@/components/ui';
import { useT } from '@/lib/i18n/context';
import { useQuyen } from '@/lib/support/useQuyen';
import { taiTaiKhoan, type HoSoTaiKhoan } from '@/lib/store/profile';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { ThemeToggle } from './ThemeToggle';

/**
 * Điều hướng chính.
 *
 * Brand spec tách hai chế độ: khách vào trang thì thanh này là trang bán hàng
 * (Khám phá · Cách hoạt động · Câu chuyện), đăng nhập rồi thì nó thành thanh của
 * ứng dụng (Bản đồ · Hành trình · Hỏi Celes · Kết nối). Trộn hai thứ vào một
 * thanh chính là lỗi đã bị chỉ ra: người dùng đang ở trong app mà vẫn nhìn thấy
 * menu marketing, còn khách thì lạc mất trang giới thiệu.
 *
 * Logo luôn đưa về đúng "nhà" của từng trạng thái: landing khi chưa đăng nhập,
 * bản đồ khi đã đăng nhập.
 */
export function SiteNav() {
  const pathname = usePathname();
  const t = useT();
  const [taiKhoan, setTaiKhoan] = useState<HoSoTaiKhoan | null>(null);
  const [daCauHinhAuth, setDaCauHinhAuth] = useState(false);
  const [moMenu, setMoMenu] = useState(false);
  // Vai trò admin do MÁY CHỦ quyết. Không bao giờ so email ở trình duyệt:
  // email nằm trong tay người dùng, danh sách admin thì chỉ máy chủ mới biết.
  const { quyen } = useQuyen();
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

  const daDangNhap = Boolean(taiKhoan);

  // Khách đang dở dang ở trang lập lá số: bỏ bớt mục và KHÔNG lặp lại nút "Bắt
  // đầu miễn phí" — họ đang bắt đầu rồi, nhắc nữa là nhiễu.
  const dangLapLaSo = pathname === '/la-so';

  // Spec v4 gộp "Khám phá bản đồ" vào trong Hỏi Celes: hai mục đó cùng dẫn tới
  // một ý định — muốn hiểu điều gì đó về lá số của mình — nên để cạnh nhau ở
  // thanh chính là bắt người dùng tự quyết định nên xem dữ liệu trước hay hỏi
  // trước. /la-so vẫn tồn tại như một route, chỉ là không tranh chỗ ở đây nữa.
  const lienKet = daDangNhap
    ? [
        { href: '/home', nhan: t.nav.homNay },
        // Danh sách lá số đứng ngang hàng với Hành trình và Hỏi Celes: nó là
        // một nơi người dùng quay lại thường xuyên, không phải một mục cài đặt.
        // Nằm trong menu tài khoản thì mỗi lần đổi lá số phải mò qua avatar.
        { href: '/ho-so', nhan: t.nav.nguoiCuaToi },
        { href: '/hanh-trinh', nhan: t.nav.hanhTrinh },
        { href: '/hoi-dap', nhan: t.nav.hoiCeles },
        { href: '/hop-tuoi', nhan: t.nav.ketNoi },
      ]
    : dangLapLaSo
      ? [
          { href: '/', nhan: t.nav.veCelestia },
          { href: '/gioi-thieu', nhan: t.nav.cachHoatDong },
        ]
      : [
          { href: '/', nhan: t.nav.veCelestia },
          { href: '/la-so', nhan: t.nav.khamPha },
          { href: '/gioi-thieu', nhan: t.nav.cachHoatDong },
        ];

  // Trang đăng nhập rút gọn hết mức để người dùng tập trung vào việc đang làm dở
  if (pathname === '/dang-nhap') {
    return (
      <header
        className="no-print border-b"
        style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}
      >
        <Shell>
          <nav className="flex items-center justify-between gap-[16px] py-[16px]">
            <Link href="/" aria-label="Celestia" style={{ color: 'var(--fg)' }}>
              <Logo />
            </Link>
            <div className="flex items-center gap-[12px]">
              <ChuyenNgonNgu />
              <Link href="/" className="link-text">
                {t.chung.quayLai}
              </Link>
            </div>
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
          <Link
            href={daDangNhap ? '/home' : '/'}
            aria-label="Celestia"
            style={{ color: 'var(--fg)' }}
          >
            <Logo />
          </Link>

          <div className="flex flex-wrap items-center gap-[20px]">
            {lienKet.map((l) => (
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
            <ChuyenNgonNgu />
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
                    {[
                      { href: '/tai-khoan', nhan: t.nav.taiKhoan },
                      // Lối ủng hộ tự nguyện: luôn có mặt, không phụ thuộc còn
                      // bao nhiêu lượt — spec cấm biến nó thành lời nhắc hết lượt.
                      { href: '/support', nhan: t.ungHo.ten },
                      // Quản trị chỉ hiện với tài khoản thật sự có quyền. Người
                      // dùng thường không bao giờ thấy mục này.
                      ...(quyen?.tier === 'admin'
                        ? [{ href: '/admin', nhan: t.nav.quanTri }]
                        : []),
                    ].map((m) => (
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
                      {t.nav.dangXuat}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {daCauHinhAuth && (
                  <Link href="/dang-nhap" className="link-text">
                    {t.nav.dangNhap}
                  </Link>
                )}
                {/* Một CTA duy nhất trên header, và nó biến mất khi đã ở đúng chỗ
                    nó dẫn tới — spec cấm đặt nhiều CTA ngang hàng nhau. */}
                {!dangLapLaSo && (
                  <Link href="/la-so" className="btn-primary btn-sm">
                    {t.nav.batDauMienPhi}
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
