/**
 * CÂU DO MÃ VIẾT — đường Focused (CEL-186 vé B, quyết định #3 và #5).
 *
 * Những chỗ engine không có căn cứ để model tự nói (chọn mốc, chọn phương án,
 * vận của người khác, tháng nhuận) thì câu đầu do mã đặt, nguyên văn đã
 * duyệt. Model không viết lại, không "diễn giải" các câu này.
 *
 * Hai loại:
 *   - TRỌN LƯỢT (`goiModel: false`): trước ngày sinh, tháng nhuận (DỮ KIỆN); F2
 *     (HỎI LẠI, không tính lượt); AGE-02 (ngoại lệ tạm). Danh sách cho phép và
 *     luật của từng loại: `scripts/test-loi-chi-ma.ts`. D không còn ở đây (04/10).
 *   - CÂU DẪN (`goiModel: true`): E, N2, N4. Câu mã đứng đầu, model đọc phần
 *     dưới qua guard như mọi khuôn khác.
 *
 * Chip chỉ là thứ engine trả lời được (#5): không có "Tháng nào đáng chú ý hơn?".
 *
 * Mọi câu có bản VI và EN (chủ dự án 04/10): theo `ngonNgu` của người dùng.
 * Bản VI của tháng nhuận, N2 là nguyên văn chủ dự án duyệt 04/10 — đổi chữ
 * là phải duyệt lại. Câu hỏi lại F2 cũng là nguyên văn chủ dự án duyệt 04/10 (bước 1).
 */

import { canChiCuaNam } from '@/lib/tuvi/bay-gio';
import type { LoiDiTiep } from '../hinh-dang-tra-loi';
import { boDau } from '../thuc-the';
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

/*
 * F2 là lượt HỎI LẠI (chủ dự án 04/10): server không biết lá số đang mở là của
 * người hỏi hay của chính người được hỏi — đó là dữ kiện còn thiếu, không phải
 * chuyện luật chữ đoán được. Không tính lượt, và MỘT chạm phải trả lời được câu
 * gốc: chip đầu là chính câu người dùng, đổi "mẹ tôi" thành "người có lá số này".
 */
export function cauVanRieng(nn: NgonNgu = 'vi'): string {
  // Nguyên văn chủ dự án duyệt 04/10: "luận", không "đoán"; không khẳng định lá số là của ai.
  return nn === 'en'
    ? 'So that Celes doesn’t read someone’s personal fortune from the wrong chart, please tell Celes: is the open chart that of the person you’re asking about, or your own?'
    : 'Để Celes không luận vận riêng của một người bằng nhầm lá số, bạn cho Celes biết: lá số đang mở là của người bạn đang hỏi, hay là của bạn?';
}

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

export const NGUOI_CO_LA_SO = 'người có lá số này';

/**
 * Câu gốc, người được hỏi đổi thành chủ lá số: "Mẹ tôi năm nay sức khỏe thế nào?"
 * → "Người có lá số này năm nay sức khỏe thế nào?". Giữ nguyên chủ đề, mốc, lời
 * người dùng — chip này là câu của họ, không phải câu Celes đặt (nên cả giao diện
 * EN cũng giữ chữ họ gõ). Không tìm thấy cụm người thì null.
 */
export function chipLaSoCuaNguoiDuocHoi(cauHoi: string, dt: DoiTuongCauHoi): string | null {
  const cum = `(?:${thoat(dt.nhan)}|${thoat(boDau(dt.nhan))}) (?:của |cua )?(?:tôi|mình|em|tớ|toi|minh)`;
  const re = new RegExp(`(?<![\\p{L}\\p{M}])${cum}(?![\\p{L}\\p{M}])`, 'iu');
  const goc = cauHoi.normalize('NFC');
  const m = re.exec(goc);
  if (!m) return null;
  const ra = `${goc.slice(0, m.index)}${NGUOI_CO_LA_SO}${goc.slice(m.index + m[0].length)}`.trim();
  return m.index === 0 ? hoaDau(ra) : ra;
}

