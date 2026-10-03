/**
 * CÂU DO MÃ VIẾT — đường Focused (CEL-186 vé B, quyết định #3 và #5).
 *
 * Những chỗ engine không có căn cứ để model tự nói (chọn mốc, chọn phương án,
 * vận của người khác, tháng nhuận) thì câu đầu do mã đặt, nguyên văn đã
 * duyệt. Model không viết lại, không "diễn giải" các câu này.
 *
 * Hai loại:
 *   - TRỌN LƯỢT (`goiModel: false`): D, F2, tháng nhuận. Lượt trả ngay, không
 *     truy hồi, không gọi model.
 *   - CÂU DẪN (`goiModel: true`): E, N2, N4. Câu mã đứng đầu, model đọc phần
 *     dưới qua guard như mọi khuôn khác.
 *
 * Chip chỉ là thứ engine trả lời được (#5): không có "Tháng nào đáng chú ý hơn?".
 *
 * Mọi câu có bản VI và EN (chủ dự án 04/10): theo `ngonNgu` của người dùng.
 * Bản VI của D, tháng nhuận, N2 là nguyên văn chủ dự án duyệt 04/10 — đổi chữ
 * là phải duyệt lại.
 */

import { canChiCuaNam } from '@/lib/tuvi/bay-gio';
import type { LoiDiTiep } from '../hinh-dang-tra-loi';
import type { DoiTuongCauHoi } from './doi-tuong';
import type { NgonNgu } from './ngon-ngu';
import type { MocThang } from './phan-loai';

export interface CauMa {
  cau: string;
  chip: string[];
  loiDi: LoiDiTiep[];
  goiModel: boolean;
}

const hoaDau = (s: string) => s.charAt(0).toLocaleUpperCase('vi') + s.slice(1);

/* ------------------------------------------------------------ khuôn D */

export const CAU_KHI_NAO: Record<NgonNgu, string> = {
  vi: 'Lá số hiện chưa đủ để chọn ra một năm hay một tháng tốt nhất nếu chưa đặt các mốc cạnh nhau. Bạn có thể chọn một mốc cụ thể để Celes đọc riêng.',
  en: 'Your chart cannot single out one best year or month without setting the options side by side. You can pick a specific year or month for Celes to read on its own.',
};

const CHIP_KHI_NAO: Record<NgonNgu, string[]> = {
  vi: ['Năm nay thì sao?', 'Sang năm thì sao?'],
  en: ['What about this year?', 'What about next year?'],
};

export function cauKhiNao(nn: NgonNgu = 'vi'): CauMa {
  return { cau: CAU_KHI_NAO[nn], chip: CHIP_KHI_NAO[nn], loiDi: [], goiModel: false };
}

/* ------------------------------------------------------------ khuôn E */

export const CAU_HAI_VE: Record<NgonNgu, string> = {
  vi: 'Lá số hiện cho Celes đọc được bối cảnh của quyết định này, nhưng chưa đủ để kết luận một phương án chắc chắn tốt hơn phương án còn lại.',
  en: 'Your chart lets Celes read the backdrop to this decision, but it is not enough to say one option is surely better than the other.',
};

/** Chip tách từng phương án người dùng gõ: "Ở lại thì sao?". */
export function chipHaiVe(haiVe: [string, string], nn: NgonNgu = 'vi'): string[] {
  // EN: cụm người dùng gõ có thể là tiếng Việt hoặc dài — dùng chip chung, không nhét nguyên cụm.
  if (nn === 'en') return ['What about the first option?', 'What about the second option?'];
  return haiVe.map((v) => `${hoaDau(v.trim())} thì sao?`);
}

export function cauHaiVe(haiVe: [string, string], nn: NgonNgu = 'vi'): CauMa {
  return { cau: CAU_HAI_VE[nn], chip: chipHaiVe(haiVe, nn), loiDi: [], goiModel: true };
}

/* ----------------------------------------------------------- khuôn F2 */

export const CAU_VAN_RIENG: Record<NgonNgu, string> = {
  vi: 'Lá số này là của bạn, nên Celes không dùng nó để kết luận vận riêng của người khác. Celes vẫn có thể đọc mối quan hệ giữa hai người hoặc phần liên quan trực tiếp tới bạn.',
  en: 'This chart is yours, so Celes does not use it to draw conclusions about another person’s own fortunes. Celes can still read the relationship between the two of you, or the part that concerns you directly.',
};

/** Lối sang nối hai lá số — cùng nhãn và đường với `loiDiTiep`. */
const LOI_HAI_LA_SO: Record<NgonNgu, LoiDiTiep> = {
  vi: { nhan: 'Xem hai lá số cạnh nhau', duong: '/hop-tuoi' },
  en: { nhan: 'See two charts side by side', duong: '/hop-tuoi' },
};

/**
 * Chip quan hệ: bấm vào ra khuôn F1, đúng cung lục thân (`nhanDangDoiTuong`
 * nhận "<người> tôi" + "hợp nhau" là `quan-he`). Bản EN không có tên người
 * bằng tiếng Anh (`dt.nhan` là chữ Việt) nên nói chung "this person".
 */
