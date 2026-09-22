'use client';

import { useState, type ReactNode } from 'react';
import { useT } from '@/lib/i18n/context';
import { useManHep } from '@/lib/ui/man-hinh';

/**
 * Khối gập lại trên điện thoại, mở sẵn trên máy tính.
 *
 * ---------------------------------------------------------------------------
 * CÙNG MỘT CHỨNG BỆNH Ở BA MÀN
 *
 * Màn Hỏi Celes, màn Luận giải và màn Lá số đều dựng theo lối hai cột: cột
 * trái là "bạn đang hỏi về ai, vào lúc nào", cột phải là việc chính. Trên máy
 * tính hai cột đứng cạnh nhau nên cột trái không tốn gì của ai.
 *
 * Trên điện thoại hai cột xếp dọc, và cột trái rơi xuống ĐẦU trang. Người dùng
 * mở ứng dụng để hỏi một câu, nhưng thứ đầu tiên họ gặp là một ô chọn người,
 * một form bốn trường, một ô năm, một ô tháng và một ô câu hỏi — phải cuộn qua
 * hết mới tới chỗ bấm. Lần thứ hai họ vào, toàn bộ những trường ấy đã điền
 * sẵn và đúng, mà vẫn phải cuộn qua.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO GẬP CHỨ KHÔNG PHẢI GIẤU
 *
 * Giấu hẳn thì người dùng không đổi được người hay đổi được năm — mà đó là
 * việc thật, không phải việc hiếm. Gập lại kèm MỘT DÒNG TÓM TẮT thì họ vẫn
 * thấy mình đang hỏi về ai, và mở ra trong một lần chạm khi cần đổi.
 *
 * Dòng tóm tắt là bắt buộc, không phải trang trí: một khối gập không nói nó
 * đang chứa gì thì người dùng phải mở ra mới biết, và lúc ấy nó tệ hơn cả
 * không gập.
 *
 * ---------------------------------------------------------------------------
 * TRÊN MÁY TÍNH KHỐI NÀY TÀNG HÌNH
 *
 * Nó trả thẳng `children`, không thêm một thẻ bọc nào — bố cục cũ giữ nguyên
 * từng pixel. Đây là điều kiện để dùng nó ở màn đang chạy tốt mà không phải
 * đo lại cả hai bản.
 */
export function KhoiGap({
  tomTat,
  nhanMo,
  children,
  moSan = false,
}: {
  /** Một dòng: đang hỏi về ai, vào lúc nào. Người dùng đọc nó thay cho cả khối. */
  tomTat: ReactNode;
  /** Chữ trên nút mở — nói VIỆC SẼ LÀM ("Đổi người"), không nói "Mở rộng" */
  nhanMo: string;
  children: ReactNode;
  /** Mở sẵn cả trên điện thoại — dùng khi chưa có gì để tóm tắt */
  moSan?: boolean;
}) {
  const t = useT();
  const manHep = useManHep();
  const [mo, setMo] = useState(moSan);

  if (!manHep) return <>{children}</>;

  /*
   * Chưa có gì để tóm tắt thì KHÔNG vẽ thanh.
   *
   * Lúc người dùng chưa chọn lá số nào, `tomTat` chỉ nói được một câu rỗng
   * ("người vừa nhập") trong khi đúng các trường ấy đang mở ngay bên dưới —
   * thành ra một dòng chữ thừa kèm một nút "Đóng" đóng cái đang cần điền. Chọn
   * xong thì `moSan` thành false, thanh hiện ra với đúng cái tên vừa chọn.
   */
  if (moSan) return <>{children}</>;

  return (
    /*
      `min-w-0` ở CẢ HAI cấp, và đây là chỗ đã trả giá một lần.
      Khối này thường là con của một `grid`. Ô lưới mặc định có
      `min-width: auto`, nghĩa là nó KHÔNG co xuống dưới bề ngang nội dung —
      nên một dòng tóm tắt dài đẩy cả cột rộng hơn màn, và trình duyệt di động
      bóp nguyên trang lại cho vừa. Đo trên iPhone 390px: trang nở thành 405px
      và chữ trên nút tràn khỏi mép phải.
      `truncate` ở dòng chữ là chưa đủ — nó chỉ cắt được khi cha đã cho phép co.
    */
    <div className="flex min-w-0 flex-col gap-[12px]">
      <div
        className="flex min-w-0 items-center justify-between gap-[12px] rounded-[var(--radius-cards)] border px-[14px] py-[10px]"
        style={{ borderColor: 'var(--line)', background: 'var(--surface-card)' }}
      >
        <span className="body-sm min-w-0 truncate" style={{ color: 'var(--fg-muted)' }}>
          {tomTat}
        </span>
        <button
          type="button"
          onClick={() => setMo((v) => !v)}
          className="link-text link-action shrink-0"
          aria-expanded={mo}
        >
          {mo ? t.chung.dong : nhanMo}
        </button>
      </div>
      {mo && children}
    </div>
  );
}
