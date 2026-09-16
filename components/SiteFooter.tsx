import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Shell } from '@/components/ui';

/**
 * Chân trang: một đường hairline, logo, câu miễn trừ và vài liên kết.
 * Cố ý nhạt — design system kết thúc trang bằng dải CTA tối, chân trang chỉ là
 * phần đuôi chứ không phải một khối nội dung nữa.
 */
export function SiteFooter() {
  return (
    <footer className="no-print border-t" style={{ borderColor: 'var(--line)' }}>
      <Shell className="flex flex-wrap items-center justify-between gap-[16px] py-[32px]">
        <span style={{ color: 'var(--fg)' }}>
          <Logo size={16} />
        </span>

        <p className="caption max-w-[420px]">
          Nội dung luận giải do AI soạn, chỉ mang tính tham khảo — không thay thế cho quyết định
          của chính bạn.
        </p>

        <div className="flex flex-wrap items-center gap-[20px]">
          <Link href="/gioi-thieu" className="link-text">
            Giới thiệu
          </Link>
          <Link href="/" className="link-text">
            Lập lá số
          </Link>
          <Link href="/hoi-dap" className="link-text">
            Hỏi đáp
          </Link>
        </div>
      </Shell>
    </footer>
  );
}
