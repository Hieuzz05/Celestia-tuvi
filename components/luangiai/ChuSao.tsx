'use client';

import { useMemo } from 'react';

/**
 * Tô màu TÊN SAO và TÊN CÁCH CỤC trong một đoạn văn.
 *
 * ---------------------------------------------------------------------------
 * TÔ BẰNG CSS, KHÔNG BẰNG KÝ HIỆU TRONG CHỮ
 *
 * Cách rẻ nhất là bảo model viết `**Tham Lang**` rồi dịch dấu sao thành thẻ
 * đậm. Đã thử và đã hỏng: bảng mười hai phần vẽ chữ bằng thẻ <p> trần nên dấu
 * sao hiện nguyên xi trước mặt người đọc — đúng dấu hiệu lộ liễu nhất của chữ
 * máy sinh chưa qua khâu nào.
 *
 * Nên chữ giữ nguyên là chữ trơn, và việc tô màu nằm hẳn ở tầng hiển thị. Đổi
 * màu, bỏ màu hay đổi cách nhấn về sau đều không phải đụng tới model.
 *
 * ---------------------------------------------------------------------------
 * CHỈ TÔ TÊN CÓ THẬT TRÊN LÁ SỐ
 *
 * `ten` do máy chủ gửi xuống, dựng từ chính lá số đang đọc. Không tự quét bằng
 * một từ điển sao đầy đủ: làm vậy thì một câu nhắc tới ngôi sao KHÔNG có trên
 * lá số cũng được tô đẹp như thật, và màu sắc biến thành lời bảo đảm cho một
 * thứ chưa được kiểm.
 *
 * Tên dài xếp trước tên ngắn, nếu không "Tử Phủ Vũ Tướng Liêm" sẽ bị cắt thành
 * "Tử Vi" cộng một mẩu chữ thường.
 */
export function ChuSao({
  van,
  ten,
  className,
  style,
  mauTen = 'var(--accent)',
}: {
  van: string;
  ten: readonly string[];
  className?: string;
  style?: React.CSSProperties;
  /** Màu tên sao. Nền tối cần một sắc khác nền sáng — xem KhoiGuong.tsx */
  mauTen?: string;
}) {
  const re = useMemo(() => {
    const sach = [...new Set(ten)]
      .filter((x) => x.trim().length > 1)
      .sort((a, b) => b.length - a.length)
      .map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return sach.length ? new RegExp(`(${sach.join('|')})`, 'gu') : null;
  }, [ten]);

  if (!re) {
    return (
      <p className={className} style={style}>
        {van}
      </p>
    );
  }

  const manh = van.split(re);

  return (
    <p className={className} style={style}>
      {manh.map((m, i) =>
        // `split` với nhóm bắt: phần tử lẻ luôn là phần khớp
        i % 2 === 1 ? (
          <b key={i} style={{ color: mauTen, fontWeight: 600 }}>
            {m}
          </b>
        ) : (
          m
        )
      )}
    </p>
  );
}
