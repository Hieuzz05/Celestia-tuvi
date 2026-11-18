/**
 * Chiều của một sao theo NGỮ CẢNH — thay cho nhãn cát / hung cố định.
 *
 * Quyết định của chủ dự án (11/11/2026, CELES-72): "Trong tử vi không được xét
 * mặc định một sao là tốt hay xấu", "phải xét các bộ sao liên kết", "không có
 * chuyện sao ở cung xung chiếu là lực cản", "không có sao nào luôn đắc".
 * Phương án và nguồn sách: docs/ra-soat/QUYET-DINH-2026-11-11.md và
 * D:\Celestia\PHUONG-AN-SAO-TOT-XAU-2026-11-11.md.
 *
 * Nhãn `Sao.tinhChat` vẫn còn trong engine nhưng CHỈ để mệnh bàn xếp sao vào
 * hai cột theo phân loại sách (lục cát / lục sát). Mọi chỗ LUẬN đọc hàm ở đây.
 * Máy canh: scripts/test-chieu-sao.ts.
 *
 * Năm mức:
 * - 'thuan'   : sao làm được việc của nó ở chỗ này
 * - 'hai-mat' : dùng được nhưng có giá, hoặc tốt xấu tuỳ cách dùng
 * - 'yeu'     : nét có mà không ra sức (cát tinh hãm, không gặp sát)
 * - 'can'     : thật sự gây vướng ở chỗ này
 * - 'trung'   : không nghiêng bên nào khi luận cả đời (sao vòng)
 *
 * Kết luận ở mức CUNG, kèm lý do theo từng cặp sao. Không cộng điểm từng sao.
 */
import type { Cung, LaSo } from './ansao';
import { tamPhuongTuChinh } from './ansao';
import { CHINH_TINH, TU_HOA, type Sao } from './constants';
import { doSangCuaSao } from './dosang';

export type Chieu = 'thuan' | 'hai-mat' | 'yeu' | 'can' | 'trung';

/** Mã lý do — để máy canh và người đọc mã biết vì sao ra chiều đó */
export type LyDo =
  | 'sang'
  | 'ham'
  | 'binh'
  | 'ham-gap-sat'
  | 'sat-dac'
  | 'sat-ham'
  | 'sat-bi-che'
  | 'chi-huy'
  | 'da-la-tu-sinh'
  | 'nhat-nguyet-gap-sat'
  | 'tuan-triet-giai'
  | 'tuan-triet-be'
  | 'xuong-khuc-nhat-nguyet'
  | 'ma-thuan'
  | 'ma-nghich'
  | 'ma-tuan'
  | 'ma-hoi'
  | 'ma-mot-minh'
  | 'hoa-goc-sang'
  | 'hoa-goc-ham'
  | 'ky-goc-sang'
  | 'ky-goc-ham'
  | 'ky-tu-mo'
  | 'ky-nhat-nguyet-suu-mui'
  | 'ky-thanh-long'
  | 'ky-khoa-quyen'
  | 'loc-ky'
  | 'ky-nhat-nguyet-ham'
  | 'ky-van-khuc'
  | 'loc-gap-khong-kiep'
  | 'loc-tuan-triet'
  | 'xuong-khuc-ky'
  | 'phu-gap-khong'
  | 'chi-huy-pha-cach'
  | 'ma-hoa-linh'
  | 'liem-tham-tuan'
  | 'goc-tot'
  | 'goc-xau'
  | 'goc-trung'
  | 'sao-vong'
  | 'sao-luu'
  | 'ky-tuan'
  | 'ky-triet'
  | 'ky-triet-kiep'
  | 'triet-tien-van'
  | 'hinh-tuan-triet'
  /** Không có câu sách nào khớp bộ đang có: không nói tốt xấu, chỉ nêu tính chất sao */
  | 'chua-du-bo'
  /** Sao chỉ dùng xem hạn (Thương, Sứ, La, Võng): trên lá số gốc không định chiều */
  | 'sao-xem-han'
  | 'la-vong-da-la'
  | 'theo-cung'
  | 'theo-bo'
  | 'gap-sat'
  | 'tuoi';

export interface KetQuaChieu {
  chieu: Chieu;
  ly: LyDo[];
}

const CHINH = new Set<string>(CHINH_TINH);
/** Lục sát — sáu sao sách gọi là sát tinh */
export const SAT_TINH = new Set(['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp']);
const KHONG_KIEP = new Set(['Địa Không', 'Địa Kiếp']);
const SANG = new Set(['M', 'V', 'D']);
/** Tứ mộ: Sửu Thìn Mùi Tuất */
const TU_MO = new Set([1, 4, 7, 10]);
const SUU_MUI = new Set([1, 7]);
const HOI = 11;

/**
 * Nhóm sách xếp là "phúc tinh / trợ tinh". KHÔNG phải kết luận: mỗi sao vẫn xét bộ đi cùng
 * trong `chieuPhuTinh` (Tả Hữu gặp sát thì trợ hoạ, Việt gặp Hỏa Linh Kình Hình, Hồng Hỷ gặp
 * Kỵ Kiếp). Chuyên gia 12/11/2026.
 */
const GOC_TOT = new Set([
  'Lộc Tồn', 'Thiên Khôi', 'Thiên Việt', 'Tả Phù', 'Hữu Bật', 'Thiên Y', 'Văn Xương', 'Văn Khúc',
  'Thai Phụ', 'Phong Cáo', 'Long Trì', 'Phượng Các', 'Hồng Loan', 'Thiên Hỷ', 'Thiên Đức',
  'Nguyệt Đức', 'Tam Thai', 'Bát Tọa', 'Ân Quang', 'Thiên Quý', 'Quốc Ấn', 'Thiên Trù', 'Thiên Quan',
  'Thiên Phúc', 'LN Văn Tinh', 'Giải Thần', 'Thiên Thọ', 'Địa Giải', 'Thiên Giải',
]);
/**
 * Sao sách xếp xấu và CÓ bảng độ sáng (dosang.ts): đắc thì hai mặt, hãm thì cản.
 * Mười sao còn lại (Kiếp Sát, Thiên Không, Cô Quả, Lưu Hà, Phá Toái, Thương Sứ, La Võng)
 * không có bảng dùng được, nên xét theo cung và bộ đi cùng ở `chieuPhuTinhKhongDoSang`;
 * không câu sách nào khớp thì 'trung', không mặc định 'can' (chuyên gia 12/11/2026).
 */
