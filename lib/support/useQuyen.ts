'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Quyen } from '@/lib/support/entitlements';

/**
 * Quyền hiện tại, đọc từ máy chủ.
 *
 * Hook này phục vụ TRẢI NGHIỆM: hiện số câu còn lại, quyết định mở cổng ủng hộ
 * trước khi gửi yêu cầu. Nó KHÔNG phải cơ chế chặn — mọi khả năng trả phí đều
 * được kiểm lại ở endpoint tương ứng. Ai sửa state trong devtools thì cũng chỉ
 * bỏ qua được cái modal, không lấy thêm được lượt nào.
 */
export function useQuyen() {
  const [quyen, setQuyen] = useState<Quyen | null>(null);
  const [dangTai, setDangTai] = useState(true);

  // Hàm tải KHÔNG tự đặt state: người gọi nối `.then(setQuyen)`. Hàm async mà
  // tự setState thì gọi nó thẳng trong effect là cascading render.
  const tai = useCallback(async (): Promise<Quyen | null> => {
    try {
      const res = await fetch('/api/entitlements/me', { cache: 'no-store' });
      if (!res.ok) return null;
      return (await res.json()) as Quyen;
    } catch {
      return null;
    }
  }, []);

  const taiLai = useCallback(() => {
    tai().then(setQuyen);
  }, [tai]);

  useEffect(() => {
    tai().then((q) => {
      setQuyen(q);
      setDangTai(false);
    });
  }, [tai]);

  return {
    quyen,
    dangTai,
    taiLai,
    /** Bậc admin và bản chưa cấu hình tài khoản không bị tính lượt */
    khongGioiHan: quyen?.ask.remaining === null,
    conCau: quyen?.ask.remaining ?? null,
  };
}
