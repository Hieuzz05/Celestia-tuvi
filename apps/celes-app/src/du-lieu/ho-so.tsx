import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { lapLaSo, type GioiTinh, type LaSo } from '@tuvi/ansao';
import { docNhanh, type GocNhin, type YDinhDoc } from '@tuvi/quick-read';
import { useNgonNgu } from '@/i18n/context';

/**
 * Hồ sơ người dùng và bản đồ dựng từ đó.
 *
 * Lá số KHÔNG được lưu trữ — nó được tính lại từ thông tin sinh mỗi lần mở app.
 * Lý do: engine còn sửa, mà lá số lưu sẵn sẽ mắc kẹt ở phiên bản cũ và âm thầm
 * lệch với bản web. Chỉ lưu thứ người dùng thực sự nhập vào.
 */

export type BanKhoan =
  | 'congViec'
  | 'tinhCam'
  | 'banThan'
  | 'giaDinh'
  | 'taiChinh'
  | 'quyetDinh'
  | 'chuaRo';

/** Người dùng có thể không nhớ giờ sinh — trạng thái đó phải được ghi lại, không đoán bừa */
export type DoChacGio = 'chinh-xac' | 'khoang' | 'khong-chac';

export interface HoSo {
  ten: string;
  /** Ngày sinh dương lịch dạng YYYY-MM-DD */
  ngaySinh: string;
  gio: number;
  phut: number;
  doChacGio: DoChacGio;
  gioiTinh: GioiTinh;
  banKhoan: BanKhoan[];
  taoLuc: string;
}

const KHOA = 'celestia:ho-so';

interface BoiCanh {
  hoSo: HoSo | null;
  laSo: LaSo | null;
  gocNhin: GocNhin[];
  dangTai: boolean;
  luuHoSo: (h: HoSo) => Promise<void>;
  xoaHoSo: () => Promise<void>;
}

const Ctx = createContext<BoiCanh | null>(null);

/** Nối điều người dùng bận tâm sang ý định mà engine hiểu được */
const SANG_Y_DINH: Partial<Record<BanKhoan, YDinhDoc>> = {
  congViec: 'congViec',
  tinhCam: 'tinhCam',
  banThan: 'banThan',
  quyetDinh: 'quyetDinh',
};

export function HoSoProvider({ children }: { children: ReactNode }) {
  const { ngonNgu } = useNgonNgu();
  const [hoSo, setHoSo] = useState<HoSo | null>(null);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KHOA)
      .then((v) => {
        if (v) setHoSo(JSON.parse(v) as HoSo);
      })
      .catch(() => {
        // Hồ sơ hỏng hoặc không đọc được thì coi như chưa có, đưa về onboarding
      })
      .finally(() => setDangTai(false));
  }, []);

  const luuHoSo = useCallback(async (h: HoSo) => {
    setHoSo(h);
    try {
      await AsyncStorage.setItem(KHOA, JSON.stringify(h));
    } catch {
      // Không lưu được thì vẫn dùng được trong phiên hiện tại
    }
  }, []);

  const xoaHoSo = useCallback(async () => {
    setHoSo(null);
    await AsyncStorage.removeItem(KHOA).catch(() => {});
  }, []);

  const laSo = useMemo(() => {
    if (!hoSo) return null;
    const [nam, thang, ngay] = hoSo.ngaySinh.split('-').map(Number);
    if (!nam || !thang || !ngay) return null;
    try {
      return lapLaSo({
        ngay,
        thang,
        nam,
        gio: hoSo.gio,
        phut: hoSo.phut,
        gioiTinh: hoSo.gioiTinh,
        hoTen: hoSo.ten,
      });
    } catch {
      return null;
    }
  }, [hoSo]);

  const gocNhin = useMemo(() => {
    if (!laSo) return [];
    const yDinh = hoSo?.banKhoan.map((b) => SANG_Y_DINH[b]).find(Boolean);
    return docNhanh(laSo, new Date().getFullYear(), yDinh, ngonNgu);
  }, [laSo, hoSo, ngonNgu]);

  return (
    <Ctx.Provider value={{ hoSo, laSo, gocNhin, dangTai, luuHoSo, xoaHoSo }}>
      {children}
    </Ctx.Provider>
  );
}

export function useHoSo(): BoiCanh {
  const c = useContext(Ctx);
  if (!c) throw new Error('useHoSo phải nằm trong HoSoProvider');
  return c;
}
