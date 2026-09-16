import type { ReactNode } from 'react';

/** Nhãn mono giãn 0.10em mở đầu mỗi khối — tín hiệu "sang phần mới" của hệ */
export function Eyebrow({
  children,
  icon,
  className = '',
}: {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <p className={`eyebrow inline-flex items-center gap-[8px] ${className}`}>
      {icon}
      {children}
    </p>
  );
}

/**
 * Ghi chú viết tay — lớp cá tính, không phải nội dung.
 *
 * Hệ giới hạn 1-3 cái mỗi trang và CHỈ đặt trên dải gradient hero: ra nền trắng
 * là mất tương phản, đọc thành chữ vỡ. Mỗi cái đi kèm một mũi tên vẽ tay chỉ vào
 * đúng một phần tử cụ thể.
 */
export function GhiChuTay({
  children,
  huong = 'phai',
  xoay = -3,
  className = '',
}: {
  children: ReactNode;
  /** Mũi tên chỉ sang phải, sang trái hay xuống dưới */
  huong?: 'phai' | 'trai' | 'duoi';
  /** Độ nghiêng nhẹ 2-4 độ cho ra chất viết vội */
  xoay?: number;
  className?: string;
}) {
  return (
    <span
      className={`annotation inline-flex items-center gap-[8px] ${className}`}
      style={{ transform: `rotate(${xoay}deg)` }}
    >
      {huong === 'trai' && <MuiTen huong="trai" />}
      <span>{children}</span>
      {huong !== 'trai' && <MuiTen huong={huong} />}
    </span>
  );
}

function MuiTen({ huong }: { huong: 'phai' | 'trai' | 'duoi' }) {
  const xoay = huong === 'trai' ? 180 : huong === 'duoi' ? 65 : 0;
  return (
    <svg
      width="46"
      height="22"
      viewBox="0 0 46 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ transform: `rotate(${xoay}deg)`, flexShrink: 0 }}
    >
      {/* Nét cong hơi run cho giống vẽ tay, không phải mũi tên dựng bằng thước */}
      <path d="M1 14c7-6 15-9 24-10 6-.6 12 .3 18 2.5" />
      <path d="M36 1.5c2.6 2.4 5 4 7 5-2.6 1.2-5 3-7 5.3" />
    </svg>
  );
}
