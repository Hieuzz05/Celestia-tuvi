'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Shell } from '@/components/ui';
import { useQuyen } from '@/lib/support/useQuyen';

/**
 * Chặn các trang quản trị.
 *
 * Trước đây `/admin` không có cổng nào: trang vẫn dựng ra, chỉ có các bảng dữ
 * liệu bên trong lặng lẽ trả 403. Người không có quyền thấy một trang trống mà
 * không hiểu vì sao, còn người CÓ quyền mà cấu hình sai thì cũng thấy y hệt —
 * không phân biệt được.
 *
 * Vai trò đọc từ `/api/entitlements/me`, tức là do máy chủ quyết. Tuyệt đối
 * không so email ở trình duyệt: email nằm trong tay người dùng, còn danh sách
 * admin thì chỉ máy chủ mới biết.
 *
 * Đây vẫn chỉ là lớp giao diện. Chặn thật nằm ở từng API, và nó không đổi.
 */
export function ChanQuanTri({ children }: { children: ReactNode }) {
  const { quyen, dangTai } = useQuyen();

  if (dangTai) return <Shell className="py-[48px]"><span /></Shell>;

  if (quyen?.tier !== 'admin') {
    return (
      <Shell className="flex flex-col gap-[12px] py-[48px]">
        <h1 className="heading-sm">Trang này dành cho quản trị viên</h1>
        <p className="body-sm max-w-[560px]" style={{ color: 'var(--fg-muted)' }}>
          {quyen?.tier === 'anonymous'
            ? 'Bạn chưa đăng nhập.'
            : 'Tài khoản bạn đang dùng không nằm trong danh sách quản trị. Danh sách đó khai ở biến môi trường ADMIN_EMAILS trên máy chủ.'}
        </p>
        <Link href={quyen?.tier === 'anonymous' ? '/dang-nhap' : '/home'} className="btn-outline btn-sm self-start">
          {quyen?.tier === 'anonymous' ? 'Đăng nhập' : 'Về trang chủ'}
        </Link>
      </Shell>
    );
  }

  return <>{children}</>;
}
