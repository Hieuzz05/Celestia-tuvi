import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { DO_DAI_V3 } from './prompt-v3';
import { TRAN_GOI_Y } from './kiem-v3';

/**
 * CẤU HÌNH LUẬN GIẢI v3 — các con số quản trị chỉnh được mà không cần deploy (30/09/2026).
 *
 * Chủ dự án: "Bạn tự đề xuất, nếu cần tôi sẽ tự chỉnh số". Số đề xuất nằm trong mã (DO_DAI_V3,
 * TRAN_GOI_Y) và là MẶC ĐỊNH; trang /admin/luan-giai ghi một bản đè vào bảng noi_dung_ai
 * (chart_hash `cau-hinh`, bề mặt `cau-hinh-v3`, khoá `v3`). Mỗi lần lưu giữ lại bản trước trong
 * `lichSu` để khôi phục.
 *
 * Chỉ SỐ, không có chữ prompt: chữ prompt đổi thì phải qua bộ thử và review, không sửa trên web.
 * Đổi số KHÔNG làm bài đã đệm viết lại — quản trị dùng nút "Viết lại (quản trị)" trên lá số để thử.
 *
 * Đọc hỏng / chưa có bản đè thì dùng mặc định trong mã; không bao giờ để một dòng DB hỏng làm
 * tắt luận giải.
 */

type Khoang = readonly [number, number];
export interface DoDaiLoai {
  /** Sàn và trần validator — ngoài khoảng này (quá 15%) là bắt sửa */
  luan: Khoang;
  /** Khoảng NÊN viết, nói trong lời nhắc */
  muc: Khoang;
  viSao: Khoang;
  doan: Khoang;
}
export interface CauHinhV3 {
  doDai: { 'tong-quan': DoDaiLoai; 'chuyen-sau': DoDaiLoai };
  /** Trần số từ của trường gợi ý; quá 1,5 lần là chặn */
  tranGoiY: number;
}

export const CAU_HINH_MAC_DINH: CauHinhV3 = { doDai: DO_DAI_V3, tranGoiY: TRAN_GOI_Y };

export interface BanCauHinh {
  cauHinh: CauHinhV3;
  /** Nhãn người sửa đặt, vd "Nới chuyên sâu lên 260" */
  nhan: string;
  luc: string;
  boi?: string;
}
interface DongLuu {
  hienTai: BanCauHinh;
  lichSu: BanCauHinh[];
}

const CHART_HASH = 'cau-hinh';
const BE_MAT = 'cau-hinh-v3';
const HAN_MS = 60_000;
const TOI_DA_LICH_SU = 20;
let dem: { luc: number; ch: CauHinhV3 } | null = null;

const so = (x: unknown, min: number, max: number): number | null =>
  typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max ? x : null;

function khoang(x: unknown, macDinh: Khoang, min: number, max: number): Khoang {
  if (!Array.isArray(x)) return macDinh;
  const a = so(x[0], min, max), b = so(x[1], min, max);
  return a !== null && b !== null && a <= b ? [a, b] : macDinh;
}

/** Ép dữ liệu (từ DB hoặc trình duyệt) về cấu hình hợp lệ; trường hỏng lấy mặc định */
export function lamSachCauHinh(x: unknown): CauHinhV3 {
  const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
  const dd = (o.doDai && typeof o.doDai === 'object' ? o.doDai : {}) as Record<string, unknown>;
  const loai = (id: 'tong-quan' | 'chuyen-sau'): DoDaiLoai => {
    const m = CAU_HINH_MAC_DINH.doDai[id];
    const v = (dd[id] && typeof dd[id] === 'object' ? dd[id] : {}) as Record<string, unknown>;
    const luan = khoang(v.luan, m.luan, 20, 800);
    // Mức nên viết phải nằm trong sàn–trần, không thì lời nhắc tự mâu thuẫn với validator
    const muc = khoang(v.muc, m.muc, 20, 800);
    return {
      luan,
      muc: muc[0] >= luan[0] && muc[1] <= luan[1] ? muc : [Math.max(m.muc[0], luan[0]), Math.min(m.muc[1], luan[1])],
      viSao: khoang(v.viSao, m.viSao, 10, 400),
      doan: khoang(v.doan, m.doan, 1, 8),
    };
  };
  return { doDai: { 'tong-quan': loai('tong-quan'), 'chuyen-sau': loai('chuyen-sau') }, tranGoiY: so(o.tranGoiY, 10, 120) ?? TRAN_GOI_Y };
}

async function docDong(): Promise<DongLuu | null> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase
    .from('noi_dung_ai')
    .select('noi_dung')
    .eq('chart_hash', CHART_HASH)
    .eq('be_mat', BE_MAT)
    .eq('khoa_ky', 'v3')
    .eq('ngon_ngu', 'vi')
    .maybeSingle();
  const d = data?.noi_dung as DongLuu | undefined;
  return d?.hienTai ? d : null;
}

/** Cấu hình đang chạy (đệm trong tiến trình 60 giây) */
export async function docCauHinhV3(): Promise<CauHinhV3> {
  if (dem && Date.now() - dem.luc < HAN_MS) return dem.ch;
  let ch = CAU_HINH_MAC_DINH;
  try {
    const d = await docDong();
    if (d) ch = lamSachCauHinh(d.hienTai.cauHinh);
  } catch {
    /* giữ mặc định */
  }
  dem = { luc: Date.now(), ch };
  return ch;
}

export async function docCauHinhChoQuanTri(): Promise<{ hienTai: BanCauHinh | null; lichSu: BanCauHinh[]; macDinh: CauHinhV3 }> {
  const d = await docDong();
  return { hienTai: d?.hienTai ?? null, lichSu: d?.lichSu ?? [], macDinh: CAU_HINH_MAC_DINH };
}

export async function luuCauHinhV3(cauHinh: CauHinhV3, nhan: string, boi?: string): Promise<BanCauHinh> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) throw new Error('Thiếu Supabase');
  const cu = await docDong();
  const moi: BanCauHinh = { cauHinh: lamSachCauHinh(cauHinh), nhan: nhan.slice(0, 120) || 'Không nhãn', luc: new Date().toISOString(), boi };
  const lichSu = cu ? [cu.hienTai, ...cu.lichSu].slice(0, TOI_DA_LICH_SU) : [];
  const { error } = await supabase
    .from('noi_dung_ai')
    .upsert(
      { chart_hash: CHART_HASH, be_mat: BE_MAT, khoa_ky: 'v3', ngon_ngu: 'vi', noi_dung: { hienTai: moi, lichSu } satisfies DongLuu },
      { onConflict: 'chart_hash,be_mat,khoa_ky,ngon_ngu' }
    );
  if (error) throw new Error(error.message);
  dem = null;
  return moi;
}
