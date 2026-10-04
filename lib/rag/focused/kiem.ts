/**
 * GUARD — đường Focused (CEL-186 vé B, mục 6).
 *
 * Hàm thuần, không gọi model, KHÔNG sửa văn model (Answer Contract v2, spec 5).
 * `kiemCung` trả danh sách lỗi cứng; có lỗi thì `chay.ts` viết lại TOÀN bài một
 * lần, vẫn lỗi thì 502 + hoàn lượt. Không cắt câu, không thay câu.
 *
 * `kiemMotCau` (luật từng câu cũ) còn ở đây cho tới khi `kiemCung` phủ đủ bảng 5.1.
 * `chonChip` lọc chip (không đụng `answer`).
 */

import { CUM_AI, RO_RI_RAG } from '../ngon-ngu';
import { TIENG_LONG_MOT_CAU } from '../sua-chua';
import { boDau, tenBiaChan } from '../thuc-the';
import type { NghiengVe } from '../nghieng-ve';
import type { MucAnToan } from '../an-toan';
import type { ChuDe } from '../planner';
import { CHIP_DU_PHONG, type NgonNgu } from './ngon-ngu';
import type { DoiTuongCauHoi } from './doi-tuong';
import { nhanDangDoiTuong } from './doi-tuong';
import type { BanNhap, LoiCung } from './hop-dong';
import { laChipNgoaiTam } from './ngoai-tam';
import { laHoiKhiNao, type BoiCanhThoiGian, type PhanLoai } from './phan-loai';
import { khoaTen, tenCungTrongCau, tenNgoaiTap } from './quet-ten';

/* ------------------------------------------------------------------ kiểu */

export type LyDoBo =
  | 'ten-ngoai-goi'
  | 'ten-bia'
  | 'luu-hoa'
  | 'ten-cung'
  | 'giong-may'
  | 'tieng-long'
  | 'phan-quyet'
  | 'khuyen'
  | 'nghieng-ve'
  | 'moc-la'
  | 'tuong-lai'
  | 'rong';

export interface NguCanhKiem {
  cauHoi: string;
  phanLoai: PhanLoai;
  mucAnToan: MucAnToan;
  chuDe: ChuDe;
  doiTuong: DoiTuongCauHoi | null;
  /** Tên được phép (`tapTenTuGoi`) */
  tapTen: ReadonlySet<string>;
  phucDucLaSao: boolean;
  /** Mã F### có trong gói */
  maHopLe: ReadonlySet<string>;
  /** Mã E### có trong gói */
  maNguonHopLe: ReadonlySet<string>;
  nghieng: NghiengVe | null;
  thoiGian: BoiCanhThoiGian;
  /** Khoảng tuổi đại vận có trong gói, `[từ, đến]` */
  tuoiHopLe: [number, number][];
  /** Câu do mã viết đứng đầu lượt (E, N2, N4) — không kiểm */
  cauMa: string[];
  /** Chip do mã đặt (E, N4). Có thì thay chip model, trừ N4 trộn thêm. */
  chipMa?: string[];
  /** N4: chip "Sang năm <Can Chi>" đứng đầu, trộn chip model phía sau */
  chipCuoiNam?: (goiY: string[]) => string[];
  /** Chip lượt trước — chip lặp lại thì không còn "đi sâu một lớp" */
  chipTruoc: string[];
  /** Mã F### loại `nguyet-han` trong gói */
  maNguyetHan?: ReadonlySet<string>;
  /** Ngôn ngữ của chip dự phòng. Thiếu = 'vi'. */
  ngonNgu?: NgonNgu;
}

/* -------------------------------------------------------------- tiện ích */

export const soAmTiet = (s: string) => s.split(/[^\p{L}\p{M}\d]+/u).filter(Boolean).length;

const re = (mau: string, co = 'iu') => new RegExp(`(?<![\\p{L}\\p{M}])(?:${mau})(?![\\p{L}\\p{M}])`, co);

/** Mọi cụm 1–5 từ của chuỗi đã bỏ dấu — khớp theo TỪ, như `ngon-ngu.ts`. */
function cumTu(s: string): Set<string> {
  const tu = boDau(s).split(/[^a-z0-9%]+/).filter(Boolean);
  const ra = new Set<string>();
  for (let i = 0; i < tu.length; i++) {
    for (let n = 1; n <= 5 && i + n <= tu.length; n++) ra.add(tu.slice(i, i + n).join(' '));
  }
  return ra;
}

