import { namAmHienTai, thangAmHienTai } from '@tuvi/bay-gio';
import type { HoSo } from './ho-so';
import { tokenHienTai } from './supabase';

/**
 * Gọi sang dịch vụ của Celestia.
 *
 * App KHÔNG tự chạy model: phần điều phối AI, kho tri thức và hạn mức đều nằm ở
 * máy chủ web — cùng một chỗ với web thì hai bên trả lời nhất quán, và khoá API
 * không bị nhúng vào gói cài đặt (ai tải app về cũng rút được khoá ra).
 *
 * Địa chỉ đổi được qua biến môi trường khi dựng bản chạy thử nội bộ.
 */

const GOC =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'https://celestia-tuvi.vercel.app';

/** Ném ra khi máy chủ không trả lời được — màn hình tự đổi sang thông điệp của Celes */
export class LoiCeles extends Error {}

/**
 * Máy chủ trả 401 kèm `canDangNhap` — chưa đăng nhập hoặc phiên đã hết hạn.
 * Tách riêng để màn hình mời đăng nhập thay vì báo "Celes chưa hoàn thành được".
 */
export class LoiCanDangNhap extends LoiCeles {}

/**
 * Máy chủ trả 402: hết lượt miễn phí hôm nay, hoặc tính năng cần bậc cao hơn.
 * Thanh toán đang TẠM ẨN trên iOS (quy định 3.1.1) nên app chỉ báo, không mở cổng.
 */
export class LoiHetLuot extends LoiCeles {
  constructor(public gioiHan?: number) {
    super('het-luot');
  }
}

export interface TinNhanGui {
  vaiTro: 'nguoi-dung' | 'tro-ly';
  noiDung: string;
}

export function tachNgay(ngaySinh: string) {
  const [nam, thang, ngay] = ngaySinh.split('-').map(Number);
  return { ngay, thang, nam };
}

/** Phần lá số mọi tuyến đều cần — cùng hình dạng body của web */
export function thanLaSo(hoSo: HoSo) {
  return { ...tachNgay(hoSo.ngaySinh), gio: hoSo.gio, gioiTinh: hoSo.gioiTinh, hoTen: hoSo.ten };
}

/**
 * Một lượt POST JSON tới máy chủ, gắn Bearer nếu đã đăng nhập.
 * 401 `canDangNhap` / 429 `gioiHanKhach` → LoiCanDangNhap, 402 → LoiHetLuot, còn lại → LoiCeles.
 */
