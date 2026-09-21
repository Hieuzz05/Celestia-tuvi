'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChuyenNgonNgu } from '@/components/ChuyenNgonNgu';
import { Logo } from '@/components/Logo';
import { IconDong, IconMenu, IconNguoiDung, Shell } from '@/components/ui';
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
  /*
   * Menu điều hướng cho màn hẹp — TÁCH RIÊNG khỏi `moMenu` của tài khoản.
   *
   * Thanh này trước đây không có một lớp breakpoint nào: cùng một hàng ngang ở
   * 1440px và ở 390px, chỉ dựa vào `flex-wrap`. Đo thử: logo + năm liên kết +
   * đổi ngôn ngữ + đổi nền + chip tài khoản cần khoảng 770px, mà cột nội dung
   * trên máy 390px chỉ có 342px — nên nó xuống ba hàng. Và vì header `sticky`,
   * ba hàng ấy DÍNH LẠI, ăn mất khoảng một phần bảy màn hình suốt lúc cuộn.
   *
   * Hai menu là hai việc khác nhau nên để rời: điều hướng là "đi đâu", tài
   * khoản là "tôi là ai". Gộp vào một nút thì người dùng phải mở một thứ để
   * tìm thứ kia.
   *
   * NGƯỠNG LÀ `lg` (1024px) CHỨ KHÔNG PHẢI `md`, và con số này đo ra chứ
   * không chọn theo thói quen. Nav của người ĐÃ ĐĂNG NHẬP cần đúng 772px
   * (logo 155 + năm liên kết 402 + nhóm phải 183 + hai khoảng cách 32), mà ở
   * iPad dọc 820px thì nav rộng đúng 772px. Biên bằng KHÔNG: một tên tài
   * khoản dài hơn, hoặc nhãn tiếng Anh vốn dài hơn tiếng Việt, là xuống hàng
   * ngay. Ở `lg` thì nav có 976px cho 772px cần dùng.
   */
  const [moNav, setMoNav] = useState(false);
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
        <nav className="flex items-center justify-between gap-[16px] py-[16px]">
          <Link
            href={daDangNhap ? '/home' : '/'}
            aria-label="Celestia"
            style={{ color: 'var(--fg)' }}
          >
            <Logo />
          </Link>

          {/* Hàng liên kết chỉ nằm trên thanh từ md trở lên; hẹp hơn thì vào panel */}
          <div className="hidden items-center gap-[24px] lg:flex">
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

          <div className="flex items-center gap-[12px]">
            <div className="hidden items-center gap-[12px] lg:flex">
              <ChuyenNgonNgu />
              <ThemeToggle />
            </div>

            {taiKhoan ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMoMenu((v) => !v)}
                  className="pill-tag flex items-center gap-[8px]"
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

            {/*
              Nút mở menu chỉ hiện dưới md. Cao 44px: đây là nút điều hướng
              chính trên điện thoại, không phải chỗ để tiết kiệm không gian.

              CÓ CHỮ chứ không để mỗi icon. Ba gạch ngang là quy ước quen với
              người làm sản phẩm, không quen với mọi người dùng — chủ dự án mở
              bản chỉ-icon trên điện thoại và ghi thẳng vào ảnh: "user ko biết
              để bấm vào". Một chữ "Menu" tốn chừng bốn mươi pixel và bỏ hẳn
              câu hỏi ấy.
            */}
            <button
              type="button"
              onClick={() => setMoNav((v) => !v)}
              className="flex h-[44px] items-center gap-[8px] rounded-[var(--radius-buttons)] border px-[12px] text-[14px] font-medium lg:hidden"
              style={{ color: 'var(--fg)', borderColor: 'var(--line-strong)' }}
              aria-expanded={moNav}
              aria-controls="menu-dieu-huong"
            >
              {moNav ? <IconDong size={18} /> : <IconMenu size={18} />}
              {moNav ? t.chung.dongMenu : t.chung.menu}
            </button>
          </div>
        </nav>

        {/*
          Panel điều hướng cho màn hẹp.
          Đặt NGOÀI <nav> hàng ngang để nó chiếm trọn chiều ngang, và chỉ dựng
          khi mở — một panel ẩn bằng CSS vẫn nằm trong luồng Tab và vẫn được
          trình đọc màn hình đọc ra.
        */}
        {moNav && (
          <div
            id="menu-dieu-huong"
            className="flex flex-col gap-[4px] border-t pb-[16px] lg:hidden"
            style={{ borderColor: 'var(--line)' }}
          >
            {lienKet.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="nav-link flex min-h-[44px] items-center"
                data-active={pathname === l.href}
                /* Đóng ngay ở cú bấm, không chờ hiệu ứng theo pathname: panel
                   còn mở sau điều hướng là nó che đúng trang vừa mở ra. */
                onClick={() => setMoNav(false)}
              >
                {l.nhan}
              </Link>
            ))}
            <div
              className="mt-[8px] flex items-center gap-[12px] border-t pt-[12px]"
              style={{ borderColor: 'var(--line)' }}
            >
              <ChuyenNgonNgu />
              <ThemeToggle />
            </div>
          </div>
        )}
      </Shell>
    </header>
  );
}