/* ----------------------------------------------------------- bảng chữ */

/** Chữ chuyên môn của sách — cùng danh sách `TU_CHUYEN_MON` của `ngon-ngu.ts` (ở đó là cảnh báo, ở đây là chặn). */
const TU_CHUYEN_MON = [
  'mieu vien', 'toa thu', 'hoi chieu', 'cung chieu', 'xung chieu', 'tam phuong tu chinh', 'nhi hop',
  'ban tien cach', 'phu quy cach', 'thu menh',
];

/** Giọng báo cáo — `KHOI_GIONG_CELES` cấm, ở đây chặn. */
const GIONG_BAO_CAO = [
  'dua tren cac du kien', 'yeu to nay cho thay', 'co the thay rang', 'diem can nhin la', 'tom lai',
  'du kien la so', 'theo la so cua ban', 'ma f',
];

const BO_GIONG_MAY = [...CUM_AI, ...RO_RI_RAG, ...TU_CHUYEN_MON, ...GIONG_BAO_CAO];

/** Luật 3. "Không chắc chắn", "chưa chắc chắn" là rào đón, không phải phán. */
export const PHAN_QUYET = re(
  '(?<!(?:không|chưa) )chắc chắn|nhất định|chắc luôn|sẽ không|không bao giờ|trăm phần trăm|không thể nào|sẽ xảy ra|không hợp nhau|không hợp với nhau'
);
export const PHAN_TRAM = /100\s*%/u;

/** Luật 4. "nên" đứng một mình thường là liên từ ("…, nên chuyện chậm"), nên chỉ bắt khi có chủ ngữ hoặc đứng đầu câu. */
export const KHUYEN = re(
  [
    '(?:bạn|mình|anh|chị|em|cậu) (?:nên|đừng|hãy|không nên|chưa nên)',
    'hãy',
    'đừng',
    'không nên',
    'thì nên',
    'tốt nhất là',
    'thời điểm vàng',
    'celes khuyên',
    'lời khuyên',
    'nghiêng về (?:việc|chuyện|phương án|lựa chọn|hướng) ',
  ].join('|')
);
export const KHUYEN_DAU_CAU = /^\s*(?:Nên|Đừng|Hãy)(?![\p{L}\p{M}])/u;

/** Luật 5 */
const NGHIENG_VE = re('nghiêng về');

/** Luật 7 */
const TUONG_LAI = re('sẽ|sắp|tới đây|sắp tới|trong thời gian tới');

