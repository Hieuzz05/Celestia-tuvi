/**
 * Token thiết kế của Celes trên di động — hệ "Aurora" bản 8 (29/09/2026).
 *
 * Bản thiết kế gốc: `docs/thiet-ke/celes-ios/aurora/gen.py`. Đổi 29/09/2026 theo
 * góp ý senior UI/UX:
 * - Theme tối là MẶC ĐỊNH, nền gần đen `#0B0A0D` (bản cũ nền Aubergine quá sáng
 *   trên màn OLED, và làm màu vùng chìm mất). Aubergine vẫn là mực của theme sáng.
 * - Mỗi luồng một VÙNG MÀU (`VUNG`) để người dùng biết mình đang ở đâu: màu vùng
 *   đi vào quầng sáng nền, chữ nhấn, thẻ chính và tab đang chọn.
 * - Bo góc to hơn web (thẻ 20, nút 14) — app là sản phẩm chạm, không phải trang đọc.
 *   Font riêng của app (Bricolage Grotesque / Be Vietnam Pro / Newsreader), web giữ bộ cũ.
 *
 * Luật giữ nguyên: mỗi màn đúng MỘT nút hành động fuchsia; pill (999) chỉ cho lựa
 * chọn / tag; vùng chạm ≥ 44; không chữ dưới 11px (trừ mệnh bàn).
 *
 * Component chỉ đọc token ngữ nghĩa (`mau.nen`, `mau.chu`, `vung.mau`...), không
 * đọc thẳng bảng màu gốc — đổi theme là đổi một chỗ.
 */

/** Bảng màu gốc, cố định ở cả hai theme */
export const BANG_MAU = {
  aubergine: '#240029',
  fuchsia: '#DF37A7',
  /** Nền nút hành động — chữ trắng đạt tương phản WCAG */
  fuchsiaNut: '#D32298',
  /** Fuchsia cho CHỮ trên nền sáng (liên kết, nhãn nhấn) */
  fuchsiaChu: '#B8157F',
  hong: '#FFBDD3',
  vangAm: '#FFCB0F',
  kem: '#FFF1BD',
  nenAm: '#FFFBFD',
  trang: '#FFFFFF',
  vien: '#D4CCD4',
  chuMo: '#6D526D',
  tot: '#15803D',
  xau: '#EF4444',
  /** Nền đêm — gần đen, hơi ngả tím */
  dem: '#0B0A0D',
  /** Bề mặt đặc trên nền đêm (thanh tab, sheet) */
  beMat: '#15121A',
  theToi: '#15121A',
} as const;

/** Gradient chữ ký — hero Hôm nay ở theme sáng, thẻ chia sẻ */
export const GRADIENT_CHU_KY = ['#FFBDD3', '#FFF1BD', '#FFCB0F'] as const;
export const GRADIENT_DIEM_DUNG = [0, 0.48, 1] as const;

/** Nút hành động chính: dải 135° ba điểm dừng */
export const GRADIENT_NUT = ['#E23BA8', '#D32298', '#A8157E'] as const;
export const GRADIENT_NUT_DIEM = [0, 0.55, 1] as const;

/** Quả cầu Celes: tâm sáng lệch trái-trên */
export const GRADIENT_ORB = ['#FFFFFF', '#FFF1BD', '#FFBDD3', '#E23BA8', '#6A0B6E'] as const;
export const GRADIENT_ORB_DIEM = [0, 0.14, 0.38, 0.66, 1] as const;

export type TenTheme = 'sang' | 'toi';

/* ---------------------------------------------------------------- Vùng màu */

export type TenVung = 'celes' | 'khoiDau' | 'homNay' | 'laSo' | 'hanhTrinh' | 'moiQuanHe' | 'toi';

export interface Quang {
  /** Tâm quầng, tính theo tỉ lệ bề ngang / bề cao màn (có thể âm hoặc > 1) */
  x: number;
  y: number;
  /** Bán kính theo tỉ lệ bề ngang / bề cao màn */
  rx: number;
  ry: number;
  rgb: string;
  a: number;
}

export interface Vung {
  mau: string;
  /** Màu sáng cho đầu dải chữ gradient */
  sang: string;
  /** "r,g,b" để tự pha độ trong */
  rgb: string;
  quang: Quang[];
}