const thoat = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function hoiLaiVanRieng(cauHoi: string, dt: DoiTuongCauHoi, nn: NgonNgu = 'vi'): CauMa {
  const banDoi = dt.vai === 'vo-chong' || dt.vai === 'nguoi-yeu';
  const doc = chipLaSoCuaNguoiDuocHoi(cauHoi, dt);
  return {
    cau: cauVanRieng(nn),
    chip: [...(doc ? [doc] : []), chipQuanHe(dt, nn)],
    loiDi: banDoi ? [LOI_HAI_LA_SO[nn]] : [],
    goiModel: false,
  };
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

/** Chip duy nhất: tháng X âm THƯỜNG — thứ engine đọc được. Có chữ "âm" để không bị hiểu là tháng dương. */
const chipThangThuong = (m: MocThang, namNay: number, nn: NgonNgu) =>
  `${nn === 'en' ? 'Lunar month' : 'Tháng'} ${m.thang}${nn === 'en' ? '' : ' âm'}${duoiNam(m.nam, namNay, nn)}`;

const THANG_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const tenThangDuong = (d: NonNullable<MocThang['duong']>, nn: NgonNgu) =>
  nn === 'en' ? `${THANG_EN[d.thang - 1]} ${d.nam}` : `Tháng ${d.thang}/${d.nam}`;
/** "27/5 – 24/6" → " (từ 27/5 đến 24/6 dương lịch)" / " (27 May – 24 Jun)": người không quen âm lịch dễ đọc nhầm ngày trong ngoặc là ngày âm. */
const ngoac = (khoang: string | null, nn: NgonNgu) => {
  const m = khoang && /^(\d+)\/(\d+) – (\d+)\/(\d+)$/u.exec(khoang);
  if (!m) return '';
  if (nn !== 'en') return ` (từ ${m[1]}/${m[2]} đến ${m[3]}/${m[4]} dương lịch)`;
  const ten = (t: string) => THANG_EN[Number(t) - 1].slice(0, 3);
  return ` (${m[1]} ${ten(m[2])} – ${m[3]} ${ten(m[4])})`;
};
const THU_TU_EN = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];

/**
 * Đang đọc tháng X NHUẬN. Engine chỉ có nguyệt hạn theo số tháng, không tách
 * tháng nhuận — đọc tiếp là đưa vận tháng X thường ra như thể của tháng nhuận:
 * câu sai mà trông hợp lệ. Nên dừng hẳn (fail closed), trọn lượt, không truy
 * hồi, không gọi model.
 *
 * Hai đường vào: người dùng tự gõ "nhuận" (câu duyệt 04/10 + chip tháng X âm
 * thường), hoặc tháng DƯƠNG họ hỏi rơi phần lớn vào tháng nhuận (nói rõ quy đổi,
 * không chip — mời đọc tháng X thường là đổi câu hỏi của họ).
 */
export function cauNhuanChuaTach(m: MocThang, namNay: number, nn: NgonNgu = 'vi'): CauMa {
  if (m.duong) {
    const d = m.duong;
    const ten = tenThangDuong(d, nn);
    const thangAm = nn === 'en' ? `the leap lunar month ${m.thang}${namAm(m, nn)}${ngoac(d.khoang, nn)}` : `tháng ${m.thang} nhuận âm lịch${namAm(m, nn)}${ngoac(d.khoang, nn)}`;
    // TIME-05: người dùng hỏi tháng DƯƠNG — không nhắc "hai tháng ${m.thang}" hay "tách", họ không hỏi chuyện đó.
    const cau =
      nn === 'en'
        ? `Monthly fortune follows the lunar calendar, so Celes converts the month you asked about: ${d.ro ? `most of ${ten} falls in ${thangAm}` : `${ten} spans two lunar months, the longer part being ${thangAm}`}. Celes cannot read a leap month yet, so it will not read this month.`
        : `Vận tháng tính theo âm lịch, nên Celes quy đổi tháng bạn hỏi: ${d.ro ? `${ten.charAt(0).toLowerCase()}${ten.slice(1)} phần lớn nằm trong ${thangAm}` : `${ten.charAt(0).toLowerCase()}${ten.slice(1)} vắt qua hai tháng âm, phần dài hơn là ${thangAm}`}. Celes chưa đọc được vận của tháng nhuận, nên chưa luận tháng này.`;
    return { cau, chip: [], loiDi: [], goiModel: false };
  }
  return { cau: cauNhuan(m, nn), chip: [chipThangThuong(m, namNay, nn)], loiDi: [], goiModel: false };
}

/** Năm âm, chỉ khi khác năm dương người dùng hỏi (tháng 1–2 dương thường còn thuộc năm âm trước). */
const namAm = (m: MocThang, nn: NgonNgu) => (m.duong && m.duong.nam !== m.nam ? (nn === 'en' ? ` of ${m.nam}` : ` năm ${m.nam}`) : '');

/**
 * Người dùng hỏi tháng DƯƠNG (chủ dự án 04/10/2026). Nói rõ đang đọc theo tháng
 * âm nào — nguyệt hạn tính theo tháng âm, và một tháng dương vắt qua hai tháng âm.
 * Chỉ nói "phần lớn" khi tháng âm chiếm từ 60% số ngày. Tháng đã qua gộp luôn ý của N2.
 */
