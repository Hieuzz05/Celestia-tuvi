/**
 * CEL-191 — Focused hiểu câu theo từng TRƯỜNG (chủ đề / ý định / thời gian).
 *
 * Trước CEL-191 lớp Focused gọi `lapKeHoachDayDu` khi luật không chắc chủ đề, và nhận NGUYÊN kế
 * hoạch của model: một ý định luật đã đọc đúng ("…được không?" → co-khong) bị model ghi đè
 * (flow 2: 2/5 lần ra co-khong). Thời gian thì model không được hỏi, nên câu tiếng Anh
 * "this year" hay câu luật chắc chủ đề mà parser bỏ sót mốc rơi về `khong-ro`.
 *
 * Ở đây: luật trước, model chỉ điền chỗ TRỐNG, gộp theo từng trường (spec §5):
 *   chuDe     — luật chắc thì giữ; không chắc thì model nếu hợp lệ.
 *   yDinh     — luật ra khác `mo-ta` thì giữ; `mo-ta` là chỗ trống model được điền.
 *   thời gian — parser giải được thì giữ; parser rỗng VÀ câu có dấu hiệu thời gian thì dùng
 *               `timeIntent` KÝ HIỆU của model, CODE tính năm/tháng (model không bao giờ tính).
 * Model lỗi / hết giờ / giá trị lạ → giữ luật. Không đụng `lapKeHoachDayDu` (STANDARD gọi nó).
 */
import { docObjectJson } from '../doc-json';
import {
  CHU_DE_HOP_LE,
  lapKeHoachTheoTruong,
  Y_DINH_HOP_LE,
  type ChuDe,
  type DauVaoPlanner,
  type KeHoachTruyVan,
  type ThoiGianKeHoach,
  type YDinh,
} from '../planner';

export const TIME_INTENT = [
  'current-year',
  'next-year',
  'previous-year',
  'current-month',
  'next-month',
  'near-future',
  'long-term',
  'explicit-month',
  'none',
  'unclear',
] as const;
export type TimeIntent = (typeof TIME_INTENT)[number];

const boDau = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

/**
 * Dấu hiệu thời gian — CỔNG GỌI, không phải bộ giải. Bắt nhầm chỉ tốn một lời gọi (model trả
 * `none` thì vẫn về luật); bỏ lỡ thì giữ nguyên hành vi trước CEL-191. Mức NGÀY ("ngày mai",
 * "tuần sau") cố ý KHÔNG có: lớp ngày chưa có, guard "mốc nhỏ hơn năm" của CEL-186 lo phần đó.
 * Đo trên 80 câu thật (spec §0): parser bỏ lỡ 0–2/80.
 */
const DAU_HIEU: RegExp[] = [
  /\bthang\s*(1[0-2]|[1-9])\b/,
  /\bthang\s+(gieng|chap|mot|hai|ba|tu|nam|sau|bay|tam|chin|muoi)\b/,
  /\bnam\s+(19|20)\d\d\b/,
  /\b(nam|thang|quy)\s+(nay|toi|sau|truoc|ngoai|moi)\b/,
  /\bsang nam\b/,
  /\b(tet|sinh nhat|dau nam|cuoi nam|giua nam|nua dau|nua cuoi|mua (xuan|he|thu|dong))\b/,
  /\b(sap toi|thoi gian toi|sap|gan day|tuong lai|sau nay|ve gia)\b/,
  /\b(this|next|last|coming)\s+(year|month|quarter|spring|summer|fall|autumn|winter)\b/,
  /\b(january|february|march|april|june|july|august|september|october|november|december)\b/,
  /\b(soon|in the future|future|later this year|by the end of)\b/,
  /\b(19|20)\d\d\b/,
];

export function coDauHieuThoiGian(cauHoi: string): boolean {
  const bd = boDau(cauHoi.normalize('NFC'));
  return DAU_HIEU.some((re) => re.test(bd));
}

/**
 * Bảng tra ĐÓNG (spec §5.4): ký hiệu → trục thời gian. Không nhánh mới, không phạm vi mới.
 * `namXem` / `thangXem` là năm / tháng âm đang neo, như parser. Giá trị lạ / none / unclear /
 * explicit-month → null (giữ `khong-ro`: tháng nói rõ là việc của parser, model không tính).
 */