const GOC_XAU = new Set(['Thiên Hình', 'Thiên Riêu', 'Thiên Khốc', 'Thiên Hư']);
const SAO_XEM_HAN = new Set(['Thiên Thương', 'Thiên Sứ']);
const LA_VONG = new Set(['Thiên La', 'Địa Võng']);
/** Dần Thân Tỵ Hợi */
const TU_SINH = new Set([2, 5, 8, 11]);

/**
 * Sao lưu theo năm: xét như sao gốc cùng tên đặt vào cung nó đứng — độ sáng theo
 * bảng đắc hãm, bộ đi cùng là các sao gốc ở đó. Không bảng gán sẵn theo tên.
 * Nguồn: "Các sao này vẫn bị chi phối bởi những quy tắc về hội tụ, về vị trí…"
 * (TVTH:1101), "Vị trí đắc hay hãm địa của sao Lưu giống như vị trí sao cố định"
 * (TVTH:1105), "Sao Lưu vẫn bị ảnh hưởng của Tuần Triệt" (TVTH:1106).
 * Chủ dự án quyết 19/11/2026 (CELES-90): không sao nào mặc định thuận / cản.
 */
export function chieuSaoLuu(laSo: LaSo, ten: string, chiIndex: number): KetQuaChieu {
  const tenGoc = ten.replace(/^Lưu /, '');
  const mau = laSo.cungs.flatMap((c) => c.sao).find((x) => x.ten === tenGoc);
  const s: Sao = { ten: tenGoc, loai: mau?.loai ?? 'phu-tinh', doSang: doSangCuaSao(tenGoc, chiIndex) };
  const cung = laSo.cungs[chiIndex];
  return chieuSao(laSo, { ...cung, sao: [...cung.sao, s] }, s);
}

/**
 * Tứ hoá theo hạn (lưu niên / đại vận): cùng lối với tứ hoá gốc — tuỳ sao được hoá
 * sáng hay hãm, gặp Lộc / Không Kiếp / Tuần Triệt / Khoa… (TT2:656-667), không gán
 * sẵn "Kỵ là cản, còn lại là đỡ". `tenSao` là sao nhận hoá trong hạn đó.
 */
export function chieuTuHoaHan(laSo: LaSo, hoa: string, tenSao: string, chiIndex: number): KetQuaChieu {
  const cung = laSo.cungs[chiIndex];
  const s: Sao = { ten: hoa, loai: 'tu-hoa' };
  const goc = cung.sao.find((x) => x.ten === tenSao);
  return chieuTuHoa(laSo, { ...cung, sao: [...cung.sao, s] }, s, goc);
}

// ---------------------------------------------------------------------------
// Tiện ích đọc lá số
// ---------------------------------------------------------------------------

function tenTrong(cung: Cung): Set<string> {
  return new Set(cung.sao.map((s) => s.ten));
}

/** Đồng cung + tam hợp + xung chiếu */
function vungTPTC(laSo: LaSo, cung: Cung): Cung[] {
  const { tamHop, xungChieu } = tamPhuongTuChinh(cung.chiIndex);
  return [cung, laSo.cungs[tamHop[0]], laSo.cungs[tamHop[1]], laSo.cungs[xungChieu]];
}

function gapTrongVung(laSo: LaSo, cung: Cung, ten: string | Set<string>): Sao[] {
  const khop = (t: string) => (typeof ten === 'string' ? t === ten : ten.has(t));
  return vungTPTC(laSo, cung).flatMap((c) => c.sao.filter((s) => khop(s.ten)));
}

function coTrongVung(laSo: LaSo, cung: Cung, ten: string | Set<string>): boolean {
  return gapTrongVung(laSo, cung, ten).length > 0;
}

/** Sát tinh hãm và không bị Tử Vi / Thiên Phủ chế, trong tam phương tứ chính */
function coSatHamTrongVung(laSo: LaSo, cung: Cung): boolean {
  return gapTrongVung(laSo, cung, SAT_TINH).some(
    (s) => !(s.doSang && SANG.has(s.doSang)) && !satBiChe(laSo, cung, s.ten)
  );
}

/**
 * Sát tinh bị Tử Vi / Thiên Phủ chế (VTL:309, KL:2458).
 * - Không Kiếp không sao chế được (chuyên gia, 12/11).
 * - Tử, Phủ phải sáng mới chế; Tử Phủ hãm thì tự mình còn chưa vững.
 */
function satBiChe(laSo: LaSo, cung: Cung, tenSat: string): boolean {
  if (KHONG_KIEP.has(tenSat)) return false;
  return gapTrongVung(laSo, cung, new Set(['Tử Vi', 'Thiên Phủ'])).some(
    (s) => !!s.doSang && SANG.has(s.doSang)
  );
}

/**
 * Hóa Kỵ trong tam phương đủ nặng để làm sao hãm thành cản. Sức nặng theo vị trí
 * (HS:737 toạ thủ > chiếu, HS:741 xung > hợp chiếu):
 * - đồng cung hoặc xung chiếu: Kỵ chưa tự thành tốt là tính;
 * - tam hợp: chỉ Kỵ ra 'can'.
 */
function coKyXauTrongVung(laSo: LaSo, cung: Cung): boolean {
  const { tamHop, xungChieu } = tamPhuongTuChinh(cung.chiIndex);
  const kyCua = (c: Cung) =>
    c.sao.filter((s) => s.ten === 'Hóa Kỵ').map((s) => chieuTuHoa(laSo, c, s).chieu);
  if ([cung, laSo.cungs[xungChieu]].some((c) => kyCua(c).some((ch) => ch !== 'thuan'))) return true;
  return tamHop.some((i) => kyCua(laSo.cungs[i]).includes('can'));
}

/** Sao gốc được hoá của một sao Tứ Hoá trong cung này */
export function saoGocCuaHoa(laSo: LaSo, cung: Cung, tenHoa: string): Sao | undefined {
  const viTri = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'].indexOf(tenHoa);
  if (viTri < 0) return undefined;
  const tenGoc = TU_HOA[laSo.canNamIndex]?.[viTri];
  return cung.sao.find((s) => s.ten === tenGoc);
}

const NANG = (c: Chieu): Chieu => (c === 'thuan' ? 'hai-mat' : c === 'hai-mat' ? 'can' : c === 'yeu' ? 'can' : c);
const NHE = (c: Chieu): Chieu => (c === 'can' ? 'hai-mat' : c === 'yeu' ? 'hai-mat' : c);

// ---------------------------------------------------------------------------
// Từng nhóm sao
// ---------------------------------------------------------------------------

