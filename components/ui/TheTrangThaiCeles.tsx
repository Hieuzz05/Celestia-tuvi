import type { ReactNode } from 'react';

/**
 * Thẻ trạng thái có Celes: rỗng, chờ, lỗi, sự kiện.
 *
 * Ô `linhVat` nhận nguyên một thẻ CelesMascot (có `cho`) do nơi gọi đặt — thẻ
 * không tự chọn ảnh, để `tsc` giữ luật ảnh-theo-chỗ ở đúng nơi gọi và bài
 * kiểm `scripts/test-cho-dat-celes.ts` thấy được tệp nào đặt linh vật.
 *
 * Chữ trong thẻ là lời Celes, ngôi thứ nhất ("Mình đang…"), không phải lời
 * hệ thống. Ảnh là trang trí (aria-hidden), nên tiêu đề phải tự đủ nghĩa.
 *
 * `giua`: xếp dọc và canh giữa (404, lỗi toàn trang, màn chờ lớn). Mặc định
 * xếp ngang như hàng rỗng của /ho-so; dưới 640px thẻ ngang vẫn giữ ngang vì
 * ảnh 80px + chữ vừa 390px.
 */
export function TheTrangThaiCeles({
  linhVat,
  tieuDe,
  moTa,
  children,
  giua = false,
  className = '',
}: {
  linhVat: ReactNode;
  tieuDe?: ReactNode;
  moTa?: ReactNode;
  /** Nút / liên kết hành động. */
  children?: ReactNode;
  giua?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex gap-[16px] ${giua ? 'flex-col items-center text-center' : 'items-center'} ${className}`}
    >
      {linhVat}
      <div className={`flex min-w-0 flex-col gap-[8px] ${giua ? 'items-center' : ''}`}>
        {tieuDe && <p className="subheading">{tieuDe}</p>}
        {moTa && (
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {moTa}
          </p>
        )}
        {children && <div className={`mt-[4px] flex flex-wrap gap-[8px] ${giua ? 'justify-center' : ''}`}>{children}</div>}
      </div>
    </div>
  );
}
