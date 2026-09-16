import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { BanKhoan, DoChacGio, HoSo } from './ho-so';
import type { GioiTinh } from '@tuvi/ansao';

/**
 * Bản nháp trong lúc onboarding.
 *
 * Giữ ở bộ nhớ chứ không lưu xuống đĩa: người bỏ dở giữa chừng không nên bị lôi
 * lại đúng bước đang dở khi mở app lần sau — họ sẽ thấy như bị ép. Chỉ khi đi
 * hết luồng mới ghi thành hồ sơ thật.
 *
 * Dùng context thay vì truyền qua tham số đường dẫn để dữ liệu sinh không nằm
 * trong URL, và để quay lại bước trước không mất những gì đã nhập.
 */

export interface BanNhap {
  ten: string;
  ngaySinh: string;
  gio: number;
  phut: number;
  doChacGio: DoChacGio;
  gioiTinh: GioiTinh;
  banKhoan: BanKhoan[];
}

const MAC_DINH: BanNhap = {
  ten: '',
  ngaySinh: '',
  gio: 9,
  phut: 0,
  doChacGio: 'chinh-xac',
  gioiTinh: 'nam',
  banKhoan: [],
};

interface BoiCanh {
  banNhap: BanNhap;
  dat: <K extends keyof BanNhap>(k: K, v: BanNhap[K]) => void;
  thanhHoSo: () => HoSo;
  xoaTrang: () => void;
}

const Ctx = createContext<BoiCanh | null>(null);

export function BanNhapProvider({ children }: { children: ReactNode }) {
  const [banNhap, setBanNhap] = useState<BanNhap>(MAC_DINH);

  const gt = useMemo<BoiCanh>(
    () => ({
      banNhap,
      dat: (k, v) => setBanNhap((b) => ({ ...b, [k]: v })),
      thanhHoSo: () => ({ ...banNhap, taoLuc: new Date().toISOString() }),
      xoaTrang: () => setBanNhap(MAC_DINH),
    }),
    [banNhap]
  );

  return <Ctx.Provider value={gt}>{children}</Ctx.Provider>;
}

export function useBanNhap(): BoiCanh {
  const c = useContext(Ctx);
  if (!c) throw new Error('useBanNhap phải nằm trong BanNhapProvider');
  return c;
}
