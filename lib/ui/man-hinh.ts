'use client';

import { useSyncExternalStore } from 'react';

/**
 * Màn hình đang hẹp hay rộng — một nguồn duy nhất cho mọi bố cục riêng của điện thoại.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO CẦN HÀM NÀY, TRONG KHI ĐÃ CÓ CSS
 *
 * Phần lớn việc thu gọn nên làm bằng CSS: xếp dọc thay vì xếp ngang, giấu một
 * cột, nới khoảng cách. CSS chạy trước cả JavaScript và không bao giờ nhấp
 * nháy. Chỗ nào CSS làm được thì đừng gọi tới đây.
 *
 * Nhưng có những thứ CSS không làm được, và chúng đúng là thứ người dùng điện
 * thoại kêu: THỨ TỰ các khối trong DOM (đọc trước cái gì), việc một khối có
 * được DỰNG hay không (một mệnh bàn 12 cung dựng ra rồi ẩn đi vẫn tốn máy và
 * vẫn nằm trong luồng đọc của trình đọc màn hình), và việc một danh sách dài
 * nên hiện hết hay chỉ hiện ba dòng kèm nút mở. Những cái đó phải quyết trong
 * JavaScript.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO `useSyncExternalStore` CHỨ KHÔNG PHẢI `useState` + `useEffect`
 *
 * Kiểu quen tay là đặt state rồi `useEffect` gọi `setState` khi màn hình đổi.
 * Dự án này đã có bảy cảnh báo `react-hooks/set-state-in-effect` và mốc bảy ấy
 * là cổng kiểm trước khi đẩy — thêm một cái nữa là hỏng cổng cho cả hai máy.
 * `useSyncExternalStore` là API React sinh ra đúng cho việc đọc một nguồn nằm
 * ngoài React, và nó cũng cho luôn giá trị lúc dựng trên máy chủ.
 *
 * ---------------------------------------------------------------------------
 * MÁY CHỦ TRẢ VỀ "KHÔNG HẸP", VÀ ĐÓ LÀ MỘT LỰA CHỌN
 *
 * Máy chủ không biết màn hình rộng bao nhiêu. Nó phải đoán, và đoán sai thì
 * người dùng thấy một nhịp nháy khi JavaScript chạy xong.
 *
 * Chọn "không hẹp" vì bản rộng là bản ĐẦY ĐỦ: nếu đoán sai, người dùng điện
 * thoại thấy bản đầy đủ trong một nhịp rồi nó gọn lại — khó chịu nhưng không
 * mất gì. Đoán ngược lại thì người dùng máy tính thấy bản rút gọn trước, tức
 * là nội dung BIẾN MẤT rồi mới hiện ra, và đó là kiểu nháy làm người ta tưởng
 * trang hỏng.
 *
 * Chỗ nào không chịu được nháy thì dùng CSS, đừng dùng hàm này.
 */

/**
 * 640px — cùng mốc `sm:` của Tailwind đang dùng trong dự án.
 *
 * Đặt một mốc khác ở đây là để CSS và JavaScript đổi bố cục ở hai thời điểm
 * khác nhau: có một dải chiều rộng mà trang nửa nọ nửa kia, và không ai đọc mã
 * ra được vì sao.
 */
export const MOC_MAN_HEP = 640;

const CAU_TRUY_VAN = `(max-width: ${MOC_MAN_HEP - 0.02}px)`;

function dangKy(goiLai: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mql = window.matchMedia(CAU_TRUY_VAN);
  mql.addEventListener('change', goiLai);
  return () => mql.removeEventListener('change', goiLai);
}

function docTrenTrinhDuyet(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(CAU_TRUY_VAN).matches;
}

function docTrenMayChu(): boolean {
  return false;
}

/** Màn hình có hẹp không — xem ghi chú đầu tệp trước khi dùng thay cho CSS */
export function useManHep(): boolean {
  return useSyncExternalStore(dangKy, docTrenTrinhDuyet, docTrenMayChu);
}
