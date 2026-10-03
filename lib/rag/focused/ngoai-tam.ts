/**
 * Câu hỏi ngoài tầm lá số — CEL-186 vé B (chép từ nhánh quick), phạm vi: danh tính bạn đời / người yêu.
 *
 * "Chồng tôi có phải Nguyễn Duy Hiếu không?" không có câu trả lời trong lá số:
 * lá số không chứa tên ai. Đếm hướng nghiêng cho câu này là trả lời một câu
 * người ta không hỏi, và model được đưa "XU HƯỚNG ENGINE ĐÃ CHỐT" sẽ viết "có
 * cửa đấy" — tức là xác nhận một cái tên. Nên mã chặn từ trước: không tính
 * nghiêng, và câu kết luận là một trong ba câu đã duyệt, do mã đặt.
 *
 * Nhận diện theo NGỮ NGHĨA, trên chuỗi đã bỏ dấu, không dựa vào chữ hoa
 * (người dùng gõ "nguyen duy hieu" vẫn phải bắt được):
 *   - phải có danh từ chỉ bạn đời / người yêu, VÀ
 *   - một mẫu hỏi danh tính: "có phải (là) X" với X trông như tên người và
 *     không phải thực thể Tử Vi; "tên (là) gì"; "họ gì"; "có họ X".
 *
 * Phạm vi chỉ gồm bạn đời và người yêu vì ba câu kết luận đã duyệt chỉ hợp với
 * nhóm này. "Quý nhân của tôi là ai", "đặt tên con là gì" KHÔNG thuộc phạm vi.
 */

import { stableIndex } from '../dau-an';
import { boDau, nhanDangThucThe } from '../thuc-the';

/** Bạn đời đã cưới ("chồng tôi") hay chưa ("người yêu", "chồng tương lai"). */
export type LoaiNguoi = 'da-cuoi' | 'chua-cuoi' | 'khong-ro';

export interface NgoaiTam {
  loai: LoaiNguoi;
}

const CHUA_CUOI = /(?:^| )(?:nguoi yeu|ban trai|ban gai|crush|(?:chong|vo) tuong lai)(?: |$)/;
const DA_CUOI = /(?:^| )(?:chong|vo)(?: |$)/;
const KHONG_RO = /(?:^| )nguoi ay(?: |$)/;

/** Họ phổ biến — để nhận "X" là tên người khi X có từ hai âm tiết. */
const HO = new Set([
  'nguyen', 'tran', 'le', 'pham', 'hoang', 'huynh', 'phan', 'vu', 'vo', 'dang', 'bui', 'do',
  'ho', 'ngo', 'duong', 'ly', 'dinh', 'mai', 'trinh', 'truong', 'lam', 'luong', 'ha', 'cao',
  'quach', 'tang', 'trieu', 'lu', 'ton', 'thai', 'kieu', 'chu', 'doan', 'la', 'luu', 'tu',
]);

/**
 * Âm tiết KHÔNG thể là tên khi đứng sau "có phải": "có phải người tốt",
 * "có phải duyên phận", "có phải chân mệnh"… Nhầm về phía KHÔNG bắt vẫn an
 * toàn: câu rơi về STANDARD như hôm nay.
 */
const KHONG_PHAI_TEN = new Set([
  'nguoi', 'dung', 'that', 'ban', 'chan', 'duyen', 'menh', 'kiep', 'so', 'phan', 'tot', 'xau',
  'hop', 'khac', 'nao', 'ai', 'gi', 'cai', 'mot', 'nhung', 'cac', 'toi', 'minh', 'em', 'anh',
  'chi', 'no', 'ho', 'ta', 'vi', 'do', 'tai', 'yeu', 'cuoi', 'chong', 'vo', 'con', 'nam', 'thang',
  'ngay', 'gio', 'tuoi', 'cung', 'sao', 'han', 'van', 'dinh', 'qua', 'rat', 'hon', 'nhat', 'co',
  'khong', 'se', 'da', 'dang', 'hay', 'va', 'voi', 'cua', 'la', 'thu', 'phai', 'hien', 'xinh',
  'giau', 'ngheo', 'gia', 'tre', 'dep', 'cao', 'thap', 'beo', 'gay', 'lanh', 'du', 'hien',
  'ay', 'nay', 'kia',
  // Vị ngữ hay đứng sau "có phải": "có phải ngoại tình", "có phải chung thủy".
  'ngoai', 'tinh', 'chung', 'thuy', 'ghen', 'luoi', 'nghiem', 'tuc', 'gian', 'doi', 'lua', 'xau', 'ac',
  'benh', 'om', 'met', 'buon', 'vui', 'giai', 'kho', 'sung', 'ngoan', 'thuong', 'ghet',
]);

/**
 * Tên riêng thường gặp trùng với từ thường khi bỏ dấu ("Minh" / "mình", "Anh"
 * / "anh"). Đứng sau họ và được VIẾT HOA trong câu gốc thì vẫn là tên: "Lê
 * Minh", "Phạm Anh Tuấn". Viết thường thì không đoán — rơi về STANDARD.
 */
const TEN_NHAP_NHANG = new Set(['anh', 'minh', 'thu', 'hien', 'dung', 'chi', 'van', 'ha', 'tai', 'nam', 'dinh', 'em', 'thuy', 'tinh', 'vui', 'thuong']);

