/**
 * Câu chốt theo hướng engine — đường Focused (CEL-186 vé B).
 *
 * Chép có chọn lọc từ `chot-huong.ts` của nhánh quick, KHÔNG gộp nhánh đó. Hàm
 * thuần, không gọi model.
 *
 * Câu chốt ở đây nói PHẦN ĐỜI đang thuận hay vướng, không nói "có/không". Nhờ
 * vậy cùng một câu đúng cho cả câu hỏi chiều tốt ("có người yêu không") lẫn
 * chiều xấu ("có ly hôn không"), và không thành lời khuyên cho câu quyết định
 * ("có nên nghỉ việc") — nó chỉ nói bối cảnh (domain C1, A2).
 *
 * Khác nhánh quick ở hai chỗ:
 *   - câu dự phòng LUÔN có (không còn nhánh `null` rồi giữ câu model hỏng);
 *   - câu dự phòng nêu 1–2 tên dữ kiện kèm nghĩa (domain A5): câu chốt chung
 *     chung là câu ai đọc cũng thấy đúng — đúng thứ Barnum đo.
 */

import type { DauMoc, HuongNghieng, NghiengVe } from '../nghieng-ve';
import type { ChuDe } from '../planner';
import type { DoiTuongCauHoi } from './doi-tuong';

export type NhomHuong = 'thuan' | 'ngang' | 'vuong';

export function nhomCuaHuong(h: HuongNghieng): NhomHuong {
  if (h === 'thuan-ro' || h === 'thuan-nhe') return 'thuan';
  if (h === 'can-bang') return 'ngang';
  return 'vuong';
}

/** Ranh giới từ có dấu: `\b` của JS không hiểu chữ Việt. */
const coCum = (s: string, re: RegExp) => re.test(s.normalize('NFC'));
export const tu = (mau: string) => new RegExp(`(?<![\\p{L}\\p{M}])(?:${mau})(?![\\p{L}\\p{M}])`, 'iu');

const VO_CHONG_HIEN_TAI = tu('(?:chồng|vợ) (?:tôi|mình|em|của tôi|của mình|của em)|vợ chồng');
/*
 * "Người yêu / bạn trai / bạn gái" trần là hỏi chung ("tôi có người yêu không"
 * — chưa có ai), nên chỉ tính là một người cụ thể khi có chủ sở hữu theo sau.
 */
const MOT_NGUOI_CU_THE = tu(
  '(?:người yêu|bạn trai|bạn gái|ny) (?:của )?(?:tôi|em|mình|tớ)|crush|người ấy|anh ấy|cô ấy|chị ấy|người này|người đó|mối quan hệ này|anh này|cô này'
);

const PHAN_CUA_VAI: Record<DoiTuongCauHoi['vai'], string> = {
  'vo-chong': 'chuyện vợ chồng',
  'nguoi-yeu': 'mối quan hệ này',
  con: 'chuyện con cái',
  'bo-me': 'quan hệ với cha mẹ',
  'anh-chi-em': 'quan hệ với anh chị em',
  'ban-be': 'quan hệ bạn bè',
  'cap-tren': 'quan hệ với người trên',
};

/** Phần đời làm chủ ngữ của câu chốt dự phòng. */
export function cumChoChuDe(chuDe: ChuDe, cauHoi: string, doiTuong?: DoiTuongCauHoi | null): string {
  if (doiTuong) return PHAN_CUA_VAI[doiTuong.vai];
  switch (chuDe) {
    case 'su-nghiep':
      return 'công việc';
    case 'tai-chinh':
      return 'tiền bạc';
    case 'tinh-cam':
      if (coCum(cauHoi, VO_CHONG_HIEN_TAI)) return 'chuyện vợ chồng';
      if (coCum(cauHoi, MOT_NGUOI_CU_THE)) return 'mối quan hệ này';
      return 'chuyện tình cảm';
    case 'gia-dao':
      return 'chuyện gia đình';
    case 'suc-khoe':
      return 'sức khỏe';
    default:
      return 'giai đoạn này';
  }
}

/* ------------------------------------------------------- câu dự phòng */

const THAN: Record<HuongNghieng, string> = {
  'thuan-ro': '{cum} đang khá thuận',
  'thuan-nhe': '{cum} có phần thuận nhỉnh hơn, nhưng vẫn còn chỗ vướng',
  'can-bang': '{cum} có mặt thuận và mặt vướng khá cân nhau',
  'can-nhe': '{cum} có phần vướng nhỉnh hơn, nhưng chưa phải thế khó',
  'can-ro': '{cum} đang gặp khá nhiều chỗ vướng',
};

const hoaDau = (s: string) => s.charAt(0).toLocaleUpperCase('vi') + s.slice(1);

