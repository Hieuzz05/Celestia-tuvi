/**
 * CỔNG THU HỒI (X3, CELES-27) — đọc lệnh thu hồi mục thư viện, CHỈ phía server.
 *
 * Bảng `thu_hoi_muc_thu_vien` (supabase/va-thu-hoi-muc.sql) chỉ mở cho service-role. Phạm vi do server tự
 * tính (`phamViDem`), không nhận từ request: production chỉ đọc `'all'`, Preview / local đọc thêm phạm vi
 * của chính nó — nên thu hồi THỬ trên Preview không bao giờ chạm production.
 *
 * Luật đã quyết (phương án bản 2, §4): lỗi đọc thì MỞ cổng (hiện bài), không ẩn. Cổng hỏng không được làm
 * sập V3; ẩn nhầm là ẩn hàng loạt. Câu dính được viết lại khi đọc lại được (đệm mang `canCu`).
 */
import { after } from 'next/server';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { phamViDem } from '@/lib/moi-truong-dem';
import { TAP_RONG } from './cong';

const HAN_TOT = 60_000;
const HAN_TAT = 10 * 60_000;
const HAN_LOI = 30_000;
const HAN_TAP_CU = 30 * 60_000;

type TrangThai = 'tat-co' | 'tot' | 'chua-co-bang' | 'mo-cong-do-loi';

let nho: { tap: ReadonlySet<string>; den: number; trangThai: TrangThai } | null = null;
let tapTotGanNhat: { tap: ReadonlySet<string>; luc: number } | null = null;
let lanBaoTat = 0;
let dangDocNen: Promise<unknown> | null = null;

/** Chỉ cho bài kiểm offline */
export function _datLaiThuHoiChoTest(): void {
  nho = null;
  tapTotGanNhat = null;
  lanBaoTat = 0;
  dangDocNen = null;
}

/** Chỉ cho bài kiểm offline: chờ lượt đọc nền đang chạy (nếu có) */
export async function _choDocNenChoTest(): Promise<void> {
  await dangDocNen;
}

const laChuaCoBang = (e: { code?: string; message?: string } | null | undefined) =>
  !!e && (e.code === '42P01' || e.code === 'PGRST205' || /schema cache|does not exist|Could not find the table/i.test(e.message ?? ''));

class LoiChuaCoBang extends Error {}

async function docMotLan(): Promise<ReadonlySet<string>> {
  const db = taoSupabaseAdmin();
  if (!db) throw new LoiChuaCoBang('thiếu SUPABASE_SERVICE_ROLE_KEY');
  const pv = phamViDem();
  const phamVi = pv.moiTruong === 'production' ? ['all'] : ['all', pv.phamViDem];
  const { data, error } = await db.from('thu_hoi_muc_thu_vien').select('dau').in('pham_vi', phamVi).is('huy_luc', null);
  if (error) {
    if (laChuaCoBang(error)) throw new LoiChuaCoBang(error.message);
    throw new Error(error.message);
  }
  return new Set((data ?? []).map((r: { dau: string }) => r.dau));
}

/**
 * Tập dấu mục đã thu hồi đang có hiệu lực. Cờ `CELES_CONG_THU_HOI` khác '1' → tập rỗng, 0 truy vấn.
 * Nhớ trong RAM 60 giây. Hết 60 giây mà tập tốt gần nhất chưa quá 30 phút thì trả NGAY tập đó và đọc lại
 * DB ở nền: đo trên Preview 31/10/2026, mỗi lần đọc mất 850–1400 ms (mở lại kết nối sau lúc rảnh), làm
 * lượt trúng đệm từ 1,6 s thành 3 s. Đổi lại: mục vừa thu hồi có thể lọt thêm một lượt (chủ dự án duyệt 31/10).
 */
export async function docTapThuHoi(): Promise<ReadonlySet<string>> {
  if (process.env.CELES_CONG_THU_HOI !== '1') return TAP_RONG;
  const bayGio = Date.now();
  if (nho && nho.den > bayGio) return nho.tap;
  if (nho?.trangThai === 'tot' && tapTotGanNhat && bayGio - tapTotGanNhat.luc <= HAN_TAP_CU) {
    if (!dangDocNen) {
      dangDocNen = docVaNho().finally(() => {
        dangDocNen = null;
      });
      try {
        after(dangDocNen); // Vercel giữ hàm sống tới khi đọc xong, kể cả sau khi đã trả bài
      } catch {
        // ngoài phạm vi request (bài kiểm offline): promise vẫn chạy bình thường
      }
    }
    return nho.tap;
  }
  return docVaNho();
}

async function docVaNho(): Promise<ReadonlySet<string>> {
  const bayGio = Date.now();
  const batDau = bayGio;
  let tap: ReadonlySet<string> = TAP_RONG;
  let trangThai: TrangThai = 'tot';
  let han = HAN_TOT;
  try {
    try {
      tap = await docMotLan();
    } catch (e) {
      if (e instanceof LoiChuaCoBang) throw e;
      tap = await docMotLan();
    }
    tapTotGanNhat = { tap, luc: Date.now() };
  } catch (e) {
    if (e instanceof LoiChuaCoBang) {
      trangThai = 'chua-co-bang';
      han = HAN_TAT;
      tap = TAP_RONG;
      if (bayGio - lanBaoTat >= HAN_TAT) {
        lanBaoTat = bayGio;
        console.error('[thu-hoi] cổng tắt: chưa có bảng hoặc thiếu khoá service-role —', (e as Error).message);
      }
    } else {
      trangThai = 'mo-cong-do-loi';
      han = HAN_LOI;
      tap = tapTotGanNhat && bayGio - tapTotGanNhat.luc <= HAN_TAP_CU ? tapTotGanNhat.tap : TAP_RONG;
      console.error('[thu-hoi] mo-cong-do-loi', { loi: (e as Error).message, dungTapCu: tap.size > 0 });
    }
  }
  nho = { tap, den: Date.now() + han, trangThai };
  console.info('[thu-hoi] doc', { ms: Date.now() - batDau, so: tap.size, trangThai });
  return tap;
}
