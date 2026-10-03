/**
 * So khớp cụm tiếng Việt cho lớp Focused — chịu được câu gõ nửa dấu nửa không.
 *
 * Hai lượt:
 *   1. Cụm CÓ DẤU so trên câu gốc (NFC, thường), ranh giới chữ Việt.
 *   2. Cụm KHÔNG DẤU so trên câu mà mọi chữ ĐANG CÓ DẤU bị thay bằng "_".
 *
 * Lượt 2 không được so trên bản bỏ dấu của cả câu: "Còn tôi thì sao?" bỏ dấu
 * ra "con toi" — đọc thành "con tôi" là gán câu hỏi cho đứa con không có thật.
 * Chỉ chữ người dùng tự gõ không dấu mới được hiểu theo nghĩa không dấu.
 */

import { boDau } from '../thuc-the';

export const tu = (mau: string) => new RegExp(`(?<![\\p{L}\\p{M}])(?:${mau})(?![\\p{L}\\p{M}])`, 'iu');

/** " w1 w2 _ w3 " — chữ có dấu thành "_", dấu câu thành khoảng trắng. */
export function chuKhongDau(cau: string): string {
  const tuDon = cau
    .normalize('NFC')
    .toLowerCase()
    .split(/[^\p{L}\p{M}\d]+/u)
    .filter(Boolean)
    .map((w) => (boDau(w) === w ? w : '_'));
  return ` ${tuDon.join(' ')} `;
}

/** Có cụm nào trong hai danh sách (chuỗi `a|b|c`) xuất hiện không. Rỗng thì bỏ lượt đó. */
export function khopCum(cau: string, coDau: string, khongDau = ''): boolean {
  if (coDau && tu(coDau).test(cau.normalize('NFC').toLowerCase())) return true;
  if (!khongDau) return false;
  return new RegExp(`(?<= )(?:${khongDau})(?= )`).test(chuKhongDau(cau));
}