export const VUNG: Record<TenVung, Vung> = {
  celes: {
    mau: '#F28AC9', sang: '#FFD0EA', rgb: '242,138,201',
    quang: [
      { x: 0.5, y: -0.08, rx: 0.95, ry: 0.42, rgb: '211,34,152', a: 0.3 },
      { x: 1.1, y: 0.6, rx: 0.6, ry: 0.4, rgb: '242,138,201', a: 0.08 },
    ],
  },
  khoiDau: {
    mau: '#F6A96B', sang: '#FFE0B8', rgb: '246,169,107',
    quang: [
      { x: 0.5, y: 1.12, rx: 1.2, ry: 0.48, rgb: '246,150,90', a: 0.3 },
      { x: 0.5, y: 1.18, rx: 0.8, ry: 0.3, rgb: '226,59,168', a: 0.22 },
    ],
  },
  homNay: {
    mau: '#F5C451', sang: '#FFE9A8', rgb: '245,196,81',
    quang: [
      { x: 1, y: -0.06, rx: 0.85, ry: 0.4, rgb: '245,180,60', a: 0.2 },
      { x: -0.1, y: 0.45, rx: 0.6, ry: 0.35, rgb: '242,138,201', a: 0.06 },
    ],
  },
  laSo: {
    mau: '#A393FF', sang: '#DCD5FF', rgb: '163,147,255',
    quang: [
      { x: 0, y: -0.04, rx: 0.9, ry: 0.4, rgb: '120,100,255', a: 0.22 },
      { x: 1.1, y: 0.7, rx: 0.6, ry: 0.4, rgb: '163,147,255', a: 0.07 },
    ],
  },
  hanhTrinh: {
    mau: '#5CD3BE', sang: '#C4F5EA', rgb: '92,211,190',
    quang: [
      { x: 1, y: -0.04, rx: 0.85, ry: 0.4, rgb: '60,190,170', a: 0.2 },
      { x: -0.1, y: 0.8, rx: 0.6, ry: 0.35, rgb: '92,211,190', a: 0.06 },
    ],
  },
  moiQuanHe: {
    mau: '#FF8F80', sang: '#FFD6CF', rgb: '255,143,128',
    quang: [
      { x: -0.06, y: -0.04, rx: 0.7, ry: 0.36, rgb: '255,120,110', a: 0.18 },
      { x: 1.06, y: 0.08, rx: 0.7, ry: 0.36, rgb: '226,59,168', a: 0.14 },
    ],
  },
  toi: { mau: '#C9C4CE', sang: '#FFFFFF', rgb: '201,196,206', quang: [] },
};

/** Theme sáng không tô theo vùng: mọi vùng dùng chung một nhấn fuchsia và nền kem hồng */
export const VUNG_SANG: Vung = {
  mau: '#B8157F', sang: '#D32298', rgb: '211,34,152',
  quang: [
    { x: 1.05, y: -0.05, rx: 1.2, ry: 0.55, rgb: '255,189,211', a: 0.45 },
    { x: -0.1, y: 0.38, rx: 0.9, ry: 0.45, rgb: '255,241,189', a: 0.55 },
    { x: 0.5, y: 1.12, rx: 1, ry: 0.5, rgb: '255,139,208', a: 0.14 },
  ],
};

/* ---------------------------------------------------------------- Bộ màu theo theme */

/** Cặp nền / chữ của một nhãn trạng thái */
export interface CapMau {
  nen: string;
  chu: string;
}

export interface BoMau {
  nen: string;
  /** Bề mặt thẻ (kính mờ) */
  the: string;
  theAm: string;
  /** Bề mặt đặc: thanh tab, bottom sheet, ô nhập */
  theNoi: string;
  chu: string;
  chuMo: string;
  chuNhat: string;
  vien: string;
  hanhDong: string;
  chuTrenHanhDong: string;
  tot: string;
  xau: string;
  bongNguoiDung: string;
  chuBongNguoiDung: string;

