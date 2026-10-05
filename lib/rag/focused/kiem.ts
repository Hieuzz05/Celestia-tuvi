/**
 * GUARD — đường Focused (CEL-186 vé B, mục 6).
 *
 * Hàm thuần, không gọi model, KHÔNG sửa văn model (Answer Contract v2, spec 5).
 * `kiemCung` trả danh sách lỗi cứng theo bảng 5.1; có lỗi thì `chay.ts` viết lại
 * TOÀN bài một lần, vẫn lỗi thì 502 + hoàn lượt. Không cắt câu, không thay câu.
 * Luật văn phong (tên cung, giọng máy, khuyên chung, "sẽ" ở tháng đã qua…) là
 * EVAL: đo ở bộ chấm, không chặn ở đây.
 *
 * `chonChip` lọc chip (không đụng `answer`).
 */

import { RO_RI_RAG } from '../ngon-ngu';
import { tachManh } from '../sua-chua';
import { boDau, tenBiaChan } from '../thuc-the';
import type { NghiengVe } from '../nghieng-ve';
import type { MucAnToan } from '../an-toan';
import type { ChuDe } from '../planner';
import { nhomCuaHuong, soChieu, type HuongThang, type NhomHuong } from './chot-huong';
import { CHIP_DU_PHONG, type NgonNgu } from './ngon-ngu';
import type { DoiTuongCauHoi } from './doi-tuong';
import { nhanDangDoiTuong } from './doi-tuong';
import { TANG_CUA, type BanNhap, type LoiCung, type MaLoiCung } from './hop-dong';
import { laChipNgoaiTam } from './ngoai-tam';
import { laHoiKhiNao, type BoiCanhThoiGian, type PhanLoai } from './phan-loai';
import { tenNgoaiTap } from './quet-ten';

/* ------------------------------------------------------------------ kiểu */

/** Năm, tháng được phép nêu (spec 5.1 `moc-la`, delta #6) */
export interface MocHopLe {
  nam: ReadonlySet<number>;
  thang: ReadonlySet<number>;
}

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
  /** Mã T### (nghiệm lý đã duyệt, đã khớp) — CHỈ có khi cờ CELES_OWNER_KNOWLEDGE_FOCUSED bật (CEL-194) */
  maNghiemLyHopLe?: ReadonlySet<string>;
  nghieng: NghiengVe | null;
  thoiGian: BoiCanhThoiGian;
  /** Khoảng tuổi đại vận có trong gói, `[từ, đến]` */
  tuoiHopLe: [number, number][];
  /** Mốc được nêu trong `answer` — KHÔNG có năm sau (delta #6) */
  mocHopLeAnswer: MocHopLe;
  /** Mốc được nêu trong chip = answer ∪ {năm sau, tháng kế} */
  mocHopLeChip: MocHopLe;
  /** Câu mã đứng đầu lượt (tháng dương, danh tính bạn đời) — không kiểm */
  cauMa: string[];
  /** Chip do mã đặt (E). Có thì thay chip model. */
  chipMa?: string[];
  /** N4: chip "Sang năm <Can Chi>" đứng đầu, trộn chip model phía sau */
  chipCuoiNam?: (goiY: string[]) => string[];
  /** Chip lượt trước — chip lặp lại thì không còn "đi sâu một lớp" */
  chipTruoc: string[];
  /** Mã F### loại `nguyet-han` trong gói */
  maNguyetHan?: ReadonlySet<string>;
  /** Hướng của tháng đang hỏi theo cửa sổ âm (spec v2 §3.3) */
  huongThang?: HuongThang;
  /** Mã nguyệt hạn + lưu niên của từng cửa sổ (W1/W2/W3) */
  maTheoCuaSo?: Record<string, string[]>;
  /** Ngôn ngữ của chip dự phòng. Thiếu = 'vi'. */
  ngonNgu?: NgonNgu;
  /** Giải thích lượt trước (spec 6.2): chiều của kết luận vừa đưa — claims[0] không được lật */
  huongLuotTruoc?: NhomHuong;
}

/* -------------------------------------------------------------- tiện ích */

export const soAmTiet = (s: string) => s.split(/[^\p{L}\p{M}\d]+/u).filter(Boolean).length;

const re = (mau: string, co = 'iu') => new RegExp(`(?<![\\p{L}\\p{M}])(?:${mau})(?![\\p{L}\\p{M}])`, co);

