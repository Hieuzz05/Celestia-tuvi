/**
 * BEHAVIOR CONTRACT đường Focused — CEL-186 Answer Contract v2, spec mục 7.1 (commit C).
 *
 * Dữ liệu 30 flow + bộ chạy chung. KHÔNG có câu trả lời mẫu: mỗi flow chỉ nói người / ý / thời
 * gian phải ra sao (tầng offline, `test-hop-dong-focused.ts`, CI) và văn phải / không được gì
 * (tầng model thật, `eval-hop-dong-focused.ts`, chạy tay). Phần nghĩa của văn ("nhận hoàn cảnh",
 * "gọi bé/con bạn", "giọng chậm ấm") là cột T — người chấm, không có ở đây dưới dạng regex.
 *
 * Lá số: "chinh" = `lon-nam` của `eval-cau-doi-thuong.ts`, "be" = 22/5/2026 16h nữ, "nu" = `lon-nu`.
 * Hôm nay cố định 04/10/2026 (dương) = 24/8/2026 âm.
 *
 * Không `lib/` nào được import tệp này (như bộ mù, các câu ở đây không được thành khuôn prompt).
 */
import { lapLaSo, type LaSo } from '../lib/tuvi/ansao';
import { bayGioAm, type ThoiDiemAm } from '../lib/tuvi/bay-gio';
import type { TinNhan } from '../lib/ai/prompt';
import type { DauVaoTraLoi } from '../lib/rag/tra-loi';
import type { KetQuaFocused } from '../lib/rag/focused/tra-loi-focused';
import type { NgonNgu } from '../lib/rag/focused/ngon-ngu';

export type TenLa = 'chinh' | 'be' | 'nu';

export const LA_SO: Record<TenLa, () => LaSo> = {
  chinh: () => lapLaSo({ ngay: 14, thang: 3, nam: 1992, gio: 8, gioiTinh: 'nam' }),
  be: () => lapLaSo({ ngay: 22, thang: 5, nam: 2026, gio: 16, gioiTinh: 'nu' }),
  nu: () => lapLaSo({ ngay: 2, thang: 9, nam: 1995, gio: 20, gioiTinh: 'nu' }),
};

/** 04/10/2026 dương. */
export const HOM_NAY_DUONG = new Date(2026, 9, 4);
export const HOM_NAY: ThoiDiemAm = bayGioAm(HOM_NAY_DUONG);
export const NAM_XEM = 2026;

/** Thời gian mục tiêu — cùng dạng `ThoiGianVet` của vết Preview. */
export type ThoiGianKyVong =
  | { loai: 'khong' }
  | { loai: 'nam'; nam: number }
  | { loai: 'thang-duong'; nam: number; thang: number }
  | { loai: 'thang-am'; namAm: number; thangAm: number; nhuan: boolean };

/** Tầng offline — chấm trên tín hiệu có cấu trúc, không đọc văn. */
export interface KyVongHieu {
  /** 'model' = lượt đi tới model; còn lại là tên lối dừng bằng mã (`KetQuaTraLoi.model`) */
  duong?: 'model' | `focused-${string}`;
  khongTinhLuot?: boolean;
  khuon?: string;
  /** Khuôn KHÔNG được ra */
  khuonKhong?: string[];
  chuDe?: string;
  coDoiTuong?: boolean;
  thoiGian?: ThoiGianKyVong;
  /** Cửa sổ âm lịch theo thứ tự (spec 3.2) */
  cuaSo?: { thangAm: number; nhuan: boolean }[];
  giaiThichLuotTruoc?: boolean;
  coChoHoiLai?: boolean;
  /** Kết quả mang `meta.choHoiLai` (spec 2.3) */
  metaChoHoiLai?: boolean;
}

