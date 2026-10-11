'use client';

import { useT } from '@/lib/i18n/context';

/**
 * Lưu bài đang đọc thành PDF (CEL-074). Không dựng PDF riêng: mở hộp thoại in
 * của trình duyệt, người đọc chọn "Lưu thành PDF". CSS in ở app/globals.css lo
 * ẩn khung trang, giữ phần căn cứ đang gập, và ép giấy trắng cả ở theme Đêm.
 * Viền, không hồng: màn này đã có "Đọc tiếp →" là nút chính.
 */
export function NutLuuPdf() {
  const t = useT();
  return (
    <button type="button" className="btn-outline btn-sm no-print" title={t.luuPdf.goiY} onClick={() => window.print()}>
      {t.luuPdf.nut}
    </button>
  );
}
