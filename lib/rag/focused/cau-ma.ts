/**
 * CÂU DO MÃ VIẾT — đường Focused (CEL-186 vé B, quyết định #3 và #5).
 *
 * Những chỗ engine không có căn cứ để model tự nói (chọn mốc, chọn phương án,
 * vận của người khác, tháng nhuận mơ hồ) thì câu đầu do mã đặt, nguyên văn đã
 * duyệt. Model không viết lại, không "diễn giải" các câu này.
 *
 * Hai loại:
 *   - TRỌN LƯỢT (`goiModel: false`): D, F2, hỏi lại nhuận. Lượt trả ngay, không
 *     truy hồi, không gọi model.
 *   - CÂU DẪN (`goiModel: true`): E, N2, N4. Câu mã đứng đầu, model đọc phần
 *     dưới qua guard như mọi khuôn khác.
 *
 * Chip chỉ là thứ engine trả lời được (#5): không có "Tháng nào đáng chú ý hơn?".
 */

import { canChiCuaNam } from '@/lib/tuvi/bay-gio';
import type { LoiDiTiep } from '../hinh-dang-tra-loi';
import type { DoiTuongCauHoi } from './doi-tuong';
import type { MocThang } from './phan-loai';

export interface CauMa {
  cau: string;
  chip: string[];
  loiDi: LoiDiTiep[];
  goiModel: boolean;
}

const hoaDau = (s: string) => s.charAt(0).toLocaleUpperCase('vi') + s.slice(1);

/* ------------------------------------------------------------ khuôn D */

export const CAU_KHI_NAO =
  'Celes chưa có đủ dữ kiện để chọn chính xác một năm hoặc tháng tốt nhất mà không so từng mốc. Với lá số hiện tại, Celes có thể đọc một năm hoặc một tháng cụ thể nếu bạn chọn mốc đó.';

export function cauKhiNao(): CauMa {
  return { cau: CAU_KHI_NAO, chip: ['Năm nay thì sao?', 'Sang năm thì sao?'], loiDi: [], goiModel: false };
}

/* ------------------------------------------------------------ khuôn E */

export const CAU_HAI_VE =
  'Lá số hiện cho Celes đọc được bối cảnh của quyết định này, nhưng chưa đủ để kết luận một phương án chắc chắn tốt hơn phương án còn lại.';

/** Chip tách từng phương án người dùng gõ: "Ở lại thì sao?". */
export function chipHaiVe(haiVe: [string, string]): string[] {
  return haiVe.map((v) => `${hoaDau(v.trim())} thì sao?`);
}

export function cauHaiVe(haiVe: [string, string]): CauMa {
  return { cau: CAU_HAI_VE, chip: chipHaiVe(haiVe), loiDi: [], goiModel: true };
}

/* ----------------------------------------------------------- khuôn F2 */

export const CAU_VAN_RIENG =
  'Lá số này là của bạn, nên Celes không dùng nó để kết luận vận riêng của người khác. Celes vẫn có thể đọc mối quan hệ giữa hai người hoặc phần liên quan trực tiếp tới bạn.';

/** Lối sang nối hai lá số — cùng nhãn và đường với `loiDiTiep`. */
const LOI_HAI_LA_SO: LoiDiTiep = { nhan: 'Xem hai lá số cạnh nhau', duong: '/hop-tuoi' };

/**
 * Chip quan hệ: bấm vào ra khuôn F1, đúng cung lục thân (`nhanDangDoiTuong`
 * nhận "<người> tôi" + "hợp nhau" là `quan-he`).
 */
export function chipQuanHe(dt: DoiTuongCauHoi): string {
  return `Tôi với ${dt.nhan} tôi có hợp nhau không?`;
}

export function cauVanRieng(dt: DoiTuongCauHoi): CauMa {
  const banDoi = dt.vai === 'vo-chong' || dt.vai === 'nguoi-yeu';
  return { cau: CAU_VAN_RIENG, chip: [chipQuanHe(dt)], loiDi: banDoi ? [LOI_HAI_LA_SO] : [], goiModel: false };
}

/* ------------------------------------------------------- tháng nhuận */

const tenThang = (m: Pick<MocThang, 'thang'>, nhuan: boolean) => `tháng ${m.thang}${nhuan ? ' nhuận' : ''}`;
/** Năm khác năm đang chạy thì chip phải mang năm, không thì bấm vào đọc nhầm năm. */
const duoiNam = (nam: number, namNay: number) => (nam === namNay ? '' : ` năm ${nam}`);

export function cauHoiNhuan(m: MocThang, namNay: number): CauMa {
  const x = m.thang;
  return {
    cau: `Năm này có cả tháng ${x} thường và tháng ${x} nhuận. Cần xác định đúng tháng trước khi Celes đọc nguyệt hạn.`,
    chip: [`Tháng ${x}${duoiNam(m.nam, namNay)}`, `Tháng ${x} nhuận${duoiNam(m.nam, namNay)}`],
    loiDi: [],
    goiModel: false,
  };
}

/**
 * Người dùng đã chọn tháng X NHUẬN. Engine chỉ có nguyệt hạn theo số tháng,
 * không tách tháng nhuận — đọc tiếp là đưa vận tháng X thường ra như thể của
 * tháng nhuận: câu sai mà trông hợp lệ. Nên dừng hẳn (fail closed), trọn lượt,
 * không truy hồi, không gọi model. Chip "Tháng X" (thường) vẫn đọc được.
 */
export function cauNhuanChuaTach(m: MocThang, namNay: number): CauMa {
  const x = m.thang;
  return {
    cau: `Celes chưa tách riêng được vận của tháng ${x} nhuận năm ${m.nam}, nên chưa đọc phần này để không lẫn với tháng ${x} thường.`,
    chip: [`Tháng ${x}${duoiNam(m.nam, namNay)}`],
    loiDi: [],
    goiModel: false,
  };
}

/* ---------------------------------------------------- N2 tháng đã qua */

export function cauThangDaQua(m: MocThang): string {
  return `Bạn đang hỏi ${tenThang(m, m.nhuan === 'nhuan')} âm lịch năm ${m.nam}. Mốc này đã qua so với thời điểm hiện tại, nên phần dưới là đọc lại xu hướng của tháng đó, không phải dự báo sắp tới.`;
}

/* --------------------------------------------------- N4 cuối năm âm */

export const CAU_CUOI_NAM =
  'Phần này đang đọc quãng từ hiện tại đến hết năm âm này. Phần sau Tết thuộc năm mới và cần được xem riêng.';

/** Chip sang năm đứng ĐẦU: đó là điều người hỏi "sắp tới" thật sự sắp gặp. */
export function chipCuoiNam(namNay: number, goiY: string[]): string[] {
  const namSau = namNay + 1;
  const canChi = canChiCuaNam(namSau);
  const chip = `Sang năm ${canChi} thì sao?`;
  const con = goiY.filter((c) => !c.includes(canChi) && !c.includes(String(namSau)));
  return [chip, ...con].slice(0, 3);
}
