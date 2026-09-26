import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import type { MucThuVien } from './kieu';

/**
 * Chỗ lưu thư viện — TẠM trong bảng noi_dung_ai (QĐ-13 trong KIEN-TRUC-LUAN-GIAI.md).
 *
 * Máy làm việc không chạy được SQL tạo bảng; noi_dung_ai đã có khoá duy nhất
 * (chart_hash, be_mat, khoa_ky, ngon_ngu) đúng dạng cần: mỗi mục một dòng, khoá là
 * id mục. chart_hash cố định CHART_HASH — không băm được từ ngày giờ sinh nào
 * (băm lá số là 16 ký tự hex), nên route luận giải không bao giờ đọc nhầm.
 *
 * Câu trích sách nằm ở đây, trong Supabase — không vào repo.
 * Xét lại khi chủ dự án chạy SQL bảng riêng.
 */

const CHART_HASH = 'thu-vien';
const BE_MAT = 'thu-vien';
const HAN_MS = 5 * 60_000;
let dem: { luc: number; ds: MucThuVien[] } | null = null;

export async function docThuVien(chuDe?: string, dot?: string): Promise<MucThuVien[]> {
  const ds = await docTatCa(chuDe);
  return dot ? ds.filter((m) => m.dotTrich === dot) : ds;
}

async function docTatCa(chuDe?: string): Promise<MucThuVien[]> {
  if (!dem || Date.now() - dem.luc > HAN_MS) {
    const supabase = taoSupabaseAdmin();
    if (!supabase) return [];
    const ds: MucThuVien[] = [];
    try {
      for (let tu = 0; ; tu += 1000) {
        const { data, error } = await supabase
          .from('noi_dung_ai')
          .select('noi_dung')
          .eq('chart_hash', CHART_HASH)
          .eq('be_mat', BE_MAT)
          .range(tu, tu + 999);
        if (error) return dem?.ds.filter((m) => !chuDe || m.chuDe.includes(chuDe)) ?? [];
        ds.push(...(data ?? []).map((d) => d.noi_dung as MucThuVien));
        if (!data || data.length < 1000) break;
      }
    } catch {
      return [];
    }
    dem = { luc: Date.now(), ds };
  }
  return dem.ds.filter((m) => !chuDe || m.chuDe.includes(chuDe));
}

export async function luuThuVien(ds: MucThuVien[]): Promise<number> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return 0;
  let da = 0;
  for (let i = 0; i < ds.length; i += 200) {
    const lo = ds.slice(i, i + 200).map((m) => ({
      chart_hash: CHART_HASH,
      be_mat: BE_MAT,
      khoa_ky: m.id,
      ngon_ngu: 'vi',
      noi_dung: m,
      phien_ban: { schema: String(m.schemaVersion), dot: m.dotTrich },
    }));
    const { error } = await supabase.from('noi_dung_ai').upsert(lo, { onConflict: 'chart_hash,be_mat,khoa_ky,ngon_ngu' });
    if (error) throw new Error(`Không lưu được thư viện: ${error.message}`);
    da += lo.length;
  }
  dem = null;
  return da;
}

/** Xoá các mục của một đợt trích (chạy lại đợt) — chỉ đụng bề mặt thư viện */
export async function xoaDotTrich(dot: string): Promise<void> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return;
  await supabase.from('noi_dung_ai').delete().eq('chart_hash', CHART_HASH).eq('be_mat', BE_MAT).eq('phien_ban->>dot', dot);
  dem = null;
}