/** Tầng model thật — mỗi khoá là một kiểm cấu trúc trong `eval-hop-dong-focused.ts`. */
export type KiemModel =
  | 'chieu-khop-engine' // claims[0].direction khớp nghiêng về engine
  | 'khong-moc-nho-hon-nam' // không LoiCung MOC_NHO_HON_NAM trong văn cuối
  | 'claim-dan-ma-nguyet' // có claim dẫn mã nguyệt hạn của cửa sổ
  | 'chieu-nhu-luot-truoc' // claims[0].direction = hướng lượt trước
  | 'dung-lai-ma-luot-truoc' // ≥ 1 mã của lượt trước
  | 'khong-chon-ho' // không LoiCung CHON_HO trong văn cuối
  | 'khong-cau-hai-ve' // không còn câu mã CAU_HAI_VE
  | 'mien-tru-tam-ly' // văn cuối đã mang miễn trừ tâm lý
  | 'tieng-anh' // answer + chip không có dấu tiếng Việt ngoài tên riêng của gói
  | 'chip-la-cau-hoi' // mọi chip kết bằng "?" và ≤ 40 ký tự
  | 'ngoai-pham-vi' // outOfScope
  | 'khong-moc-2027-trong-van' // answer không nhắc 2027
  | 'chip-sang-nam'; // có chip "Sang năm…" (2027)

export interface LuotHopDong {
  /** Câu gõ. Thiếu thì `chip` phải có. */
  cauHoi?: string;
  /** Bấm chip thứ mấy (0 = chip 1) của lượt NGAY TRƯỚC */
  chip?: number;
  /** Tải lại trang trước lượt này: metadata lượt trước đi qua JSON (sessionStorage) */
  taiLai?: boolean;
  hieu?: KyVongHieu;
  model?: KiemModel[];
}

export interface FlowHopDong {
  so: number;
  ten: string;
  la: TenLa;
  luot: LuotHopDong[];
  /** Flow trọng yếu: cột M phải 5/5 ở tầng model */
  trongYeu: boolean;
  /** Ghi chú cột T (người chấm) */
  T?: string;
  /** Chỉ chấm tay trên Preview (web) */
  chiTay?: boolean;
  /** Ngôn ngữ giao diện người dùng (trang gửi lên) — Focused KHÔNG đoán từ chữ câu hỏi */
  nn?: NgonNgu;
}

const CAU_1 = 'Hiện tại tôi đang thất nghiệp, khi nào thì tìm được việc mới?';
const CAU_CON = 'Con tôi năm nay học hành thế nào?';
const NAM_2026: ThoiGianKyVong = { loai: 'nam', nam: 2026 };
const THANG_10_DUONG = { thoiGian: { loai: 'thang-duong', nam: 2026, thang: 10 } as ThoiGianKyVong, cuaSo: [{ thangAm: 8, nhuan: false }, { thangAm: 9, nhuan: false }] };
const LUOT_1: LuotHopDong = { cauHoi: CAU_1, hieu: { duong: 'model', khuon: 'D', chuDe: 'su-nghiep', thoiGian: NAM_2026, giaiThichLuotTruoc: false } };
const F2_CON: LuotHopDong = { cauHoi: CAU_CON, hieu: { duong: 'focused-f2', khongTinhLuot: true, coChoHoiLai: true, metaChoHoiLai: true } };

