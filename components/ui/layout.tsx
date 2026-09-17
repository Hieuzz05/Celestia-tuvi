import type { ReactNode } from 'react';

/**
 * Khung bố cục của design system Outseta.
 *
 * Trang chạy tràn hết chiều ngang, nội dung neo vào cột 1200px ở giữa. Các dải
 * hero/CTA cố tình nằm ngoài cột đó để nền tràn sát mép màn hình, nên chúng tự
 * bọc <Shell> ở bên trong thay vì bị bọc từ ngoài.
 */

/** Cột nội dung 1200px — dùng ở mọi trang và bên trong mọi dải tràn màn */
export function Shell({
  children,
  className = '',
  rong,
}: {
  children: ReactNode;
  className?: string;
  /**
   * `hep` — cột 800px cho khối chữ căn giữa (headline + phụ đề + CTA).
   * `hero` — dùng trọn cột nội dung 1200px cho headline mở đầu. Cột chữ hẹp
   * 800px đẩy câu mở đầu xuống dòng ngay giữa mệnh đề; đo ở 1280px trở lên thì
   * 1200px vừa đủ để nó nằm một dòng.
   */
  rong?: 'hep' | 'hero';
}) {
  const maxW =
    rong === 'hep' ? 'max-w-[800px]' : rong === 'hero' ? 'max-w-[1200px]' : 'max-w-[1200px]';
  return <div className={`mx-auto w-full ${maxW} px-[24px] ${className}`}>{children}</div>;
}

/**
 * Dải hero: gradient hoàng hôn tràn hết chiều ngang.
 * Hệ cấm dùng gradient này cho thẻ, nút hay icon — chỉ dải nền cấp trang.
 */
export function HeroBand({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`hero-band relative overflow-hidden ${className}`}>{children}</section>;
}

/** Dải CTA tối cuối trang — nền Aubergine, chữ trắng, phụ đề Plum Tinted */
export function DarkBand({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`dark-band ${className}`}>{children}</section>;
}

/**
 * Cặp eyebrow + tiêu đề đặt trên mỗi khối lớn.
 * Mono giãn 0.10em là cách hệ nói "dừng lại, sang phần mới".
 */
export function SectionHeader({
  eyebrow,
  tieuDe,
  mo,
  canGiua = false,
  cap = 'h2',
  className = '',
}: {
  eyebrow: string;
  tieuDe: ReactNode;
  mo?: ReactNode;
  canGiua?: boolean;
  /** h1 dùng cỡ heading (56px), h2 dùng heading-sm (36px) */
  cap?: 'h1' | 'h2';
  className?: string;
}) {
  const The = cap;
  return (
    <div className={`${canGiua ? 'text-center' : ''} ${className}`}>
      <p className="eyebrow mb-[16px]">{eyebrow}</p>
      <The className={cap === 'h1' ? 'heading' : 'heading-sm'}>{tieuDe}</The>
      {mo && (
        <p className={`body-lg mt-[16px] ${canGiua ? 'mx-auto max-w-[640px]' : 'max-w-[640px]'}`}>
          {mo}
        </p>
      )}
    </div>
  );
}

/** Khoảng nghỉ giữa các khối — nhịp 80px của hệ */
export function Section({
  children,
  className = '',
  gon = false,
  id,
}: {
  children: ReactNode;
  className?: string;
  gon?: boolean;
  /** Neo cho liên kết sâu, ví dụ /#cau-chuyen */
  id?: string;
}) {
  return (
    <section id={id} className={`${gon ? 'py-[48px]' : 'py-[80px]'} ${className}`}>
      {children}
    </section>
  );
}
