/**
 * Validator + cắt tất định cho lượt QUICK — CEL-186a. Hàm thuần, không gọi model.
 *
 * Chạy sau `locYHong`, trước `dungVan` (doc 16.5). Mọi luật ở đây BỎ CÂU, không
 * viết lại câu: viết lại là gọi model lần nữa, và lần gọi ấy không qua validator.
 *
 * Bất biến I6: bài QUICK ra tới người dùng luôn có đúng MỘT câu chốt. Luật nào
 * bắt trúng câu chốt thì câu dự phòng của `chot-huong.ts` vào thay — không bao
 * giờ bỏ trống. Câu tính cách (`tomTat`, ý) trượt thì BỎ, không thay bằng câu
 * chung chung.
 *
 * Danh sách cụm mới để riêng ở đây, KHÔNG thêm vào `ngon-ngu.ts`: đổi bộ soát
 * bên đó là tăng `PHIEN_BAN_NGON_NGU` và xả toàn bộ đệm.
 */

import type { TinNhan } from '@/lib/ai/prompt';
import type { GoiBangChung, TraLoiCoCauTruc, YChinh } from './bang-chung';
import { doAnToan, type MucAnToan } from './an-toan';
import { cauChotDuPhong, laCauChieuXau, soatCauChot, type NhomHuong } from './chot-huong';
import { coChuDeNang, type DoSauTraLoi } from './hop-dong-tra-loi';
import { laCauNoiTiep } from './tiep-noi';
import { CAU_PHAN_QUYET, CAU_RA_LENH, CUM_TIENG_LONG_CAM } from './chuan-ngon-ngu';
import { BAC_CHAC_CHAN, mucNguYCuaCum } from './hinh-dang-tra-loi';
import { laChipNgoaiTam } from './ngoai-tam';
import { CUM_AI, RO_RI_RAG } from './ngon-ngu';
import type { HuongNghieng } from './nghieng-ve';
import type { ChuDe, YDinh } from './planner';
import { boMarkdown, demTenSao, doiTenCung, TIENG_LONG_MOT_CAU } from './sua-chua';
import { boDau, nhanDangThucThe } from './thuc-the';

/* ------------------------------------------------------------ đo lường */

/** Mục tiêu 40–110 âm tiết, trần mềm 150, không tính chip (brief §16). */
export const AM_TIET_MUC_TIEU = { duoi: 40, tren: 110 } as const;
export const TRAN_AM_TIET = 150;