function chieuChinhTinh(laSo: LaSo, cung: Cung, s: Sao): KetQuaChieu {
  const ts = tenTrong(cung);
  const sang = !!s.doSang && SANG.has(s.doSang);
  const ham = s.doSang === 'H';
  const tuanTriet = cung.coTuan || cung.coTriet;
  const nhatNguyet = s.ten === 'Thái Âm' || s.ten === 'Thái Dương';

  /*
   * Nhật Nguyệt ở Sửu Mùi gặp Tuần Triệt: tối mà hoá sáng (HS:1684, KL:683/1166).
   * Xét sát tinh TRƯỚC: "kỉ phùng sát tinh" (KL:682), "kỉ phùng Kiếp, Triệt" (Chìa khóa:1170).
   * Tuần và Triệt tách: Triệt mạnh ở tiền vận (HS:4248, AB:4819), sách chỉ khen chắc Tuần (AB:4245).
   * Chuyên gia 12/11/2026.
   */
  if (nhatNguyet && SUU_MUI.has(cung.chiIndex) && tuanTriet) {
    const coSat = ts.has('Kình Dương') || ts.has('Đà La') || ts.has('Địa Kiếp');
    if (coSat) {
      return cung.coTuan
        ? { chieu: 'hai-mat', ly: ['tuan-triet-giai', 'nhat-nguyet-gap-sat'] }
        : { chieu: 'can', ly: ['nhat-nguyet-gap-sat', 'triet-tien-van'] };
    }
    if (cung.coTuan) return { chieu: 'thuan', ly: ['tuan-triet-giai'] };
    return { chieu: 'hai-mat', ly: ['tuan-triet-giai', 'triet-tien-van'] };
  }
  // Thiên Phủ gặp Tuần hoặc Thiên Không đồng cung: kho rỗng (KL:2457)
  if (s.ten === 'Thiên Phủ' && (cung.coTuan || ts.has('Thiên Không'))) {
    return { chieu: 'can', ly: ['phu-gap-khong'] };
  }
  // Liêm Tham ở Tỵ Hợi gặp Tuần: phản vi kỳ cách (chuyên gia, 12/11)
  if (
    (s.ten === 'Liêm Trinh' || s.ten === 'Tham Lang') &&
    (cung.chiIndex === 5 || cung.chiIndex === HOI) &&
    cung.coTuan
  ) {
    return { chieu: 'thuan', ly: ['liem-tham-tuan'] };
  }

  if (sang) {
    // Sao sáng gặp Tuần Triệt thì bị bẻ, nét còn mà không ra sức (HS:4252, AB:4817)
    if (tuanTriet) return { chieu: 'yeu', ly: ['sang', 'tuan-triet-be'] };
    // Thiên Phủ gặp Không Kiếp thì bị lấn (KL:2457)
    if (s.ten === 'Thiên Phủ' && (ts.has('Địa Không') || ts.has('Địa Kiếp'))) {
      return { chieu: 'hai-mat', ly: ['sang', 'phu-gap-khong'] };
    }
    // Nhật Nguyệt sợ Kình Đà đồng cung dù sáng hay tối (NLTT:467)
    if (nhatNguyet && (ts.has('Kình Dương') || ts.has('Đà La'))) {
      return { chieu: 'hai-mat', ly: ['sang', 'nhat-nguyet-gap-sat'] };
    }
    // Thiên Đồng chỉ ngại Không Kiếp, Kỵ, Hình
    if (s.ten === 'Thiên Đồng') {
      if (['Địa Không', 'Địa Kiếp', 'Hóa Kỵ', 'Thiên Hình'].some((t) => ts.has(t))) {
        return { chieu: 'hai-mat', ly: ['sang', 'nhat-nguyet-gap-sat'] };
      }
      return { chieu: 'thuan', ly: ['sang'] };
    }
    // Nhật Nguyệt, Cơ, Lương gặp sát tinh hãm thì bị chi phối (NLTT:467, KL:2459)
    const deBiChiPhoi = ['Thái Dương', 'Thái Âm', 'Thiên Cơ', 'Thiên Lương'].includes(s.ten);
    if (deBiChiPhoi && coSatHamTrongVung(laSo, cung)) {
      return { chieu: 'hai-mat', ly: ['sang', 'nhat-nguyet-gap-sat'] };
    }
    return { chieu: 'thuan', ly: ['sang'] };
  }

  if (ham) {
    // Sao hãm gặp Tuần Triệt thì giảm xấu (HS:4252, KL:1163)
    if (tuanTriet) return { chieu: 'hai-mat', ly: ['ham', 'tuan-triet-giai'] };
    // Nhật Nguyệt hãm vẫn sợ Kình Đà đồng cung
    if (nhatNguyet && (ts.has('Kình Dương') || ts.has('Đà La'))) {
      return { chieu: 'can', ly: ['ham-gap-sat'] };
    }
    // Cát hãm chỉ thành cản khi gặp sát tinh hoặc Kỵ chưa tự thành tốt (VTL:647)
    if (coSatHamTrongVung(laSo, cung) || coKyXauTrongVung(laSo, cung)) {
      return { chieu: 'can', ly: ['ham-gap-sat'] };
    }
    return { chieu: 'yeu', ly: ['ham'] };
  }

  // Bình hoà
  return { chieu: 'hai-mat', ly: ['binh'] };
}

/** Sao chỉ huy được từng sát tinh, phải ĐỒNG CUNG (NLTT:457, KL:3071) */
const CHI_HUY: Record<string, string> = {
  'Địa Không': 'Phá Quân',
  'Địa Kiếp': 'Phá Quân',
  'Kình Dương': 'Thất Sát',
  'Đà La': 'Thất Sát',
  'Hỏa Tinh': 'Tham Lang',
  'Linh Tinh': 'Tham Lang',
};

function chieuSatTinh(laSo: LaSo, cung: Cung, s: Sao): KetQuaChieu {
  const ts = tenTrong(cung);
  const tuSinh = [2, 5, 8, 11].includes(cung.chiIndex);
  // Đà La đi với Thất Sát ở tứ sinh tính như đắc trong cặp chỉ huy (chuyên gia, 12/11)
  const dac =
    (!!s.doSang && SANG.has(s.doSang)) || (s.ten === 'Đà La' && tuSinh && ts.has('Thất Sát'));
  const tuanTriet = cung.coTuan || cung.coTriet;

  // Cặp chỉ huy: sát tinh đắc + sao chỉ huy đồng cung
  const chiHuy = cung.sao.find((x) => x.ten === CHI_HUY[s.ten]);
  if (dac && chiHuy) {
    if (tuanTriet || ts.has('Thiên Tài')) return { chieu: 'yeu', ly: ['chi-huy', 'chi-huy-pha-cach'] };
    return { chieu: chiHuy.doSang === 'H' ? 'hai-mat' : 'thuan', ly: ['chi-huy'] };
  }

  // Đà La ở tứ sinh: hai mặt, không xếp nghịch
  if (s.ten === 'Đà La' && tuSinh) return { chieu: 'hai-mat', ly: ['da-la-tu-sinh'] };

  // Sát tinh đắc: hai mặt, dùng được (VTL:2109, HS:2756, KL:1962); gặp Tuần Triệt thì yếu đi
  if (dac) {
    if (tuanTriet) return { chieu: 'yeu', ly: ['sat-dac', 'tuan-triet-be'] };
    return { chieu: 'hai-mat', ly: ['sat-dac'] };
  }

  // Hãm gặp Tuần Triệt: giảm xấu
  if (tuanTriet) return { chieu: 'hai-mat', ly: ['sat-ham', 'tuan-triet-giai'] };

  // Bị Tử Vi / Thiên Phủ sáng chế (VTL:309, KL:2458)
  if (satBiChe(laSo, cung, s.ten)) return { chieu: 'hai-mat', ly: ['sat-bi-che'] };

  return { chieu: 'can', ly: ['sat-ham'] };
}

