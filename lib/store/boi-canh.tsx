'use client';

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
import { danhSachHoSo, type HoSo } from '@/lib/store/hoso';
import { docLaSoMacDinh, datLaSoMacDinh } from '@/lib/store/la-so-mac-dinh';
import type { GioiTinh } from '@/lib/tuvi/ansao';

/**
 * Bối cảnh dùng chung cho cả sản phẩm — mục 14 của spec v4.
 *
 * Vấn đề bản cũ: mỗi màn tự gọi `danhSachHoSo()` rồi tự chọn `hoSos[0]`, nên
 * đổi lá số ở Hỏi Celes xong sang Hành trình là quay về người khác, còn đổi
 * route là mất luôn lá số vừa nhập. Ở đây tách rõ hai khái niệm:
 *
 *  - `idMacDinh` (default_profile_id): lá số mang badge "Lá số của tôi". Lưu
 *    trên máy chủ, đổi bằng một hành động có chủ đích.
 *  - `idDangXem` (active_profile_id): lá số đang xem trong phiên này. Xem tạm
 *    một người khác KHÔNG được đổi "Lá số của tôi".
 *
 * `nhap` (draft_chart) giữ lá số vừa lập mà chưa lưu, để rời trang rồi quay lại
 * không mất — và để sau khi đăng nhập còn thứ mà lưu lại.
 *
 * Tất cả nằm trong sessionStorage chứ không phải localStorage: đây là trạng
 * thái của một phiên làm việc, không phải sở thích lâu dài. Đóng tab rồi mở lại
 * thì quay về "Lá số của tôi" là đúng mong đợi.
 */

export interface LaSoNhap {
  hoTen: string;
  ngay: number;
  thang: number;
  nam: number;
  gio: number;
  phut?: number;
  gioiTinh: GioiTinh;
}

interface BoiCanh {
  hoSos: HoSo[];
  dangTai: boolean;
  /** Lá số mang badge "Lá số của tôi" */
  idMacDinh: string | null;
  /** Lá số đang xem trong phiên này */
  idDangXem: string | null;
  hoSoDangXem: HoSo | null;
  /** Lá số vừa lập nhưng chưa lưu */
  nhap: LaSoNhap | null;
  /** Năm/tháng đang xem ở Hành trình */
  namXem: number | null;
  thangXem: number | null;
  /** Chế độ mệnh bàn gần nhất */
  cheDoBanDo: string | null;

  xemHoSo: (id: string | null) => void;
  datMacDinh: (id: string) => Promise<void>;
  datNhap: (nhap: LaSoNhap | null) => void;
  datThoiDiem: (nam: number, thang: number) => void;
  datCheDoBanDo: (cheDo: string) => void;
  taiLai: () => Promise<void>;
}

const KHOA = {
  dangXem: 'celestia:active_profile_id',
  nhap: 'celestia:draft_chart',
  nam: 'celestia:active_year',
  thang: 'celestia:active_month',
  cheDo: 'celestia:active_chart_mode',
} as const;

function doc<T>(khoa: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(khoa);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function ghi(khoa: string, gt: unknown) {
  if (typeof window === 'undefined') return;
  try {
    if (gt === null || gt === undefined) window.sessionStorage.removeItem(khoa);
    else window.sessionStorage.setItem(khoa, JSON.stringify(gt));
  } catch {
    // Chế độ riêng tư chặn sessionStorage — bỏ qua, không được làm hỏng luồng chính
  }
}

const Ctx = createContext<BoiCanh | null>(null);

export function BoiCanhProvider({ children }: { children: ReactNode }) {
  const [hoSos, setHoSos] = useState<HoSo[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [idMacDinh, setIdMacDinh] = useState<string | null>(null);
  const [idDangXem, setIdDangXem] = useState<string | null>(null);
  const [nhap, setNhapState] = useState<LaSoNhap | null>(null);
  const [namXem, setNamXem] = useState<number | null>(null);
  const [thangXem, setThangXem] = useState<number | null>(null);
  const [cheDoBanDo, setCheDoBanDo] = useState<string | null>(null);
  const daDocPhien = useRef(false);

  const taiLai = useCallback(async () => {
    try {
      const [ds, macDinh] = await Promise.all([danhSachHoSo(), docLaSoMacDinh()]);
      setHoSos(ds);

      // Lá số mặc định đã bị xoá thì rơi về người mới nhất, đừng để trỏ vào chỗ trống
      const macDinhHopLe = ds.some((h) => h.id === macDinh) ? macDinh : (ds[0]?.id ?? null);
      setIdMacDinh(macDinhHopLe);

      // Phiên trước đang xem ai thì giữ nguyên; hết hạn thì về "Lá số của tôi"
      const tuPhien = daDocPhien.current ? null : doc<string>(KHOA.dangXem);
      daDocPhien.current = true;
      setIdDangXem((cu) => {
        const muon = cu ?? tuPhien ?? macDinhHopLe;
        return ds.some((h) => h.id === muon) ? muon : macDinhHopLe;
      });
    } catch {
      setHoSos([]);
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => {
    setNhapState(doc<LaSoNhap>(KHOA.nhap));
    setNamXem(doc<number>(KHOA.nam));
    setThangXem(doc<number>(KHOA.thang));
    setCheDoBanDo(doc<string>(KHOA.cheDo));
    taiLai();
  }, [taiLai]);

  const xemHoSo = useCallback((id: string | null) => {
    setIdDangXem(id);
    ghi(KHOA.dangXem, id);
  }, []);

  const datMacDinh = useCallback(async (id: string) => {
    await datLaSoMacDinh(id);
    setIdMacDinh(id);
  }, []);

  const datNhap = useCallback((moi: LaSoNhap | null) => {
    setNhapState(moi);
    ghi(KHOA.nhap, moi);
  }, []);

  const datThoiDiem = useCallback((nam: number, thang: number) => {
    setNamXem(nam);
    setThangXem(thang);
    ghi(KHOA.nam, nam);
    ghi(KHOA.thang, thang);
  }, []);

  const datCheDoBanDoCb = useCallback((cheDo: string) => {
    setCheDoBanDo(cheDo);
    ghi(KHOA.cheDo, cheDo);
  }, []);

  const giaTri = useMemo<BoiCanh>(
    () => ({
      hoSos,
      dangTai,
      idMacDinh,
      idDangXem,
      hoSoDangXem: hoSos.find((h) => h.id === idDangXem) ?? null,
      nhap,
      namXem,
      thangXem,
      cheDoBanDo,
      xemHoSo,
      datMacDinh,
      datNhap,
      datThoiDiem,
      datCheDoBanDo: datCheDoBanDoCb,
      taiLai,
    }),
    [
      hoSos,
      dangTai,
      idMacDinh,
      idDangXem,
      nhap,
      namXem,
      thangXem,
      cheDoBanDo,
      xemHoSo,
      datMacDinh,
      datNhap,
      datThoiDiem,
      datCheDoBanDoCb,
      taiLai,
    ]
  );

  return <Ctx.Provider value={giaTri}>{children}</Ctx.Provider>;
}

export function useBoiCanh(): BoiCanh {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBoiCanh phải nằm trong <BoiCanhProvider>');
  return v;
}
