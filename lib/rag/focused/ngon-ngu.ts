/**
 * Ngôn ngữ của câu do mã viết — đường Focused (CEL-186 vé B, chủ dự án 04/10).
 *
 * Câu mã (D, F2, tháng nhuận, tháng đã qua, câu chốt dự phòng, chip dự phòng,
 * miễn trừ SENSITIVE, nhãn lối đi) phải theo ngôn ngữ người dùng: người dùng EN
 * không được nhận câu tiếng Việt.
 *
 * Nguồn: `ngonNgu` trang gửi lên (lựa chọn ở giao diện), rồi cookie
 * `tuvi-ai:ngon-ngu`; thiếu cả hai là 'vi'. KHÔNG đoán từ chữ của câu hỏi — một
 * người dùng giao diện Việt gõ "career 2027?" vẫn là người dùng Việt.
 */

import type { LoiDiTiep } from '../hinh-dang-tra-loi';

export type NgonNgu = 'vi' | 'en';

export const COOKIE_NGON_NGU = 'tuvi-ai:ngon-ngu';

/** Chỉ 'en' đúng chữ mới là EN; mọi giá trị khác (thiếu, lạ) là 'vi'. */
export function chonNgonNgu(tuTrang: unknown, tuCookie?: string | null): NgonNgu {
  if (tuTrang === 'en' || tuTrang === 'vi') return tuTrang;
  return tuCookie === 'en' ? 'en' : 'vi';
}

/* --------------------------------------------------- miễn trừ SENSITIVE */

/** Bản EN của `MIEN_TRU_TAM_LY` (an-toan.ts) — cùng ý, không thêm bớt. */
export const MIEN_TRU_TAM_LY_EN =
  'A chart speaks of tendencies; it does not replace a qualified professional. If this lasts and wears you down, a psychologist can help far more than a chart can.';

const daCoMienTruEn = (van: string) => /psychologist|qualified professional|does not replace/i.test(van);

export function datMienTruTheoNgonNgu(van: string, nn: NgonNgu, datVi: (v: string) => string): string {
  if (nn === 'vi') return datVi(van);
  return daCoMienTruEn(van) ? van : `${van.trim()}\n\n${MIEN_TRU_TAM_LY_EN}`;
}

/* ------------------------------------------------------------ lối đi */

/** Nhãn EN theo đường — `loiDiTiep` (dùng chung với STANDARD) chỉ có nhãn Việt. */
const NHAN_LOI_DI_EN: Record<string, string> = {
  '/luan-giai?chuDe=su-nghiep': 'Read more about work and direction',
  '/luan-giai?chuDe=tai-chinh': 'Read more about money',
  '/hop-tuoi': 'See two charts side by side',
  '/hanh-trinh': 'See where this stretch sits in your journey',
  '/la-so': 'See it on your chart',
};

export function loiDiTheoNgonNgu(loiDi: LoiDiTiep[], nn: NgonNgu): LoiDiTiep[] {
  if (nn === 'vi') return loiDi;
  return loiDi.map((l) => ({ ...l, nhan: NHAN_LOI_DI_EN[l.duong] ?? l.nhan }));
}

/* ------------------------------------------------------- chip dự phòng */

export const CHIP_DU_PHONG: Record<NgonNgu, string[]> = {
  vi: ['Sang năm thì sao?', 'Tháng này thì sao?', 'Năm nay thì sao?'],
  en: ['What about next year?', 'What about this month?', 'What about this year?'],
};
