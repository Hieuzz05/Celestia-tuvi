/**
 * Câu chốt theo hướng engine — dùng chung cho QUICK (CEL-186a) và STANDARD (186b).
 *
 * Hàm thuần, không gọi model, không đọc lá số. Mô-đun này KHÔNG phụ thuộc độ
 * sâu: nó chỉ biết hướng engine đã chốt, phần đời đang hỏi, và câu người dùng gõ.
 *
 * Ba việc:
 *   1. Câu chốt DỰ PHÒNG — khi câu chốt model viết bị loại, mã đặt câu này vào.
 *      Chữ do chủ dự án duyệt (brief CEL-186 §22), không phải model sinh.
 *   2. Soát `chieuCauChot` — lưới PHỤ (quyết định P3): model tự khai câu chốt
 *      nói phần đời thuận / ngang / vướng; lệch nhóm hướng engine → dự phòng,
 *      THIẾU trường → chỉ ghi vết.
 *   3. Nhận diện câu hỏi "chiều xấu" (ly hôn, mất việc…) — câu chốt kiểu "có
 *      cửa đấy" đảo nghĩa ở đó, nên 186a đưa chúng về STANDARD.
 *
 * Câu dự phòng cố ý không có "bạn" làm chủ ngữ, không "của bạn", không có/không,
 * không nên/chưa nên — nó nói PHẦN ĐỜI đang thuận hay vướng, nên đúng engine
 * với cả câu hỏi chiều tốt lẫn chiều xấu.
 */

import type { HuongNghieng } from './nghieng-ve';
import type { ChuDe, YDinh } from './planner';
import { boDau } from './thuc-the';

export type NhomHuong = 'thuan' | 'ngang' | 'vuong';

export function nhomCuaHuong(h: HuongNghieng): NhomHuong {
  if (h === 'thuan-ro' || h === 'thuan-nhe') return 'thuan';
  if (h === 'can-bang') return 'ngang';
  return 'vuong';
}

/* ------------------------------------------------------------ {cum} §23 */

/** Ranh giới từ có dấu: `\b` của JS không hiểu chữ Việt. */
const coCum = (s: string, re: RegExp) => re.test(s.normalize('NFC'));
const tu = (mau: string) => new RegExp(`(?<![\\p{L}\\p{M}])(?:${mau})(?![\\p{L}\\p{M}])`, 'iu');

const VO_CHONG_HIEN_TAI = tu('(?:chồng|vợ) (?:tôi|mình|em|của tôi|của mình|của em)|vợ chồng');
/*
 * "Người yêu / bạn trai / bạn gái" trần là hỏi chung ("tôi có người yêu không"
 * — chưa có ai), nên chỉ tính là một người cụ thể khi có chủ sở hữu theo sau.
 */
const MOT_NGUOI_CU_THE = tu(
  '(?:người yêu|bạn trai|bạn gái|ny) (?:của )?(?:tôi|em|mình|tớ)|crush|người ấy|anh ấy|cô ấy|chị ấy|người này|người đó|mối quan hệ này|anh này|cô này'
);