/**
 * Hai cụm hệ phái của `RO_RI_RAG` bỏ dấu xong trùng chữ thường: "tiền bạc phải" → "bac phai",
 * "năm phải" → "nam phai" (eval I: bắt nhầm, phải viết lại). Ở Focused chỉ tính khi văn có dấu đúng.
 */
const HE_PHAI_CO_DAU: Record<string, RegExp> = { 'nam phai': re('nam phái'), 'bac phai': re('bắc phái') };

/** Mọi cụm 1–5 từ của chuỗi đã bỏ dấu — khớp theo TỪ, như `ngon-ngu.ts`. */
function cumTu(s: string): Set<string> {
  const tu = boDau(s).split(/[^a-z0-9%]+/).filter(Boolean);
  const ra = new Set<string>();
  for (let i = 0; i < tu.length; i++) {
    for (let n = 1; n <= 5 && i + n <= tu.length; n++) ra.add(tu.slice(i, i + n).join(' '));
  }
  return ra;
}

/**
 * Câu của `answer` — tách bằng hàm của `sua-chua.ts` (spec 5.2). Quét tên theo
 * câu thì chữ hoa đầu câu thứ hai ("Suy…") không bị coi là tên riêng.
 */
const tachCau = (van: string) => tachManh(van).filter((m) => m.loai === 'NOI_DUNG').map((m) => m.text);

/** ≤60 ký tự quanh vị trí `i` — chỉ đưa vào prompt viết lại. */
function doanQuanh(s: string, i: number): string {
  const tu = Math.max(0, i - 30);
  return s.slice(tu, tu + 60);
}

/* ----------------------------------------------------------- bảng chữ */

/** Giọng báo cáo — tầng C `GIONG_BAO_CAO` (CEL-191: tách khỏi `LO_MA`, chỉ đo). */
const GIONG_BAO_CAO = [
  'dua tren cac du kien', 'yeu to nay cho thay', 'co the thay rang', 'diem can nhin la', 'tom lai',
  'du kien la so', 'theo la so cua ban', 'ma f',
];

/** Cả tập phán quyết — `CHAC_CHAN_GIA` chỉ chặn tập con, phần còn lại do bộ chấm đo (EVAL). */
export const PHAN_QUYET = re(
  '(?<!(?:không|chưa) )chắc chắn|nhất định|chắc luôn|sẽ không|không bao giờ|trăm phần trăm|không thể nào|sẽ xảy ra|không hợp nhau|không hợp với nhau'
);
/**
 * `CHAC_CHAN_GIA` (tầng B): danh sách ĐÓNG các cụm khẳng định sự việc sẽ xảy ra (CEL-191 §7).
 * "Chắc chắn" đứng một mình, "nhất định" không kèm "sẽ", "không thể nào" xuống tầng C (`PHAN_QUYET`,
 * chỉ đo): "chắc chắn là bạn nên nghỉ ngơi" không phải lời tiên tri. "Không / chưa chắc chắn sẽ"
 * và phủ định trong cùng vế (`PHU_DINH_VE`) vẫn là rào đón.
 */
// Chen tối đa hai tiếng giữa "chắc chắn" và "sẽ" ("chắc chắn bạn sẽ có việc") — vẫn là khẳng định sẽ xảy ra.
const CHAC_CHAN_GIA = re('(?<!(?:không|chưa) )chắc chắn (?:[\\p{L}\\p{M}]+ ){0,2}sẽ|nhất định sẽ|trăm phần trăm|sẽ xảy ra', 'giu');
/**
 * Phủ định đứng xa hơn một từ vẫn là rào đón: "không phải dấu hiệu chắc chắn bị cho nghỉ",
 * "không có nghĩa là chắc chắn mất tiền", "không đủ để kết luận chắc chắn". Chỉ xét trong cùng
 * vế câu (sau dấu , ; : hay "mà", "nhưng" gần nhất) — tái hiện 502 của eval mù I: mọi lượt trượt đều đúng dạng này.
 */
const PHU_DINH_VE = re('(?:không|chưa|chẳng) (?:có )?(?:phải|hẳn|(?:đồng )?nghĩa|đủ|thể|căn cứ)');
function chacChanGia(s: string): RegExpExecArray | null {
  CHAC_CHAN_GIA.lastIndex = 0;
  for (let m = CHAC_CHAN_GIA.exec(s); m; m = CHAC_CHAN_GIA.exec(s)) {
    const ve = s.slice(0, m.index).split(/[,;:]| mà | nhưng /u).pop() ?? '';
    if (!PHU_DINH_VE.test(ve)) return m;
  }
  return null;
}
export const PHAN_TRAM = /100\s*%/u;