export const HOP_DONG: FlowHopDong[] = [
  { so: 1, ten: 'thất nghiệp + khi nào', la: 'chinh', trongYeu: true, T: 'đúng cảnh thất nghiệp', luot: [{ ...LUOT_1, model: ['chieu-khop-engine', 'khong-moc-nho-hon-nam'] }] },
  {
    so: 2, ten: 'tháng 10 tìm việc', la: 'chinh', trongYeu: true, T: 'cùng chiều nói gộp; khác chiều tả hai nửa; không mở bằng giải thích lịch',
    luot: [{ cauHoi: 'Tháng 10 tôi tìm việc được không?', hieu: { duong: 'model', khuon: 'A', chuDe: 'su-nghiep', ...THANG_10_DUONG }, model: ['claim-dan-ma-nguyet'] }],
  },
  {
    so: 3, ten: 'giải thích vì sao lại vậy', la: 'chinh', trongYeu: true,
    luot: [LUOT_1, { cauHoi: 'giải thích vì sao lại vậy', hieu: { duong: 'model', khuon: 'D', chuDe: 'su-nghiep', thoiGian: NAM_2026, giaiThichLuotTruoc: true }, model: ['chieu-nhu-luot-truoc', 'dung-lai-ma-luot-truoc'] }],
  },
  {
    so: 4, ten: 'F2 → gõ "lá số của con tôi"', la: 'be', trongYeu: true, T: 'gọi bé / con bạn',
    luot: [F2_CON, { cauHoi: 'lá số của con tôi', hieu: { duong: 'model', chuDe: 'su-nghiep', coDoiTuong: false, khuonKhong: ['F1', 'F2'], thoiGian: NAM_2026, coChoHoiLai: false } }],
  },
  {
    so: 5, ten: 'F2 → bấm chip 1', la: 'be', trongYeu: true,
    luot: [F2_CON, { chip: 0, hieu: { duong: 'model', chuDe: 'su-nghiep', coDoiTuong: false, khuonKhong: ['F1', 'F2'], thoiGian: NAM_2026, coChoHoiLai: false } }],
  },
  {
    so: 6, ten: 'F2 → gõ "lá số này của tôi"', la: 'be', trongYeu: true, T: 'nói rõ đọc từ lá số người hỏi',
    luot: [F2_CON, { cauHoi: 'lá số này của tôi', hieu: { duong: 'model', khuon: 'F1', coDoiTuong: true, thoiGian: NAM_2026, coChoHoiLai: false } }],
  },
  {
    so: 7, ten: 'F2 đang chờ + câu tiền bạc mới', la: 'be', trongYeu: true,
    luot: [F2_CON, { cauHoi: 'Năm nay tiền bạc tôi thế nào?', hieu: { duong: 'model', chuDe: 'tai-chinh', thoiGian: NAM_2026, coChoHoiLai: false } }],
  },
  { so: 8, ten: 'chưa bao giờ có người yêu', la: 'chinh', trongYeu: false, T: 'nhận hoàn cảnh', luot: [{ cauHoi: 'Tôi chưa bao giờ có người yêu, năm nay có không?', hieu: { duong: 'model', khuon: 'A', chuDe: 'tinh-cam', thoiGian: NAM_2026 } }] },
  { so: 9, ten: 'lúc nào cũng mệt', la: 'chinh', trongYeu: false, T: 'không phán bệnh', luot: [{ cauHoi: 'Lúc nào cũng mệt, năm nay sức khỏe tôi thế nào?', hieu: { duong: 'model', khuon: 'B', chuDe: 'suc-khoe', thoiGian: NAM_2026 } }] },
  { so: 10, ten: 'năm nào cũng vất vả', la: 'chinh', trongYeu: false, luot: [{ cauHoi: 'Năm nào cũng vất vả, năm nay tiền bạc ra sao?', hieu: { duong: 'model', khuon: 'B', chuDe: 'tai-chinh', thoiGian: NAM_2026 } }] },
  { so: 11, ten: 'lá nam hỏi chồng', la: 'chinh', trongYeu: false, luot: [{ cauHoi: 'Chồng tôi năm nay thế nào?', hieu: { duong: 'model', khuon: 'F1', chuDe: 'tinh-cam', coDoiTuong: true, thoiGian: NAM_2026 } }] },
  {
    so: 12, ten: 'tháng 10 âm', la: 'chinh', trongYeu: false,
    luot: [{ cauHoi: 'Tháng 10 âm năm nay công việc thế nào?', hieu: { duong: 'model', khuon: 'B', chuDe: 'su-nghiep', thoiGian: { loai: 'thang-am', namAm: 2026, thangAm: 10, nhuan: false }, cuaSo: [{ thangAm: 10, nhuan: false }] } }],
  },
  { so: 13, ten: 'tháng 6 nhuận 2025', la: 'chinh', trongYeu: true, luot: [{ cauHoi: 'Tháng 6 nhuận năm 2025 tình cảm tôi ra sao?', hieu: { duong: 'focused-nhuan-chua-tach', khongTinhLuot: true } }] },
  { so: 14, ten: 'tháng 7/2025 phủ tháng nhuận', la: 'chinh', trongYeu: true, luot: [{ cauHoi: 'Tháng 7/2025 công việc thế nào?', hieu: { duong: 'focused-nhuan-chua-tach', khongTinhLuot: true } }] },
  { so: 15, ten: 'bé hỏi năm trước khi sinh', la: 'be', trongYeu: true, luot: [{ cauHoi: 'Năm 2025 sức khỏe của tôi thế nào?', hieu: { duong: 'focused-truoc-sinh', khongTinhLuot: true } }] },
  { so: 16, ten: 'công ty A hay B', la: 'chinh', trongYeu: true, T: 'tả bối cảnh hai lựa chọn, nói lá số không chọn hộ', luot: [{ cauHoi: 'Nên nhận việc công ty A hay ở lại công ty B?', hieu: { duong: 'model', khuon: 'E', thoiGian: NAM_2026 }, model: ['khong-chon-ho', 'khong-cau-hai-ve'] }] },
  {
    so: 17, ten: 'SENSITIVE tuyệt vọng', la: 'chinh', trongYeu: false, T: 'giọng chậm ấm, không bị cắt ngắn',
    luot: [{ cauHoi: 'Dạo này mình thấy tuyệt vọng về mọi thứ, năm nay tình cảm có khá hơn không?', hieu: { duong: 'model', khuon: 'A', chuDe: 'tinh-cam', thoiGian: NAM_2026 }, model: ['mien-tru-tam-ly'] }],
  },
  { so: 18, ten: 'EN career this year', la: 'chinh', trongYeu: true, nn: 'en', luot: [{ cauHoi: 'How will my career go this year?', hieu: { duong: 'model', khuon: 'B', chuDe: 'su-nghiep', thoiGian: NAM_2026 }, model: ['tieng-anh'] }] },
  {
    so: 19, ten: 'EN this October', la: 'chinh', trongYeu: false, nn: 'en',
    luot: [{ cauHoi: 'Will I find a job this October?', hieu: { duong: 'model', khuon: 'A', chuDe: 'su-nghiep', ...THANG_10_DUONG }, model: ['tieng-anh', 'claim-dan-ma-nguyet'] }],
  },
  {
    so: 20, ten: 'đổi chủ đề sang tình cảm', la: 'chinh', trongYeu: false,
    luot: [{ cauHoi: 'Năm nay công việc của tôi thế nào?' }, { cauHoi: 'Còn tình cảm thì sao?', hieu: { duong: 'model', chuDe: 'tinh-cam', giaiThichLuotTruoc: false } }],
  },
  {
    so: 21, ten: 'năm sau thì sao', la: 'chinh', trongYeu: false,
    luot: [LUOT_1, { cauHoi: 'giải thích vì sao lại vậy' }, { cauHoi: 'Năm sau thì sao?', hieu: { duong: 'model', chuDe: 'su-nghiep', thoiGian: { loai: 'nam', nam: 2027 } } }],
  },
  { so: 22, ten: 'cãi nhau với mẹ — lượt đầu', la: 'chinh', trongYeu: false, luot: [{ cauHoi: 'Vì sao tôi hay cãi nhau với mẹ?', hieu: { duong: 'model', chuDe: 'tong-quan', giaiThichLuotTruoc: false } }] },
  { so: 22.5, ten: 'cãi nhau với mẹ — sau #1', la: 'chinh', trongYeu: false, luot: [LUOT_1, { cauHoi: 'Vì sao tôi hay cãi nhau với mẹ?', hieu: { duong: 'model', chuDe: 'tong-quan', giaiThichLuotTruoc: false } }] },
  { so: 23, ten: 'khi nào nên đổi việc', la: 'chinh', trongYeu: false, T: 'nói chưa chọn tháng', luot: [{ cauHoi: 'Khi nào tôi nên đổi việc?', hieu: { duong: 'model', khuon: 'D', thoiGian: NAM_2026 }, model: ['khong-moc-nho-hon-nam', 'chip-sang-nam'] }] },
  { so: 24, ten: 'mẹ tôi sức khỏe → F2', la: 'chinh', trongYeu: true, luot: [{ cauHoi: 'Mẹ tôi năm nay sức khỏe thế nào?', hieu: { duong: 'focused-f2', khongTinhLuot: true, coChoHoiLai: true, metaChoHoiLai: true } }] },
  { so: 25, ten: 'tháng này', la: 'chinh', trongYeu: false, luot: [{ cauHoi: 'Tháng này công việc tôi thế nào?', hieu: { duong: 'model', khuon: 'B', chuDe: 'su-nghiep', ...THANG_10_DUONG } }] },
  {
    so: 26, ten: 'tháng 6 đã qua', la: 'chinh', trongYeu: false, T: 'kể thì đã qua',
    luot: [{ cauHoi: 'Tháng 6 năm nay tôi có nên chuyển nhà không?', hieu: { duong: 'model', khuon: 'C', thoiGian: { loai: 'thang-duong', nam: 2026, thang: 6 }, cuaSo: [{ thangAm: 4, nhuan: false }, { thangAm: 5, nhuan: false }] } }],
  },
  { so: 27, ten: 'chip là câu hỏi', la: 'chinh', trongYeu: false, luot: [{ cauHoi: 'Năm nay tôi có cưới được không?', hieu: { duong: 'model' }, model: ['chip-la-cau-hoi'] }] },
  { so: 28, ten: 'thời tiết', la: 'chinh', trongYeu: false, luot: [{ cauHoi: 'Thời tiết mai thế nào?', hieu: { duong: 'model' }, model: ['ngoai-pham-vi'] }] },
  { so: 29, ten: 'không 2027 trong văn', la: 'chinh', trongYeu: false, luot: [{ cauHoi: 'Năm nay công việc tôi thế nào?', hieu: { duong: 'model', khuon: 'B', chuDe: 'su-nghiep', thoiGian: NAM_2026 }, model: ['khong-moc-2027-trong-van', 'chip-sang-nam'] }] },
  {
    so: 30, ten: 'F5 rồi giải thích', la: 'chinh', trongYeu: true, chiTay: true,
    luot: [LUOT_1, { cauHoi: 'giải thích vì sao lại vậy', taiLai: true, hieu: { duong: 'model', khuon: 'D', chuDe: 'su-nghiep', giaiThichLuotTruoc: true }, model: ['chieu-nhu-luot-truoc'] }],
  },
];

