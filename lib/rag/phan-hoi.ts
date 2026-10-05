/**
 * PHẢN HỒI 👍👎 trên một lượt Celes (CEL-195).
 *
 * Ghi vào đúng hai cột đã có của ai_requests: `phan_hoi` (huu_ich | khong_dung) và `ly_do_phan_hoi`.
 * Lý do là DANH SÁCH ĐÓNG, không nhận chữ tự do: chữ tự do là nơi người dùng gõ lại ngày sinh, tên,
 * chuyện riêng — đúng thứ PRIV-01 vừa gỡ khỏi trace.
 *
 * Chủ quyền: requestId là UUID ngẫu nhiên máy chủ cấp (không đoán được), và lệnh ghi lọc thêm
 * `user_id` = người đang đăng nhập — lượt của người khác trả cùng một câu "không có" như lượt không tồn tại.
 */
export const LY_DO_PHAN_HOI = ['sai-thuc-te', 'sai-thoi-diem', 'qua-chung', 'gio-sinh-chua-chac', 'khac'] as const;
export type LyDoPhanHoi = (typeof LY_DO_PHAN_HOI)[number];
export type LoaiPhanHoi = 'huu_ich' | 'khong_dung';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const laUuid = (s: unknown): s is string => typeof s === 'string' && UUID.test(s);

export type KetQuaPhanHoi =
  | { ok: true; requestId: string; phanHoi: LoaiPhanHoi; lyDo: LyDoPhanHoi | null }
  | { ok: false; loi: string };

/** Hàm thuần — kiểm body trước khi chạm DB. 👍 không mang lý do; 👎 phải có lý do trong danh sách. */
export function chuanHoaPhanHoi(b: unknown): KetQuaPhanHoi {
  if (!b || typeof b !== 'object') return { ok: false, loi: 'body' };
  const { requestId, phanHoi, lyDo } = b as Record<string, unknown>;
  if (!laUuid(requestId)) return { ok: false, loi: 'requestId' };
  if (phanHoi === 'huu_ich') return { ok: true, requestId, phanHoi, lyDo: null };
  if (phanHoi !== 'khong_dung') return { ok: false, loi: 'phanHoi' };
  if (!LY_DO_PHAN_HOI.includes(lyDo as LyDoPhanHoi)) return { ok: false, loi: 'lyDo' };
  return { ok: true, requestId, phanHoi, lyDo: lyDo as LyDoPhanHoi };
}

/**
 * Dòng phản hồi cho màn "Cần duyệt" — hàm thuần, CHỈ dữ liệu an toàn: mã lượt rút gọn, giờ, nhãn,
 * phiên bản, model, mã lỗi kiểm duyệt. Không câu hỏi, không câu trả lời, không user_id, không băm lá số.
 * Nhận cả dòng thô rồi CHỌN trường (danh sách trắng) — thêm cột mới vào ai_requests không tự lộ ra đây.
 */
export interface DongPhanHoiAnToan {
  ma: string;
  luc: string;
  phanHoi: LoaiPhanHoi;
  lyDo: LyDoPhanHoi | null;
  phienBan: Record<string, string>;
  model: string | null;
  maLoi: string[];
}

export function dongPhanHoiAnToan(r: Record<string, unknown>): DongPhanHoiAnToan {
  const kd = r.ket_qua_kiem_duyet as { loi?: { ma?: unknown }[] } | null;
  const pb = r.phien_ban && typeof r.phien_ban === 'object' ? (r.phien_ban as Record<string, unknown>) : {};
  return {
    ma: String(r.request_id ?? '').slice(0, 8),
    luc: String(r.tao_luc ?? ''),
    phanHoi: r.phan_hoi === 'huu_ich' ? 'huu_ich' : 'khong_dung',
    lyDo: LY_DO_PHAN_HOI.includes(r.ly_do_phan_hoi as LyDoPhanHoi) ? (r.ly_do_phan_hoi as LyDoPhanHoi) : null,
    phienBan: Object.fromEntries(Object.entries(pb).filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, v as string])),
    model: typeof r.model === 'string' ? r.model : null,
    maLoi: (kd?.loi ?? []).map((l) => l.ma).filter((m): m is string => typeof m === 'string'),
  };
}

/** Cột được phép SELECT cho màn "Cần duyệt" — không có cau_hoi, user_id, chart_hash. */
export const COT_PHAN_HOI_AN_TOAN = 'request_id, tao_luc, phan_hoi, ly_do_phan_hoi, phien_ban, model, ket_qua_kiem_duyet';