  /** Dải kính của thẻ, từ trên xuống */
  kinh: readonly [string, string];
  vienKinh: string;
  /** Giọng Celes (chữ nghiêng Newsreader) */
  giong: string;
  /** Dải chữ gradient khi không theo vùng */
  chuGradient: readonly [string, string, string];
  thanhTab: string;
  vienTab: string;
  tabTat: string;
  /** Rãnh của thanh tiến độ, radar */
  ranh: string;
  tot2: CapMau;
  canY: CapMau;
  vua: CapMau;
  vang: CapMau;
  /** Nhãn tứ hoá */
  hoa: { loc: CapMau; quyen: CapMau; khoa: CapMau; ky: CapMau };
  /** Màu chữ sao trong mệnh bàn */
  sao: { chinh: string; mieu: string; ham: string; binh: string; cat: string; hung: string; vong: string; nho: string };
}

const TOI: BoMau = {
  nen: BANG_MAU.dem,
  the: 'rgba(255,255,255,0.04)',
  theAm: 'rgba(255,255,255,0.06)',
  theNoi: BANG_MAU.beMat,
  chu: '#F3F1F4',
  chuMo: 'rgba(243,241,244,0.60)',
  chuNhat: 'rgba(243,241,244,0.45)',
  vien: 'rgba(255,255,255,0.08)',
  hanhDong: BANG_MAU.fuchsiaNut,
  chuTrenHanhDong: BANG_MAU.trang,
  tot: '#86EFAC',
  xau: '#FF9CA8',
  bongNguoiDung: BANG_MAU.fuchsiaNut,
  chuBongNguoiDung: BANG_MAU.trang,

  kinh: ['rgba(255,255,255,0.055)', 'rgba(255,255,255,0.025)'],
  vienKinh: 'rgba(255,255,255,0.075)',
  giong: '#ECE3EF',
  chuGradient: ['#FFBDD3', '#FFF1BD', '#FFCB0F'],
  thanhTab: 'rgba(17,15,20,0.94)',
  vienTab: 'rgba(255,255,255,0.08)',
  tabTat: 'rgba(243,241,244,0.52)',
  ranh: 'rgba(255,255,255,0.10)',
  tot2: { nen: 'rgba(74,222,128,0.13)', chu: '#86EFAC' },
  canY: { nen: 'rgba(240,164,75,0.15)', chu: '#FBC98A' },
  vua: { nen: 'rgba(255,255,255,0.07)', chu: 'rgba(243,241,244,0.78)' },
  vang: { nen: 'rgba(255,203,15,0.13)', chu: '#FFCB0F' },
  hoa: {
    loc: { nen: 'rgba(74,222,128,0.18)', chu: '#86EFAC' },
    quyen: { nen: 'rgba(255,203,15,0.18)', chu: '#FFE07A' },
    khoa: { nen: 'rgba(125,211,252,0.18)', chu: '#9ADCFD' },
    ky: { nen: 'rgba(255,120,140,0.2)', chu: '#FFA3B1' },
  },
  sao: {
    chinh: '#F3F1F4', mieu: '#86EFAC', ham: '#FBC98A', binh: 'rgba(243,241,244,0.55)',
    cat: 'rgba(243,241,244,0.78)', hung: '#FF9CA8', vong: '#B6AAF0', nho: 'rgba(243,241,244,0.50)',
  },
};

const SANG: BoMau = {
  nen: BANG_MAU.nenAm,
  the: 'rgba(255,255,255,0.92)',
  theAm: BANG_MAU.kem,
  theNoi: BANG_MAU.trang,
  chu: BANG_MAU.aubergine,
  chuMo: 'rgba(36,0,41,0.66)',
  chuNhat: 'rgba(36,0,41,0.5)',
  vien: 'rgba(36,0,41,0.09)',
  hanhDong: BANG_MAU.fuchsiaNut,
  chuTrenHanhDong: BANG_MAU.trang,
  tot: BANG_MAU.tot,
  xau: '#C2334A',
  bongNguoiDung: BANG_MAU.fuchsiaNut,
  chuBongNguoiDung: BANG_MAU.trang,

  kinh: ['rgba(255,255,255,0.94)', 'rgba(255,255,255,0.88)'],
  vienKinh: 'rgba(36,0,41,0.06)',
  giong: '#6A0B6E',
  chuGradient: ['#D32298', '#EC4F8E', '#D98C00'],
  thanhTab: 'rgba(255,255,255,0.94)',
  vienTab: 'rgba(36,0,41,0.08)',
  tabTat: 'rgba(36,0,41,0.58)',
  ranh: 'rgba(36,0,41,0.08)',
  tot2: { nen: '#DCFCE7', chu: '#15803D' },
  canY: { nen: '#FFEDD5', chu: '#B45309' },
  vua: { nen: 'rgba(36,0,41,0.06)', chu: 'rgba(36,0,41,0.7)' },
  vang: { nen: 'rgba(255,203,15,0.22)', chu: '#9A6A00' },
  hoa: {
    loc: { nen: '#DCFCE7', chu: '#15803D' },
    quyen: { nen: '#FEF3C7', chu: '#92400E' },
    khoa: { nen: '#E0F2FE', chu: '#0369A1' },
    ky: { nen: '#FFE4E6', chu: '#BE123C' },
  },
  sao: {
    chinh: '#240029', mieu: '#15803D', ham: '#B45309', binh: 'rgba(36,0,41,0.55)',
    cat: 'rgba(36,0,41,0.78)', hung: '#C2334A', vong: '#8C698C', nho: 'rgba(36,0,41,0.55)',
  },
};

