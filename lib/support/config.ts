/**
 * Cấu hình thương mại của Support Celes.
 *
 * Spec yêu cầu mọi con số ở đây phải chỉnh được từ xa và KHÔNG được rải cứng
 * khắp các component. Dự án chạy ngân sách 0 nên chưa có dịch vụ remote config;
 * biến môi trường là thứ gần nhất đạt yêu cầu đó — đổi giá trị trên Vercel rồi
 * redeploy là xong, không phải sửa mã.
 *
 * Giá trị mặc định lấy đúng theo mục 3 và 37 của spec.
 */

function so(ten: string, macDinh: number): number {
  const v = Number(process.env[ten]);
  return Number.isFinite(v) && v > 0 ? v : macDinh;
}

function bat(ten: string, macDinh: boolean): boolean {
  const v = process.env[ten]?.trim().toLowerCase();
  if (v === undefined || v === '') return macDinh;
  return v === '1' || v === 'true';
}

export const CAU_HINH_UNG_HO = {
  /** Số câu Hỏi Celes miễn phí mỗi ngày cho tài khoản thường */
  freeAskDailyLimit: so('FREE_ASK_DAILY_LIMIT', 5),
  /**
   * Số BÀI LUẬN GIẢI SÂU miễn phí mỗi ngày.
   *
   * Một, không phải năm như Hỏi Celes. Một bài sâu tốn 25–45 giây máy chủ và
   * gấp nhiều lần token của một câu chat, nên nó là thứ đắt nhất sản phẩm cho
   * không. Mở rộng tay thì hoặc cạn tiền, hoặc phải hạ chất lượng — cả hai đều
   * tệ hơn là nói thẳng rằng mỗi ngày một bài.
   */
  freeDeepReadDailyLimit: so('FREE_DEEP_READ_DAILY_LIMIT', 1),
  /** Mỗi lần ủng hộ mở quyền trong bao lâu */
  supporterDurationHours: so('SUPPORTER_DURATION_HOURS', 24),
  supporterAskQuotaPerPayment: so('SUPPORTER_ASK_QUOTA_PER_PAYMENT', 30),
  supporterLongReportsPerPayment: so('SUPPORTER_LONG_REPORTS_PER_PAYMENT', 1),

  /** Mức gợi ý trên giao diện — chỉ là điểm neo, không phải bậc giá */
  suggestedAmounts: (process.env.SUPPORT_SUGGESTED_AMOUNTS ?? '19000,39000,79000')
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((x) => Number.isFinite(x) && x > 0),
  minSupportAmount: so('MIN_SUPPORT_AMOUNT_VND', 10000),
  maxSupportAmount: so('MAX_SUPPORT_AMOUNT_VND', 5000000),

  profileLimitFree: so('FREE_PROFILE_LIMIT', 1),
  profileLimitSupporter: so('SUPPORTER_PROFILE_LIMIT', 5),

  enableSupportGateAsk: bat('ENABLE_SUPPORT_GATE_ASK', true),
  enableSupportGateDeepMap: bat('ENABLE_SUPPORT_GATE_DEEP_MAP', true),
  enableSupportGateJourney: bat('ENABLE_SUPPORT_GATE_JOURNEY', true),
  enableSupportGateConnection: bat('ENABLE_SUPPORT_GATE_CONNECTION', true),
  enableSupportGateReports: bat('ENABLE_SUPPORT_GATE_REPORTS', true),

  /** Phiên thanh toán sống bao lâu trước khi phải tạo mã mới */
  paymentTtlMinutes: so('SUPPORT_PAYMENT_TTL_MINUTES', 15),
} as const;

export type LyDoUngHo =
  | 'ask_quota'
  | 'deep_map'
  | 'journey_detail'
  | 'connection_full'
  | 'long_report'
  | 'profile_limit'
  | 'voluntary';

const LY_DO_HOP_LE: LyDoUngHo[] = [
  'ask_quota',
  'deep_map',
  'journey_detail',
  'connection_full',
  'long_report',
  'profile_limit',
  'voluntary',
];

export function lyDoHopLe(v: unknown): v is LyDoUngHo {
  return typeof v === 'string' && (LY_DO_HOP_LE as string[]).includes(v);
}

/**
 * Chỉ nhận đường dẫn nội bộ cho chỗ quay lại.
 *
 * Nếu để lọt một URL tuyệt đối vào đây thì trang thanh toán trở thành cầu
 * chuyển hướng mở — người khác gửi link "ủng hộ" rồi đá nạn nhân sang site của
 * họ, mà thanh địa chỉ vẫn là celestia trước đó.
 */
export function duongDanNoiBo(v: unknown): string | null {
  if (typeof v !== 'string' || !v.startsWith('/') || v.startsWith('//')) return null;
  return v.slice(0, 300);
}