const NAM = /(?<!\d)(19\d{2}|20\d{2})(?!\d)/gu;
const THANG = /(?<![\p{L}\p{M}])th[aá]ng\s*(1[0-2]|[1-9])(?!\d)/giu;
const TUOI = /(?<!\d)(\d{1,2})\s*(?:[–-]\s*(\d{1,2})\s*)?tuổi|tuổi\s*(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?/giu;

/* ------------------------------------------------------- luật trên một câu */

/**
 * Luật 1–7 trên MỘT câu. `laCauChot` bật thêm luật tên của câu chốt (giao với
 * `dauMoc`). Thứ tự lý do không mang nghĩa ưu tiên.
 */
export function kiemMotCau(noiDung: string, ctx: NguCanhKiem, laCauChot = false): LyDoBo[] {
  const ly = new Set<LyDoBo>();
  const s = noiDung.normalize('NFC');
  if (!s.trim()) return ['rong'];

  // 1. Tên
  const ngoai = tenNgoaiTap(s, ctx.tapTen, ctx.phucDucLaSao);
  if (ngoai.some((t) => t.startsWith('Lưu Hóa'))) ly.add('luu-hoa');
  if (ngoai.some((t) => !t.startsWith('Lưu Hóa'))) ly.add('ten-ngoai-goi');
  if (tenBiaChan(s).length) ly.add('ten-bia');
  const { khuon } = ctx.phanLoai;
  if (laCauChot && ctx.nghieng && (khuon === 'A' || khuon === 'B' || khuon === 'C' || khuon === 'D')) {
    const tapChot = new Set(
      ctx.nghieng.dauMoc.map((d) => khoaTen(d.ten)).filter((k) => ctx.tapTen.has(k))
    );
    if (tenNgoaiTap(s, tapChot, ctx.phucDucLaSao).length) ly.add('ten-ngoai-goi');
  }

  // 2. Mặt trước sạch
  if (tenCungTrongCau(s, ctx.phucDucLaSao).length) ly.add('ten-cung');
  const cum = cumTu(s);
  if (BO_GIONG_MAY.some((c) => cum.has(c))) ly.add('giong-may');
  // "dữ kiện" là chữ nội bộ — so có dấu, vì bỏ dấu thì trùng "dự kiến" (celes-domain 04/10).
  if (/(?<![\p{L}\p{M}])dữ kiện(?![\p{L}\p{M}])/iu.test(s)) ly.add('giong-may');
  if (TIENG_LONG_MOT_CAU.test(s)) ly.add('tieng-long');

  // 3. Phán quyết
  if (PHAN_QUYET.test(s) || PHAN_TRAM.test(s)) ly.add('phan-quyet');

  // 4. Khuyên, chọn hộ
  if (KHUYEN.test(s) || KHUYEN_DAU_CAU.test(s)) ly.add('khuyen');
  if (ctx.phanLoai.haiVe && chonMotVe(s, ctx.phanLoai.haiVe)) ly.add('khuyen');

  // 5. G (hoặc không có hướng engine) thì không được nói "nghiêng về"
  if ((khuon === 'G' || !ctx.nghieng) && NGHIENG_VE.test(s)) ly.add('nghieng-ve');

  // 6. Không mốc lạ. "Khi nào" (D) chỉ đọc mức năm: mốc nhỏ hơn năm bằng chữ cũng là mốc lạ.
  if (mocLa(s, ctx) || (khuon === 'D' && MOC_NHO_HON_NAM.test(s))) ly.add('moc-la');

  // 7. Tháng đã qua thì không nói như dự báo
  if (ctx.thoiGian.thang?.trangThai === 'da-qua' && TUONG_LAI.test(s)) ly.add('tuong-lai');

  return [...ly];
}

/** E1: câu chọn hộ một vế ("ở lại hợp hơn", "chọn nhảy việc"). */
function chonMotVe(s: string, haiVe: [string, string]): boolean {
  const t = s.toLowerCase();
  return haiVe.some((v) => {
    const ve = v.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`chọn\\s+${ve}|${ve}[^.!?]{0,24}(?:tốt|hợp|lợi|ổn|đáng)\\s+hơn|${ve}\\s+hơn`, 'iu').test(t);
  });
}

/** Mốc nhỏ hơn một năm nói bằng chữ — số tháng đã có `THANG` bắt. */
export const MOC_NHO_HON_NAM =
  /(?<![\p{L}\p{M}])(?:cuối năm|đầu năm|giữa năm|nửa (?:đầu|cuối|sau) năm|(?:sau|trước|quanh|dịp) Tết|quý (?:một|hai|ba|bốn|I{1,3}|IV|[1-4])|mùa (?:xuân|hạ|hè|thu|đông)|tháng (?:giêng|chạp|tới|sau|sắp tới)|vài tháng tới|mấy tháng tới)(?![\p{L}\p{M}])/iu;

function mocLa(s: string, ctx: NguCanhKiem): boolean {
  for (const m of s.matchAll(NAM)) if (Number(m[1]) !== ctx.thoiGian.namHieuLuc) return true;
  const thang = ctx.thoiGian.thang?.thang;
  for (const m of s.matchAll(THANG)) if (Number(m[1]) !== thang) return true;
  for (const m of s.matchAll(TUOI)) {
    const so = [m[1], m[2], m[3], m[4]].filter(Boolean).map(Number);
    if (so.some((x) => !ctx.tuoiHopLe.some(([a, b]) => x >= a && x <= b))) return true;
  }
  return false;
}

/* ------------------------------------------------------------- cả lượt */

/** Mã máy lộ ra văn: F###/E### và nhãn cửa sổ W1–W3 (spec 5.1 LO_MA). */
const MA_MAY = /\b[FE]\d{3}\b|\bW[1-3]\b/u;

/** ≤60 ký tự quanh vị trí `i` — chỉ đưa vào prompt viết lại. */
function doanQuanh(s: string, i: number): string {
  const tu = Math.max(0, i - 30);
  return s.slice(tu, tu + 60);
}

/**
 * Validator cứng (spec 5.1). Thuần, không sửa `ban`. Commit D chạy tập tối thiểu:
 * SCHEMA, KHONG_CAN_CU, MA_KHONG_HOP_LE, LO_MA.
 */
