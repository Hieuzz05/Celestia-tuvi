import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Hạn lưu nhật ký vận hành (PRIV-01, chủ dự án chốt 05/10/2026).
 *
 * - `ai_requests`, `retrieval_runs` (kéo theo `retrieval_results` qua on delete cascade): 90 ngày.
 *   Dòng nối được về người qua `user_id` / `request_id` ↔ `usage_events`, nên không giữ vô hạn.
 * - `noi_dung_ai` bề mặt `gioi-han-khach`: 2 ngày. Sổ đếm chỉ cần hôm nay; khoá chứa băm lá số.
 *   noi_dung_ai là bảng ĐỆM DÙNG CHUNG (bài luận, cấu hình…), nên lệnh xoá BẮT BUỘC lọc đúng
 *   be_mat — thiếu bộ lọc đó là xoá sạch đệm bài luận của mọi người.
 *
 * KHÔNG dọn ở đây: `usage_events` (sổ hạn mức / thanh toán — chủ dự án quyết riêng),
 * `ai_usage_logs` (số tổng hợp theo ngày, không nối được về người).
 */
export const HAN_LUU_NHAT_KY_NGAY = 90;
export const HAN_LUU_GIOI_HAN_KHACH_NGAY = 2;

const NGAY_MS = 24 * 60 * 60 * 1000;

export interface LenhXoa {
  bang: 'ai_requests' | 'retrieval_runs' | 'noi_dung_ai';
  /** Chỉ dòng có tao_luc TRƯỚC mốc này */
  truoc: string;
  /** Lọc bằng thêm theo cột → giá trị */
  loc?: Record<string, string>;
}

/** Danh sách lệnh xoá — hàm thuần, kiểm offline ở scripts/test-nhat-ky-rieng-tu.ts */
export function lenhDonNhatKy(bayGio: Date): LenhXoa[] {
  const moc = (ngay: number) => new Date(bayGio.getTime() - ngay * NGAY_MS).toISOString();
  return [
    { bang: 'ai_requests', truoc: moc(HAN_LUU_NHAT_KY_NGAY) },
    { bang: 'retrieval_runs', truoc: moc(HAN_LUU_NHAT_KY_NGAY) },
    { bang: 'noi_dung_ai', truoc: moc(HAN_LUU_GIOI_HAN_KHACH_NGAY), loc: { be_mat: 'gioi-han-khach' } },
  ];
}

export async function donNhatKy(
  supabase: SupabaseClient,
  bayGio = new Date()
): Promise<{ bang: string; soDong: number | null; loi?: string }[]> {
  const ketQua: { bang: string; soDong: number | null; loi?: string }[] = [];
  for (const l of lenhDonNhatKy(bayGio)) {
    let q = supabase.from(l.bang).delete({ count: 'exact' }).lt('tao_luc', l.truoc);
    for (const [cot, gt] of Object.entries(l.loc ?? {})) q = q.eq(cot, gt);
    const { count, error } = await q;
    ketQua.push({ bang: l.bang, soDong: count ?? null, ...(error ? { loi: error.message } : {}) });
  }
  return ketQua;
}
