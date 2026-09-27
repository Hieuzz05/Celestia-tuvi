import { lapLaSo } from './ansao';
import { docNhanh, type GocNhin } from './quick-read';

/**
 * Ba lá số mẫu trên trang chủ (27/09/2026).
 *
 * Bản cũ tính cả ba ngay trong trình duyệt nên engine an sao (~31KB nén) nằm trong
 * gói JS tải trước khi vẽ chữ chính. Tính sẵn cả ba × hai ngôn ngữ ở máy chủ thì
 * lại đẩy ~24KB dữ liệu vào HTML — HTML nằm trên đường găng, không lời gì. Nên chỉ
 * người mẫu ĐẦU (thứ người xem thấy ngay) tính sẵn; bấm sang người khác mới nạp
 * module này về trình duyệt (dynamic import) và tính tại chỗ.
 */

export const NGUOI_MAU = [
  { nhan: 'Nam · 2000', nhanEn: 'Male · 2000', ngay: 24, thang: 8, nam: 2000, gio: 9, gioiTinh: 'nam' as const },
  { nhan: 'Nữ · 1995', nhanEn: 'Female · 1995', ngay: 12, thang: 3, nam: 1995, gio: 15, gioiTinh: 'nu' as const },
  { nhan: 'Nam · 1988', nhanEn: 'Male · 1988', ngay: 2, thang: 11, nam: 1988, gio: 23, gioiTinh: 'nam' as const },
];

export interface MauDaTinh {
  vi: GocNhin[];
  en: GocNhin[];
}

export function tinhMotMau(i: number, namXem: number): MauDaTinh {
  const laSo = lapLaSo({ ...NGUOI_MAU[i] });
  return {
    vi: docNhanh(laSo, namXem, undefined, 'vi'),
    en: docNhanh(laSo, namXem, undefined, 'en'),
  };
}

/** Nhãn nút chọn người mẫu — gửi xuống trình duyệt mà không kéo theo engine */
export const NHAN_MAU = NGUOI_MAU.map(({ nhan, nhanEn }) => ({ nhan, nhanEn }));
