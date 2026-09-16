'use client';

import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes, InputHTMLAttributes } from 'react';

/**
 * Điều khiển của design system Outseta.
 *
 * Thang bo góc là thứ phân biệt "chất liệu": ô nhập 3px sắc hơn nút 6px, nút lại
 * sắc hơn thẻ 14px, còn pill/badge bo tròn hẳn 999px. Không thêm bậc thứ năm.
 */

type NutProps = ButtonHTMLAttributes<HTMLButtonElement> & { nho?: boolean };

/**
 * Nút chuyển đổi duy nhất — hồng Fuchsia đặc.
 * Hệ quy định mỗi khung nhìn chỉ có đúng MỘT nút này; mọi hành động còn lại dùng NutVien.
 */
export function NutChinh({ nho, className = '', children, ...rest }: NutProps) {
  return (
    <button className={`btn-primary ${nho ? 'btn-sm' : ''} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/** Hành động hạng hai — viền Heather, nền trong suốt. Không bao giờ chuyển sang xám. */
export function NutVien({ nho, className = '', children, ...rest }: NutProps) {
  return (
    <button className={`btn-outline ${nho ? 'btn-sm' : ''} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/** Chip lọc / nhãn phân loại — viền mảnh, bo tròn hẳn, đọc ra là bộ lọc chứ không phải nút */
export function PillTag({
  dangChon,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { dangChon?: boolean }) {
  return (
    <button className={`pill-tag ${className}`} data-active={dangChon} {...rest}>
      {children}
    </button>
  );
}

/** Pill tĩnh không bấm được — dùng cho nhãn phân loại thuần hiển thị */
export function NhanPill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`pill-tag inline-block ${className}`}>{children}</span>;
}

/**
 * Huy hiệu trạng thái tốt — bộ ba xanh (viền Mint, nền Honeydew, chữ Forest).
 * Đây là chỗ DUY NHẤT màu xanh xuất hiện trong hệ.
 */
export function HuyHieuOk({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`badge-ok ${className}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
        <path d="M4 12.5l5.5 5.5L20 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </span>
  );
}

/** Ô nhập kèm nhãn — gộp lại để mọi form trong web có cùng khoảng cách nhãn/ô */
export function Truong({
  nhan,
  goiY,
  children,
  className = '',
}: {
  nhan: string;
  goiY?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-[6px] ${className}`}>
      <span className="field-label">{nhan}</span>
      {children}
      {goiY && <span className="caption">{goiY}</span>}
    </label>
  );
}

export function O({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`field-input ${className}`} {...rest} />;
}

export function OChon({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`field-input ${className}`} {...rest}>
      {children}
    </select>
  );
}
