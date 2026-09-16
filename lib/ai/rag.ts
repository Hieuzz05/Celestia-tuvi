import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { embedTruyVan } from './embedding';

export interface DoanTriThuc {
  noiDung: string;
  tieuDe: string;
  hePhai: string;
  diemTuongDong: number;
}

/**
 * Truy hồi các đoạn tri thức liên quan tới câu truy vấn.
 *
 * Trả về mảng rỗng (không ném lỗi) khi kho chưa cấu hình hoặc chưa có tài liệu:
 * RAG là lớp bổ sung chất lượng, thiếu nó thì luận giải vẫn phải chạy được bằng
 * kiến thức nội tại của model.
 */
export async function truyHoiTriThuc(
  cauTruyVan: string,
  soLuong = 6,
  hePhai?: string
): Promise<DoanTriThuc[]> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return [];

  try {
    const vector = await embedTruyVan(cauTruyVan);
    const { data, error } = await supabase.rpc('tim_kien_thuc', {
      vector_truy_van: vector,
      so_luong: soLuong,
      // Đo thực tế: câu hỏi đúng chủ đề ~0.79, câu lạc đề ~0.49. Lấy 0.6 để
      // đoạn không liên quan không lọt vào prompt.
      nguong_toi_thieu: 0.6,
      loc_he_phai: hePhai ?? null,
    });
    if (error) {
      console.warn('[RAG] Không truy hồi được tri thức:', error.message);
      return [];
    }
    return (data ?? []).map(
      (d: { noi_dung: string; tieu_de: string; he_phai: string; diem_tuong_dong: number }) => ({
        noiDung: d.noi_dung,
        tieuDe: d.tieu_de,
        hePhai: d.he_phai,
        diemTuongDong: d.diem_tuong_dong,
      })
    );
  } catch (e) {
    console.warn('[RAG] Lỗi khi truy hồi:', e instanceof Error ? e.message : e);
    return [];
  }
}

/** Gộp các đoạn truy hồi được thành khối văn bản để chèn vào prompt */
export function dungKhoiTriThuc(doans: DoanTriThuc[]): string | undefined {
  if (doans.length === 0) return undefined;
  return doans
    .map(
      (d, i) =>
        `[${i + 1}] Nguồn: ${d.tieuDe} (${d.hePhai}, độ liên quan ${(d.diemTuongDong * 100).toFixed(0)}%)\n${d.noiDung}`
    )
    .join('\n\n');
}
