/**
 * GUARD — đường Focused (CEL-186 vé B, mục 6).
 *
 * Hàm thuần: nhận bản thô model trả về và ngữ cảnh lượt, trả bản đã lọc cùng lý
 * do của từng câu bị bỏ. Không gọi model. Hai việc cần model (sửa tiếng lóng,
 * thử lại) do `chay.ts` làm rồi gọi lại guard.
 *
 * Câu do mã viết (D, E, F2, N2, N4, nhuận, câu chốt dự phòng) KHÔNG qua guard:
 * nguyên văn đã duyệt, nhưng VẪN đếm vào độ dài (luật 10).
 *
 * Mười ba luật, đánh số theo phương án:
 *   1 tên chỉ trong gói · 2 mặt trước sạch · 3 không phán quyết · 4 không khuyên
 *   5 G không "nghiêng về" · 6 không mốc lạ · 7 tháng đã qua không "sẽ"
 *   8 câu chốt khớp hướng · 9 cân bằng · 10 độ dài · 11 sửa tiếng lóng (chay.ts)
 *   12 câu mở hỏng thì đẩy câu kế lên · 13 chip
 */

import { CUM_AI, RO_RI_RAG } from '../ngon-ngu';
import { doiTenCung, boMarkdown, TIENG_LONG_MOT_CAU } from '../sua-chua';
import { boDau, tenBiaChan } from '../thuc-the';
import type { NghiengVe } from '../nghieng-ve';
import type { MucAnToan } from '../an-toan';
import type { ChuDe } from '../planner';
import { cauChotDuPhong, nhomCuaHuong, soatCauChot, type NhomHuong } from './chot-huong';
import type { DoiTuongCauHoi } from './doi-tuong';
import { nhanDangDoiTuong } from './doi-tuong';
import { laChipNgoaiTam } from './ngoai-tam';
import { laHoiKhiNao, type BoiCanhThoiGian, type PhanLoai } from './phan-loai';
import { khoaTen, tenCungTrongCau, tenNgoaiTap } from './quet-ten';

/* ------------------------------------------------------------------ kiểu */

export type PhiaCau = 'thuan' | 'can' | 'nen';

export interface CauModel {
  noiDung: string;
  maDuKien: string[];
  phia: PhiaCau;
}

/** Bản thô model trả, đã đọc qua `docFocused` */
export interface BanThoFocused {
  cauChot: string;
  chieuCauChot?: NhomHuong;
  cau: CauModel[];
  goiYTiep: string[];
  /** Model khai câu ngoài đời sống cá nhân (prompt mục (b)): một câu chốt, không câu thân */
  ngoaiPhamVi?: boolean;
}

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
  | 'nguoc-phia'
  | 'qua-dai'
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
  nghieng: NghiengVe | null;
  thoiGian: BoiCanhThoiGian;
  /** Khoảng tuổi đại vận có trong gói, `[từ, đến]` */
  tuoiHopLe: [number, number][];
  /** Tiền tố thời gian cho câu chốt dự phòng ("Năm 2027", "Tháng 3 âm") */
  mocChot?: string;
  /** Câu do mã viết đứng đầu lượt (E, N2, N4) — đếm vào độ dài, không kiểm */
  cauMa: string[];
  /** Chip do mã đặt (E, N4). Có thì thay chip model, trừ N4 trộn thêm. */
  chipMa?: string[];
  /** N4: chip "Sang năm <Can Chi>" đứng đầu, trộn chip model phía sau */
  chipCuoiNam?: (goiY: string[]) => string[];
  /** Chip lượt trước — chip lặp lại thì không còn "đi sâu một lớp" */
  chipTruoc: string[];
  /** Câu mã đã là câu chốt (danh tính bạn đời) — bỏ câu chốt model, như E */
  boChotModel?: boolean;
}

export interface CauDaBo {
  noiDung: string;
  lyDo: LyDoBo[];
}

export interface KetQuaKiem {
  /** Câu mở của phần model (rỗng ở E — câu mã đã mở) */
  cauChot: string;
  dungDuPhong: boolean;
  lyDoThayChot?: string;
  cau: (CauModel & { coCanCu: boolean })[];
  bo: CauDaBo[];
  chip: string[];
  /** Có lý do thì `chay.ts` thử lại một lần, rồi 502 */
  thuLai: string | null;
  soAmTiet: number;
  soCau: number;
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
  if (laCauChot && ctx.nghieng && (khuon === 'A' || khuon === 'B' || khuon === 'C')) {
    const tapChot = new Set(
      ctx.nghieng.dauMoc.map((d) => khoaTen(d.ten)).filter((k) => ctx.tapTen.has(k))
    );
    if (tenNgoaiTap(s, tapChot, ctx.phucDucLaSao).length) ly.add('ten-ngoai-goi');
  }

