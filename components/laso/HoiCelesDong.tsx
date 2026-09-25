import Link from 'next/link';

/**
 * Lối sang Hỏi Celes ở cuối phần tổng quan — MỘT dòng, không phải một thẻ.
 *
 * Thẻ Hỏi Celes cũ to ngang thẻ mời chuyên sâu, nên cuối trang có hai lời mời
 * cùng sức nặng. Đây là lối phụ: nhỏ hơn nút chính một bậc.
 */
export function HoiCelesDong({ tieuDe, mo, href }: { tieuDe: string; mo: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex min-h-[56px] items-center gap-[12px] rounded-[var(--radius-cards)] border px-[16px] py-[12px] transition-colors hover:border-[var(--accent)]"
      style={{ borderColor: 'var(--line)' }}
    >
      <span
        aria-hidden
        className="inline-flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full"
        style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        </svg>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>
          {tieuDe}
        </span>
        <span className="caption">{mo}</span>
      </span>
      <span aria-hidden className="transition-transform group-hover:translate-x-[4px]" style={{ color: 'var(--fg-muted)' }}>
        →
      </span>
    </Link>
  );
}