/* ------------------------------------------------------------------ bộ chạy chung */

export interface LuotDaChay {
  luot: LuotHopDong;
  cauHoi: string;
  kq: KetQuaFocused;
  ms: number;
}

/** Hàm trả lời một lượt — tầng offline tiêm `traLoiFocused` + model giả, tầng model tiêm model thật. */
export type GoiLuot = (vao: DauVaoTraLoi) => Promise<KetQuaFocused>;

/**
 * Chạy tuần tự các lượt của một flow. Lịch sử là câu hỏi + văn trả lời; metadata lượt trước
 * (`meta`, spec 2.3 — có từ commit F) đi kèm dưới khoá `luotTruoc`, qua JSON khi `taiLai`.
 */
export async function chayFlow(flow: FlowHopDong, goi: GoiLuot, chung: Partial<DauVaoTraLoi> = {}): Promise<LuotDaChay[]> {
  const laSo = LA_SO[flow.la]();
  const lichSu: TinNhan[] = [];
  const ra: LuotDaChay[] = [];
  let truoc: KetQuaFocused | null = null;
  for (const luot of flow.luot) {
    const chipTruoc: string[] = truoc?.coCauTruc?.goiYTiep ?? [];
    const cauHoi = luot.chip !== undefined ? chipTruoc[luot.chip] ?? '' : luot.cauHoi ?? '';
    let meta = (truoc as (KetQuaFocused & { meta?: unknown }) | null)?.meta;
    if (meta !== undefined && luot.taiLai) meta = JSON.parse(JSON.stringify(meta));
    const vao = {
      laSo,
      cauHoi,
      namXem: NAM_XEM,
      thangXem: HOM_NAY.thang,
      ghiNhatKy: false,
      lichSu: [...lichSu],
      laTiepTuChip: luot.chip !== undefined,
      ...(meta !== undefined ? { luotTruoc: meta } : {}),
      ...(flow.nn ? { ngonNgu: flow.nn } : {}),
      ...chung,
    } as DauVaoTraLoi;
    const t = Date.now();
    const kq = await goi(vao);
    ra.push({ luot, cauHoi, kq, ms: Date.now() - t });
    lichSu.push({ vaiTro: 'nguoi-dung', noiDung: cauHoi });
    if (kq.van) lichSu.push({ vaiTro: 'tro-ly', noiDung: kq.van });
    truoc = kq;
  }
  return ra;
}

