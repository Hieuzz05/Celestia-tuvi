/**
 * Tách câu đầu khỏi phần còn lại của một đoạn.
 *
 * VÌ SAO CÓ: phản hồi người dùng là "nhiều chữ quá, không đọc". Đo `/la-so` ở
 * khổ 390px ngày 09/10/2026: 1.110 chữ trên bề mặt, 14 đoạn từ 25 chữ trở lên.
 * Cái sai không nằm ở chữ xấu mà ở chỗ đặt — mỗi thẻ in trọn 4-6 câu ngay khi
 * mở, không có tầng nào ngắn hơn một đoạn.
 *
 * LUẬT BẤT BIẾN: hàm này CẮT, không VIẾT LẠI. Ghép `cauDau + conLai` phải ra
 * lại đúng chữ gốc (chỉ sai khác khoảng trắng nối). Rút gọn bằng cách bỏ chữ
 * của bản luận là bịa luận giải — thứ luật dự án cấm, và là thứ phá đúng cái
 * sản phẩm này bán.
 *
 * Cắt ở dấu chấm / hỏi / than theo sau là khoảng trắng + CHỮ HOA (gồm cả chữ
 * hoa có dấu tiếng Việt). Nhờ điều kiện chữ hoa mà dấu chấm của số thập phân
 * hay của "v.v." không bị tính là hết câu.
 *
 * Câu đầu ngắn hơn 20 hoặc dài hơn 180 ký tự thì KHÔNG cắt: cắt giữa một câu
 * dài làm hỏng nghĩa, còn một câu quá ngắn đứng một mình thì chẳng nói được gì
 * — cả hai trường hợp thà để nguyên khối.
 */
export interface CauTach {
  /** Câu đầu — đủ đứng một mình trên thẻ */
  cauDau: string;
  /** Phần còn lại; rỗng nghĩa là câu đầu đã là tất cả, đừng hiện nút mở */
  conLai: string;
}

const HOA = 'A-ZĐÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠ-Ỹ';

export function tachCauDau(van: string): CauTach {
  const s = (van ?? '').trim();
  if (!s) return { cauDau: '', conLai: '' };

  const m = s.match(new RegExp(`^([\\s\\S]{20,180}?[.!?])\\s+(?=[${HOA}])`));
  if (!m) return { cauDau: s, conLai: '' };

  return { cauDau: m[1].trim(), conLai: s.slice(m[0].length).trim() };
}
