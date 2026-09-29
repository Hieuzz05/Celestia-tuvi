/**
 * Token thiết kế của Celestia trên di động.
 *
 * CÙNG design system với web (`app/globals.css`) — chốt 27/09/2026 sau phản biện:
 * bản trước lấy bo góc và thang chữ riêng từ spec di động 16/09 (thẻ 18/22, nút 12,
 * ô nhập 12, nút màu #DF37A7), nên app "cùng màu cùng font" nhưng lệch component.
 * Giờ bo góc và màu nút theo đúng web; chỉ thang chữ tiêu đề co lại cho màn hẹp.
 * Luật: pill (999) CHỈ cho lựa chọn / tag / bộ lọc; hành động là nút bo 8.
 *
 * Component chỉ được đọc token ngữ nghĩa (`mau.nen`, `mau.chu`...), không đọc
 * thẳng bảng màu gốc — đổi theme là đổi một chỗ.
 */

/** Bảng màu gốc, cố định ở cả hai theme */
export const BANG_MAU = {
  aubergine: '#240029',
  fuchsia: '#DF37A7',
  /** Nền nút hành động — web dùng bản đậm này để chữ trắng đạt tương phản WCAG */
  fuchsiaNut: '#D32298',
  /** Fuchsia cho CHỮ trên nền sáng (liên kết, nhãn nhấn) */
  fuchsiaChu: '#B62B8B',
  hong: '#FFBDD3',
  vangAm: '#FFCC11',
  kem: '#FFF1BD',
  nenAm: '#FFFDF9',
  trang: '#FFFFFF',
  vien: '#D4CCD4',
  chuMo: '#6D526D',
  tot: '#15803D',
  xau: '#EF4444',
  theToi: '#2D0334',
} as const;

/** Gradient chữ ký — chỉ dùng cho hero, onboarding, khoảnh khắc trả phí, thẻ chia sẻ */
export const GRADIENT_CHU_KY = ['#FFBDD3', '#FFF1BD', '#FFCC11'] as const;
export const GRADIENT_DIEM_DUNG = [0, 0.48, 1] as const;

export type TenTheme = 'sang' | 'toi';

export interface BoMau {
  nen: string;
  the: string;
  theAm: string;
  theNoi: string;
  chu: string;
  chuMo: string;
  chuNhat: string;
  vien: string;
  hanhDong: string;
  chuTrenHanhDong: string;
  tot: string;
  xau: string;
  /** Nền của bong bóng tin nhắn người dùng */
  bongNguoiDung: string;
  chuBongNguoiDung: string;
}

const SANG: BoMau = {
  nen: BANG_MAU.nenAm,
  the: BANG_MAU.trang,
  theAm: BANG_MAU.kem,
  theNoi: BANG_MAU.trang,
  chu: BANG_MAU.aubergine,
  chuMo: BANG_MAU.chuMo,
  chuNhat: '#9B869B',
  vien: BANG_MAU.vien,
  hanhDong: BANG_MAU.fuchsiaNut,
  chuTrenHanhDong: BANG_MAU.trang,
  tot: BANG_MAU.tot,
  xau: BANG_MAU.xau,
  bongNguoiDung: BANG_MAU.aubergine,
  chuBongNguoiDung: BANG_MAU.trang,
};

/**
 * Theme tối giữ nguyên bản sắc: nền là chính màu mực Aubergine.
 * Spec cấm thay bằng đen hay xanh navy chung chung.
 */
const TOI: BoMau = {
  nen: BANG_MAU.aubergine,
  the: BANG_MAU.theToi,
  theAm: '#3A0A42',
  theNoi: '#3A0A42',
  chu: BANG_MAU.trang,
  chuMo: BANG_MAU.vien,
  chuNhat: '#9B869B',
  vien: 'rgba(212,204,212,0.18)',
  hanhDong: BANG_MAU.fuchsia,
  chuTrenHanhDong: BANG_MAU.trang,
  tot: '#22C55E',
  xau: BANG_MAU.xau,
  bongNguoiDung: BANG_MAU.fuchsia,
  chuBongNguoiDung: BANG_MAU.trang,
};

export const MAU_THEO_THEME: Record<TenTheme, BoMau> = { sang: SANG, toi: TOI };

/** Thang chữ dành riêng cho di động */
export const CHU = {
  displayXl: { fontSize: 40, lineHeight: 41, fontWeight: '700' as const },
  display: { fontSize: 34, lineHeight: 36, fontWeight: '700' as const },
  h1: { fontSize: 30, lineHeight: 33, fontWeight: '700' as const },
  h2: { fontSize: 26, lineHeight: 30, fontWeight: '700' as const },
  h3: { fontSize: 21, lineHeight: 25, fontWeight: '600' as const },
  bodyLg: { fontSize: 18, lineHeight: 26, fontWeight: '400' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '400' as const },
  eyebrow: { fontSize: 12, lineHeight: 15, fontWeight: '400' as const },
  // Cỡ chữ siêu nhỏ của mệnh bàn KHÔNG nằm ở đây — khai báo riêng trong
  // `app/ban-do.tsx` để không màn nào khác vô tình dùng.
};

/** Tên font đã nạp — heading và body tách họ, eyebrow dùng mono */
export const FONT = {
  display: 'InterTight_700Bold',
  displayVua: 'InterTight_600SemiBold',
  than: 'Inter_400Regular',
  thanVua: 'Inter_500Medium',
  thanDam: 'Inter_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
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

/** Theo web: thẻ 14, nút 6 (di động 8 cho vùng chạm to), ô nhập 3 (di động 6) */
export const BO_GOC = {
  the: 14,
  theHero: 16,
  nut: 8,
  oNhap: 6,
  vien: 999,
  bottomSheet: 20,
};

/** Lề ngang của màn hình — spec cho 16/20/24 tuỳ bề ngang máy */
export const LE_NGANG = 20;

/** Vùng chạm tối thiểu theo chuẩn tiếp cận */
export const CHAM_TOI_THIEU = 44;

export const DO_NOI = {
  the: {
    shadowColor: BANG_MAU.aubergine,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  hero: {
    shadowColor: BANG_MAU.aubergine,
    shadowOpacity: 0.1,
    shadowRadius: 21,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};

/** Nhịp chuyển động: bình tĩnh, có chủ đích, nhẹ */
export const NHIP = {
  viMo: 165,
  manHinh: 230,
};