export function giaiTimeIntent(ti: string | undefined, namXem?: number, thangXem?: number): ThoiGianKeHoach | null {
  switch (ti) {
    case 'current-year':
      return { phamViThoiGian: 'nam', ...(namXem !== undefined ? { namMucTieu: namXem } : {}) };
    case 'next-year':
      return { phamViThoiGian: 'nam', ...(namXem !== undefined ? { namMucTieu: namXem + 1 } : {}) };
    case 'previous-year':
      return { phamViThoiGian: 'nam', ...(namXem !== undefined ? { namMucTieu: namXem - 1 } : {}) };
    case 'current-month':
      return thangXem === undefined ? null : { phamViThoiGian: 'thang', thangMucTieu: thangXem };
    case 'next-month': {
      if (thangXem === undefined) return null;
      const t = thangXem + 1;
      // Như LECH_THANG của parser: tháng tới của tháng 12 là tháng 1 NĂM SAU.
      return {
        phamViThoiGian: 'thang',
        thangMucTieu: t > 12 ? t - 12 : t,
        ...(t > 12 && namXem !== undefined ? { namMucTieu: namXem + 1 } : {}),
      };
    }
    case 'near-future':
      return { phamViThoiGian: 'gan' };
    case 'long-term':
      return { phamViThoiGian: 'giai-doan' };
    default:
      return null;
  }
}

export interface CongGoi {
  goi: boolean;
  lyDo: 'khong-chac' | 'thoi-gian' | null;
}

/**
 * Cổng gọi model (spec §4): `!chacChan || (dấu hiệu thời gian && parser rỗng)`, VÀ không có người
 * được hỏi, VÀ không kế thừa, VÀ không tắt phân loại. Người được hỏi / kế thừa đã khoá chủ đề —
 * cho model đoán lại là mở lại cờ #2 của CEL-186.
 */
export function canGoiModel(v: {
  keHoach: Pick<KeHoachTruyVan, 'chacChan'>;
  cauHoi: string;
  parserRong: boolean;
  coDoiTuong: boolean;
  keThua: boolean;
  dungModelPhanLoai?: boolean;
}): CongGoi {
  if (v.coDoiTuong || v.keThua || v.dungModelPhanLoai === false) return { goi: false, lyDo: null };
  if (!v.keHoach.chacChan) return { goi: true, lyDo: 'khong-chac' };
  if (v.parserRong && coDauHieuThoiGian(v.cauHoi)) return { goi: true, lyDo: 'thoi-gian' };
  return { goi: false, lyDo: null };
}

export interface PhanLoaiModel {
  chuDe?: ChuDe;
  yDinh?: YDinh;
  timeIntent?: TimeIntent;
}

/** Chờ tối đa 8 giây — như `lapKeHoachDayDu`. Phân loại là bước mở đầu. */
const HAN_CHO_MS = 8_000;

export const SYSTEM_PHAN_LOAI_FOCUSED = `Bạn là bộ phân loại câu hỏi của một sản phẩm Tử Vi. Chỉ phân loại, KHÔNG trả lời câu hỏi.

chuDe — câu hỏi về lĩnh vực nào:
  su-nghiep · tai-chinh · tinh-cam · gia-dao · suc-khoe · tong-quan

yDinh — người hỏi cần gì:
  quyet-dinh  người hỏi đang phải chọn, cần tiêu chí để quyết
  co-khong    người hỏi muốn một nhận định có hay không
  thoi-diem   người hỏi muốn biết lúc nào
  giai-thich  người hỏi muốn hiểu vì sao
  tra-cuu     người hỏi muốn biết một thuật ngữ nghĩa là gì
  mo-ta       còn lại

timeIntent — câu hỏi nhắm vào quãng thời gian nào, CHỈ chọn một ký hiệu:
  current-year · next-year · previous-year · current-month · next-month ·
  near-future (sắp tới, vài tháng tới) · long-term (sau này, cả đời) ·
  explicit-month (câu nêu tên/số một tháng cụ thể) · none (không nói thời gian) · unclear
KHÔNG tự tính năm hay tháng, KHÔNG viết số năm, chỉ trả ký hiệu.

Ví dụ:
"How will my career go this year?" → {"chuDe":"su-nghiep","yDinh":"mo-ta","timeIntent":"current-year"}
"What about next month?" → {"chuDe":"tong-quan","yDinh":"mo-ta","timeIntent":"next-month"}
"Sắp tới tôi có người yêu không?" → {"chuDe":"tinh-cam","yDinh":"co-khong","timeIntent":"near-future"}
"Tình duyên tôi thế nào?" → {"chuDe":"tinh-cam","yDinh":"mo-ta","timeIntent":"none"}

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code, không giải thích:
{"chuDe": "...", "yDinh": "...", "timeIntent": "..."}`;

