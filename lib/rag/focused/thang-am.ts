import { lunarToSolar, solarToLunar } from '@/lib/tuvi/lunar';
import type { ThoiDiemAm } from '@/lib/tuvi/bay-gio';

/**
 * Tháng âm cho đường Focused (CEL-186 vé B, N2 / N4 / tháng nhuận).
 *
 * Không sửa `lib/tuvi`: app đọc thẳng engine, và những gì ở đây chỉ là đọc lịch.
 */

/**
 * Năm âm `nam` có tháng `thang` nhuận không.
 *
 * KHÔNG được dùng `lunarToSolar(1, X, nam, true) !== null`: ở năm không nhuận
 * hàm đó vẫn trả một ngày (nó bỏ qua cờ nhuận), nên mọi tháng của 2026 sẽ bị
 * coi là "có nhuận". Phải đổi ngược lại và xem ngày ấy có đúng là tháng X nhuận.
 */
export function coThangNhuan(nam: number, thang: number): boolean {
  const kq = lunarToSolar(1, thang, nam, true);
  if (!kq) return false;
  const am = solarToLunar(kq.day, kq.month, kq.year);
  return am.isLeapMonth === true && am.month === thang && am.year === nam;
}

/**
 * Khoảng ngày dương của một tháng âm, dạng "11/9 – 10/10".
 *
 * Khác `khoangDuongCuaThangAm` ở chỗ biết tháng nhuận: tháng X thường của năm
 * có X nhuận kết thúc ở ngày trước mồng 1 tháng X nhuận, không phải trước tháng
 * X+1. Trả null khi không đổi được.
 */
export function khoangDuong(nam: number, thang: number, nhuan = false): string | null {
  if (nhuan && !coThangNhuan(nam, thang)) return null;
  const dau = lunarToSolar(1, thang, nam, nhuan);
  const cuoi = ngayCuoiThangAm(nam, thang, nhuan);
  if (!dau || !cuoi) return null;
  return `${dau.day}/${dau.month} – ${cuoi.getUTCDate()}/${cuoi.getUTCMonth() + 1}`;
}

/** Ngày dương cuối cùng (UTC, nửa đêm) của một tháng âm — biết tháng nhuận. Null khi không đổi được. */
export function ngayCuoiThangAm(nam: number, thang: number, nhuan = false): Date | null {
  if (nhuan && !coThangNhuan(nam, thang)) return null;
  const dauSau =
    !nhuan && coThangNhuan(nam, thang)
      ? lunarToSolar(1, thang, nam, true)
      : thang === 12
        ? lunarToSolar(1, 1, nam + 1)
        : lunarToSolar(1, thang + 1, nam);
  if (!dauSau) return null;
  const d = new Date(Date.UTC(dauSau.year, dauSau.month - 1, dauSau.day));
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

/** Ngày dương cuối cùng của năm âm `nam` (hôm trước Tết năm sau). */
export function ngayCuoiNamAm(nam: number): Date | null {
  const tet = lunarToSolar(1, 1, nam + 1);
  if (!tet) return null;
  const d = new Date(Date.UTC(tet.year, tet.month - 1, tet.day));
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

/** Tháng (năm âm, tháng âm) so với bây giờ */
export function soVoiBayGio(nam: number, thang: number, bayGio: ThoiDiemAm): 'da-qua' | 'dang' | 'toi' {
  if (nam !== bayGio.nam) return nam < bayGio.nam ? 'da-qua' : 'toi';
  if (thang === bayGio.thang) return 'dang';
  return thang < bayGio.thang ? 'da-qua' : 'toi';
}

/** Tháng âm 11–12: "sắp tới" của người hỏi vắt qua Tết (N4) */
export function laCuoiNamAm(bayGio: ThoiDiemAm): boolean {
  return bayGio.thang >= 11;
}

/** Năm dương của "bây giờ" (bayGio là ngày âm, tiêm được trong test). */
export function namDuongCua(bayGio: ThoiDiemAm): number {
  return lunarToSolar(bayGio.ngay, bayGio.thang, bayGio.nam)?.year ?? bayGio.nam;
}

/**
 * Tháng âm phủ NHIỀU NGÀY NHẤT của một tháng dương (chủ dự án 04/10/2026:
 * "tháng 6" không kèm "âm" là tháng 6 dương). Nguyệt hạn tính theo tháng âm,
 * nên phải quy đổi; một tháng dương thường vắt qua hai tháng âm, lấy tháng âm
 * chiếm nhiều ngày nhất. Hoà thì lấy tháng âm đến trước (khi đó `ro` = false).
 */
export function thangAmChuYeu(
  namDuong: number,
  thangDuong: number
): { nam: number; thang: number; nhuan: boolean; khoang: string | null; ro: boolean } {
  const soNgay = new Date(Date.UTC(namDuong, thangDuong, 0)).getUTCDate();
  const dem = new Map<string, { nam: number; thang: number; nhuan: boolean; n: number }>();
  for (let d = 1; d <= soNgay; d++) {
    const am = solarToLunar(d, thangDuong, namDuong);
    const k = `${am.year}-${am.month}-${am.isLeapMonth ? 1 : 0}`;
    const cu = dem.get(k);
    if (cu) cu.n += 1;
    else dem.set(k, { nam: am.year, thang: am.month, nhuan: am.isLeapMonth === true, n: 1 });
  }
  let chon = { nam: namDuong, thang: thangDuong, nhuan: false, n: 0 };
  for (const v of dem.values()) if (v.n > chon.n) chon = v;
  // `ro`: tháng âm chiếm từ 60% số ngày — dưới mức đó (kể cả hoà) không được nói "phần lớn".
  return { nam: chon.nam, thang: chon.thang, nhuan: chon.nhuan, khoang: khoangDuong(chon.nam, chon.thang, chon.nhuan), ro: chon.n * 5 >= soNgay * 3 };
}
