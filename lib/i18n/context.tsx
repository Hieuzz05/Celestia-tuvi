'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { en } from './en';
import { vi, type TuDien } from './vi';

/**
 * Lớp ngôn ngữ VI/EN.
 *
 * Brand spec chốt: mặc định theo locale của thiết bị, IP chỉ là phương án cuối,
 * và lựa chọn phải được nhớ lại. Ở đây dùng locale state chứ không tách route
 * /vi và /en — spec cho phép cả hai, mà tách route thì phải dựng lại toàn bộ
 * cây app router cho một thứ chưa có nội dung SEO riêng.
 *
 * Lựa chọn lưu ở localStorage cho lần sau, và ghi kèm cookie để sau này nếu cần
 * dựng sẵn đúng ngôn ngữ từ phía máy chủ thì đã có sẵn tín hiệu.
 */

export type NgonNgu = 'vi' | 'en';

const KHOA = 'tuvi-ai:ngon-ngu';
const TU_DIEN: Record<NgonNgu, TuDien> = { vi, en };

interface BoiCanh {
  ngonNgu: NgonNgu;
  t: TuDien;
  datNgonNgu: (n: NgonNgu) => void;
  /** true khi vẫn đang dùng mặc định, chưa đọc xong lựa chọn đã lưu */
  dangDoDinh: boolean;
}

const Ctx = createContext<BoiCanh | null>(null);

/** Đoán ngôn ngữ từ thiết bị — tiếng Việt chỉ khi trình duyệt thật sự khai báo vi */
function doanTuThietBi(): NgonNgu {
  if (typeof navigator === 'undefined') return 'vi';
  const ds = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const l of ds) {
    const ma = l?.toLowerCase() ?? '';
    if (ma.startsWith('vi')) return 'vi';
    if (ma.startsWith('en')) return 'en';
  }
  return 'vi';
}

export function NgonNguProvider({ children }: { children: ReactNode }) {
  const [ngonNgu, setNgonNgu] = useState<NgonNgu>('vi');
  const [dangDoDinh, setDangDoDinh] = useState(true);

  useEffect(() => {
    let daChon: NgonNgu | null = null;
    try {
      const luu = window.localStorage.getItem(KHOA);
      if (luu === 'vi' || luu === 'en') daChon = luu;
    } catch {
      // Chế độ riêng tư chặn localStorage — rơi về đoán từ thiết bị
    }
    const chon = daChon ?? doanTuThietBi();
    // localStorage và navigator chỉ có ở trình duyệt; đọc trong lúc render sẽ
    // lệch với bản dựng phía máy chủ và vỡ hydration. Chạy đúng một lần lúc gắn
    // vào cây là cách đúng ở đây, nên tắt cảnh báo cho riêng dòng dưới.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNgonNgu(chon);
    setDangDoDinh(false);
    document.documentElement.lang = chon;
  }, []);

  const datNgonNgu = useCallback((n: NgonNgu) => {
    setNgonNgu(n);
    document.documentElement.lang = n;
    try {
      window.localStorage.setItem(KHOA, n);
      document.cookie = `${KHOA}=${n}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Không lưu được thì vẫn đổi trong phiên hiện tại
    }
  }, []);

  return (
    <Ctx.Provider value={{ ngonNgu, t: TU_DIEN[ngonNgu], datNgonNgu, dangDoDinh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNgonNgu(): BoiCanh {
  const c = useContext(Ctx);
  if (!c) throw new Error('useNgonNgu phải nằm trong NgonNguProvider');
  return c;
}

/** Lấy thẳng từ điển — dùng khi component chỉ cần đọc chữ */
export function useT(): TuDien {
  return useNgonNgu().t;
}

/** Thay {khoa} trong chuỗi bằng giá trị thật */
export function dien(mau: string, gt: Record<string, string | number>): string {
  return mau.replace(/\{(\w+)\}/g, (_, k) => String(gt[k] ?? `{${k}}`));
}