/**
 * Tên kèm nghĩa đời thường, nghĩa cắt gọn ở dấu chấm phẩy đầu.
 *
 * Nét sao đã bị bóc chủ ngữ "bạn" (`boChuNgu`), nên phải gắn lại; riêng nét tự
 * có chủ ngữ ("năm nay…", "phần này…") thì nối bằng dấu hai chấm.
 */
export function tenKemNghia(d: DauMoc): string {
  const y = d.y.split(/[;—]/)[0].trim().replace(/[.,]$/, '');
  return /^(?:năm nay|phần này|chuyện|việc)(?![\p{L}\p{M}])/iu.test(y) ? `${d.ten}: ${y}` : `${d.ten} cho thấy bạn ${y}`;
}

/**
 * Chọn 1–2 mốc để nêu tên. Nghiêng một phía: mốc nặng nhất của phía đó, cộng
 * mốc nặng nhất phía kia khi hướng chỉ nghiêng nhẹ. Cân bằng: mỗi phía một.
 */
export function mocChoCauChot(n: NghiengVe): DauMoc[] {
  const thuan = n.dauMoc.find((d) => d.huong === 'do');
  const can = n.dauMoc.find((d) => d.huong === 'can');
  const nhom = nhomCuaHuong(n.huong);
  const chinh = nhom === 'vuong' ? can : thuan;
  const nguoc = nhom === 'vuong' ? thuan : can;
  const ra: DauMoc[] = [];
  if (nhom === 'ngang') {
    if (thuan) ra.push(thuan);
    if (can) ra.push(can);
  } else {
    if (chinh) ra.push(chinh);
    if (nguoc && !n.huong.endsWith('-ro')) ra.push(nguoc);
  }
  return ra.length ? ra : n.dauMoc.slice(0, 1);
}

/**
 * Câu chốt dự phòng — mã viết, luôn có khi có `nghieng`.
 *
 * `moc` là cụm thời gian đã tính sẵn ("Từ giờ đến hết năm Bính Ngọ", "Năm
 * 2027", "Tháng 3 âm"); rỗng thì câu không có tiền tố thời gian.
 */
export function cauChotDuPhong(vao: {
  nghieng: NghiengVe;
  chuDe: ChuDe;
  cauHoi: string;
  moc?: string;
  doiTuong?: DoiTuongCauHoi | null;
}): string {
  const than = THAN[vao.nghieng.huong].replace('{cum}', cumChoChuDe(vao.chuDe, vao.cauHoi, vao.doiTuong));
  const dau = vao.moc ? `${vao.moc}, ${than}` : hoaDau(than);
  const moc = mocChoCauChot(vao.nghieng);
  if (!moc.length) return `${dau}.`;
  const [a, b] = moc;
  const vi = b ? `${tenKemNghia(a)}, còn ${tenKemNghia(b)}` : tenKemNghia(a);
  return `${dau}: ${vi}.`;
}

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

/* ------------------------------------------------------- soát câu chốt */

export type LyDoThayCauChot = 'nguoc-huong' | 'qua-chac' | 'thieu-chieu';

const QUA_CHAC_LUON = tu(
  'chắc chắn|nhất định|chắc luôn|100%|trăm phần trăm|không thể nào|hẳn là|rõ ràng là|sẽ có người|sẽ gặp được|sẽ không|không bao giờ'
);
const QUA_CHAC_KHI_NHE = tu('rất thuận|cực kỳ thuận|rất sáng|rất khó|cực kỳ khó|hoàn toàn');

/**
 * So câu chốt model viết với hướng engine.
 *
 * Khác nhánh quick: THIẾU `chieu` cũng thay (Focused bắt buộc trường này trong
 * schema; câu chốt không khai chiều là câu không kiểm được chiều).
 */
export function soatCauChot(vao: {
  ketLuan: string;
  chieu: NhomHuong | undefined;
  huong: HuongNghieng;
}): LyDoThayCauChot | null {
  if (!vao.chieu) return 'thieu-chieu';
  if (vao.chieu !== nhomCuaHuong(vao.huong)) return 'nguoc-huong';
  if (coCum(vao.ketLuan, QUA_CHAC_LUON)) return 'qua-chac';
  if (!vao.huong.endsWith('-ro') && coCum(vao.ketLuan, QUA_CHAC_KHI_NHE)) return 'qua-chac';
  return null;
}

/** Đọc trường `chieuCauChot` thô của model; giá trị lạ coi như thiếu. */
export function docChieu(x: unknown): NhomHuong | undefined {
  return x === 'thuan' || x === 'ngang' || x === 'vuong' ? x : undefined;
}
