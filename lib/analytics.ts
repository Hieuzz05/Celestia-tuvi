'use client';

/**
 * Ghi sự kiện phễu kích hoạt.
 *
 * Chưa nối dịch vụ analytics nào — dự án chạy ngân sách 0 và chưa chốt nhà cung
 * cấp. Lớp này tồn tại để chỗ gọi nằm sẵn đúng vị trí trong luồng: khi nối GA4,
 * Plausible hay PostHog thì chỉ sửa một hàm này, không phải đi rải lại khắp app.
 *
 * Trong lúc chưa nối, sự kiện được giữ ở sessionStorage để tự kiểm luồng khi phát
 * triển, và in ra console khi chạy dev.
 */

export type TenSuKien =
  | 'landing_cta_click'
  | 'birth_flow_started'
  | 'chart_generated'
  | 'quick_read_viewed'
  | 'why_opened'
  | 'auth_gate_viewed'
  | 'signup_started'
  | 'signup_completed'
  | 'post_signup_feature_resumed'
  | 'signup_after_result'
  | 'home_returned'
  | 'timeline_year_opened'
  | 'ask_submitted'
  | 'relationship_started'
  | 'paywall_viewed'
  | 'purchase_started'
  | 'purchase_success'
  // Phễu ủng hộ — spec Support Celes mục 35 liệt kê đủ bộ này
  | 'support_gate_viewed'
  | 'support_gate_closed'
  | 'support_amount_selected'
  | 'support_custom_amount_entered'
  | 'support_payment_create_started'
  | 'support_payment_created'
  | 'support_checkout_opened'
  | 'support_payment_pending'
  | 'support_payment_cancelled'
  | 'support_payment_expired'
  | 'support_payment_success_client'
  | 'support_entitlement_granted'
  | 'support_resume_action'
  | 'supporter_expired';

const KHOA = 'tuvi-ai:su-kien';
const TOI_DA = 100;

export function ghiSuKien(ten: TenSuKien, thuocTinh?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  const ban = { ten, luc: new Date().toISOString(), ...thuocTinh };

  if (process.env.NODE_ENV === 'development') {
    console.debug('[su-kien]', ban);
  }

  try {
    const cu = JSON.parse(window.sessionStorage.getItem(KHOA) ?? '[]') as unknown[];
    cu.push(ban);
    window.sessionStorage.setItem(KHOA, JSON.stringify(cu.slice(-TOI_DA)));
  } catch {
    // Chế độ riêng tư chặn sessionStorage — bỏ qua, không được làm hỏng luồng chính
  }
}

/** Đọc lại các sự kiện đã ghi trong phiên — dùng khi tự kiểm phễu */
export function docSuKien(): { ten: string; luc: string }[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.sessionStorage.getItem(KHOA) ?? '[]');
  } catch {
    return [];
  }
}
