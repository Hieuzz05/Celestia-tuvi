import type { ReactNode } from 'react';

/**
 * Thẻ và khối nội dung của design system Outseta.
 *
 * Mọi thẻ đều nằm trên nền trắng, bo 14px, và dùng viền-giả bằng box-shadow pha
 * tím thay vì border xám — đó là lý do các thẻ trông "nổi" mà không hề có bóng đen.
 */

export function The({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

/** Thẻ nổi hơn — dùng cho khối cần tách khỏi nền, ví dụ ảnh chụp sản phẩm */
export function TheNoi({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card-elevated ${className}`}>{children}</div>;
}

/** Thẻ trưng bày: nội dung tràn sát mép, không padding */
export function TheTrungBay({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`showcase-card ${className}`}>{children}</div>;
}

/**
 * Thẻ lời chứng thực — avatar tròn 40px nền Aubergine chữ trắng, tên 16px/600,
 * vai trò 14px/400 màu Heather, trích dẫn 14px.
 */
export function TheTrichDan({
  ten,
  vaiTro,
  trichDan,
  className = '',
}: {
  ten: string;
  vaiTro: string;
  trichDan: ReactNode;
  className?: string;
}) {
  return (
    <figure className={`card flex flex-col gap-[16px] p-[32px] ${className}`}>
      <blockquote className="body-sm" style={{ color: 'var(--fg)' }}>
        {trichDan}
      </blockquote>
      <figcaption className="flex items-center gap-[12px]">
        <span
          className="flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-full text-[16px] font-semibold"
          style={{ background: 'var(--fg)', color: 'var(--bg)' }}
          aria-hidden
        >
          {ten.trim().charAt(0).toUpperCase()}
        </span>
        <span className="flex flex-col">
          <span className="text-[16px] font-semibold" style={{ color: 'var(--fg)' }}>
            {ten}
          </span>
          <span className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
            {vaiTro}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Bước đánh số — vòng tròn 24px kèm chữ, không có thẻ bao quanh.
 * Vòng tròn trôi ngay cạnh dòng chữ, cách 12px.
 */
export function BuocSo({
  so,
  tieuDe,
  mo,
  className = '',
}: {
  so: number;
  tieuDe: string;
  mo?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex gap-[12px] ${className}`}>
      <span className="step-num mt-[2px]">{so}</span>
      <div className="flex flex-col gap-[8px]">
        <span className="text-[16px] font-medium" style={{ color: 'var(--fg)' }}>
          {tieuDe}
        </span>
        {mo && <span className="body-sm" style={{ color: 'var(--fg-muted)' }}>{mo}</span>}
      </div>
    </div>
  );
}

/** Ô icon 40px trong hàng tích hợp — một màu, không nền */
export function OIcon({ children, nhan }: { children: ReactNode; nhan: string }) {
  return (
    <span className="icon-tile" title={nhan} aria-label={nhan}>
      {children}
    </span>
  );
}