/** Lời khuyên chung — EVAL. "nên" đứng một mình thường là liên từ, nên chỉ bắt khi có chủ ngữ hoặc đứng đầu câu. */
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

/** `CHON_HO` (khuôn C, E): tập con của `KHUYEN` — chỉ chỗ chọn hộ, không bắt "hãy", "đừng". */
const CHON_HO = re('(?:bạn|mình|anh|chị|em|cậu) (?:nên|không nên|chưa nên)|thì nên|tốt nhất là');
const CHON_HO_DAU_CAU = /^\s*Nên(?![\p{L}\p{M}])/u;

const NAM = /(?<!\d)(19\d{2}|20\d{2})(?!\d)/gu;
const THANG = /(?<![\p{L}\p{M}])th[aá]ng\s*(1[0-2]|[1-9])(?!\d)/giu;
const TUOI = /(?<!\d)(\d{1,2})\s*(?:[–-]\s*(\d{1,2})\s*)?tuổi|tuổi\s*(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?/giu;

/** Mốc nhỏ hơn một năm nói bằng chữ — số tháng đã có `THANG` bắt. */
export const MOC_NHO_HON_NAM =
  /(?<![\p{L}\p{M}])(?:cuối năm|đầu năm|giữa năm|nửa (?:đầu|cuối|sau) năm|(?:sau|trước|quanh|dịp) Tết|quý (?:một|hai|ba|bốn|I{1,3}|IV|[1-4])|mùa (?:xuân|hạ|hè|thu|đông)|tháng (?:giêng|chạp|tới|sau|sắp tới)|vài tháng tới|mấy tháng tới)(?![\p{L}\p{M}])/iu;

/** Mã máy lộ ra văn: F###/E### và nhãn cửa sổ W1–W3 (spec 5.1 LO_MA). */
const MA_MAY = /\b[FE]\d{3}\b|\bW[1-3]\b/u;
/** Mã nghiệm lý lộ ra văn (CEL-194) — chỉ kiểm khi lượt có T###, để cờ tắt thì validator y như cũ. */
const MA_NGHIEM_LY_MAY = /\bT\d{3}\b|\bNL-[A-Z0-9]/u;

/* ------------------------------------------------------------- mốc hợp lệ */

/**
 * Hai tập mốc của lượt (spec 5.1 `moc-la`, delta #6). Tính một lần khi dựng ngữ cảnh.
 *
 * Answer: năm hiệu lực, năm người dùng tự nêu, năm sinh, năm 4 chữ số trong văn
 * F###/E### của gói, năm / tháng dương hai đầu cửa sổ tháng; tháng người hỏi,
 * tháng âm đang đọc. KHÔNG có năm sau: hỏi "năm nay" mà answer nói "sang 2027"
 * là lệch câu hỏi.
 * Chip: answer ∪ {năm hiệu lực + 1, tháng dương kế của tháng đang hỏi (quay năm)}.
 */
export function tinhMocHopLe(v: {
  cauHoi: string;
  thoiGian: BoiCanhThoiGian;
  namSinh: number[];
  vanGoi: string[];
}): { answer: MocHopLe; chip: MocHopLe } {
  const nam = new Set<number>([v.thoiGian.namHieuLuc, ...v.namSinh]);
  const thang = new Set<number>();
  for (const m of v.cauHoi.matchAll(NAM)) nam.add(Number(m[1]));
  for (const m of v.cauHoi.matchAll(THANG)) thang.add(Number(m[1]));
  for (const s of v.vanGoi) for (const m of s.matchAll(NAM)) nam.add(Number(m[1]));

  const t = v.thoiGian.thang;
  if (t) {
    // Tháng hỏi + tháng âm của mọi cửa sổ + năm, tháng dương hai đầu mỗi cửa sổ (spec 5.1 MOC_BIA).
    if (t.muc.loai === 'thang-duong') {
      nam.add(t.muc.nam);
      thang.add(t.muc.thang);
    } else thang.add(t.muc.thangAm);
    for (const w of t.cuaSo) {
      nam.add(w.namAm);
      thang.add(w.thangAm);
      for (const iso of [w.tuNgay, w.denNgay]) {
        nam.add(Number(iso.slice(0, 4)));
        thang.add(Number(iso.slice(5, 7)));
      }
    }
  }

  const namChip = new Set(nam).add(v.thoiGian.namHieuLuc + 1);
  const thangChip = new Set(thang);
  if (t) {
    const hoi = t.muc.loai === 'thang-duong' ? { nam: t.muc.nam, thang: t.muc.thang } : { nam: t.muc.namAm, thang: t.muc.thangAm };
    if (hoi.thang === 12) {
      thangChip.add(1);
      namChip.add(hoi.nam + 1);
    } else thangChip.add(hoi.thang + 1);
  }
  return { answer: { nam, thang }, chip: { nam: namChip, thang: thangChip } };
}

/** Mốc đầu tiên không thuộc tập — null khi sạch. */
function mocNgoaiTap(s: string, tap: MocHopLe, tuoi?: [number, number][]): RegExpMatchArray | null {
  for (const m of s.matchAll(NAM)) if (!tap.nam.has(Number(m[1]))) return m;
  for (const m of s.matchAll(THANG)) if (!tap.thang.has(Number(m[1]))) return m;
  if (tuoi) {
    for (const m of s.matchAll(TUOI)) {
      const so = [m[1], m[2], m[3], m[4]].filter(Boolean).map(Number);
      if (so.some((x) => !tuoi.some(([a, b]) => x >= a && x <= b))) return m;
    }
  }
  return null;
}

/** E1: câu chọn hộ một vế ("ở lại hợp hơn", "chọn nhảy việc"). */
function chonMotVe(s: string, haiVe: [string, string]): boolean {
  const t = s.toLowerCase();
  return haiVe.some((v) => {
    const ve = v.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`chọn\\s+${ve}|${ve}[^.!?]{0,24}(?:tốt|hợp|lợi|ổn|đáng)\\s+hơn|${ve}\\s+hơn`, 'iu').test(t);
  });
}

