import { CAN, CHI } from './constants';
import { jdFromDate, solarToLunar } from './lunar';

const mod = (n: number, m: number) => ((n % m) + m) % m;

export interface ThongTinNgay {
  duongLich: { ngay: number; thang: number; nam: number };
  amLich: { ngay: number; thang: number; nam: number; nhuan: boolean };
  canChiNgay: string;
  canChiThang: string;
  canChiNam: string;
  chiNgayIndex: number;
  gioHoangDao: { chi: string; khungGio: string }[];
}

/**
 * Giờ hoàng đạo theo chi của ngày (bảng Thanh Long truyền thống).
 * Key là chi ngày rút gọn theo cặp xung: Tý–Ngọ, Sửu–Mùi, Dần–Thân, Mão–Dậu, Thìn–Tuất, Tỵ–Hợi.
 */
const GIO_HOANG_DAO: Record<number, number[]> = {
  0: [0, 1, 3, 6, 8, 9], // ngày Tý / Ngọ
  1: [2, 3, 5, 8, 10, 11], // ngày Sửu / Mùi
  2: [0, 1, 4, 5, 7, 10], // ngày Dần / Thân
  3: [0, 2, 3, 6, 7, 9], // ngày Mão / Dậu
  4: [2, 4, 5, 8, 9, 11], // ngày Thìn / Tuất
  5: [1, 4, 6, 7, 10, 11], // ngày Tỵ / Hợi
};

const KHUNG_GIO = [
  '23:00 – 00:59',
  '01:00 – 02:59',
  '03:00 – 04:59',
  '05:00 – 06:59',
  '07:00 – 08:59',
  '09:00 – 10:59',
  '11:00 – 12:59',
  '13:00 – 14:59',
  '15:00 – 16:59',
  '17:00 – 18:59',
  '19:00 – 20:59',
  '21:00 – 22:59',
];

export function thongTinNgay(ngay: number, thang: number, nam: number): ThongTinNgay {
  const jd = jdFromDate(ngay, thang, nam);
  const am = solarToLunar(ngay, thang, nam);

  const canNgay = mod(jd + 9, 10);
  const chiNgay = mod(jd + 1, 12);
  const canNam = mod(am.year + 6, 10);
  const chiNam = mod(am.year + 8, 12);
  // Ngũ hổ độn: can tháng Giêng suy từ can năm, tháng Giêng là tháng Dần
  const canThangGieng = [2, 4, 6, 8, 0][canNam % 5];
  const canThang = mod(canThangGieng + (am.month - 1), 10);
  const chiThang = mod(1 + am.month, 12);

  const danhSachGio = GIO_HOANG_DAO[chiNgay % 6].map((i) => ({
    chi: CHI[i],
    khungGio: KHUNG_GIO[i],
  }));

  return {
    duongLich: { ngay, thang, nam },
    amLich: { ngay: am.day, thang: am.month, nam: am.year, nhuan: am.isLeapMonth },
    canChiNgay: `${CAN[canNgay]} ${CHI[chiNgay]}`,
    canChiThang: `${CAN[canThang]} ${CHI[chiThang]}`,
    canChiNam: `${CAN[canNam]} ${CHI[chiNam]}`,
    chiNgayIndex: chiNgay,
    gioHoangDao: danhSachGio,
  };
}