/** Phần đời làm chủ ngữ của câu dự phòng. */
export function cumChoChuDe(chuDe: ChuDe, cauHoi: string): string {
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

/* -------------------------------------------------------- năm trong câu */

/** Các số năm bốn chữ số người dùng gõ (1900–2199). */
function soNamTrongCau(cauHoi: string): number[] {
  return [...cauHoi.matchAll(/(?<!\d)(19\d\d|2[01]\d\d)(?!\d)/g)].map((m) => Number(m[1]));
}

const NAM_NAY = /(?:^|[^a-z])nam nay(?:$|[^a-z])/;
const NAM_KHAC = /(?:^|[^a-z])(?:nam sau|nam toi|sang nam|nam ngoai|nam truoc|nam kia|nam kia nua)(?:$|[^a-z])/;

/**
 * Câu hỏi có nhắc một năm KHÁC `namXem` không — "năm sau", "năm ngoái", hay
 * một số năm khác. Engine luận theo `namXem`; câu dự phòng "Năm {namXem}, …"
 * cho câu hỏi về năm khác là nói sai năm (S-c).
 */
export function coNamKhac(cauHoi: string, namXem: number): boolean {
  if (soNamTrongCau(cauHoi).some((n) => n !== namXem)) return true;
  return NAM_KHAC.test(boDau(cauHoi));
}

/**
 * Người dùng có THẬT SỰ hỏi về năm `namXem` không (§24).
 *
 * `namXem` mặc định là năm hiện tại — route điền khi web không gửi — nên nó
 * không phải bằng chứng người ta hỏi về năm. Chỉ chữ trong câu mới là.
 */
export function hoiVeNam(cauHoi: string, namXem: number): boolean {
  if (coNamKhac(cauHoi, namXem)) return false;
  return soNamTrongCau(cauHoi).includes(namXem) || NAM_NAY.test(boDau(cauHoi));
}

/* -------------------------------------------------------- câu dự phòng §22 */

const CO_KHONG: Record<HuongNghieng, string> = {
  'thuan-ro': '{cum} đang khá thuận.',
  'thuan-nhe': '{cum} có phần thuận lợi nhỉnh hơn, nhưng vẫn còn điểm vướng.',
  'can-bang': '{cum} có mặt thuận lợi và mặt vướng khá cân nhau.',
  'can-nhe': '{cum} có phần vướng nhỉnh hơn, nhưng chưa phải thế khó.',
  'can-ro': '{cum} đang gặp khá nhiều điểm vướng.',
};

const QUYET_DINH: Record<HuongNghieng, string> = {
  'thuan-ro': 'với {cum}, các điều kiện hiện tại khá ủng hộ lựa chọn này.',
  'thuan-nhe': 'với {cum}, lựa chọn này đang có lợi thế nhẹ, nhưng chưa thật rõ.',
  'can-bang': 'với {cum}, điểm thuận lợi và điểm bất lợi đang khá cân nhau.',
  'can-nhe': 'với {cum}, điểm bất lợi đang nhỉnh hơn một chút.',
  'can-ro': 'với {cum}, các điều kiện hiện tại chưa ủng hộ lựa chọn này.',
};

const hoaDau = (s: string) => s.charAt(0).toLocaleUpperCase('vi') + s.slice(1);

/**
 * Câu chốt dự phòng. `null` khi ý định không có bảng (`thoi-diem` và các ý
 * định khác) — lúc đó lớp gọi không được QUICK ngay từ đầu.
 *
 * Tiền tố "Năm {nam}, " chỉ thêm khi người dùng thật sự hỏi về năm (§24).
 */
export function cauChotDuPhong(vao: {
  yDinh: YDinh;
  huong: HuongNghieng;
  chuDe: ChuDe;
  cauHoi: string;
  namXem: number;
}): string | null {
  const bang = vao.yDinh === 'co-khong' ? CO_KHONG : vao.yDinh === 'quyet-dinh' ? QUYET_DINH : null;
  if (!bang) return null;
  const than = bang[vao.huong].replace('{cum}', cumChoChuDe(vao.chuDe, vao.cauHoi));
  return hoiVeNam(vao.cauHoi, vao.namXem) ? `Năm ${vao.namXem}, ${than}` : hoaDau(than);
}

/* ------------------------------------------------------------ chiều xấu */

const CHIEU_XAU = tu(
  [
    'ly hôn|ly dị|chia tay|mất việc|thất nghiệp|phá sản|bị lừa|bị đuổi|đuổi việc|ngoại tình|cắm sừng|vỡ nợ|kiện|phản bội',
    // Tiền: "có bị lỗ không" — engine "thuận" mà model viết "có cửa đấy" là đảo nghĩa.
    'lỗ|thua lỗ|lỗ vốn|mất tiền|mất trắng|nợ|nợ nần|thua',
    // "Có bị … không": hỏi về một điều không mong.
    'có bị|sẽ bị',
    // Phương án RỜI BỎ: hướng engine là của phần đời đang có, "khá ủng hộ lựa
    // chọn này" gắn vào "nghỉ việc" là ủng hộ ngược (celes-domain, 02/10/2026).
    'nghỉ việc|bỏ việc|thôi việc|xin nghỉ|bỏ chồng|bỏ vợ|bỏ người yêu|rút vốn|bán nhà|bán đất|cắt lỗ|bỏ học|từ bỏ',
  ].join('|')
);

/**
 * Câu hỏi về một chuyện xấu: "năm nay tôi có ly hôn không". Câu chốt "khá
 * thuận" ở đây đúng engine, nhưng câu chốt model viết kiểu "có cửa đấy" thì
 * đảo nghĩa — nên 186a không QUICK những câu này (S-d).
 */
export function laCauChieuXau(cauHoi: string): boolean {
  return coCum(cauHoi, CHIEU_XAU);
}

/* ------------------------------------------------- soát câu chốt (P3) */

export type LyDoThayCauChot = 'nguoc-huong' | 'qua-chac';

/** Cụm khẳng định mạnh: chỉ hợp với hướng `*-ro`, không bao giờ hợp cụm "chắc chắn". */
const QUA_CHAC_LUON = tu('chắc chắn|nhất định|chắc luôn|100%|trăm phần trăm|không thể nào|hẳn là|rõ ràng là|sẽ có người|sẽ gặp được');
const QUA_CHAC_KHI_NHE = tu('rất thuận|cực kỳ thuận|rất sáng|rất khó|cực kỳ khó|hoàn toàn');

/**
 * So câu chốt model viết với hướng engine.
 *
 * - `chieu` thiếu → không thay, chỉ ghi vết (P3: nhà cung cấp dự phòng hay bỏ
 *   trống trường; dự phòng hàng loạt vì lý do đó là phạt nhầm).
 * - `chieu` khác nhóm của `huong` → thay (`nguoc-huong`).
 * - Khẳng định chắc nịch, hay khẳng định mạnh khi engine chỉ nghiêng nhẹ /
 *   cân bằng → thay (`qua-chac`).
 */
export function soatCauChot(vao: {
  ketLuan: string;
  chieu: NhomHuong | undefined;
  huong: HuongNghieng;
}): { thay: LyDoThayCauChot | null; thieuChieu: boolean } {
  const thieuChieu = !vao.chieu;
  if (vao.chieu && vao.chieu !== nhomCuaHuong(vao.huong)) return { thay: 'nguoc-huong', thieuChieu };
  if (coCum(vao.ketLuan, QUA_CHAC_LUON)) return { thay: 'qua-chac', thieuChieu };
  if (!vao.huong.endsWith('-ro') && coCum(vao.ketLuan, QUA_CHAC_KHI_NHE)) return { thay: 'qua-chac', thieuChieu };
  return { thay: null, thieuChieu };
}

/** Đọc trường `chieuCauChot` thô của model; giá trị lạ coi như thiếu. */
export function docChieu(x: unknown): NhomHuong | undefined {
  return x === 'thuan' || x === 'ngang' || x === 'vuong' ? x : undefined;
}
