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
 *   - câu dự phòng nêu 1–2 tên mốc kèm HƯỚNG (đỡ / kéo lại), KHÔNG kèm nghĩa
 *     (chủ dự án 04/10): engine không có nghĩa sao theo từng phần đời, nét sao
 *     chung là nét tính cách — gắn vào câu tiền bạc thành "Tang Môn cho thấy
 *     bạn dễ phải chia tay…", sai cả phần đời lẫn người.
 */

import type { DauMoc, HuongNghieng, NghiengVe } from '../nghieng-ve';
import type { ChuDe } from '../planner';
import type { DoiTuongCauHoi } from './doi-tuong';
import type { NgonNgu } from './ngon-ngu';

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

const PHAN_CUA_VAI: Record<NgonNgu, Record<DoiTuongCauHoi['vai'], string>> = {
  vi: {
    'vo-chong': 'chuyện vợ chồng',
    'nguoi-yeu': 'mối quan hệ này',
    con: 'chuyện con cái',
    'bo-me': 'quan hệ với cha mẹ',
    'anh-chi-em': 'quan hệ với anh chị em',
    'ban-be': 'quan hệ bạn bè',
    'cap-tren': 'quan hệ với người trên',
  },
  en: {
    'vo-chong': 'your marriage',
    'nguoi-yeu': 'this relationship',
    con: 'matters with your children',
    'bo-me': 'your relationship with your parents',
    'anh-chi-em': 'your relationship with your siblings',
    'ban-be': 'your friendships',
    'cap-tren': 'your relationship with those above you',
  },
};

type PhanDoi = 'cong-viec' | 'tien-bac' | 'vo-chong' | 'quan-he-nay' | 'tinh-cam' | 'gia-dinh' | 'suc-khoe' | 'chung';

const TEN_PHAN: Record<NgonNgu, Record<PhanDoi, string>> = {
  vi: {
    'cong-viec': 'công việc',
    'tien-bac': 'tiền bạc',
    'vo-chong': 'chuyện vợ chồng',
    'quan-he-nay': 'mối quan hệ này',
    'tinh-cam': 'chuyện tình cảm',
    'gia-dinh': 'chuyện gia đình',
    'suc-khoe': 'sức khỏe',
    chung: 'giai đoạn này',
  },
  en: {
    'cong-viec': 'work',
    'tien-bac': 'money',
    'vo-chong': 'your marriage',
    'quan-he-nay': 'this relationship',
    'tinh-cam': 'your love life',
    'gia-dinh': 'family matters',
    'suc-khoe': 'health',
    chung: 'this period',
  },
};

/** Phần đời làm chủ ngữ của câu chốt dự phòng. */
export function cumChoChuDe(
  chuDe: ChuDe,
  cauHoi: string,
  doiTuong?: DoiTuongCauHoi | null,
  nn: NgonNgu = 'vi'
): string {
  if (doiTuong) return PHAN_CUA_VAI[nn][doiTuong.vai];
  return TEN_PHAN[nn][phanDoi(chuDe, cauHoi)];
}

function phanDoi(chuDe: ChuDe, cauHoi: string): PhanDoi {
  switch (chuDe) {
    case 'su-nghiep':
      return 'cong-viec';
    case 'tai-chinh':
      return 'tien-bac';
    case 'tinh-cam':
      if (coCum(cauHoi, VO_CHONG_HIEN_TAI)) return 'vo-chong';
      if (coCum(cauHoi, MOT_NGUOI_CU_THE)) return 'quan-he-nay';
      return 'tinh-cam';
    case 'gia-dao':
      return 'gia-dinh';
    case 'suc-khoe':
      return 'suc-khoe';
    default:
      return 'chung';
  }
}

/* ------------------------------------------------------- câu dự phòng */

const THAN: Record<NgonNgu, Record<HuongNghieng, string>> = {
  vi: {
    'thuan-ro': '{cum} đang khá thuận',
    'thuan-nhe': '{cum} có phần thuận nhỉnh hơn, nhưng vẫn còn chỗ vướng',
    'can-bang': '{cum} có mặt thuận và mặt vướng ngang nhau',
    'can-nhe': '{cum} có phần vướng nhỉnh hơn, nhưng chưa phải thế khó',
    'can-ro': '{cum} đang gặp khá nhiều chỗ vướng',
  },
  en: {
    'thuan-ro': '{cum} is going fairly smoothly',
    'thuan-nhe': '{cum} leans a little toward smooth, though some snags remain',
    'can-bang': '{cum} has smooth and snagged sides in equal measure',
    'can-nhe': '{cum} leans a little toward snags, though nothing severe',
    'can-ro': '{cum} is running into quite a few snags',
  },
};

const hoaDau = (s: string) => s.charAt(0).toLocaleUpperCase('vi') + s.slice(1);

const VAI_MOC: Record<NgonNgu, Record<DauMoc['huong'], string>> = {
  vi: { do: 'đỡ cho phần này', can: 'kéo phần này lại' },
  en: { do: 'supports it', can: 'holds it back' },
};

/**
 * Tên mốc kèm HƯỚNG, không kèm nghĩa.
 *
 * `d.y` là nét CHUNG của sao (tính cách chủ lá số), không phải nghĩa theo phần
 * đời đang hỏi — engine chưa có nghĩa sao theo từng phần đời đáng tin. Gắn nét
 * chung vào câu là tự suy nghĩa sang tiền bạc / tình cảm / sức khỏe, và gán
 * tính cách cho người hỏi hoặc người khác (celes-domain FAIL 04/10). Nên chỉ
 * nói mốc này đỡ hay kéo lại — đúng điều engine đã tính.
 */
export function tenKemHuong(d: DauMoc, nn: NgonNgu = 'vi'): string {
  return `${d.ten} ${VAI_MOC[nn][d.huong]}`;
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
  } else if (chinh) {
    // Không có mốc phía chính (bị lọc khỏi gói) thì không nêu tên: một mốc phía
    // ngược đứng sau "đang khá thuận" là câu tự cãi mình.
    ra.push(chinh);
    if (nguoc && !n.huong.endsWith('-ro')) ra.push(nguoc);
  }
  return ra;
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
  ngonNgu?: NgonNgu;
}): string {
  const nn = vao.ngonNgu ?? 'vi';
  const than = THAN[nn][vao.nghieng.huong].replace('{cum}', cumChoChuDe(vao.chuDe, vao.cauHoi, vao.doiTuong, nn));
  const dau = vao.moc ? `${vao.moc}, ${than}` : hoaDau(than);
  const moc = mocChoCauChot(vao.nghieng);
  if (!moc.length) return `${dau}.`;
  const [a, b] = moc;
  const noi = nn === 'en' ? ', while ' : ', còn ';
  const ds = b ? `${tenKemHuong(a, nn)}${noi}${tenKemHuong(b, nn)}` : tenKemHuong(a, nn);
  return `${dau}: ${ds}.`;
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