function chieuThienMa(laSo: LaSo, cung: Cung): KetQuaChieu {
  const ts = tenTrong(cung);
  // Nghịch: chiết túc, Mã gặp Đà / Hình / Tuyệt / Tuần / Triệt / Không (KL:2084-2088, VTL:706-707)
  if (
    ts.has('Đà La') ||
    ts.has('Thiên Hình') ||
    ts.has('Thiên Không') ||
    ts.has('Địa Không') ||
    cung.coTriet ||
    cung.coTuan ||
    cung.trangSinh === 'Tuyệt'
  ) {
    return { chieu: 'can', ly: [cung.coTuan ? 'ma-tuan' : 'ma-nghich'] };
  }
  const coLoc = coTrongVung(laSo, cung, new Set(['Lộc Tồn', 'Hóa Lộc']));
  // Mã ở Hợi: một mình thì vất vả, có Lộc thì đỡ
  if (cung.chiIndex === HOI) return { chieu: coLoc ? 'hai-mat' : 'can', ly: ['ma-hoi'] };
  // Mã gặp Hỏa Linh đồng cung: chiến mã, hai mặt
  if (ts.has('Hỏa Tinh') || ts.has('Linh Tinh')) return { chieu: 'hai-mat', ly: ['ma-hoa-linh'] };

  const nhatNguyetSang = gapTrongVung(laSo, cung, new Set(['Thái Dương', 'Thái Âm'])).some(
    (s) => !!s.doSang && SANG.has(s.doSang)
  );
  const tuPhu = coTrongVung(laSo, cung, new Set(['Tử Vi', 'Thiên Phủ']));
  if (coLoc || tuPhu || nhatNguyetSang) return { chieu: 'thuan', ly: ['ma-thuan'] };
  return { chieu: 'hai-mat', ly: ['ma-mot-minh'] };
}

function chieuTuHoa(
  laSo: LaSo,
  cung: Cung,
  s: Sao,
  goc: Sao | undefined = saoGocCuaHoa(laSo, cung, s.ten)
): KetQuaChieu {
  const ts = tenTrong(cung);
  const gocHam = goc?.doSang === 'H';
  const tuanTriet = cung.coTuan || cung.coTriet;
  const khongKiep = ts.has('Địa Không') || ts.has('Địa Kiếp');

  if (s.ten !== 'Hóa Kỵ') {
    // Lộc gặp Không Kiếp đồng cung: lộc khó giữ (VTL:701)
    if (s.ten === 'Hóa Lộc' && khongKiep) return { chieu: 'can', ly: ['loc-gap-khong-kiep'] };
    // Lộc Quyền Khoa gặp Tuần Triệt: giảm tác dụng; thêm Không Kiếp thì thành cản
    if (tuanTriet) {
      return khongKiep
        ? { chieu: 'can', ly: ['loc-tuan-triet', 'loc-gap-khong-kiep'] }
        : { chieu: 'hai-mat', ly: ['loc-tuan-triet'] };
    }
    if (s.ten === 'Hóa Lộc' && ts.has('Hóa Kỵ')) return { chieu: 'hai-mat', ly: ['loc-ky'] };
    if (gocHam) return { chieu: 'hai-mat', ly: ['hoa-goc-ham'] };
    return { chieu: 'thuan', ly: ['hoa-goc-sang'] };
  }

  // --- Hóa Kỵ ---
  // Thành tốt: Kỵ với Nhật Nguyệt ở Sửu Mùi CHỈ khi đã có Tuần Triệt (HS:1749); không có
  // thì để luật chung (Kỵ ở tứ mộ nhẹ đi). Chuyên gia 12/11/2026.
  if ((ts.has('Thái Dương') || ts.has('Thái Âm')) && SUU_MUI.has(cung.chiIndex) && tuanTriet) {
    return { chieu: 'thuan', ly: ['ky-nhat-nguyet-suu-mui', 'tuan-triet-giai'] };
  }
  if (ts.has('Thanh Long')) return { chieu: 'thuan', ly: ['ky-thanh-long'] };

  // Theo sao gốc được hoá (TT2:667): chỉ sao gốc HÃM mới thành cản, bình hoà là hai mặt
  let chieu: Chieu = gocHam ? 'can' : 'hai-mat';
  const ly: LyDo[] = [gocHam ? 'ky-goc-ham' : 'ky-goc-sang'];

  // Nặng thêm
  if (ts.has('Hóa Lộc') || ts.has('Lộc Tồn')) {
    chieu = 'can';
    ly.push('loc-ky');
  }
  const nhatNguyetHam = cung.sao.some(
    (x) => (x.ten === 'Thái Dương' || x.ten === 'Thái Âm') && x.doSang === 'H'
  );
  if (nhatNguyetHam) {
    chieu = 'can';
    ly.push('ky-nhat-nguyet-ham');
  }
  if (ts.has('Văn Khúc') || ts.has('Văn Xương')) {
    chieu = NANG(chieu);
    ly.push('ky-van-khuc');
  }
  /*
   * Tuần Triệt KHÔNG làm Kỵ nhẹ đi (TVƯD-PT:3081/3088/3099, TVƯD-CT:1576, AB:5357,
   * NLTT:493/1705). Luật chung "sao xấu gặp Tuần Triệt bớt xấu" (HS:4252) chính sách đó
   * rào là không tuyệt đối (HS:4253). Chỉ ghi lý do để lời luận nói "âm ỉ, kéo dài" (Tuần)
   * hay "nặng ở giai đoạn đầu đời" (Triệt). Triệt + Địa Kiếp đồng cung thì nặng thêm.
   */
  if (cung.coTuan) ly.push('ky-tuan');
  if (cung.coTriet) {
    ly.push('ky-triet');
    if (ts.has('Địa Kiếp')) {
      chieu = NANG(chieu);
      ly.push('ky-triet-kiep');
    }
  }

  // Nhẹ đi: chỉ Hóa Khoa giải Kỵ, Quyền không giải
  const coLocKy = ly.includes('loc-ky');
  if (ts.has('Hóa Khoa') && !coLocKy) {
    chieu = NHE(chieu);
    ly.push('ky-khoa-quyen');
  }
  if (TU_MO.has(cung.chiIndex) && !coLocKy) {
    chieu = NHE(chieu);
    ly.push('ky-tu-mo');
  }
  return { chieu, ly };
}