/** Các từ được viết hoa trong câu gốc, đã bỏ dấu. Từ đầu câu không tính. */
function tuVietHoa(cauGoc: string): Set<string> {
  const tu = cauGoc.normalize('NFC').split(/[^\p{L}\p{M}]+/u).filter(Boolean);
  return new Set(tu.slice(1).filter((t) => /^\p{Lu}/u.test(t)).map((t) => boDau(t)));
}

/** Phần đuôi câu hỏi: "không", "ko", "k", "hả", "à", "chăng", "nhỉ" và dấu câu. */
const DUOI = /\s+(?:khong|ko|k|kg|hong|ha|a|chang|nhi|vay|the|day)\b.*$/;

/** X sau "có phải (là)" có trông như tên người không. */
function laTenNguoi(x: string, hoa: ReadonlySet<string> = new Set()): boolean {
  const am = x.trim().split(/\s+/).filter(Boolean);
  if (am.length === 0 || am.length > 4) return false;
  if (nhanDangThucThe(x).length > 0) return false;
  if (am.some((a) => /\d/.test(a))) return false;
  // Họ đứng đầu + từ hai âm tiết: "nguyen duy hieu", "le hoa". Âm tiết sau họ
  // vẫn phải không nằm trong danh sách từ thường.
  if (am.length >= 2 && HO.has(am[0]))
    return !am.slice(1).some((a) => KHONG_PHAI_TEN.has(a) && !(TEN_NHAP_NHANG.has(a) && hoa.has(a)));
  // Không có họ: tên gọi trần một–hai âm tiết ("Hiếu", "Thu Trang") — phải VIẾT
  // HOA trong câu gốc. Viết thường thì "ngoại tình", "chung thủy" trông y hệt
  // một cái tên khi đã bỏ dấu; nhầm về phía không bắt vẫn an toàn.
  return am.length <= 2 && am.every((a) => hoa.has(a) && !(KHONG_PHAI_TEN.has(a) && !TEN_NHAP_NHANG.has(a)));
}

function coMauHoiDanhTinh(s: string, hoa: ReadonlySet<string> = new Set()): boolean {
  if (/(?:^| )ten (?:la |no la )?gi(?: |$)/.test(s)) return true;
  if (/(?:^| )ho (?:la )?gi(?: |$)/.test(s)) return true;
  const coHo = s.match(/(?:^| )co ho ([a-z]+)/);
  if (coHo && HO.has(coHo[1])) return true;
  const coPhai = s.match(/(?:^| )co phai (?:la )?(.+)$/);
  if (coPhai) {
    const x = coPhai[1].replace(DUOI, '').trim();
    if (laTenNguoi(x, hoa)) return true;
  }
  return false;
}

/** Chuẩn hoá: bỏ dấu, gộp khoảng trắng, bỏ dấu câu. */
function chuan(cau: string): string {
  return boDau(cau)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Câu hỏi danh tính bạn đời / người yêu. `null` khi không phải. */
export function nhanDangNgoaiTam(cauHoi: string): NgoaiTam | null {
  const s = chuan(cauHoi);
  if (!s) return null;
  const loai: LoaiNguoi | null = CHUA_CUOI.test(s)
    ? 'chua-cuoi'
    : DA_CUOI.test(s)
      ? 'da-cuoi'
      : KHONG_RO.test(s)
        ? 'khong-ro'
        : null;
  if (!loai) return null;
  return coMauHoiDanhTinh(s, tuVietHoa(cauHoi)) ? { loai } : null;
}

/**
 * Ba câu kết luận đã duyệt (brief §11). Mã đặt, model không viết lại.
 *
 * Câu 2 nói "người bạn sẽ cưới" — sai với người đã cưới, nên chỉ dùng khi
 * danh từ là người yêu / bạn trai / bạn gái / crush / "… tương lai".
 */
export const CAU_NGOAI_TAM = [
  'Lá số không thể xác nhận người bạn đời của bạn là một người cụ thể chỉ bằng tên.',
  'Celes không thể dùng lá số để kiểm chứng một cái tên có phải người bạn sẽ cưới hay không.',
  'Tên của người bạn đời không phải điều lá số có thể xác nhận; Celes chỉ có thể xem người đó có hợp với mẫu bạn đời trong lá số đến đâu.',
] as const;

/** Chọn câu kết luận ổn định theo FNV của câu hỏi (cùng câu hỏi → cùng câu). */
export function cauKetLuanNgoaiTam(cauHoi: string, nt: NgoaiTam): string {
  const tap = nt.loai === 'chua-cuoi' ? [0, 1, 2] : [0, 2];
  return CAU_NGOAI_TAM[tap[stableIndex(chuan(cauHoi), tap.length)]];
}

/**
 * Chip hỏi lại điều ngoài tầm lá số: "Anh ấy tên gì?", "Có phải Hiếu không?".
 * Bấm vào là quay lại đúng ngõ cụt vừa rồi, và vẫn tốn một lượt.
 */
export function laChipNgoaiTam(chip: string): boolean {
  const s = chuan(chip);
  return (
    nhanDangNgoaiTam(chip) !== null ||
    // Chip không cần danh từ bạn đời: "Có phải Hiếu không?" đứng sau một câu ngoài tầm.
    coMauHoiDanhTinh(s, tuVietHoa(chip)) ||
    /(?:^| )(?:ten (?:la |that |day du )?gi|ho (?:la )?gi|ten that|ten day du)(?: |$)/.test(s)
  );
}
