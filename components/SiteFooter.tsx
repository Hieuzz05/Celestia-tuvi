'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Shell } from '@/components/ui';
import { useT } from '@/lib/i18n/context';

/**
 * Chân trang: một đường hairline, logo, câu miễn trừ và vài liên kết.
 *
 * Luôn giữ đường về trang giới thiệu và câu chuyện — lỗi đã được chỉ ra là người
 * dùng đi sang màn khác rồi thì không còn chỗ nào quay lại phần giới thiệu nữa.
 * Câu chuyện giờ là một section trong trang chủ nên liên kết là neo, không phải route.
 */
export function SiteFooter() {
  const t = useT();

  return (
    <footer className="no-print border-t" style={{ borderColor: 'var(--line)' }}>
      <Shell className="flex flex-wrap items-center justify-between gap-[16px] py-[32px]">
        <span style={{ color: 'var(--fg)' }}>
          <Logo size={16} />
        </span>

        <p className="caption max-w-[440px]">{t.chan.mienTru}</p>

        <div className="flex flex-wrap items-center gap-[20px]">
          <Link href="/la-so" className="link-text">
            {t.chung.ctaChinh}
          </Link>
          <Link href="/gioi-thieu" className="link-text">
            {t.nav.cachHoatDong}
          </Link>
          {/* Quyết định #9 gộp Câu chuyện vào trang chủ; giữ liên kết ở đây
              nhưng trỏ vào neo, bằng không chân trang nào cũng có một link 404. */}
          <Link href="/#cau-chuyen" className="link-text">
            {t.nav.cauChuyen}
          </Link>
        </div>
      </Shell>
    </footer>
  );
}