function chieuPhuTinh(laSo: LaSo, cung: Cung, s: Sao): KetQuaChieu {
  const ts = tenTrong(cung);
  const tuanTriet = cung.coTuan || cung.coTriet;
  const khongKiep = ts.has('Địa Không') || ts.has('Địa Kiếp');

  // Xương Khúc: có bảng độ sáng
  if (s.ten === 'Văn Xương' || s.ten === 'Văn Khúc') {
    if (ts.has('Hóa Kỵ')) return { chieu: 'can', ly: ['xuong-khuc-ky'] };
    if (tuanTriet) return { chieu: 'hai-mat', ly: ['tuan-triet-be'] };
    if (ts.has('Thái Dương') || ts.has('Thái Âm')) return { chieu: 'thuan', ly: ['xuong-khuc-nhat-nguyet'] };
    if (s.doSang && SANG.has(s.doSang)) return { chieu: 'thuan', ly: ['sang'] };
    if (coSatHamTrongVung(laSo, cung) || coKyXauTrongVung(laSo, cung)) {
      return { chieu: 'can', ly: ['ham-gap-sat'] };
    }
    return { chieu: 'yeu', ly: ['ham'] };
  }

  // Lộc Tồn. Kiếp Sát, Lưu Hà là "hai đại khắc tinh của Lộc tồn" (KL:2635-2637).
  if (s.ten === 'Lộc Tồn') {
    if (khongKiep) return { chieu: 'can', ly: ['loc-gap-khong-kiep'] };
    if (ts.has('Kiếp Sát') || ts.has('Lưu Hà')) return { chieu: 'can', ly: ['theo-bo'] };
    if (tuanTriet) return { chieu: 'hai-mat', ly: ['loc-tuan-triet'] };
    if (ts.has('Hóa Kỵ')) return { chieu: 'hai-mat', ly: ['loc-ky'] };
    return { chieu: 'thuan', ly: ['goc-tot'] };
  }

  if (GOC_TOT.has(s.ten)) {
    // Tả Hữu đi với sát tinh hãm / Kỵ xấu thì "trợ hoạ" (TVTH:3468, 3484)
    if ((s.ten === 'Tả Phù' || s.ten === 'Hữu Bật') && (coSatHamTrongVung(laSo, cung) || coKyXauTrongVung(laSo, cung))) {
      return { chieu: 'hai-mat', ly: ['goc-tot', 'gap-sat'] };
    }
    // Khôi Việt gặp Hỏa Linh, Kình, Hình đồng cung (TVTH:3485, 3508)
    if ((s.ten === 'Thiên Khôi' || s.ten === 'Thiên Việt') &&
        ['Hỏa Tinh', 'Linh Tinh', 'Kình Dương', 'Thiên Hình'].some((t) => ts.has(t))) {
      return { chieu: 'hai-mat', ly: ['goc-tot', 'gap-sat'] };
    }
    // Hồng Hỷ gặp Kỵ, Địa Kiếp: tình duyên trắc trở (TĐ:842, TĐ:851, KL:2616)
    if ((s.ten === 'Hồng Loan' || s.ten === 'Thiên Hỷ') && (ts.has('Hóa Kỵ') || ts.has('Địa Kiếp'))) {
      return { chieu: 'hai-mat', ly: ['goc-tot', 'gap-sat'] };
    }
    if (tuanTriet) return { chieu: 'hai-mat', ly: ['goc-tot', 'tuan-triet-be'] };
    return { chieu: 'thuan', ly: ['goc-tot'] };
  }

  // Thiên Hình gặp Tuần Triệt: "kiếm gẫy", dễ mất việc (KL:2647). Đắc thì bị bẻ;
  // hãm thì bớt tai hoạ nhưng vẫn mang điềm ấy, không lên thuận. Chuyên gia 12/11/2026.
  if (s.ten === 'Thiên Hình' && tuanTriet) {
    return s.doSang && SANG.has(s.doSang)
      ? { chieu: 'yeu', ly: ['hinh-tuan-triet', 'tuan-triet-be'] }
      : { chieu: 'hai-mat', ly: ['hinh-tuan-triet', 'tuan-triet-giai'] };
  }

  if (GOC_XAU.has(s.ten)) {
    // Sao có bảng độ sáng mà đắc thì hai mặt
    if (s.doSang && SANG.has(s.doSang)) return { chieu: 'hai-mat', ly: ['sat-dac'] };
    if (tuanTriet) return { chieu: 'hai-mat', ly: ['goc-xau', 'tuan-triet-giai'] };
    return { chieu: 'can', ly: ['goc-xau'] };
  }

  return chieuPhuTinhKhongDoSang(laSo, cung, s) ?? { chieu: 'trung', ly: ['goc-trung'] };
}

/**
 * Mười phụ tinh không có bảng độ sáng dùng được. Luật theo bảng chuyên gia 12/11/2026
 * (trích sách ở từng dòng). Thứ tự: cung đóng → bộ chính tinh → sao làm nặng → sao chế giải
 * → tuổi. Không khớp câu nào thì 'trung' + 'chua-du-bo': lời luận chỉ nêu tính chất sao.
 * Trả undefined nếu không phải một trong mười sao.
 */