/* ------------------------------------------------------------- cả lượt */

export interface KetQuaKiem {
  /** Tầng A ∪ B — vào vòng viết lại, vẫn còn thì 502. */
  chan: LoiCung[];
  /** Tầng C — chỉ điểm (mã + số lần), ghi vào vết. */
  do: { ma: MaLoiCung; dem: number }[];
}

/**
 * Validator cứng (spec 5.1). Thuần, không sửa `ban`. Mỗi mã lỗi chặn báo tối đa một lần.
 * Quét tên trên từng câu của `answer` và trên từng `claims[].claim` (spec 5.2).
 * Chỉ trả lỗi CHẶN (tầng A ∪ B); điểm tầng C ở `kiemBaTang`.
 */
export function kiemCung(ban: BanNhap | null, ctx: NguCanhKiem): LoiCung[] {
  return kiemBaTang(ban, ctx).chan;
}

/** Validator ba tầng (CEL-191 §7): `chan` = A ∪ B, `do` = điểm C. */
export function kiemBaTang(ban: BanNhap | null, ctx: NguCanhKiem): KetQuaKiem {
  if (!ban) return { chan: [{ ma: 'SCHEMA', tang: 'A', chiTiet: 'bản trả về không phải một object JSON đúng schema' }], do: [] };
  const loi: LoiCung[] = [];
  const co = new Set<LoiCung['ma']>();
  const diemC = new Map<MaLoiCung, number>();
  const bao = (l: Omit<LoiCung, 'tang'>) => {
    const tang = TANG_CUA[l.ma];
    if (tang === 'C') {
      diemC.set(l.ma, (diemC.get(l.ma) ?? 0) + 1);
      return;
    }
    if (co.has(l.ma)) return;
    co.add(l.ma);
    loi.push({ ...l, tang });
  };
  const cau = tachCau(ban.answer);

  // SCHEMA
  if (!ban.answer) bao({ ma: 'SCHEMA', chiTiet: 'thiếu "answer" hoặc "answer" rỗng' });
  if (ban.outOfScope && (ban.claims.length || cau.length > 1)) {
    bao({ ma: 'SCHEMA', chiTiet: '"outOfScope" thì "answer" đúng MỘT câu và "claims" rỗng' });
  }

  // Căn cứ
  const hopLe = (m: string) => ctx.maHopLe.has(m) || ctx.maNguonHopLe.has(m) || !!ctx.maNghiemLyHopLe?.has(m);
  const sai = [...new Set(ban.claims.flatMap((c) => c.evidenceIds.filter((m) => !hopLe(m))))];
  if (sai.length) bao({ ma: 'MA_KHONG_HOP_LE', chiTiet: `mã ${sai.join(', ')} không có trong DỮ KIỆN hay NGUỒN THAM CHIẾU` });
  // T### là cách đọc, không phải căn cứ: claim dẫn T phải dẫn kèm F của gói (CEL-194).
  const tKhongF = ban.claims.find(
    (c) => c.evidenceIds.some((m) => ctx.maNghiemLyHopLe?.has(m)) && !c.evidenceIds.some((m) => ctx.maHopLe.has(m))
  );
  if (tKhongF) bao({ ma: 'T_THIEU_F', chiTiet: `claim dẫn ${tKhongF.evidenceIds.join(', ')} nhưng không có mã F### nào — nghiệm lý phải đi kèm dữ kiện lá số` });
  if (!ban.outOfScope && !ban.claims.some((c) => c.evidenceIds.some(hopLe))) {
    bao({ ma: 'KHONG_CAN_CU', chiTiet: '"claims" không có kết luận nào dẫn mã F### / E### có trong gói' });
  }

  // Tên: từng câu answer, từng claim
  for (const s of [...cau, ...ban.claims.map((c) => c.claim)]) {
    const ngoai = tenNgoaiTap(s, ctx.tapTen, ctx.phucDucLaSao);
    const luu = ngoai.filter((t) => t.startsWith('Lưu Hóa'));
    const khac = ngoai.filter((t) => !t.startsWith('Lưu Hóa'));
    if (luu.length) bao({ ma: 'LUU_HOA', chiTiet: `"${luu[0]}" không có trong DỮ KIỆN — lá số không an lưu tứ hoá` });
    if (khac.length) bao({ ma: 'TEN_NGOAI_GOI', chiTiet: `tên ${khac.map((t) => `"${t}"`).join(', ')} không có trong DỮ KIỆN` });
    const bia = tenBiaChan(s);
    if (bia.length) bao({ ma: 'TEN_BIA', chiTiet: `tên ${bia.map((t) => `"${t}"`).join(', ')} không phải sao có thật` });
  }

  // Mốc
  const moc = mocNgoaiTap(ban.answer, ctx.mocHopLeAnswer, ctx.tuoiHopLe);
  if (moc) {
    bao({ ma: 'MOC_BIA', chiTiet: `mốc "${moc[0]}" không có trong khối MỐC THỜI GIAN hay dữ kiện`, doan: doanQuanh(ban.answer, moc.index ?? 0) });
  }
  const khuon = ctx.phanLoai.khuon;
  if (khuon === 'D') {
    const m = MOC_NHO_HON_NAM.exec(ban.answer);
    if (m) bao({ ma: 'MOC_NHO_HON_NAM', chiTiet: `"${m[0]}" nhỏ hơn một năm — lượt này chỉ đọc mức năm`, doan: doanQuanh(ban.answer, m.index) });
  }

  // Định lượng, độ chắc, chọn hộ, lộ nguồn — theo câu
  const pt = PHAN_TRAM.exec(ban.answer);
  if (pt) bao({ ma: 'PHAN_TRAM', chiTiet: 'văn nêu phần trăm — lá số không cho con số xác suất', doan: doanQuanh(ban.answer, pt.index) });
  for (const s of cau) {
    const cc = chacChanGia(s);
    if (cc) bao({ ma: 'CHAC_CHAN_GIA', chiTiet: `"${cc[0]}" — lá số chỉ nói xu hướng, không nói chắc điều sẽ xảy ra`, doan: s.slice(0, 60) });
    else if (PHAN_QUYET.test(s)) bao({ ma: 'PHAN_QUYET', chiTiet: 'câu có giọng phán quyết' });
    if (khuon === 'C' || khuon === 'E') {
      const chon =
        CHON_HO.test(s) || CHON_HO_DAU_CAU.test(s) || (khuon === 'E' && !!ctx.phanLoai.haiVe && chonMotVe(s, ctx.phanLoai.haiVe));
      if (chon) bao({ ma: 'CHON_HO', chiTiet: 'văn chọn hộ hoặc khuyên người hỏi nên làm gì — chỉ đọc bối cảnh, người hỏi tự quyết', doan: s.slice(0, 60) });
    }
    const cum = cumTu(s);
    const nguon = RO_RI_RAG.find((c) => cum.has(c) && (HE_PHAI_CO_DAU[c]?.test(s) ?? true));
    if (nguon) bao({ ma: 'LO_NGUON', chiTiet: `văn nhắc nguồn (cụm "${nguon}", viết không dấu)`, doan: s.slice(0, 60) });
    const bc = GIONG_BAO_CAO.find((c) => cum.has(c));
    if (bc) bao({ ma: 'GIONG_BAO_CAO', chiTiet: `văn có giọng báo cáo (cụm "${bc}", viết không dấu)` });
  }
  const m = MA_MAY.exec(ban.answer) ?? (ctx.maNghiemLyHopLe ? MA_NGHIEM_LY_MAY.exec(ban.answer) : null);
  if (m) bao({ ma: 'LO_MA', chiTiet: `văn có mã nội bộ "${m[0]}"`, doan: doanQuanh(ban.answer, m.index) });

  // Hướng và tháng — chỉ khi có kết luận
  if (!ban.outOfScope) {
    if (ctx.nghieng && khuon !== 'G') {
      const ly = soChieu(ban.claims[0]?.direction, ctx.nghieng.huong);
      if (ly) {
        bao({
          ma: 'NGUOC_HUONG',
          chiTiet:
            ly === 'thieu-chieu'
              ? 'claims[0] thiếu "direction"'
              : `claims[0] nói "${ban.claims[0]?.direction}" nhưng hướng đã chốt là "${nhomCuaHuong(ctx.nghieng.huong)}"`,
        });
      }
    }
    if (ctx.huongLuotTruoc && ban.claims[0]?.direction !== ctx.huongLuotTruoc) {
      bao({
        ma: 'NGUOC_HUONG',
        chiTiet: `đang giải thích kết luận lượt trước (chiều "${ctx.huongLuotTruoc}") nhưng claims[0] nói "${ban.claims[0]?.direction ?? 'không có chiều'}" — không đổi kết luận`,
      });
    }
    const ht = ctx.huongThang;
    if (ht?.kieu === 'hai-nua') {
      // Hai nửa khác chiều: claim nói về một nửa (timeRefs đúng một W) phải đúng chiều nửa ấy.
      for (const c of ban.claims) {
        const w = (c.timeRefs ?? []).filter((r) => ht.theoCuaSo.some((x) => x.cuaSo === r));
        if (w.length !== 1) continue;
        const nhom = ht.theoCuaSo.find((x) => x.cuaSo === w[0])!.nhom;
        if (c.direction !== nhom) {
          bao({
            ma: 'NGUOC_HUONG',
            chiTiet: c.direction
              ? `claim về ${w[0]} nói "${c.direction}" nhưng chiều của phần đó là "${nhom}"`
              : `claim về ${w[0]} thiếu "direction"`,
          });
          break;
        }
      }
      // Mỗi nửa phải có ít nhất một claim dẫn căn cứ của nó.
      const thieu = ht.theoCuaSo
        .map((x) => x.cuaSo)
        .filter((w) => {
          const ma = ctx.maTheoCuaSo?.[w] ?? [];
          return ma.length > 0 && !ban.claims.some((c) => c.evidenceIds.some((x) => ma.includes(x)));
        });
      if (thieu.length) {
        bao({
          ma: 'THIEU_THANG',
          chiTiet: `tháng có hai phần khác chiều mà không claim nào dẫn căn cứ của ${thieu
            .map((w) => `${w} (${(ctx.maTheoCuaSo?.[w] ?? []).join(', ')})`)
            .join(', ')}`,
        });
      }
    } else {
      const nh = ctx.maNguyetHan;
      if (ctx.thoiGian.thang && nh?.size && !ban.claims.some((c) => c.evidenceIds.some((x) => nh.has(x)))) {
        bao({ ma: 'THIEU_THANG', chiTiet: `câu hỏi về một tháng mà không claim nào dẫn dữ kiện của tháng (${[...nh].join(', ')})` });
      }
    }
  }
  return { chan: loi, do: [...diemC].map(([ma, dem]) => ({ ma, dem })) };
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
    // Spec 5.1 `chonChip`: chip là câu người dùng HỎI, và chỉ nêu mốc của tập chip.
    if (!/[?？]$/u.test(c)) continue;
    if (mocNgoaiTap(c, ctx.mocHopLeChip)) continue;
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