export const MAU_THEO_THEME: Record<TenTheme, BoMau> = { sang: SANG, toi: TOI };

/* ---------------------------------------------------------------- Chữ */

/** Thang chữ dành riêng cho di động */
export const CHU = {
  displayXl: { fontSize: 38, lineHeight: 39, letterSpacing: -1.5 },
  display: { fontSize: 32, lineHeight: 34, letterSpacing: -1.1 },
  h1: { fontSize: 28, lineHeight: 31, letterSpacing: -0.9 },
  h2: { fontSize: 24, lineHeight: 27, letterSpacing: -0.7 },
  h3: { fontSize: 19, lineHeight: 23, letterSpacing: -0.4 },
  bodyLg: { fontSize: 17, lineHeight: 26 },
  body: { fontSize: 15, lineHeight: 23 },
  bodySm: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 17 },
  eyebrow: { fontSize: 12, lineHeight: 15 },
  // Cỡ chữ siêu nhỏ của mệnh bàn KHÔNG nằm ở đây — khai báo riêng trong
  // `app/ban-do.tsx` để không màn nào khác vô tình dùng.
};

/**
 * Tên font đã nạp. Heading: Bricolage Grotesque (dấu tiếng Việt gọn, có cá tính);
 * thân: Be Vietnam Pro; giọng Celes: Newsreader nghiêng; nhãn: JetBrains Mono.
 */
export const FONT = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayVua: 'BricolageGrotesque_700Bold',
  than: 'BeVietnamPro_400Regular',
  thanVua: 'BeVietnamPro_500Medium',
  thanDam: 'BeVietnamPro_600SemiBold',
  thanRatDam: 'BeVietnamPro_700Bold',
  giong: 'Newsreader_400Regular_Italic',
  giongVua: 'Newsreader_500Medium_Italic',
  mono: 'JetBrainsMono_500Medium',
};

/** Đơn vị cơ sở 4px */
export const KHOANG = {
  x1: 4,
  x2: 8,
  x3: 12,
  x4: 16,
  x5: 20,
  x6: 24,
  x8: 32,
  x10: 40,
  x12: 48,
};

export const BO_GOC = {
  nho: 12,
  the: 20,
  theHero: 24,
  nut: 14,
  oNhap: 14,
  vien: 999,
  bottomSheet: 28,
};

/** Lề ngang của màn hình */
export const LE_NGANG = 20;

/** Vùng chạm tối thiểu theo chuẩn tiếp cận */
export const CHAM_TOI_THIEU = 44;

/** Chiều cao nút hành động chính */
export const CAO_NUT = 56;

/** Thanh tab nổi: cách đáy, cao, và phần orb Celes nhô lên */
export const THANH_TAB = { cachDay: 22, cao: 64, orbNho: 18, le: 14 };

export const DO_NOI = {
  the: {
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  hero: {
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 24 },
    elevation: 8,
  },
  nut: {
    shadowColor: '#D32298',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
};

/** Nhịp chuyển động: bình tĩnh, có chủ đích, nhẹ */
export const NHIP = {
  viMo: 165,
  manHinh: 230,
  /** Một nhịp thở của orb Celes */
  tho: 7000,
};