function chieuPhuTinhKhongDoSang(laSo: LaSo, cung: Cung, s: Sao): KetQuaChieu | undefined {
  const ts = tenTrong(cung);
  const tuanTriet = cung.coTuan || cung.coTriet;
  const tc = cung.tenCung;
  const TRUNG: KetQuaChieu = { chieu: 'trung', ly: ['chua-du-bo'] };

  // Thương Sứ: "chỉ dùng để xem hạn" (HS:4057, TĐ:1510, TVTH:3497). Lớp hạn xét riêng.
  if (SAO_XEM_HAN.has(s.ten)) return { chieu: 'trung', ly: ['sao-xem-han'] };

  // La Võng: chỉ tác động khi Mệnh / Thân đóng ở đó VÀ có Đà La (NLTT:372, 377; KL:2669)
  if (LA_VONG.has(s.ten)) {
    if (!((cung.laCungMenh || cung.laCungThan) && ts.has('Đà La'))) return { chieu: 'trung', ly: ['sao-xem-han'] };
    // Tuần Triệt, Tử Vi, Hóa Khoa, Thiên Giải, Giải Thần chế bớt (HS:2809, HS:3944)
    if (tuanTriet || ['Tử Vi', 'Hóa Khoa', 'Thiên Giải', 'Giải Thần'].some((t) => ts.has(t))) {
      return { chieu: 'hai-mat', ly: ['la-vong-da-la', 'tuan-triet-giai'] };
    }
    return { chieu: 'can', ly: ['la-vong-da-la'] };
  }

  if (s.ten === 'Kiếp Sát') {
    let kq: KetQuaChieu = TRUNG;
    // Khắc Lộc Tồn (KL:2636); đi với Kình Đà, Kỵ thì tác hoạ mạnh (HS:3170, AB:1138)
    if (ts.has('Lộc Tồn') || ts.has('Hóa Lộc')) kq = { chieu: 'can', ly: ['theo-bo'] };
    else if (ts.has('Kình Dương') || ts.has('Đà La') || ts.has('Hóa Kỵ')) kq = { chieu: 'can', ly: ['gap-sat'] };
    else if (ts.has('Thất Sát') || ts.has('Phá Quân')) {
      // Quan Lộc + Thất Sát: "can đảm, oai hùng" (TĐ:886); ở chỗ khác hai mặt (HS:3170)
      kq = tc === 'Quan Lộc' ? { chieu: 'thuan', ly: ['theo-bo', 'theo-cung'] } : { chieu: 'hai-mat', ly: ['theo-bo'] };
    } else if (ts.has('Thiên Tướng') || ts.has('Thiên Y')) kq = { chieu: 'hai-mat', ly: ['theo-bo'] };
    if (kq.chieu !== 'trung') {
      if (tuanTriet || ts.has('Thiên Giải')) kq = { chieu: NHE(kq.chieu), ly: [...kq.ly, 'tuan-triet-giai'] };
      // Tuổi Ất, Tân rất kỵ Kiếp Sát (CK:1216)
      if (laSo.canNamIndex === 1 || laSo.canNamIndex === 7) kq = { chieu: NANG(kq.chieu), ly: [...kq.ly, 'tuoi'] };
    }
    return kq;
  }

  if (s.ten === 'Thiên Không') {
    // Đắc ở Dần Thân Tỵ Hợi (KL:2028, HS:3925) nhưng đắc nghĩa là "hoạnh phát hoạnh phá": hai mặt
    const dac = TU_SINH.has(cung.chiIndex);
    if (tc === 'Tật Ách') {
      // Ít bệnh (HS:3916, TĐ:1430); gặp Tuần Triệt thì "bệnh khó khỏi" (TĐ:1435)
      return tuanTriet ? { chieu: 'hai-mat', ly: ['theo-cung', 'tuan-triet-be'] } : { chieu: 'thuan', ly: ['theo-cung'] };
    }
    if (ts.has('Phục Binh') && ts.has('Kiếp Sát')) return { chieu: 'can', ly: ['theo-bo'] };
    if (ts.has('Hồng Loan') || ts.has('Đào Hoa')) return { chieu: 'hai-mat', ly: ['theo-bo'] };
    if (ts.has('Lộc Tồn') || ts.has('Hóa Lộc')) return { chieu: 'hai-mat', ly: ['theo-bo'] };
    if (tc === 'Tài Bạch' || tc === 'Điền Trạch' || tc === 'Quan Lộc') {
      return dac ? { chieu: 'hai-mat', ly: ['theo-cung', 'sat-dac'] } : { chieu: 'can', ly: ['theo-cung'] };
    }
    // Tứ mộ một mình: "vị trí nguy khốn" (NL74:288)
    if (TU_MO.has(cung.chiIndex)) return { chieu: 'can', ly: ['ham'] };
    if (dac) return { chieu: 'hai-mat', ly: ['sat-dac'] };
    return TRUNG;
  }

  if (s.ten === 'Lưu Hà') {
    // Hà Cự Kỵ, Hà Kiếp Kình, Không Kiếp (HS:3412, TVTH:3487); khắc Lộc Tồn (KL:2637)
    if ((ts.has('Cự Môn') && ts.has('Hóa Kỵ')) || (ts.has('Kình Dương') && ts.has('Địa Kiếp')) ||
        (ts.has('Địa Không') && ts.has('Địa Kiếp')) || ts.has('Lộc Tồn')) {
      return { chieu: 'can', ly: ['gap-sat'] };
    }
    // Thanh Long: "Hà Long đắc thời" (TĐ:978, HS:3409); Hợi là cung Thủy hợp vị (HS:3404)
    if (ts.has('Thanh Long') || cung.chiIndex === HOI) return { chieu: 'hai-mat', ly: ['theo-bo'] };
    // Một mình sách nêu cả hai mặt: hùng biện và tai nạn sông nước (HS:3402)
    return { chieu: 'hai-mat', ly: ['theo-bo'] };
  }

  if (s.ten === 'Phá Toái') {
    if (ts.has('Kình Dương') && (ts.has('Hỏa Tinh') || ts.has('Linh Tinh') || ts.has('Hóa Kỵ'))) {
      return { chieu: 'can', ly: ['gap-sat'] };
    }
    if (tc === 'Tật Ách') return { chieu: 'thuan', ly: ['theo-cung'] }; // ít bệnh (HS:3489)
    // Tăng lực Sát Phá Tham (KL:2649); "Toái quân lưỡng Phá" (TĐ:1030)
    if (ts.has('Phá Quân') && (tc === 'Mệnh' || tc === 'Quan Lộc')) return { chieu: 'thuan', ly: ['theo-bo', 'theo-cung'] };
    if (coTrongVung(laSo, cung, new Set(['Phá Quân', 'Thất Sát']))) return { chieu: 'hai-mat', ly: ['theo-bo'] };
    // Tham Lang không dụng được Phá Toái (TVƯD-PT:3299); hao sao hiền Tử Phủ Cơ Lương (KL:2649, NL74:337)
    if (['Tham Lang', 'Tử Vi', 'Thiên Phủ', 'Thiên Cơ', 'Thiên Lương', 'Thiên Đồng'].some((t) => ts.has(t))) {
      return { chieu: 'can', ly: ['theo-bo'] };
    }
    if (ts.has('Hóa Khoa') || ts.has('Hóa Quyền')) return { chieu: 'hai-mat', ly: ['theo-bo'] };
    return { chieu: 'yeu', ly: ['chua-du-bo'] }; // phiền toái nhỏ
  }

  if (s.ten === 'Cô Thần' || s.ten === 'Quả Tú') {
    // Ở Phúc có Triệt + Dưỡng: "đời nào cũng thất tự" (TĐ:619, TĐ:1080) — ngoại lệ Tuần Triệt
    if (tc === 'Phúc Đức' && cung.coTriet && cung.trangSinh === 'Dưỡng') return { chieu: 'can', ly: ['theo-cung'] };
    // "Cô thần quả tú yếu thủ ư điền tài" (BT:340); hợp Vũ Khúc về tài lộc (BT:417, HS:2407)
    if (tc === 'Tài Bạch' || tc === 'Điền Trạch' || ts.has('Vũ Khúc')) return { chieu: 'thuan', ly: ['theo-cung'] };
    if (s.ten === 'Quả Tú') {
      if (tc === 'Phu Thê' && ts.has('Phượng Các')) return { chieu: 'thuan', ly: ['theo-bo'] }; // TĐ:1081
      if (ts.has('Hữu Bật')) return { chieu: 'thuan', ly: ['theo-bo'] }; // thọ (BT:352)
      if (tc === 'Quan Lộc') return { chieu: 'can', ly: ['theo-cung'] }; // TĐ:1081
      if (tc === 'Phu Thê' && ts.has('Phá Quân') && (ts.has('Địa Không') || ts.has('Thiên Không'))) {
        return { chieu: 'can', ly: ['theo-bo'] };
      }
    }
    // Tuổi tứ mộ: Cô Thần "không khắc nghiệt cô đơn" (NL74:348-351)
    if (s.ten === 'Cô Thần' && TU_MO.has(laSo.chiNamIndex)) return { chieu: 'hai-mat', ly: ['tuoi'] };
    if (['Mệnh', 'Phu Thê', 'Tử Tức', 'Huynh Đệ', 'Thiên Di'].includes(tc)) {
      // "Cô ngộ quý tinh" thì được giúp đỡ (TĐ:618, TĐ:620)
      if (ts.has('Thiên Khôi') || ts.has('Thiên Việt')) return { chieu: 'hai-mat', ly: ['theo-bo'] };
      return { chieu: 'can', ly: ['theo-cung'] }; // cô độc, chỉ chuyện người
    }
    return TRUNG;
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Điểm vào
// ---------------------------------------------------------------------------

/** Chiều của một sao gốc tại cung của nó, đã xét các sao đi cùng */
export function chieuSao(laSo: LaSo, cung: Cung, s: Sao): KetQuaChieu {
  if (s.loai === 'vong-sao' || s.loai === 'khong-vong') return { chieu: 'trung', ly: ['sao-vong'] };
  if (s.loai === 'tu-hoa') return chieuTuHoa(laSo, cung, s);
  if (CHINH.has(s.ten)) return chieuChinhTinh(laSo, cung, s);
  if (SAT_TINH.has(s.ten)) return chieuSatTinh(laSo, cung, s);
  if (s.ten === 'Thiên Mã') return chieuThienMa(laSo, cung);
  return chieuPhuTinh(laSo, cung, s);
}

/**
 * Tuần / Triệt tại một cung: giải phần xấu hay bẻ phần tốt.
 *
 * - Cung Tật Ách có Tuần Triệt: tốt (HS:4254).
 * - Cung có sao hãm / sát hãm: giảm xấu (HS:4252, KL:1163, AB:4817) → 'thuan'.
 *   Sao có bảng độ sáng (Hình, Riêu, Khốc, Hư) chỉ tính là xấu khi hãm.
 * - Hóa Kỵ KHÔNG được Tuần Triệt giải (TVƯD-PT:3081, AB:5357): cung có Kỵ tối đa 'hai-mat'.
 * - Cung có chính tinh sáng, Thiên Phủ, Thiên Tướng, Thiên Mã: bị bẻ → 'can'.
 * - Lẫn cả hai hoặc không có gì: 'hai-mat'.
 *
 * Trả null khi cung không có Tuần Triệt.
 */
export function chieuTuanTriet(cung: Cung): { chieu: Chieu; ly: 'giai' | 'be' | 'hai-mat' | 'tat-ach' } | null {
  if (!cung.coTuan && !cung.coTriet) return null;
  if (cung.tenCung === 'Tật Ách') return { chieu: 'thuan', ly: 'tat-ach' };
  const coXau = cung.sao.some(
    (s) =>
      (CHINH.has(s.ten) && s.doSang === 'H') ||
      (SAT_TINH.has(s.ten) && !(s.doSang && SANG.has(s.doSang))) ||
      (GOC_XAU.has(s.ten) && !(s.doSang && SANG.has(s.doSang)))
  );
  const coKy = cung.sao.some((s) => s.ten === 'Hóa Kỵ');
  const coTot = cung.sao.some(
    (s) =>
      (CHINH.has(s.ten) && !!s.doSang && SANG.has(s.doSang)) ||
      (SAT_TINH.has(s.ten) && !!s.doSang && SANG.has(s.doSang)) ||
      ['Thiên Phủ', 'Thiên Tướng', 'Thiên Mã', 'Lộc Tồn', 'Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa'].includes(s.ten)
  );
  if (coXau && !coTot && !coKy) return { chieu: 'thuan', ly: 'giai' };
  if (coTot && !coXau) return { chieu: 'can', ly: 'be' };
  return { chieu: 'hai-mat', ly: 'hai-mat' };
}

/**
 * Cung đối chiếu sang: KHÔNG mặc định là cản (HS:737, 741).
 * Hóa Kỵ ở cung đối chưa tự thành tốt là xung (TT2:667); mức theo sao gốc của Kỵ:
 * gốc hãm → 'can', gốc sáng / bình → 'hai-mat' (trở ngại mà vẫn làm được).
 * Lộc ở cung này bị Kỵ xung thì 'can' bất kể gốc (VTL:701, Tứ Hóa phái 1:931).
 * Lối ra: Thiên Đồng ở Tuất, tuổi Đinh, Cự Môn Hóa Kỵ xung về là cách tốt (Tứ Hóa phái 2:3697).
 * Ngoài ra chiều của cung đối là chiều chính tinh của nó, nhẹ hơn toạ thủ.
 */
export function chieuCungDoi(
  laSo: LaSo,
  cung: Cung
): { doi: Cung; chieu: Chieu; kyXung: boolean; chinh: Sao[] } {
  const doi = laSo.cungs[tamPhuongTuChinh(cung.chiIndex).xungChieu];
  const ky = doi.sao.find((s) => s.ten === 'Hóa Kỵ');
  const chinh = doi.sao.filter((s) => CHINH.has(s.ten));
  // Kỵ đã tự thành tốt ở cung đối (vd Nhật Nguyệt Sửu Mùi có Tuần) thì không xung phá
  const kyChieu = ky ? chieuSao(laSo, doi, ky).chieu : undefined;
  const dongTuatDinh =
    cung.chiIndex === 10 && laSo.canNamIndex === 3 && cung.sao.some((s) => s.ten === 'Thiên Đồng');
  const kyTot = !!ky && (kyChieu === 'thuan' || dongTuatDinh);
  const kyXung = !!ky && !kyTot;
  if (kyXung) {
    const locBiPha = cung.sao.some((s) => s.ten === 'Hóa Lộc' || s.ten === 'Lộc Tồn');
    return { doi, chieu: kyChieu === 'can' || locBiPha ? 'can' : 'hai-mat', kyXung, chinh };
  }
  if (kyTot) return { doi, chieu: 'hai-mat', kyXung, chinh };
  const ds = chinh.map((s) => chieuSao(laSo, doi, s).chieu);
  let chieu: Chieu = 'trung';
  if (ds.includes('can')) chieu = 'can';
  else if (ds.includes('thuan') && !ds.includes('yeu')) chieu = 'thuan';
  else if (ds.length) chieu = 'hai-mat';
  return { doi, chieu, kyXung, chinh };
}

/** Gom chiều mọi sao gốc trong một cung */
export function chieuCacSao(laSo: LaSo, cung: Cung): { sao: Sao; ket: KetQuaChieu }[] {
  return cung.sao.map((sao) => ({ sao, ket: chieuSao(laSo, cung, sao) }));
}

/**
 * Cặp khắc thật trong một cung (chuyên gia mục 11) — thay cho "có cát và có hung".
 * Trả danh sách mã cặp; rỗng là không có xung đột thật.
 */
export function capKhacTrongCung(laSo: LaSo, cung: Cung): string[] {
  const ts = tenTrong(cung);
  const ra: string[] = [];
  const coLoc = ts.has('Lộc Tồn') || ts.has('Hóa Lộc');
  if (coLoc && ts.has('Hóa Kỵ')) ra.push('loc-ky');
  if (ts.has('Lộc Tồn') && ts.has('Hóa Lộc') && (ts.has('Địa Không') || ts.has('Địa Kiếp'))) {
    ra.push('song-loc-khong-kiep');
  }
  if (ts.has('Thiên Phủ') && (cung.coTuan || ts.has('Thiên Không'))) ra.push('phu-tuan-khong');
  if ((ts.has('Thái Dương') || ts.has('Thái Âm')) && (ts.has('Kình Dương') || ts.has('Đà La'))) {
    ra.push('nhat-nguyet-kinh-da');
  }
  const tuPhuSang = cung.sao.some(
    (s) => (s.ten === 'Tử Vi' || s.ten === 'Thiên Phủ') && !!s.doSang && SANG.has(s.doSang)
  );
  const satDac = cung.sao.some((s) => SAT_TINH.has(s.ten) && !!s.doSang && SANG.has(s.doSang));
  if (tuPhuSang && satDac) ra.push('tu-phu-sat-dac');
  void laSo;
  return ra;
}

/**
 * Vô chính diệu: mượn chính tinh cung đối, dùng độ sáng của nó tại cung của nó
 * (HS:763-764). Đếm sao Không: từ ba sao Không, hoặc Nhật Nguyệt sáng chiếu thì
 * tốt; một sao Không / Kiếp đứng trơ thì bôn ba (HS:4255, VTL:2189).
 */
export function xetVoChinhDieu(
  laSo: LaSo,
  cung: Cung
): { muon: Sao[]; chieu: Chieu; soKhong: number; nhatNguyetSangChieu: boolean } | null {
  if (cung.sao.some((s) => CHINH.has(s.ten))) return null;
  const doi = laSo.cungs[tamPhuongTuChinh(cung.chiIndex).xungChieu];
  const muon = doi.sao.filter((s) => CHINH.has(s.ten));
  // Tam Không: đếm các loại Không trong cả tam phương tứ chính (chuyên gia, 12/11)
  const vung = vungTPTC(laSo, cung);
  const soKhong =
    (vung.some((c) => c.sao.some((s) => s.ten === 'Địa Không')) ? 1 : 0) +
    (vung.some((c) => c.sao.some((s) => s.ten === 'Thiên Không')) ? 1 : 0) +
    (vung.some((c) => c.coTuan) ? 1 : 0) +
    (vung.some((c) => c.coTriet) ? 1 : 0);
  // Nhật Nguyệt chiếu chỉ tốt khi CẢ HAI cùng sáng
  const nhatNguyet = gapTrongVung(laSo, cung, new Set(['Thái Dương', 'Thái Âm']));
  const nhatNguyetSangChieu =
    nhatNguyet.some((s) => s.ten === 'Thái Dương' && !!s.doSang && SANG.has(s.doSang)) &&
    nhatNguyet.some((s) => s.ten === 'Thái Âm' && !!s.doSang && SANG.has(s.doSang));
  // Không / Kiếp đứng trong cung: đắc (Dần Thân Tỵ Hợi) thì hai mặt, hãm mới bôn ba
  const khongKiep = cung.sao.filter((s) => KHONG_KIEP.has(s.ten));
  const khongKiepHam = khongKiep.some((s) => !(s.doSang && SANG.has(s.doSang)));
  let chieu: Chieu;
  if (soKhong >= 3 || nhatNguyetSangChieu) chieu = 'thuan';
  else if (khongKiep.length && soKhong <= 1) chieu = khongKiepHam ? 'can' : 'hai-mat';
  else {
    const ds = muon.map((s) => chieuSao(laSo, doi, s).chieu);
    chieu = ds.includes('thuan') ? 'hai-mat' : ds.includes('can') ? 'can' : 'yeu';
  }
  return { muon, chieu, soKhong, nhatNguyetSangChieu };
}

/**
 * Chiều nghiêng về phía đỡ hay phía cản — cho các chỗ còn chia hai phía.
 * 'yeu' (cát hãm không gặp sát) và 'hai-mat' không đứng về phía nào: cát hãm
 * chỉ thành cản khi gặp sát hoặc Kỵ (VTL:647), mà lúc đó chieuSao đã trả 'can'.
 */
export function phiaCuaChieu(c: Chieu): 'do' | 'can' | null {
  if (c === 'thuan') return 'do';
  if (c === 'can') return 'can';
  return null;
}
