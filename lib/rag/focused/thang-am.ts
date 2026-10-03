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
  if (!dau) return null;
  const dauSau =
    !nhuan && coThangNhuan(nam, thang)
      ? lunarToSolar(1, thang, nam, true)
      : thang === 12
        ? lunarToSolar(1, 1, nam + 1)
        : lunarToSolar(1, thang + 1, nam);
  if (!dauSau) return null;
  const d = new Date(Date.UTC(dauSau.year, dauSau.month - 1, dauSau.day));
  d.setUTCDate(d.getUTCDate() - 1);
  return `${dau.day}/${dau.month} – ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
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
