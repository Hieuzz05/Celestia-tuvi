import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { lapLaSo, type GioiTinh, type LaSo } from '@tuvi/ansao';
import { namAmHienTai } from '@tuvi/bay-gio';
import { docNhanh, type GocNhin, type YDinhDoc } from '@tuvi/quick-read';
import { useNgonNgu } from '@/i18n/context';
import {
  cungLaSo,
  datMacDinh,
  docCharts,
  docCucBo,
  docMacDinh,
  ghiCucBo,
  taoCucBo,
  themChart,
  xoaChart,
  type NguoiLuu,
  type NguoiMoi,
} from './la-so-luu';
import { useTaiKhoan } from './tai-khoan';

/**
 * Hồ sơ người dùng và bản đồ dựng từ đó.
 *
 * Lá số KHÔNG được lưu trữ — nó được tính lại từ thông tin sinh mỗi lần mở app.
 * Lý do: engine còn sửa, mà lá số lưu sẵn sẽ mắc kẹt ở phiên bản cũ và âm thầm
 * lệch với bản web. Chỉ lưu thứ người dùng thực sự nhập vào.
 *
 * `hoSo` luôn là "lá số của tôi" (web: idMacDinh). Xem lá số người khác không
 * đổi `hoSo` — màn đó tự dựng lá số từ `nguoi`.
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
  /** Dòng tương ứng trong bảng `charts` khi đã đăng nhập — nối "lá số của tôi" với web */
  chartId?: string;
}

/** Hồ sơ trên máy -> thông tin sinh theo khuôn bảng `charts` */
export function thongTinSinh(h: HoSo): NguoiMoi {
  const [nam, thang, ngay] = h.ngaySinh.split('-').map(Number);
  return { hoTen: h.ten, ngay, thang, nam, gio: h.gio, gioiTinh: h.gioiTinh };
}

const hai = (n: number) => String(n).padStart(2, '0');

/** Một lá số đã lưu -> hồ sơ trên máy (phút và điều bận tâm thì web không lưu) */
function tuNguoi(n: NguoiLuu, banKhoan: BanKhoan[] = [], giuChartId = true): HoSo {
  return {
    ten: n.hoTen,
    ngaySinh: `${n.nam}-${hai(n.thang)}-${hai(n.ngay)}`,
    gio: n.gio,
    phut: 0,
    doChacGio: 'khoang',
    gioiTinh: n.gioiTinh,
    banKhoan,
    taoLuc: new Date(n.taoLuc).toISOString(),
    chartId: giuChartId ? n.id : undefined,
  };
}

/** Dựng lá số từ thông tin sinh; null nếu dữ liệu hỏng */
export function dungLaSo(n: NguoiMoi, phut = 0): LaSo | null {
  if (!n.nam || !n.thang || !n.ngay) return null;
  try {
    return lapLaSo({ ...n, phut });
  } catch {
    return null;
  }
}

const KHOA = 'celestia:ho-so';