export async function goiApi<T>(duong: string, body: unknown): Promise<T> {
  // App không có cookie như trình duyệt — máy chủ đọc phiên từ header Bearer
  const token = await tokenHienTai();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${GOC}${duong}`, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch {
    throw new LoiCeles('khong-ket-noi-duoc');
  }

  const data = (await res.json().catch(() => ({}))) as T & {
    loi?: string;
    canDangNhap?: boolean;
    freeLimit?: number;
  };
  if (res.status === 401 && data.canDangNhap) throw new LoiCanDangNhap('can-dang-nhap');
  // Khách đã xem đủ lá số mới trong ngày (tổng quan luận giải) — lối ra cũng là đăng nhập
  if (res.status === 429 && (data as { gioiHanKhach?: boolean }).gioiHanKhach) {
    throw new LoiCanDangNhap('gioi-han-khach');
  }
  if (res.status === 402) throw new LoiHetLuot(data.freeLimit);
  if (!res.ok) throw new LoiCeles(data.loi ?? `http-${res.status}`);
  return data;
}

/** Lối đi tiếp do máy chủ dựng — `duong` là đường dẫn WEB, màn hình tự đổi sang tuyến app */
export interface LoiDi {
  nhan: string;
  duong: string;
}

export interface TraLoiCeles {
  traLoi: string;
  model?: string;
  goiYTiep: string[];
  loiDi: LoiDi[];
}

/** Trần lịch sử gửi lên — khớp trần 60 của `/api/hoi-dap` */
const TRAN_LICH_SU = 60;

export async function hoiCeles(
  hoSo: HoSo,
  cauHoi: string,
  lichSu: TinNhanGui[],
  tuChip = false
): Promise<TraLoiCeles> {
  const bayGio = new Date();
  const data = await goiApi<Partial<TraLoiCeles>>('/api/hoi-dap', {
    ...thanLaSo(hoSo),
    namXem: namAmHienTai(bayGio),
    thangXem: thangAmHienTai(bayGio),
    cauHoi,
    lichSu: lichSu.slice(-TRAN_LICH_SU),
    // Câu bấm từ chip gợi ý — máy chủ dùng cờ này để biết chắc đây là lượt nối tiếp
    tuChip,
  });

  // Máy chủ trả `traLoi` (không phải `noiDung`) — đọc nhầm tên này là Celes im lặng
  if (!data.traLoi) throw new LoiCeles('khong-co-noi-dung');
  return {
    traLoi: data.traLoi,
    model: data.model,
    goiYTiep: Array.isArray(data.goiYTiep) ? data.goiYTiep : [],
    loiDi: Array.isArray(data.loiDi) ? data.loiDi : [],
  };
}

/* ------------------------------------------------------------ Luận giải */

/** Một câu của luận giải chuyên sâu — khuôn `CauV3` của web */
export interface CauV3 {
  id: string;
  cauHoi: string;
  luanGiai: string;
  /** Căn cứ trên lá số — viết bằng tên sao, tên cung; màn hình ẩn mặc định */
  viSao: string;
  chuaViet: boolean;
}

/**
 * Năm xem của luận giải: năm DƯƠNG hiện tại, đúng như trang web gửi. Khoá bài
 * đệm trên máy chủ có năm xem — lệch một năm là trượt bài web đã viết, tốn một
 * lượt viết mới cho cùng nội dung.
 */
export const namXemLuanGiai = () => new Date().getFullYear();

function thanV3(hoSo: HoSo) {
  const { ngay, thang, nam, gio, gioiTinh } = thanLaSo(hoSo);
  return { ngay, thang, nam, gio, gioiTinh, namXem: namXemLuanGiai() };
}

/** Chỉ giữ trường màn hình dùng — phần còn lại (độ rõ, dấu vết kho) không lên giao diện */
const gonCau = (c: Partial<CauV3>): CauV3 => ({
  id: String(c.id ?? ''),
  cauHoi: String(c.cauHoi ?? ''),
  luanGiai: String(c.luanGiai ?? ''),
  viSao: String(c.viSao ?? ''),
  chuaViet: Boolean(c.chuaViet) || !c.luanGiai,
});

/**
 * Các câu `chi` của một nhóm (`tong-quan` hoặc id chủ đề). Tổng quan mở cho
 * khách; nhóm khác cần đăng nhập. Không trừ hạn mức — bài được đệm dùng chung.
 */
export async function docNhomV3(hoSo: HoSo, nhom: string, chi: string[]): Promise<CauV3[]> {
  const data = await goiApi<{ cau?: Partial<CauV3>[] }>('/api/luan-giai-v3', {
    ...thanV3(hoSo),
    nhom,
    chi,
  });
  return Array.isArray(data.cau) ? data.cau.map(gonCau) : [];
}

/** Phần "Tóm lại" của một chủ đề — chỉ xin khi đã đủ các câu */
export async function docTomLaiV3(hoSo: HoSo, nhom: string): Promise<string | null> {
  try {
    const data = await goiApi<{ tomLai?: string | null }>('/api/luan-giai-v3', {
      ...thanV3(hoSo),
      nhom,
      tomLai: true,
    });
    return data.tomLai ?? null;
  } catch {
    return null;
  }
}

export interface BucTranh {
  bucTranh: string | null;
  soChuDe: number;
  canToiThieu?: number;
}

/** Bức tranh lớn: ghép phần tóm lại của các chủ đề đã đọc */
export async function docBucTranhV3(hoSo: HoSo): Promise<BucTranh> {
  const data = await goiApi<Partial<BucTranh>>('/api/luan-giai-v3', {
    ...thanV3(hoSo),
    nhom: 'tinh-cach',
    bucTranh: true,
  });
  return {
    bucTranh: data.bucTranh ?? null,
    soChuDe: Number(data.soChuDe ?? 0),
    canToiThieu: data.canToiThieu,
  };
}
