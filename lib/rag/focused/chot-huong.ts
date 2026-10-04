/**
 * Hướng engine — đường Focused (CEL-186 vé B).
 *
 * Hàm thuần, không gọi model. Answer Contract v2 (spec 5) bỏ câu chốt do mã
 * viết: model tự viết cả bài, mã chỉ so `claims[0].direction` với hướng engine
 * (`soChieu`); lệch thì viết lại, không thay câu.
 */

import type { HuongNghieng } from '../nghieng-ve';

export type NhomHuong = 'thuan' | 'ngang' | 'vuong';

export function nhomCuaHuong(h: HuongNghieng): NhomHuong {
  if (h === 'thuan-ro' || h === 'thuan-nhe') return 'thuan';
  if (h === 'can-bang') return 'ngang';
  return 'vuong';
}

/** Ranh giới từ có dấu: `\b` của JS không hiểu chữ Việt. */
const coCum = (s: string, re: RegExp) => re.test(s.normalize('NFC'));
export const tu = (mau: string) => new RegExp(`(?<![\\p{L}\\p{M}])(?:${mau})(?![\\p{L}\\p{M}])`, 'iu');

/* ------------------------------------------------------------ chiều xấu */

const CHIEU_XAU = tu(
  [
    'ly hôn|ly dị|chia tay|mất việc|thất nghiệp|phá sản|bị lừa|bị đuổi|đuổi việc|ngoại tình|cắm sừng|vỡ nợ|kiện|phản bội',
    'lỗ|thua lỗ|lỗ vốn|mất tiền|mất trắng|nợ|nợ nần|thua',
    'có bị|sẽ bị',
    'nghỉ việc|bỏ việc|thôi việc|xin nghỉ|bỏ chồng|bỏ vợ|bỏ người yêu|rút vốn|bán nhà|bán đất|cắt lỗ|bỏ học|từ bỏ',
  ].join('|')
);

/** Câu hỏi về một chuyện không mong ("năm nay tôi có ly hôn không") */
export function laCauChieuXau(cauHoi: string): boolean {
  return coCum(cauHoi, CHIEU_XAU);
}

/* ------------------------------------------------------------ so chiều */

/**
 * So chiều model khai (`claims[0].direction`) với hướng engine (`NGUOC_HUONG`, spec 5.1).
 * Thiếu chiều cũng là lỗi: kết luận không khai chiều là kết luận không kiểm được.
 */
export function soChieu(chieu: NhomHuong | undefined, huong: HuongNghieng): 'thieu-chieu' | 'nguoc-huong' | null {
  if (!chieu) return 'thieu-chieu';
  return chieu === nhomCuaHuong(huong) ? null : 'nguoc-huong';
}

/** Đọc trường chiều thô của model; giá trị lạ coi như thiếu. */
export function docChieu(x: unknown): NhomHuong | undefined {
  return x === 'thuan' || x === 'ngang' || x === 'vuong' ? x : undefined;
}