export function demAmTiet(van: string): number {
  return van.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

/** Tách câu theo dấu kết câu; giữ dấu. */
export function tachCau(doan: string): string[] {
  return doan
    .split(/(?<=[.!?…])\s+/u)
    .map((c) => c.trim())
    .filter(Boolean);
}

const tuBoDau = (s: string) => ` ${boDau(s).replace(/[^a-z0-9%]+/g, ' ').trim()} `;
const coCumKhongDau = (s: string, ds: readonly string[]) => {
  const t = tuBoDau(s);
  return ds.some((c) => t.includes(` ${c} `));
};
const tu = (mau: string) => new RegExp(`(?<![\\p{L}\\p{M}])(?:${mau})(?![\\p{L}\\p{M}])`, 'iu');

/* --------------------------------------------------------------- luật */

/** Self-help không ai hỏi: "trong tuần tới", "hãy ghi lại", "bạn nên quan sát". */
const TU_GIUP = tu('trong tuần tới|tuần tới|hãy ghi lại|ghi lại|bạn nên quan sát|hãy quan sát|hãy thử|bạn nên|hãy dành|nhớ rằng|hãy nhớ');

/** Vượt độ chắc, bất kể hướng. */
const QUA_CHAC = tu('chắc chắn|nhất định|chắc luôn|100%|trăm phần trăm|hẳn là|rõ ràng là|sẽ có người|sẽ gặp được');

/** Giọng report (doc mục 6, khoản 3). So không dấu, theo từ. */
const GIONG_REPORT = [
  'dua tren cac du kien',
  'dua tren du kien',
  'yeu to nay cho thay',
  'co the thay rang',
  'diem can nhin la',
  'du kien cho thay',
  'cac du kien cho thay',
  'tom lai',
  'tong ket lai',
  'xet ve',
  've mat',
];

/** Tiếng lóng nội bộ (§22) — có dấu. */
const TIENG_LONG = tu(
  [...CUM_TIENG_LONG_CAM, 'tương quan', 'yếu tố đỡ', 'yếu tố cản', 'nghiêng về phía cản']
    .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
);

/**
 * Khẳng định đời thật không căn cứ: "bạn đang…", "bạn đã…", "bạn sẽ…", "bạn vẫn…".
 * Chỉ khi "bạn" là CHỦ NGỮ: loại "của bạn", loại khi có "nếu/khi/lỡ" đứng trước,
 * loại "bạn sẽ thấy", loại câu hỏi (doc 16.3, S-b).
 */
export function laKhangDinhDoiThat(cau: string): boolean {
  if (cau.trim().endsWith('?')) return false;
  const s = cau.normalize('NFC');
  const re = /(?<![\p{L}\p{M}])bạn (?:đang|đã|sẽ|vẫn)(?![\p{L}\p{M}])/giu;
  for (const m of s.matchAll(re)) {
    const truoc = s.slice(0, m.index).trimEnd();
    const sau = s.slice(m.index! + m[0].length).trimStart();
    if (/(?:^|\s)của$/iu.test(truoc)) continue;
    if (/(?<![\p{L}\p{M}])(?:nếu|khi|lỡ|giả sử)(?![\p{L}\p{M}])[^,.;]*$/iu.test(truoc)) continue;
    if (/^thấy(?![\p{L}\p{M}])/iu.test(sau)) continue;
    return true;
  }
  return false;
}

/** Cụm dịch thuật ngữ ra đời thường (doc 16.4). Có dấu, theo từ. */
const CUM_DICH = tu('nghĩa là|tức là|kiểu như|kiểu người|khiến bạn|làm bạn|nên bạn|bạn hay|bạn dễ');

const EMOJI = /\p{Extended_Pictographic}️?/gu;

function demEmoji(s: string): number {
  return (s.match(EMOJI) ?? []).length;
}

/** Gỡ emoji: hết khi không được trêu, giữ cái đầu khi được trêu. */
function locEmoji(s: string, choGiu: number): { s: string; con: number } {
  let con = choGiu;
  const ra = s
    .replace(EMOJI, (e) => (con-- > 0 ? e : ''))
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { s: ra, con: Math.max(con, 0) };
}

/* ---------------------------------------------------- tên bịa (S-e) */

/** Tên sao / cách cục được phép: chỉ những gì có trong gói dữ kiện + nguồn. */
function thucTheChoPhep(goi: GoiBangChung): { id: Set<string>; tenCachCuc: string[] } {
  const tenCachCuc = goi.duKien.map((f) => f.tenCachCuc).filter((x): x is string => !!x);
  const chuoi = [...goi.duKien.map((f) => f.noiDung), ...goi.bangChung.map((e) => e.noiDung), ...tenCachCuc].join(' ');
  return { id: new Set(nhanDangThucThe(chuoi).map((t) => t.id)), tenCachCuc };
}

function coTenBia(cau: string, cp: { id: Set<string>; tenCachCuc: string[] }): boolean {
  let s = cau;
  for (const ten of cp.tenCachCuc) s = s.split(ten).join(' ');
  return nhanDangThucThe(s).some(
    (t) => (t.loai === 'STAR' || t.loai === 'TRANSFORMATION' || t.loai === 'FORMATION') && !cp.id.has(t.id)
  );
}

/* --------------------------------------------------------- lặp motif */

function baGram(s: string): Set<string> {
  const t = tuBoDau(s).trim().split(' ').filter(Boolean);
  const ra = new Set<string>();
  for (let i = 0; i + 3 <= t.length; i++) ra.add(t.slice(i, i + 3).join(' '));
  return ra;
}

/** Câu lặp lại motif của 5 tin trợ lý trước: trùng ≥ 4 cụm VÀ ≥ 50% (doc 16.6). */
function lapMotif(cau: string, truoc: Set<string>): boolean {
  const g = baGram(cau);
  if (g.size === 0) return false;
  let trung = 0;
  for (const x of g) if (truoc.has(x)) trung++;
  return trung >= 4 && trung / g.size >= 0.5;
}

/* ------------------------------------------------------------- chip */

const CHIP_DU_PHONG: Partial<Record<ChuDe, string[]>> = {
  'tinh-cam': ['Tôi hợp mẫu người thế nào?', 'Năm nay tình cảm ra sao?'],
  'su-nghiep': ['Tôi hợp với kiểu việc gì?', 'Năm nay công việc ra sao?'],
  'tai-chinh': ['Tôi giữ tiền có tốt không?', 'Năm nay tiền bạc ra sao?'],
};

/**
 * Chip QUICK: 2–3 chip, mỗi chip ≤ 40 ký tự, KHÔNG cắt chip (cắt là ra mẩu câu
 * cụt). Bỏ chip hỏi điều ngoài tầm lá số, chip trùng câu hỏi, chip dính tiếng lóng.
 * Thiếu thì bù bằng chip cố định theo chủ đề.
 */
export function locChipQuick(chip: readonly string[] | undefined, cauHoi: string, chuDe: ChuDe): string[] {
  const hoi = tuBoDau(cauHoi);
  const ra: string[] = [];
  const them = (c: string) => {
    const x = c.trim();
    if (!x || x.length > 40 || ra.length >= 3) return;
    if (laChipNgoaiTam(x) || TIENG_LONG.test(x)) return;
    const k = tuBoDau(x);
    if (k === hoi || ra.some((r) => tuBoDau(r) === k)) return;
    ra.push(x);
  };
  (chip ?? []).forEach(them);
  if (ra.length < 2) (CHIP_DU_PHONG[chuDe] ?? CHIP_DU_PHONG['tinh-cam']!).forEach((c) => ra.length < 2 && them(c));
  return ra;
}

/* ------------------------------------------------------- tinh nghịch */

/** Từ nghiêm — có mặt là không trêu, dù hướng thuận (16.6). */
const TU_NGHIEM = tu('ly hôn|ly dị|chia tay|ngoại tình|nợ|kiện|thất nghiệp|đuổi việc|phản bội|bị lừa|cắm sừng|vỡ nợ|phá sản');

/**
 * Lượt này có được một nhịp tinh nghịch không — danh sách CHO PHÉP, thiếu một
 * điều kiện là đóng. Do mã tính, model chỉ nhận kết quả.
 */
export function choPhepTinhNghich(v: {
  doSau: DoSauTraLoi;
  mucAnToan: MucAnToan;
  chuDe: ChuDe;
  cauHoi: string;
  huong: HuongNghieng | null;
  ngoaiTam: boolean;
  lichSu?: readonly TinNhan[];
  /** `tinhNghichBat()` — cờ môi trường */
  coBat: boolean;
}): boolean {
  if (!v.coBat || v.doSau !== 'QUICK' || v.mucAnToan !== 'NORMAL') return false;
  if (v.chuDe === 'suc-khoe') return false;
  if (coChuDeNang(v.cauHoi) || laCauChieuXau(v.cauHoi) || TU_NGHIEM.test(v.cauHoi)) return false;
  if (laCauNoiTiep(v.cauHoi, [...(v.lichSu ?? [])])) return false;
  if (!v.ngoaiTam && !(v.huong === 'thuan-ro' || v.huong === 'thuan-nhe' || v.huong === 'can-bang')) return false;
  const gan = (v.lichSu ?? []).filter((t) => t.vaiTro === 'nguoi-dung').slice(-3);
  return gan.every((t) => doAnToan(t.noiDung).muc === 'NORMAL' && !coChuDeNang(t.noiDung));
}

/* ------------------------------------------------------------ chính */

export type LyDoDuPhong =
  | 'rong'
  | 'nguoc-huong'
  | 'qua-chac'
  | 'phan-quyet'
  | 'giong-report'
  | 'ten-sao'
  | 'ten-bia'
  | 'khang-dinh-doi-that'
  | 'tieng-long'
  | 'tu-giup';

export interface VaoKiemQuick {
  yDinh: YDinh;
  chuDe: ChuDe;
  cauHoi: string;
  namXem: number;
  goi: GoiBangChung;
  /** `null` khi ngoaiTam — lúc đó `ketLuanCoDinh` phải có. */
  huong: HuongNghieng | null;
  /** Kết luận do MÃ đặt (ngoaiTam). Có thì không soát, không thay. */
  ketLuanCoDinh?: string;
  /** Model tự khai câu chốt nói phần đời thuận / ngang / vướng (P3). */
  chieu?: NhomHuong;
  tinhNghich: boolean;
  lichSu?: TinNhan[];
}

export interface VetKiemQuick {
  duPhong: LyDoDuPhong | null;
  thieuChieu: boolean;
  soCauBo: number;
  soYBo: number;
  amTiet: number;
}

/** Ráp văn QUICK để đo — cùng thứ tự với khuôn QUICK của `dungVan`. */
export function vanQuickDeDo(t: Pick<TraLoiCoCauTruc, 'ketLuan' | 'tomTat' | 'yChinh'>): string {
  const phan = [t.ketLuan ?? '', t.tomTat, ...t.yChinh.flatMap((y) => [y.noiDung, y.luongNguoc ?? ''])];
  return doiTenCung(phan.map((x) => x.trim()).filter(Boolean).join('\n\n'));
}

export function kiemQuick(t: TraLoiCoCauTruc, v: VaoKiemQuick): { traLoi: TraLoiCoCauTruc; vet: VetKiemQuick } {
  const cp = thucTheChoPhep(v.goi);
  const motifTruoc = new Set<string>();
  for (const tn of (v.lichSu ?? []).filter((x) => x.vaiTro === 'tro-ly').slice(-5)) {
    // Chỉ câu mở + đoạn kế (16.6): phần căn cứ phía dưới lặp tên dữ kiện là chuyện bình thường.
    for (const g of baGram(tn.noiDung.split(/\n\s*\n/).slice(0, 2).join(' '))) motifTruoc.add(g);
  }
  let emojiCon = v.tinhNghich ? 1 : 0;
  let soCauBo = 0;

  /** Luật chung cho mọi câu ngoài câu chốt. Trả lý do bỏ, hoặc null. */
  const loiCau = (cau: string, ke?: string): boolean => {
    if (!cau) return true;
    if (CAU_RA_LENH.test(cau) || TU_GIUP.test(cau)) return true;
    if (CAU_PHAN_QUYET.test(cau) || QUA_CHAC.test(cau)) return true;
    if (coCumKhongDau(cau, [...CUM_AI, ...RO_RI_RAG, ...GIONG_REPORT])) return true;
    if (TIENG_LONG.test(cau) || TIENG_LONG_MOT_CAU.test(cau)) return true;
    if (laKhangDinhDoiThat(cau)) return true;
    if (coTenBia(cau, cp)) return true;
    // Thuật ngữ không dịch: câu có tên sao phải có cụm dịch, xét cùng câu kế (16.4).
    if (demTenSao(cau, cp.tenCachCuc) > 0 && !CUM_DICH.test(cau) && !(ke && CUM_DICH.test(ke))) return true;
    if (lapMotif(cau, motifTruoc)) return true;
    return false;
  };

  /** Lọc một đoạn theo câu; trả đoạn đã lọc. */
  const locDoan = (doan: string | undefined, tranCau: number): string => {
    if (!doan) return '';
    const cau = tachCau(boMarkdown(doan));
    const giu: string[] = [];
    cau.forEach((c, i) => {
      if (giu.length >= tranCau) {
        soCauBo++;
        return;
      }
      const e = locEmoji(c, emojiCon);
      emojiCon = e.con;
      if (loiCau(e.s, cau[i + 1])) soCauBo++;
      else giu.push(e.s);
    });
    return giu.join(' ');
  };

  /* ---- 1. Câu chốt ---- */
  let duPhong: LyDoDuPhong | null = null;
  let thieuChieu = false;
  let ketLuan: string;

  if (v.ketLuanCoDinh) {
    ketLuan = v.ketLuanCoDinh;
  } else {
    const tho = locEmoji(boMarkdown(t.ketLuan ?? '').replace(/\s+/g, ' ').trim(), emojiCon);
    emojiCon = tho.con;
    // Câu chốt là MỘT câu: model viết hai thì lấy câu đầu.
    const chot = tachCau(tho.s)[0] ?? '';
    if (v.huong) {
      const s = soatCauChot({ ketLuan: chot, chieu: v.chieu, huong: v.huong });
      thieuChieu = s.thieuChieu;
      if (!chot) duPhong = 'rong';
      else if (s.thay) duPhong = s.thay;
    } else if (!chot) duPhong = 'rong';
    if (!duPhong) {
      if (CAU_PHAN_QUYET.test(chot)) duPhong = 'phan-quyet';
      else if (coCumKhongDau(chot, [...CUM_AI, ...RO_RI_RAG, ...GIONG_REPORT])) duPhong = 'giong-report';
      else if (TIENG_LONG.test(chot) || TIENG_LONG_MOT_CAU.test(chot)) duPhong = 'tieng-long';
      else if (coTenBia(chot, cp)) duPhong = 'ten-bia';
      else if (demTenSao(chot, cp.tenCachCuc) > 0) duPhong = 'ten-sao';
      else if (laKhangDinhDoiThat(chot)) duPhong = 'khang-dinh-doi-that';
      else if (CAU_RA_LENH.test(chot) || TU_GIUP.test(chot)) duPhong = 'tu-giup';
    }
    const cauDuPhong = v.huong
      ? cauChotDuPhong({ yDinh: v.yDinh, huong: v.huong, chuDe: v.chuDe, cauHoi: v.cauHoi, namXem: v.namXem })
      : null;
    // Không có câu dự phòng (không lẽ xảy ra: tinhDoSau chỉ QUICK cho co-khong /
    // quyet-dinh có hướng) thì giữ câu model — vẫn hơn để trống câu chốt.
    ketLuan = duPhong && cauDuPhong ? cauDuPhong : chot;
    if (duPhong && !cauDuPhong) duPhong = null;
  }

  /* ---- 2. tomTat + ý ---- */
  const lechHuong = duPhong === 'nguoc-huong';
  let tomTat = '';
  const yChinh: YChinh[] = [];
  let soYBo = 0;

  if (!lechHuong) {
    tomTat = locDoan(t.tomTat, 2);
    // Dự phòng vì lối viết: câu tomTat đầu trỏ ngược về câu chốt cũ thì gãy mạch.
    if (duPhong && /^(?:vậy|nghe|nhưng|thế|vì thế|do đó)(?![\p{L}\p{M}])/iu.test(tomTat)) {
      const [, ...con] = tachCau(tomTat);
      tomTat = con.join(' ');
      soCauBo++;
    }
    for (const y of t.yChinh.slice(0, 2)) {
      const nguY = mucNguYCuaCum(y.noiDung);
      if (nguY && y.mucChacChan && BAC_CHAC_CHAN[nguY] > BAC_CHAC_CHAN[y.mucChacChan]) {
        soYBo++;
        continue;
      }
      const noiDung = locDoan(y.noiDung, 2);
      if (!noiDung) {
        soYBo++;
        continue;
      }
      // Lực ngược tối đa một mệnh đề — một câu.
      const luongNguoc = locDoan(y.luongNguoc, 1) || undefined;
      yChinh.push({ ...y, tieuDe: '', noiDung, luongNguoc, neuThi: undefined });
    }
    soYBo += Math.max(0, t.yChinh.length - 2);
  } else {
    soYBo = t.yChinh.length;
  }

  /* ---- 3. Cắt độ dài: bỏ ý thứ hai, rồi câu tomTat từ cuối, rồi lực ngược, rồi câu ý ---- */
  let ban: TraLoiCoCauTruc = {
    ketLuan,
    tomTat,
    yChinh,
    goiYTiep: locChipQuick(t.goiYTiep, v.cauHoi, v.chuDe),
    canNhac: [],
    buocTiepTheo: [],
    chieuCauChot: v.chieu,
  };
  const dai = () => demAmTiet(vanQuickDeDo(ban));
  if (dai() > TRAN_AM_TIET && ban.yChinh.length > 1) {
    ban = { ...ban, yChinh: ban.yChinh.slice(0, 1) };
    soYBo++;
  }
  while (dai() > TRAN_AM_TIET && ban.tomTat) {
    ban = { ...ban, tomTat: tachCau(ban.tomTat).slice(0, -1).join(' ') };
    soCauBo++;
  }
  if (dai() > TRAN_AM_TIET && ban.yChinh[0]?.luongNguoc) {
    ban = { ...ban, yChinh: [{ ...ban.yChinh[0], luongNguoc: undefined }] };
    soCauBo++;
  }
  while (dai() > TRAN_AM_TIET && ban.yChinh.length) {
    const cau = tachCau(ban.yChinh[0].noiDung);
    ban = { ...ban, yChinh: cau.length > 1 ? [{ ...ban.yChinh[0], noiDung: cau.slice(0, -1).join(' ') }] : [] };
    if (cau.length <= 1) soYBo++;
    else soCauBo++;
  }

  return { traLoi: ban, vet: { duPhong, thieuChieu, soCauBo, soYBo, amTiet: dai() } };
}