export function kiemCung(ban: BanNhap | null, ctx: Pick<NguCanhKiem, 'maHopLe' | 'maNguonHopLe'>): LoiCung[] {
  if (!ban) return [{ ma: 'SCHEMA', chiTiet: 'bản trả về không phải một object JSON đúng schema' }];
  const loi: LoiCung[] = [];
  if (!ban.answer) loi.push({ ma: 'SCHEMA', chiTiet: 'thiếu "answer" hoặc "answer" rỗng' });

  const hopLe = (m: string) => ctx.maHopLe.has(m) || ctx.maNguonHopLe.has(m);
  const sai = [...new Set(ban.claims.flatMap((c) => c.evidenceIds.filter((m) => !hopLe(m))))];
  if (sai.length) loi.push({ ma: 'MA_KHONG_HOP_LE', chiTiet: `mã ${sai.join(', ')} không có trong DỮ KIỆN hay NGUỒN THAM CHIẾU` });
  if (!ban.outOfScope && !ban.claims.some((c) => c.evidenceIds.some(hopLe))) {
    loi.push({ ma: 'KHONG_CAN_CU', chiTiet: '"claims" không có kết luận nào dẫn mã F### / E### có trong gói' });
  }

  const m = MA_MAY.exec(ban.answer);
  if (m) loi.push({ ma: 'LO_MA', chiTiet: `văn có mã nội bộ "${m[0]}"`, doan: doanQuanh(ban.answer, m.index) });
  else {
    const cum = cumTu(ban.answer);
    const bao = GIONG_BAO_CAO.find((c) => cum.has(c));
    if (bao) loi.push({ ma: 'LO_MA', chiTiet: `văn có giọng báo cáo (cụm "${bao}", viết không dấu) — nói thẳng bằng lời thường` });
  }
  return loi;
}

/* ------------------------------------------------------------------ chip */

const chuanChip = (s: string) => boDau(s).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

const CHIP_RA_LENH = /^\s*(?:hãy|nên|đừng|bạn nên|bạn hãy|có nên)(?![\p{L}\p{M}])/iu;
/** Thuật ngữ chip không được kéo người dùng vào — lượt sau phải đọc được bằng lời thường. */
const CHIP_THUAT_NGU = /đại vận/iu;
/** Hỏi tên / họ của bất kỳ ai — `laChipNgoaiTam` chỉ phủ bạn đời. Lá số không chứa tên ai. */
const CHIP_HOI_TEN = re('tên (?:là )?gì|tên (?:của )?(?:người|anh|chị|cô|cậu|em|vợ|chồng|người yêu|ny)|họ gì|họ (?:của )?(?:người|anh|chị|cô)|vần gì|chữ cái');
/** Trần độ dài chip, khớp "tối đa 40 ký tự" trong prompt. */
const CHIP_TOI_DA = 40;

export function chonChip(goiY: readonly string[], ctx: NguCanhKiem): string[] {
  if (ctx.chipMa?.length) return [...ctx.chipMa].slice(0, 3);

  const daCo = new Set([chuanChip(ctx.cauHoi), ...ctx.chipTruoc.map(chuanChip)]);
  const ra: string[] = [];
  for (const g of goiY) {
    const c = g.normalize('NFC').trim();
    if (!c) continue;
    const k = chuanChip(c);
    if (daCo.has(k)) continue;
    if (laChipNgoaiTam(c) || CHIP_HOI_TEN.test(c)) continue; // hỏi tên, họ, danh tính
    if (nhanDangDoiTuong(c)?.loai === 'van-rieng') continue; // vận riêng người khác
    if (CHIP_RA_LENH.test(c) || CHIP_THUAT_NGU.test(c)) continue;
    if (laHoiKhiNao(c)) continue; // "Tháng nào…", "Khi nào…" — engine không chọn mốc (#5)
    if ([...c].length > CHIP_TOI_DA) continue; // hợp đồng prompt: tối đa 40 ký tự, chip dài vỡ hàng trên màn hẹp
    daCo.add(k);
    ra.push(c);
    if (ra.length === 3) break;
  }
  // Chip đủ để dùng khi model trả quá ít — đều là câu engine đọc được (#5).
  for (const d of CHIP_DU_PHONG[ctx.ngonNgu ?? 'vi']) {
    if (ra.length >= 2) break;
    if (!daCo.has(chuanChip(d))) {
      daCo.add(chuanChip(d));
      ra.push(d);
    }
  }
  return ctx.chipCuoiNam ? ctx.chipCuoiNam(ra) : ra;
}