export function chipQuanHe(dt: DoiTuongCauHoi, nn: NgonNgu = 'vi'): string {
  return nn === 'en' ? 'How do this person and I get along?' : `Tôi với ${dt.nhan} tôi có hợp nhau không?`;
}

export function cauVanRieng(dt: DoiTuongCauHoi, nn: NgonNgu = 'vi'): CauMa {
  const banDoi = dt.vai === 'vo-chong' || dt.vai === 'nguoi-yeu';
  return { cau: CAU_VAN_RIENG[nn], chip: [chipQuanHe(dt, nn)], loiDi: banDoi ? [LOI_HAI_LA_SO[nn]] : [], goiModel: false };
}

/* ------------------------------------------------------- tháng nhuận */

/** Năm khác năm đang chạy thì chip phải mang năm, không thì bấm vào đọc nhầm năm. */
const duoiNam = (nam: number, namNay: number, nn: NgonNgu) =>
  nam === namNay ? '' : nn === 'en' ? ` of ${nam}` : ` năm ${nam}`;

/** Câu duyệt 04/10: engine chưa tách tháng nhuận nên không luận, dù người hỏi đã chọn hay chưa. */
function cauNhuan(m: MocThang, nn: NgonNgu): string {
  const x = m.thang;
  return nn === 'en'
    ? `Leap month ${x} of ${m.nam} has to be read separately from the regular month ${x}. Celes cannot tell these two apart yet, so it will not read the leap month, to avoid a mix-up.`
    : `Tháng ${x} nhuận năm ${m.nam} cần được đọc riêng với tháng ${x} thường. Hiện Celes chưa tách được hai mốc này, nên chưa luận tháng nhuận để tránh đọc nhầm.`;
}

/** Chip duy nhất: tháng X THƯỜNG — thứ engine đọc được. */
const chipThangThuong = (m: MocThang, namNay: number, nn: NgonNgu) =>
  `${nn === 'en' ? 'Lunar month' : 'Tháng'} ${m.thang}${duoiNam(m.nam, namNay, nn)}`;

/**
 * Năm có tháng X nhuận mà người hỏi chưa nói rõ. Không hỏi lại "thường hay
 * nhuận": nhuận thì engine không đọc được, nên chỉ mời đọc tháng thường.
 */
export function cauHoiNhuan(m: MocThang, namNay: number, nn: NgonNgu = 'vi'): CauMa {
  return { cau: cauNhuan(m, nn), chip: [chipThangThuong(m, namNay, nn)], loiDi: [], goiModel: false };
}

/**
 * Người dùng đã chọn tháng X NHUẬN. Engine chỉ có nguyệt hạn theo số tháng,
 * không tách tháng nhuận — đọc tiếp là đưa vận tháng X thường ra như thể của
 * tháng nhuận: câu sai mà trông hợp lệ. Nên dừng hẳn (fail closed), trọn lượt,
 * không truy hồi, không gọi model. Chip "Tháng X" (thường) vẫn đọc được.
 */
export function cauNhuanChuaTach(m: MocThang, namNay: number, nn: NgonNgu = 'vi'): CauMa {
  return { cau: cauNhuan(m, nn), chip: [chipThangThuong(m, namNay, nn)], loiDi: [], goiModel: false };
}

/* ---------------------------------------------------- N2 tháng đã qua */

export function cauThangDaQua(m: MocThang, nn: NgonNgu = 'vi'): string {
  const nhuan = m.nhuan === 'nhuan';
  return nn === 'en'
    ? `You are asking again about ${nhuan ? 'leap ' : ''}lunar month ${m.thang} of ${m.nam} — that time has already passed. What follows looks back at how that month tended to go; it is not a forecast for the time ahead.`
    : `Bạn đang hỏi lại tháng ${m.thang}${nhuan ? ' nhuận' : ''} âm lịch năm ${m.nam} — mốc này đã qua. Phần dưới sẽ đọc lại xu hướng của tháng đó, không coi đây là dự báo cho thời gian sắp tới.`;
}

/* --------------------------------------------------- N4 cuối năm âm */

export const CAU_CUOI_NAM: Record<NgonNgu, string> = {
  vi: 'Phần này đang đọc quãng từ hiện tại đến hết năm âm này. Phần sau Tết thuộc năm mới và cần được xem riêng.',
  en: 'This reads the stretch from now until the end of this lunar year. What comes after Lunar New Year belongs to the new year and needs a separate look.',
};

/** Chip sang năm đứng ĐẦU: đó là điều người hỏi "sắp tới" thật sự sắp gặp. */
export function chipCuoiNam(namNay: number, goiY: string[], nn: NgonNgu = 'vi'): string[] {
  const namSau = namNay + 1;
  const canChi = canChiCuaNam(namSau);
  const chip = nn === 'en' ? `What about next year (${namSau})?` : `Sang năm ${canChi} thì sao?`;
  const con = goiY.filter((c) => !c.includes(canChi) && !c.includes(String(namSau)));
  return [chip, ...con].slice(0, 3);
}
