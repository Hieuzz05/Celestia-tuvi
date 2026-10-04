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

/* ------------------------------------------------------------ cửa sổ âm */

/**
 * Một đoạn liên tục của tháng dương nằm trong cùng một tháng âm (spec 3.2). Vận
 * tháng tính theo âm lịch, nên một tháng dương được đọc bằng MỌI tháng âm chồng
 * lên nó — không chọn "tháng chủ yếu", không trọng số theo số ngày.
 */
export interface CuaSoAm {
  ma: 'W1' | 'W2' | 'W3';
  namAm: number;
  thangAm: number;
  nhuan: boolean;
  /** 'YYYY-MM-DD' dương — phần GIAO với tháng dương (thang-am: cả tháng âm) */
  tuNgay: string;
  denNgay: string;
  soNgay: number;
  /** Theo ngày dương của cửa sổ so với hôm nay */
  trangThai: 'da-qua' | 'dang' | 'toi';
}

const MA_CUA_SO = ['W1', 'W2', 'W3'] as const;
const p2 = (n: number) => String(n).padStart(2, '0');
const ngayChuoi = (d: Date) => `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`;

/** Ngày dương của "bây giờ" (bayGio là ngày âm, tiêm được trong test), UTC nửa đêm. */
export function ngayDuongCua(bayGio: ThoiDiemAm): Date {
  const d = lunarToSolar(bayGio.ngay, bayGio.thang, bayGio.nam);
  return d ? new Date(Date.UTC(d.year, d.month - 1, d.day)) : new Date();
}

function trangThaiKhoang(tu: string, den: string, homNay: Date): CuaSoAm['trangThai'] {
  const h = ngayChuoi(homNay);
  if (den < h) return 'da-qua';
  return tu > h ? 'toi' : 'dang';
}

/**
 * Các tháng âm chồng lên tháng dương `thang/nam`, theo thứ tự thời gian: 1–3 đoạn,
 * liên tục, phủ kín tháng. Đi từng ngày bằng `solarToLunar`, gom đoạn cùng
 * (năm âm, tháng âm, nhuận).
 */
export function cuaSoAmCuaThangDuong(nam: number, thang: number, homNay: Date = new Date()): CuaSoAm[] {
  const soNgay = new Date(Date.UTC(nam, thang, 0)).getUTCDate();
  const doan: { namAm: number; thangAm: number; nhuan: boolean; tu: number; den: number }[] = [];
  for (let d = 1; d <= soNgay; d++) {
    const am = solarToLunar(d, thang, nam);
    const nhuan = am.isLeapMonth === true;
    const cuoi = doan[doan.length - 1];
    if (cuoi && cuoi.namAm === am.year && cuoi.thangAm === am.month && cuoi.nhuan === nhuan) cuoi.den = d;
    else doan.push({ namAm: am.year, thangAm: am.month, nhuan, tu: d, den: d });
  }
  return doan.slice(0, 3).map((x, i) => {
    const tuNgay = `${nam}-${p2(thang)}-${p2(x.tu)}`;
    const denNgay = `${nam}-${p2(thang)}-${p2(x.den)}`;
    return {
      ma: MA_CUA_SO[i],
      namAm: x.namAm,
      thangAm: x.thangAm,
      nhuan: x.nhuan,
      tuNgay,
      denNgay,
      soNgay: x.den - x.tu + 1,
      trangThai: trangThaiKhoang(tuNgay, denNgay, homNay),
    };
  });
}

/** Tháng âm nói rõ: đúng một cửa sổ là cả tháng âm. Rỗng khi không đổi được (vd. nhuận không có). */
export function cuaSoCuaThangAm(namAm: number, thangAm: number, nhuan: boolean, homNay: Date = new Date()): CuaSoAm[] {
  if (nhuan && !coThangNhuan(namAm, thangAm)) return [];
  const dau = lunarToSolar(1, thangAm, namAm, nhuan);
  const cuoi = ngayCuoiThangAm(namAm, thangAm, nhuan);
  if (!dau || !cuoi) return [];
  const d0 = new Date(Date.UTC(dau.year, dau.month - 1, dau.day));
  const tuNgay = ngayChuoi(d0);
  const denNgay = ngayChuoi(cuoi);
  return [
    {
      ma: 'W1',
      namAm,
      thangAm,
      nhuan,
      tuNgay,
      denNgay,
      soNgay: Math.round((cuoi.getTime() - d0.getTime()) / 86400000) + 1,
      trangThai: trangThaiKhoang(tuNgay, denNgay, homNay),
    },
  ];
}

/** Trạng thái của tháng DƯƠNG người hỏi (so năm, tháng dương với hôm nay). */
export function trangThaiThangDuong(nam: number, thang: number, homNay: Date): 'da-qua' | 'dang' | 'toi' {
  const a = nam * 12 + thang;
  const b = homNay.getUTCFullYear() * 12 + homNay.getUTCMonth() + 1;
  return a === b ? 'dang' : a < b ? 'da-qua' : 'toi';
}