interface BoiCanh {
  hoSo: HoSo | null;
  laSo: LaSo | null;
  gocNhin: GocNhin[];
  /** true cho tới khi biết chắc nên vào đâu: đọc máy, đọc phiên, đồng bộ lần đầu */
  dangTai: boolean;
  luuHoSo: (h: HoSo) => Promise<void>;
  xoaHoSo: () => Promise<void>;
  /** Mọi lá số đã lưu. Đã đăng nhập thì gồm cả lá số của chính mình */
  nguoi: NguoiLuu[];
  laCuaToi: (n: NguoiLuu) => boolean;
  themNguoi: (n: NguoiMoi) => Promise<NguoiLuu>;
  xoaNguoi: (id: string) => Promise<void>;
  datLamCuaToi: (id: string) => Promise<void>;
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
  const { dangNap, phien } = useTaiKhoan();
  const userId = phien?.user.id ?? null;
  const [hoSo, setHoSo] = useState<HoSo | null>(null);
  const [docMayXong, setDocMayXong] = useState(false);
  const [nguoi, setNguoi] = useState<NguoiLuu[]>([]);
  /** userId đã đồng bộ xong — suy ra "đang đồng bộ" từ đây thay vì giữ cờ riêng, khỏi lệch một nhịp */
  const [daDongBoCho, setDaDongBoCho] = useState<string | null>(null);
  const hoSoRef = useRef<HoSo | null>(null);
  useEffect(() => {
    hoSoRef.current = hoSo;
  }, [hoSo]);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(KHOA), docCucBo()])
      .then(([v, ds]) => {
        if (v) {
          const h = JSON.parse(v) as HoSo;
          hoSoRef.current = h;
          setHoSo(h);
        }
        setNguoi(ds);
      })
      .catch(() => {
        // Hồ sơ hỏng hoặc không đọc được thì coi như chưa có, đưa về onboarding
      })
      .finally(() => setDocMayXong(true));
  }, []);

  const ghiHoSo = useCallback(async (h: HoSo | null) => {
    hoSoRef.current = h;
    setHoSo(h);
    try {
      if (h) await AsyncStorage.setItem(KHOA, JSON.stringify(h));
      else await AsyncStorage.removeItem(KHOA);
    } catch {
      // Không lưu được thì vẫn dùng được trong phiên hiện tại
    }
  }, []);

  const canGan = !!hoSo && !hoSo.chartId;

  /**
   * Đồng bộ với tài khoản mỗi khi đăng nhập, và mỗi khi hồ sơ trên máy chưa gắn
   * với dòng nào trong `charts` (vừa làm onboarding lúc đã đăng nhập).
   *
   * Luật "lá số của tôi", theo web (docs/bay/giao-dien.md — mặc định ≠ đang xem):
   *  - Tài khoản đã chọn lá số của mình -> lá số đó thắng. Hồ sơ trên máy (nếu
   *    khác) vẫn được lưu lên thành một người trong danh sách, không mất.
   *  - Chưa chọn -> hồ sơ trên máy thành lá số của tôi.
   *  - Không bao giờ tự lấy lá số đầu danh sách làm của tôi.
   */
  useEffect(() => {
    if (!docMayXong) return;
    if (!userId) {
      // Đăng xuất: danh sách trở về phần nằm trên máy; hồ sơ khách không giữ chartId
      let huy = false;
      docCucBo().then((ds) => {
        if (!huy) setNguoi(ds);
      });
      return () => {
        huy = true;
      };
    }
    if (daDongBoCho === userId && !canGan) return;
    let huy = false;

    (async () => {
      try {
        let ds = await docCharts();
        const macDinh = await docMacDinh(userId);
        const dongMacDinh = ds.find((n) => n.id === macDinh) ?? null;

        // Tìm dòng của một bộ thông tin sinh, chưa có thì thêm
        const ganVao = async (n: NguoiMoi) => {
          const co = ds.find((d) => cungLaSo(d, n));
          if (co) return co;
          const moi = await themChart(userId, n);
          ds = [moi, ...ds];
          return moi;
        };

        // Người lưu lúc chưa đăng nhập -> đẩy lên, như chuyenHoSoLenTaiKhoan của web
        const cucBo = await docCucBo();
        for (const n of cucBo) await ganVao(n);
        if (cucBo.length) await ghiCucBo([]);

        const hienTai = hoSoRef.current;
        let hoSoMoi = hienTai;
        if (hienTai && !(hienTai.chartId && ds.some((d) => d.id === hienTai.chartId))) {
          const dong = await ganVao(thongTinSinh(hienTai));
          if (dongMacDinh && dongMacDinh.id !== dong.id) {
            hoSoMoi = tuNguoi(dongMacDinh);
          } else {
            hoSoMoi = { ...hienTai, chartId: dong.id };
            if (!dongMacDinh) await datMacDinh(userId, dong.id);
          }
        } else if (!hienTai && dongMacDinh) {
          // Máy mới, đăng nhập trước: nhận lá số của mình từ tài khoản, khỏi làm lại onboarding
          hoSoMoi = tuNguoi(dongMacDinh);
        }

        if (huy) return;
        setNguoi(ds);
        if (hoSoMoi !== hienTai) await ghiHoSo(hoSoMoi);
      } catch {
        // Mất mạng hay lỗi bảng: dùng tiếp phần trên máy, lần mở sau thử lại
      } finally {
        if (!huy) setDaDongBoCho(userId);
      }
    })();

    return () => {
      huy = true;
    };
  }, [docMayXong, userId, canGan, daDongBoCho, ghiHoSo]);

  const luuHoSo = useCallback((h: HoSo) => ghiHoSo(h), [ghiHoSo]);

  const xoaHoSo = useCallback(() => ghiHoSo(null), [ghiHoSo]);

  const laCuaToi = useCallback(
    (n: NguoiLuu) => !!hoSo?.chartId && n.id === hoSo.chartId,
    [hoSo?.chartId]
  );

  const themNguoi = useCallback(
    async (n: NguoiMoi) => {
      const moi = userId ? await themChart(userId, n) : taoCucBo(n);
      setNguoi((ds) => {
        const tiep = [moi, ...ds];
        if (!userId) ghiCucBo(tiep);
        return tiep;
      });
      return moi;
    },
    [userId]
  );

  const xoaNguoi = useCallback(
    async (id: string) => {
      if (userId) await xoaChart(id);
      setNguoi((ds) => {
        const tiep = ds.filter((n) => n.id !== id);
        if (!userId) ghiCucBo(tiep);
        return tiep;
      });
    },
    [userId]
  );

  const datLamCuaToi = useCallback(
    async (id: string) => {
      const n = nguoi.find((x) => x.id === id);
      if (!n) return;
      if (userId) {
        await datMacDinh(userId, id);
        await ghiHoSo(tuNguoi(n, hoSo?.banKhoan));
        return;
      }
      // Khách: lá số cũ của mình chuyển xuống danh sách thay cho người vừa chọn, không mất
      const tiep = nguoi.filter((x) => x.id !== id);
      if (hoSo) tiep.unshift(taoCucBo(thongTinSinh(hoSo)));
      setNguoi(tiep);
      await ghiCucBo(tiep);
      await ghiHoSo(tuNguoi(n, hoSo?.banKhoan, false));
    },
    [nguoi, userId, hoSo, ghiHoSo]
  );

  const laSo = useMemo(() => (hoSo ? dungLaSo(thongTinSinh(hoSo), hoSo.phut) : null), [hoSo]);

  const gocNhin = useMemo(() => {
    if (!laSo) return [];
    const yDinh = hoSo?.banKhoan.map((b) => SANG_Y_DINH[b]).find(Boolean);
    return docNhanh(laSo, namAmHienTai(), yDinh, ngonNgu);
  }, [laSo, hoSo, ngonNgu]);

  const dangTai = !docMayXong || dangNap || (!!userId && daDongBoCho !== userId);

  return (
    <Ctx.Provider
      value={{
        hoSo,
        laSo,
        gocNhin,
        dangTai,
        luuHoSo,
        xoaHoSo,
        nguoi,
        laCuaToi,
        themNguoi,
        xoaNguoi,
        datLamCuaToi,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useHoSo(): BoiCanh {
  const c = useContext(Ctx);
  if (!c) throw new Error('useHoSo phải nằm trong HoSoProvider');
  return c;
}