/** Lọc đầu ra thô của model: giá trị ngoài danh sách bị bỏ (trường đó coi như model không trả). */
export function locPhanLoai(tho: Record<string, unknown> | null | undefined): PhanLoaiModel | null {
  if (!tho) return null;
  const ra: PhanLoaiModel = {};
  if (CHU_DE_HOP_LE.includes(tho.chuDe as ChuDe)) ra.chuDe = tho.chuDe as ChuDe;
  if (Y_DINH_HOP_LE.includes(tho.yDinh as YDinh)) ra.yDinh = tho.yDinh as YDinh;
  if ((TIME_INTENT as readonly string[]).includes(tho.timeIntent as string)) ra.timeIntent = tho.timeIntent as TimeIntent;
  return ra.chuDe || ra.yDinh || ra.timeIntent ? ra : null;
}

/** Một lời gọi model (maxTokens 60, hạn 8 s). Hỏng / hết giờ → null, không ném. */
export async function phanLoaiFocused(cauHoi: string): Promise<PhanLoaiModel | null> {
  try {
    const { goiVoiFallback } = await import('@/lib/ai/fallback');
    let hen: ReturnType<typeof setTimeout> | undefined;
    const kq = await Promise.race([
      goiVoiFallback({ system: SYSTEM_PHAN_LOAI_FOCUSED, user: cauHoi.slice(0, 400), maxTokens: 60 }),
      new Promise<null>((r) => {
        hen = setTimeout(() => r(null), HAN_CHO_MS);
      }),
    ]).finally(() => clearTimeout(hen));
    if (!kq) return null;
    return locPhanLoai(docObjectJson(kq.text) as Record<string, unknown> | null);
  } catch (e) {
    console.warn('[focused] phân loại bằng model hỏng:', e instanceof Error ? e.message : e);
    return null;
  }
}

export type NguonTruong = 'luat' | 'model';

export interface KetQuaGop {
  keHoach: KeHoachTruyVan;
  nguonTruong: { chuDe: NguonTruong; yDinh: NguonTruong; thoiGian: NguonTruong };
  /** Ký hiệu model trả (đã lọc) — chỉ để ghi vết, kể cả khi không dùng. */
  timeIntentModel: TimeIntent | null;
}

/**
 * Gộp theo trường (spec §5). Không trường nào đổi thì trả NGUYÊN đối tượng kế hoạch luật — nơi gọi
 * so `===` để ghi nguồn 'luat'.
 */
export function gopTheoTruong(v: {
  luat: KeHoachTruyVan;
  model: PhanLoaiModel | null;
  vao: DauVaoPlanner;
  parserRong: boolean;
}): KetQuaGop {
  const { luat, model, vao, parserRong } = v;
  const timeIntentModel = model?.timeIntent ?? null;
  const chuDeModel = !luat.chacChan && model?.chuDe ? model.chuDe : null;
  const yDinhModel = luat.yDinh === 'mo-ta' && model?.yDinh && model.yDinh !== 'mo-ta' ? model.yDinh : null;
  const thoiGianModel = parserRong && coDauHieuThoiGian(vao.cauHoi) ? giaiTimeIntent(timeIntentModel ?? undefined, vao.namXem, vao.thangXem) : null;

  const nguonTruong = {
    chuDe: (chuDeModel ? 'model' : 'luat') as NguonTruong,
    yDinh: (yDinhModel ? 'model' : 'luat') as NguonTruong,
    thoiGian: (thoiGianModel ? 'model' : 'luat') as NguonTruong,
  };
  if (!chuDeModel && !yDinhModel && !thoiGianModel) return { keHoach: luat, nguonTruong, timeIntentModel };

  const keHoach = lapKeHoachTheoTruong(vao, {
    chuDe: chuDeModel ?? luat.chuDe,
    yDinh: yDinhModel ?? luat.yDinh,
    // Model chốt chủ đề thì kế hoạch chắc như `lapKeHoachDayDu` hôm nay; còn lại giữ của luật.
    chacChan: chuDeModel ? true : luat.chacChan,
    phanLoaiBangModel: chuDeModel ? true : luat.phanLoaiBangModel,
    thoiGian: thoiGianModel ?? {
      phamViThoiGian: luat.phamViThoiGian,
      ...(luat.namMucTieu !== undefined ? { namMucTieu: luat.namMucTieu } : {}),
      ...(luat.thangMucTieu !== undefined ? { thangMucTieu: luat.thangMucTieu } : {}),
    },
  });
  // Chủ đề giữ của luật Focused (có thể đã chỉnh qua lapKeHoachVoiChuDe) thì cung liên quan cũng
  // phải giữ — dựng lại từ chủ đề cho ra cùng tập, nhưng giữ nguyên để không phụ thuộc điều đó.
  return { keHoach: chuDeModel ? keHoach : { ...keHoach, cungLienQuan: luat.cungLienQuan }, nguonTruong, timeIntentModel };
}