  // 2. Mặt trước sạch
  if (tenCungTrongCau(s, ctx.phucDucLaSao).length) ly.add('ten-cung');
  const cum = cumTu(s);
  if (BO_GIONG_MAY.some((c) => cum.has(c))) ly.add('giong-may');
  if (TIENG_LONG_MOT_CAU.test(s)) ly.add('tieng-long');

  // 3. Phán quyết
  if (PHAN_QUYET.test(s) || PHAN_TRAM.test(s)) ly.add('phan-quyet');

  // 4. Khuyên, chọn hộ
  if (KHUYEN.test(s) || KHUYEN_DAU_CAU.test(s)) ly.add('khuyen');
  if (ctx.phanLoai.haiVe && chonMotVe(s, ctx.phanLoai.haiVe)) ly.add('khuyen');

  // 5. G (hoặc không có hướng engine) thì không được nói "nghiêng về"
  if ((khuon === 'G' || !ctx.nghieng) && NGHIENG_VE.test(s)) ly.add('nghieng-ve');

  // 6. Không mốc lạ
  if (mocLa(s, ctx)) ly.add('moc-la');

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

export const lamSach = (s: string) => doiTenCung(boMarkdown(s.normalize('NFC').trim()));

/** Trần độ dài theo mức (luật 10, quyết định #9). */
function tranDoDai(ctx: NguCanhKiem): { cau: number; amTiet: number; thuLai: number } | null {
  if (ctx.mucAnToan !== 'NORMAL') return null; // SENSITIVE không cắt cứng
  if (ctx.phanLoai.sau) return { cau: 8, amTiet: Infinity, thuLai: Infinity };
  return { cau: 4, amTiet: 120, thuLai: 140 };
}

export function kiemLuot(ban: BanThoFocused, ctx: NguCanhKiem): KetQuaKiem {
  const bo: CauDaBo[] = [];
  const { khuon, loaiSuKien } = ctx.phanLoai;
  /*
   * Ngoài phạm vi loại (b): đúng một câu chốt, không câu thân. Không có căn cứ
   * là ĐÚNG ở đây, nên không thử lại; cũng không ép hướng (câu không nói về
   * phần đời nào). Câu chốt vẫn qua guard từng câu.
   */
  const ngoaiPhamVi = !!ban.ngoaiPhamVi && ban.cau.length === 0 && !!ban.cauChot;
  const coNghieng =
    !ngoaiPhamVi && !!ctx.nghieng && (khuon === 'A' || khuon === 'B' || khuon === 'C' || khuon === 'F1');

  // Câu thân: làm sạch, kiểm, giữ mã F### thật.
  let cau = ban.cau
    .map((c) => {
      const noiDung = lamSach(c.noiDung);
      const ma = c.maDuKien.filter((m) => ctx.maHopLe.has(m));
      return { ...c, noiDung, maDuKien: ma, coCanCu: ma.length > 0 };
    })
    .filter((c) => {
      const ly = kiemMotCau(c.noiDung, ctx);
      if (ly.length) bo.push({ noiDung: c.noiDung, lyDo: ly });
      return ly.length === 0;
    });

  // 8. Câu chốt. E: câu mã đã mở, câu chốt model bỏ (nó dễ chọn hộ một vế).
  let cauChot = khuon === 'E' || ctx.boChotModel ? '' : lamSach(ban.cauChot);
  let dungDuPhong = false;
  let lyDoThayChot: string | undefined;
  const nghiengTrongGoi = ctx.nghieng
    ? { ...ctx.nghieng, dauMoc: ctx.nghieng.dauMoc.filter((d) => ctx.tapTen.has(khoaTen(d.ten))) }
    : null;
  const duPhong = () =>
    nghiengTrongGoi
      ? cauChotDuPhong({ nghieng: nghiengTrongGoi, chuDe: ctx.chuDe, cauHoi: ctx.cauHoi, moc: ctx.mocChot, doiTuong: ctx.doiTuong })
      : '';

  if (cauChot) {
    const ly = kiemMotCau(cauChot, ctx, true);
    if (ly.length) {
      bo.push({ noiDung: cauChot, lyDo: ly });
      lyDoThayChot = ly.join(',');
      cauChot = '';
    } else if (coNghieng && ctx.nghieng) {
      const lech = soatCauChot({ ketLuan: cauChot, chieu: ban.chieuCauChot, huong: ctx.nghieng.huong });
      if (lech) {
        bo.push({ noiDung: cauChot, lyDo: ['nguoc-phia'] });
        lyDoThayChot = lech;
        cauChot = '';
      }
    }
  }

  // 9. Cân bằng / một phía. Chiều do mã (`nhomCuaHuong`), không do model khai.
  if (coNghieng && ctx.nghieng) {
    const nhom = nhomCuaHuong(ctx.nghieng.huong);
    if (nhom === 'ngang') {
      const coThuan = cau.some((c) => c.coCanCu && c.phia === 'thuan');
      const coCan = cau.some((c) => c.coCanCu && c.phia === 'can');
      // Thiếu một phía thì câu chốt dự phòng nêu đủ hai mốc thay cho model.
      if (!(coThuan && coCan) && cauChot) {
        lyDoThayChot = lyDoThayChot ?? 'can-bang-thieu-phia';
        cauChot = '';
      }
    } else {
      const nguoc: PhiaCau = nhom === 'thuan' ? 'can' : 'thuan';
      let daGap = 0;
      cau = cau.filter((c) => {
        if (c.phia !== nguoc) return true;
        daGap += 1;
        if (daGap <= 1) return true;
        bo.push({ noiDung: c.noiDung, lyDo: ['nguoc-phia'] });
        return false;
      });
    }
  }

  // Câu mã đã kết luận (boChotModel) thì không chèn thêm câu chốt dự phòng sau nó.
  if (!cauChot && coNghieng && !ctx.boChotModel) {
    cauChot = duPhong();
    dungDuPhong = !!cauChot;
  }

  // 12. Không có câu chốt hợp lệ (G, F1 không hướng): đẩy câu có căn cứ đầu tiên lên.
  let chotCoCanCu = false;
  if (!cauChot && khuon !== 'E') {
    const i = cau.findIndex((c) => c.coCanCu);
    if (i >= 0) {
      cauChot = cau[i].noiDung;
      chotCoCanCu = true;
      cau = cau.filter((_, j) => j !== i);
    }
  }

  // 10. Độ dài — tính cả câu mã.
  const tran = tranDoDai(ctx);
  const dem = () => {
    const tat = [...ctx.cauMa, cauChot, ...cau.map((c) => c.noiDung)].filter(Boolean);
    return { soCau: tat.length, amTiet: tat.reduce((n, x) => n + soAmTiet(x), 0) };
  };
  if (tran) {
    const catMot = (): boolean => {
      // Bỏ câu không căn cứ trước, rồi câu có căn cứ từ cuối lên; không đụng câu chốt.
      let i = -1;
      for (let j = cau.length - 1; j >= 0; j--) if (!cau[j].coCanCu) { i = j; break; }
      if (i < 0) i = cau.length - 1;
      if (i < 0) return false;
      bo.push({ noiDung: cau[i].noiDung, lyDo: ['qua-dai'] });
      cau = cau.filter((_, j) => j !== i);
      return true;
    };
    while (dem().soCau > tran.cau && catMot());
    while (dem().amTiet > tran.amTiet && dem().soCau > 2 && catMot());
  }

  // 13. Chip
  const chip = chonChip(ban.goiYTiep, ctx);

  const { soCau, amTiet } = dem();
  let thuLai: string | null = null;
  // Mục 9 luật 5: hết câu CÓ CĂN CỨ (không phải hết câu) mới thử lại — câu chốt dự phòng do mã viết không tính.
  if (ngoaiPhamVi && cauChot) thuLai = null;
  else if (!chotCoCanCu && !cau.some((c) => c.coCanCu)) thuLai = 'het-cau';
  else if (tran && amTiet > tran.thuLai) thuLai = 'qua-dai';

  return { cauChot, dungDuPhong, lyDoThayChot, cau, bo, chip, thuLai, soAmTiet: amTiet, soCau };
}

/* ------------------------------------------------------------------ chip */

const chuanChip = (s: string) => boDau(s).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

const CHIP_RA_LENH = /^\s*(?:hãy|nên|đừng|bạn nên|bạn hãy)(?![\p{L}\p{M}])/iu;
/** Hỏi tên / họ của bất kỳ ai — `laChipNgoaiTam` chỉ phủ bạn đời. Lá số không chứa tên ai. */
const CHIP_HOI_TEN = re('tên (?:là )?gì|tên (?:của )?(?:người|anh|chị|cô|cậu|em|vợ|chồng|người yêu|ny)|họ gì|họ (?:của )?(?:người|anh|chị|cô)|vần gì|chữ cái');
/** Chip đủ để dùng khi model trả quá ít — đều là câu engine đọc được (#5). */
const CHIP_DU_PHONG = ['Sang năm thì sao?', 'Tháng này thì sao?', 'Năm nay thì sao?'];

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
    if (CHIP_RA_LENH.test(c)) continue;
    if (laHoiKhiNao(c)) continue; // "Tháng nào…", "Khi nào…" — engine không chọn mốc (#5)
    daCo.add(k);
    ra.push(c);
    if (ra.length === 3) break;
  }
  for (const d of CHIP_DU_PHONG) {
    if (ra.length >= 2) break;
    if (!daCo.has(chuanChip(d))) {
      daCo.add(chuanChip(d));
      ra.push(d);
    }
  }
  return ctx.chipCuoiNam ? ctx.chipCuoiNam(ra) : ra;
}