/** Chấm tầng offline của một lượt: trả danh sách chỗ lệch (rỗng = đạt). */
export function chamHieu(ky: KyVongHieu | undefined, kq: KetQuaFocused): string[] {
  if (!ky) return [];
  const lech: string[] = [];
  const v = kq.vetPreview;
  const duong = kq.provider === 'ma' ? kq.model : 'model';
  const so = (ten: string, thay: unknown, can: unknown) => {
    if (JSON.stringify(thay) !== JSON.stringify(can)) lech.push(`${ten}: ra ${JSON.stringify(thay)}, cần ${JSON.stringify(can)}`);
  };
  if (ky.duong !== undefined) so('đường', duong, ky.duong);
  if (ky.khongTinhLuot !== undefined) so('khongTinhLuot', !!kq.khongTinhLuot, ky.khongTinhLuot);
  if (!v) {
    if (Object.keys(ky).some((k) => !['duong', 'khongTinhLuot'].includes(k))) lech.push('không có vetPreview');
    return lech;
  }
  if (ky.khuon !== undefined) so('khuôn', v.hieu.khuon, ky.khuon);
  if (ky.khuonKhong?.includes(v.hieu.khuon)) lech.push(`khuôn ${v.hieu.khuon} bị cấm`);
  if (ky.chuDe !== undefined) so('chủ đề', v.hieu.chuDe, ky.chuDe);
  if (ky.coDoiTuong !== undefined) so('coDoiTuong', v.hieu.coDoiTuong, ky.coDoiTuong);
  if (ky.thoiGian !== undefined) so('thời gian', v.hieu.thoiGian, ky.thoiGian);
  if (ky.cuaSo !== undefined) so('cửa sổ', (v.cuaSo ?? []).map((c) => ({ thangAm: c.thangAm, nhuan: c.nhuan })), ky.cuaSo);
  if (ky.giaiThichLuotTruoc !== undefined) so('giaiThichLuotTruoc', v.hieu.giaiThichLuotTruoc, ky.giaiThichLuotTruoc);
  if (ky.coChoHoiLai !== undefined) so('coChoHoiLai', v.hieu.coChoHoiLai, ky.coChoHoiLai);
  if (ky.metaChoHoiLai !== undefined) {
    const m = (kq as KetQuaFocused & { meta?: { choHoiLai?: unknown } }).meta;
    so('meta.choHoiLai', !!m?.choHoiLai, ky.metaChoHoiLai);
  }
  return lech;
}
