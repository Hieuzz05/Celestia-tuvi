import { cungDaiVan, tamPhuongTuChinh, type Cung, type LaSo } from './ansao';
import { CHINH_TINH } from './constants';
import { PHU_TINH_TRONG_YEU } from './phu-tinh-trong-yeu';
import { CUNG_CUA_MUC, GUONG, TAM_HOP, type MucId } from './chang-cung';

/**
 * Độ nổi bật của một phần — 0..100, tất định.
 *
 * Dùng để làm ba việc, và KHÔNG được dùng cho việc thứ tư:
 *
 *   ✅ sắp thứ tự ba phần TRONG một chặng
 *   ✅ gắn badge "đáng chú ý nhất" (tối đa ba badge một bài)
 *   ✅ co giãn độ dài ±20%
 *   ❌ KHÔNG BAO GIỜ đảo thứ tự bốn chặng — chặng là một cung đường kể chuyện,
 *      luôn 1→4. Sắp lại là biến cung đường thành danh mục.
 *
 * Và không bao giờ ẩn phần nào. Đủ 12 là cam kết sản phẩm; phần điểm thấp vẫn
 * được viết, chỉ ngắn hơn và mở bằng một câu thành thật rằng ở lá số này nó
 * không có tín hiệu nổi bật — đó cũng là một thông tin.
 */

export const PHIEN_BAN_DO_NOI_BAT = '2026.09.1';

/** Độ sáng đủ để một chính tinh thể hiện được nét của nó */
const SANG_RO = new Set(['M', 'V', 'D']);

/**
 * Trọng số từng thành phần. Tổng đúng 100 để điểm đọc được như phần trăm.
 *
 * Tứ Hoá và đại vận nặng nhất (25) vì chúng là thứ làm một cung ĐANG SỐNG:
 * Tứ Hoá đổi hẳn cách đọc, đại vận nói cung đó có đang được kích hoạt không.
 * Độ sáng nhẹ hơn (20) vì nó mô tả tiềm năng chứ không mô tả thời điểm.
 */
const TRONG_SO = {
  chinhTinhSang: 20,
  tuHoa: 25,
  phuTinhCungHuong: 15,
  daiVanCham: 25,
  xungDotRo: 15,
} as const;

export interface DiemNoiBat {
  diem: number;
  /** Từng thành phần đã cộng — để WhyDrawer giải thích được vì sao phần này nổi */
  thanhPhan: { ten: string; diem: number }[];
  /** Có cả lực thuận lẫn lực nghịch rõ rệt */
  xungDot: boolean;
}

function laChinhTinh(ten: string): boolean {
  return (CHINH_TINH as readonly string[]).includes(ten);
}

function timCung(laSo: LaSo, ten: string): Cung | undefined {
  return laSo.cungs.find((c) => c.tenCung === ten);
}

/**
 * Hai cung tam hợp của một cung, trả về đối tượng Cung.
 *
 * `tamPhuongTuChinh` trả chỉ số chi; chỗ gọi lại luôn cần đối tượng cung và
 * luôn phải tự tra lại. Gom về một chỗ thì ba lần tra tay biến thành một lần.
 */
export function tamHopCua(laSo: LaSo, tenCung: string): Cung[] {
  return (TAM_HOP[tenCung] ?? [])
    .map((t) => timCung(laSo, t))
    .filter((c): c is Cung => !!c);
}

/** Cung gương (xung chiếu) của một cung */
export function guongCua(laSo: LaSo, tenCung: string): Cung | undefined {
  return timCung(laSo, GUONG[tenCung]);
}

export function doNoiBat(laSo: LaSo, muc: MucId, namXem: number): DiemNoiBat {
  const tenGoc = CUNG_CUA_MUC[muc];
  const cung = timCung(laSo, tenGoc);
  const thanhPhan: { ten: string; diem: number }[] = [];

  if (!cung) return { diem: 0, thanhPhan, xungDot: false };

  // 1. Chính tinh đủ sáng — cung có sao chủ và sao ấy nói được
  const chinhSang = cung.sao.filter((s) => laChinhTinh(s.ten) && s.doSang && SANG_RO.has(s.doSang));
  if (chinhSang.length) {
    thanhPhan.push({ ten: 'Chính tinh sáng tại cung', diem: TRONG_SO.chinhTinhSang });
  }

  // 2. Tứ Hoá bản mệnh rơi vào cung — đổi hẳn cách đọc, nên nặng nhất
  if (cung.sao.some((s) => s.loai === 'tu-hoa')) {
    thanhPhan.push({ ten: 'Tứ Hoá rơi vào cung', diem: TRONG_SO.tuHoa });
  }

  // 3. Từ hai phụ tinh trọng yếu cùng hướng trở lên
  const phu = cung.sao.filter((s) => PHU_TINH_TRONG_YEU.has(s.ten));
  const phuCat = phu.filter((s) => s.tinhChat === 'cat').length;
  const phuHung = phu.filter((s) => s.tinhChat === 'hung').length;
  if (phuCat >= 2 || phuHung >= 2) {
    thanhPhan.push({ ten: 'Nhiều phụ tinh cùng hướng', diem: TRONG_SO.phuTinhCungHuong });
  }

  /*
   * 4. Đại vận hiện tại chạm cung — bản cung, tam hợp, HAY gương.
   *
   * Lấy cả ba chứ không chỉ bản cung: đại vận đóng ở cung xung chiếu vẫn kích
   * hoạt cung này mạnh y như đóng ngay tại đây. Bỏ tam phương ra là phần lớn lá
   * số chỉ có đúng một phần được tính "đang sống".
   */
  const tuoiAm = namXem - laSo.thongTin.amLich.nam + 1;
  const dv = cungDaiVan(laSo, tuoiAm);
  if (dv) {
    const { tamHop, xungChieu } = tamPhuongTuChinh(cung.chiIndex);
    const vung = new Set([cung.chiIndex, ...tamHop, xungChieu]);
    if (vung.has(dv.chiIndex)) {
      thanhPhan.push({ ten: 'Giai đoạn đang đi qua chạm vào', diem: TRONG_SO.daiVanCham });
    }
  }

  /*
   * 5. Xung đột thuận–nghịch rõ.
   *
   * Cung vừa có lực đỡ vừa có lực cản đáng kể là cung ĐÁNG ĐỌC NHẤT — đó là
   * chỗ người ta thấy mình mâu thuẫn và không tự giải thích được. Một cung toàn
   * cát đọc xong thấy dễ chịu rồi quên; một cung có hai lực kéo ngược thì dính.
   */
  const coCat = cung.sao.some((s) => s.tinhChat === 'cat');
  const coHung = cung.sao.some((s) => s.tinhChat === 'hung') || cung.coTuan || cung.coTriet;
  const xungDot = coCat && coHung;
  if (xungDot) {
    thanhPhan.push({ ten: 'Có hai lực kéo ngược nhau', diem: TRONG_SO.xungDotRo });
  }

  return {
    diem: thanhPhan.reduce((t, x) => t + x.diem, 0),
    thanhPhan,
    xungDot,
  };
}

/** Ngưỡng badge "đáng chú ý nhất" */
export const NGUONG_NOI = 70;
/** Ngưỡng viết ngắn hơn kèm câu thành thật */
export const NGUONG_MO = 30;
/** Tối đa ba badge một bài — nhiều hơn thì badge không còn nghĩa gì */
export const TRAN_BADGE = 3;
