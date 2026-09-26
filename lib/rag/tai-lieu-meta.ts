import { createHash } from 'node:crypto';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Mức tin cậy + loại nguồn của từng tài liệu, đọc THẲNG từ knowledge_documents.
 *
 * Vì sao không dùng `mucTinCay` đi kèm đoạn truy hồi: truy hồi v3 đệm kết quả
 * 30 phút trong tiến trình (truy-hoi-v3.ts), nên quản trị viên đổi mức tin cậy
 * xong phải chờ nửa tiếng mới có tác dụng. Bảng này nhỏ (vài chục tài liệu),
 * đọc một lần mỗi phút là đủ tươi mà không tốn gì.
 *
 * Đọc hỏng thì trả map rỗng — lớp gọi lùi về giá trị đi kèm đoạn.
 */

export interface MetaTaiLieu {
  mucTinCay: string;
  loaiNguon: string;
}

/**
 * Loại nguồn là LUẬT NGẦM (chủ dự án chốt 26/09/2026: "Nguồn chuyên gia Celes
 * là luật ngầm, không ghi trên lá số"). Celes vẫn dùng để định hướng luận,
 * nhưng bài không được nhắc tới, trích lại, hay gọi tên nó.
 */
export const LOAI_NGUON_AN = new Set(['ghi-chu-chuyen-gia', 'noi-bo']);

const HAN_MS = 60_000;
let dem: { luc: number; meta: Map<string, MetaTaiLieu>; phienBanKho: string } | null = null;

interface DongTaiLieu {
  id: string;
  muc_tin_cay: string;
  loai_nguon: string;
  luu_tru: boolean | null;
  knowledge_document_versions: { id: string; trang_thai: string }[] | null;
}

async function napLai(): Promise<NonNullable<typeof dem> | null> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('id, muc_tin_cay, loai_nguon, luu_tru, knowledge_document_versions(id, trang_thai)');
    if (error || !data) return null;
    const meta = new Map<string, MetaTaiLieu>();
    const dauVet: string[] = [];
    for (const d of data as DongTaiLieu[]) {
      meta.set(d.id, { mucTinCay: d.muc_tin_cay, loaiNguon: d.loai_nguon });
      const xb = (d.knowledge_document_versions ?? []).filter((v) => v.trang_thai === 'da_xuat_ban').map((v) => v.id);
      if (!d.luu_tru && xb.length) dauVet.push(`${d.id}:${xb.sort().join(',')}:${d.muc_tin_cay}:${d.loai_nguon}`);
    }
    const phienBanKho = createHash('sha256').update(dauVet.sort().join('|')).digest('hex').slice(0, 12);
    return { luc: Date.now(), meta, phienBanKho };
  } catch {
    return null;
  }
}

async function lay(): Promise<NonNullable<typeof dem> | null> {
  if (dem && Date.now() - dem.luc < HAN_MS) return dem;
  const moi = await napLai();
  if (moi) dem = moi;
  return moi ?? dem;
}

export async function docMetaTaiLieu(): Promise<Map<string, MetaTaiLieu>> {
  return (await lay())?.meta ?? new Map();
}

/**
 * Dấu vân tay của KHO đang xuất bản: đổi khi thêm / xuất bản / lưu trữ tài liệu,
 * hay đổi mức tin cậy, loại nguồn. Nút "Tạo bản mới" chỉ mở khi bài của người
 * đọc được viết với một dấu khác dấu hiện tại. Không đọc được kho thì null.
 */
export async function phienBanKho(): Promise<string | null> {
  return (await lay())?.phienBanKho ?? null;
}

/** Quản trị viên vừa sửa kho — lần đọc sau lấy bản mới (chỉ trong tiến trình này) */
export function xoaDemMeta(): void {
  dem = null;
}
