import type { Metadata } from 'next';

// Trang là client component nên không tự khai được tiêu đề — trước 24/09/2026 mọi
// tab đều mang cùng một tên "Celestia — Hiểu mình…", mở vài tab là không phân biệt nổi.
export const metadata: Metadata = { title: 'Đăng nhập' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
