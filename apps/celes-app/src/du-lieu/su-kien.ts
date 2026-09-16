/**
 * Ghi sự kiện theo bảng phân loại ở spec §38.
 *
 * Chưa nối dịch vụ analytics nào — chưa chốt nhà cung cấp, và dự án chạy ngân
 * sách 0. Lớp này tồn tại để các điểm gọi nằm sẵn đúng vị trí trong luồng: khi
 * nối GA4, PostHog hay Amplitude thì chỉ sửa một hàm, không phải đi rải lại
 * khắp app.
 *
 * Tuyệt đối không ghi kèm nội dung nhạy cảm: ngày giờ sinh, nội dung hội thoại,
 * tên người thân. Chỉ ghi định danh và các thuộc tính đếm được.
 */

export type TenSuKien =
  | 'app_open'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'chart_created'
  | 'quick_read_viewed'
  | 'evidence_opened'
  | 'signup_started'
  | 'signup_completed'
  | 'home_viewed'
  | 'daily_insight_opened'
  | 'journey_viewed'
  | 'year_selected'
  | 'month_selected'
  | 'celes_opened'
  | 'celes_message_sent'
  | 'celes_response_received'
  | 'celes_feedback_positive'
  | 'celes_feedback_negative'
  | 'connection_created'
  | 'profile_added'
  | 'paywall_viewed'
  | 'subscription_started'
  | 'subscription_completed'
  | 'share_created'
  | 'notification_enabled';

const LICH_SU: { ten: TenSuKien; luc: string }[] = [];
const TOI_DA = 200;

export function ghiSuKien(ten: TenSuKien, thuocTinh?: Record<string, unknown>) {
  const ban = { ten, luc: new Date().toISOString(), ...thuocTinh };

  if (__DEV__) {
    console.log('[su-kien]', ban);
  }

  LICH_SU.push({ ten, luc: ban.luc });
  if (LICH_SU.length > TOI_DA) LICH_SU.shift();
}

/** Đọc lại sự kiện trong phiên — dùng khi tự kiểm luồng lúc phát triển */
export function docSuKien() {
  return [...LICH_SU];
}
