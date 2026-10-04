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
import { nhomCuaHuong, soChieu, type HuongThang } from './chot-huong';
import { CHIP_DU_PHONG, type NgonNgu } from './ngon-ngu';
import type { DoiTuongCauHoi } from './doi-tuong';
import { nhanDangDoiTuong } from './doi-tuong';
import type { BanNhap, LoiCung } from './hop-dong';
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

/** Giọng báo cáo — thuộc `LO_MA` (spec 5.1). */
const GIONG_BAO_CAO = [
  'dua tren cac du kien', 'yeu to nay cho thay', 'co the thay rang', 'diem can nhin la', 'tom lai',
  'du kien la so', 'theo la so cua ban', 'ma f',
];

/** Cả tập phán quyết — `CHAC_CHAN_GIA` chỉ chặn tập con, phần còn lại do bộ chấm đo (EVAL). */
export const PHAN_QUYET = re(
  '(?<!(?:không|chưa) )chắc chắn|nhất định|chắc luôn|sẽ không|không bao giờ|trăm phần trăm|không thể nào|sẽ xảy ra|không hợp nhau|không hợp với nhau'
);
/**
 * `CHAC_CHAN_GIA` (delta #3): tập con TỐI THIỂU của `PHAN_QUYET`. "Không / chưa
 * chắc chắn" và "không thể nào biết / nói / đoán / khẳng định" là rào đón.
 */
const CHAC_CHAN_GIA = re(
  '(?<!(?:không|chưa) )chắc chắn|nhất định|trăm phần trăm|sẽ xảy ra|không thể nào(?! (?:biết|nói|đoán|khẳng định))'
);
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

/**
 * Validator cứng (spec 5.1). Thuần, không sửa `ban`. Mỗi mã lỗi báo tối đa một lần.
 * Quét tên trên từng câu của `answer` và trên từng `claims[].claim` (spec 5.2).
 */
export function kiemCung(ban: BanNhap | null, ctx: NguCanhKiem): LoiCung[] {
  if (!ban) return [{ ma: 'SCHEMA', chiTiet: 'bản trả về không phải một object JSON đúng schema' }];
  const loi: LoiCung[] = [];
  const co = new Set<LoiCung['ma']>();
  const bao = (l: LoiCung) => {
    if (co.has(l.ma)) return;
    co.add(l.ma);
    loi.push(l);
  };
  const cau = tachCau(ban.answer);

  // SCHEMA
  if (!ban.answer) bao({ ma: 'SCHEMA', chiTiet: 'thiếu "answer" hoặc "answer" rỗng' });
  if (ban.outOfScope && (ban.claims.length || cau.length > 1)) {
    bao({ ma: 'SCHEMA', chiTiet: '"outOfScope" thì "answer" đúng MỘT câu và "claims" rỗng' });
  }

  // Căn cứ
  const hopLe = (m: string) => ctx.maHopLe.has(m) || ctx.maNguonHopLe.has(m);
  const sai = [...new Set(ban.claims.flatMap((c) => c.evidenceIds.filter((m) => !hopLe(m))))];
  if (sai.length) bao({ ma: 'MA_KHONG_HOP_LE', chiTiet: `mã ${sai.join(', ')} không có trong DỮ KIỆN hay NGUỒN THAM CHIẾU` });
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
    const cc = CHAC_CHAN_GIA.exec(s);
    if (cc) bao({ ma: 'CHAC_CHAN_GIA', chiTiet: `"${cc[0]}" — lá số chỉ nói xu hướng, không nói chắc điều sẽ xảy ra`, doan: s.slice(0, 60) });
    if (khuon === 'C' || khuon === 'E') {
      const chon =
        CHON_HO.test(s) || CHON_HO_DAU_CAU.test(s) || (khuon === 'E' && !!ctx.phanLoai.haiVe && chonMotVe(s, ctx.phanLoai.haiVe));
      if (chon) bao({ ma: 'CHON_HO', chiTiet: 'văn chọn hộ hoặc khuyên người hỏi nên làm gì — chỉ đọc bối cảnh, người hỏi tự quyết', doan: s.slice(0, 60) });
    }
    const cum = cumTu(s);
    const nguon = RO_RI_RAG.find((c) => cum.has(c));
    if (nguon) bao({ ma: 'LO_NGUON', chiTiet: `văn nhắc nguồn (cụm "${nguon}", viết không dấu)`, doan: s.slice(0, 60) });
    const bc = GIONG_BAO_CAO.find((c) => cum.has(c));
    if (bc) bao({ ma: 'LO_MA', chiTiet: `văn có giọng báo cáo (cụm "${bc}", viết không dấu) — nói thẳng bằng lời thường` });
  }
  const m = MA_MAY.exec(ban.answer);
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
