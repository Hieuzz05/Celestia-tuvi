'use client';

/**
 * Ghi sự kiện phễu kích hoạt.
 *
 * TỰ GHI VÀO DB (25/09/2026). Dự án ngân sách 0 và chưa chốt nhà cung cấp, nên
 * thay vì chờ GA4/Plausible/PostHog, sự kiện gửi thẳng về /api/su-kien → bảng
 * `su_kien`, xem phễu ở trang quản trị. Chọn được nhà cung cấp thì vẫn chỉ sửa
 * một hàm này.
 *
 * KHÔNG gửi dữ liệu cá nhân: thuộc tính chỉ là mã khối, nguồn, ý định — đã rà
 * mọi chỗ gọi. Người dùng nhận diện bằng một mã khách NGẪU NHIÊN trong trình
 * duyệt (`khach`), không gắn email hay tài khoản.
 *
 * Bản sao trong sessionStorage giữ lại để tự kiểm luồng khi phát triển.
 */

import { type TenSuKien } from './su-kien-ten';

export type { TenSuKien };

const KHOA = 'tuvi-ai:su-kien';
const KHOA_KHACH = 'tuvi-ai:khach';
const TOI_DA = 100;

/** Mã khách ẩn danh, ngẫu nhiên, sống trong trình duyệt này — để đếm phễu theo người chứ không theo lượt */
function maKhach(): string {
  try {
    let m = window.localStorage.getItem(KHOA_KHACH);
    if (!m) {
      m = crypto.randomUUID();
      window.localStorage.setItem(KHOA_KHACH, m);
    }
    return m;
  } catch {
    return 'khong-luu-duoc';
  }
}

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

  // sendBeacon: không chặn giao diện, và vẫn gửi được khi người dùng vừa bấm sang trang khác
  try {
    const goi = JSON.stringify({ ten, thuocTinh: thuocTinh ?? {}, khach: maKhach(), trang: window.location.pathname });
    const blob = new Blob([goi], { type: 'application/json' });
    if (!navigator.sendBeacon?.('/api/su-kien', blob)) {
      void fetch('/api/su-kien', { method: 'POST', body: goi, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  } catch {
    // Không gửi được sự kiện thì thôi — tuyệt đối không làm hỏng việc người dùng đang làm
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