export function cauThangDuong(m: MocThang, nn: NgonNgu = 'vi'): string {
  const d = m.duong!;
  const ten = tenThangDuong(d, nn);
  const thangAm =
    nn === 'en' ? `lunar month ${m.thang}${namAm(m, nn)}${ngoac(d.khoang, nn)}` : `tháng ${m.thang} âm lịch${namAm(m, nn)}${ngoac(d.khoang, nn)}`;
  // TIME-01: nói rõ đây là quy đổi của Celes — người hỏi gọi tháng dương, không phải tháng âm.
  if (nn === 'en') {
    const quyDoi = d.ro
      ? `Monthly fortune follows the lunar calendar, so Celes reads ${ten} by the lunar month covering most of it: ${thangAm}.`
      : `Monthly fortune follows the lunar calendar; ${ten} spans two lunar months, so Celes reads the longer one: ${thangAm}.`;
    return m.trangThai === 'da-qua'
      ? `${ten} has already passed. ${quyDoi} What follows looks back at how that month tended to go; it is not a forecast for the time ahead.`
      : quyDoi;
  }
  const thuong = `${ten.charAt(0).toLowerCase()}${ten.slice(1)}`;
  const quyDoi = d.ro
    ? `Vận tháng tính theo âm lịch, nên Celes đọc ${thuong} theo tháng âm chiếm phần lớn của nó: ${thangAm}.`
    : `Vận tháng tính theo âm lịch; ${thuong} vắt qua hai tháng âm, nên Celes đọc theo tháng có phần dài hơn: ${thangAm}.`;
  return m.trangThai === 'da-qua'
    ? `${ten} đã qua. ${quyDoi} Phần dưới nhìn lại xu hướng của tháng ấy, không coi đây là dự báo cho thời gian sắp tới.`
    : quyDoi;
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

/* ------------------------------------------- giới hạn (AGE / PERSON) */

/*
 * Hai câu dừng trọn lượt, không truy hồi, không gọi model, KHÔNG tính lượt hỏi
 * (`khongTinhLuot`): lá số không có gì để đọc, người hỏi không mất gì.
 */

/** Mốc người dùng hỏi, dạng chữ — cho câu trước-ngày-sinh. */
export type MocHoi =
  | { loai: 'thang-duong'; nam: number; thang: number }
  | { loai: 'thang-am'; nam: number; thang: number; nhuan: boolean }
  | { loai: 'nam'; nam: number };

function tenMocHoi(m: MocHoi, nn: NgonNgu): string {
  if (m.loai === 'thang-duong') return nn === 'en' ? `${THANG_EN[m.thang - 1]} ${m.nam}` : `tháng ${m.thang}/${m.nam}`;
  if (m.loai === 'thang-am')
    return nn === 'en' ? `${m.nhuan ? 'leap ' : ''}lunar month ${m.thang} of ${m.nam}` : `tháng ${m.thang}${m.nhuan ? ' nhuận' : ''} âm lịch năm ${m.nam}`;
  return nn === 'en' ? `${m.nam}` : `năm ${m.nam}`;
}

/** AGE-01: mốc hỏi kết thúc trước ngày sinh — chưa có vận nào để đọc. */
export function cauTruocSinh(moc: MocHoi, sinh: { ngay: number; thang: number; nam: number }, nn: NgonNgu = 'vi'): CauMa {
  const ngaySinh = `${sinh.ngay}/${sinh.thang}/${sinh.nam}`;
  const ten = tenMocHoi(moc, nn);
  const cau =
    nn === 'en'
      ? `${hoaDau(ten)} is before the birth date on this chart (${ngaySinh}), so there is no fortune to read for it yet. You can ask about any time from the birth date onward.`
      : `${hoaDau(ten)} là trước ngày sinh của lá số này (${ngaySinh}), nên chưa có vận nào để đọc. Bạn có thể hỏi một mốc từ ngày sinh trở đi.`;
  const chip = nn === 'en' ? ['What is this chart’s temperament like?'] : ['Tính cách của lá số này thế nào?'];
  return { cau, chip, loiDi: [], goiModel: false };
}

/** AGE-02: chuyện người lớn (việc làm, hôn nhân, người yêu) ở tuổi chưa hợp — không kể. */
export function cauChuaHopTuoi(tuoi: number, nam: number, nn: NgonNgu = 'vi'): CauMa {
  const cau =
    nn === 'en'
      ? `In ${nam}, the person on this chart is only ${tuoi}. Work, marriage and romance are not something Celes reads at that age, so it will leave them out. You can ask about temperament, health or family for this chart instead.`
      : `Năm ${nam}, người có lá số này mới ${tuoi} tuổi. Ở tuổi ấy, công việc, hôn nhân hay người yêu chưa phải điều để luận, nên Celes xin để phần này lại. Bạn có thể hỏi về tính cách, sức khoẻ hoặc gia đình của lá số này.`;
  const chip = nn === 'en' ? ['What is this chart’s temperament like?', 'How is health for this chart?'] : ['Tính cách của lá số này thế nào?', 'Sức khoẻ của lá số này thế nào?'];
  return { cau, chip, loiDi: [], goiModel: false };
}
