import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { SYSTEM_V3, SYSTEM_V3_KHUNG } from './prompt-v3';

/**
 * MẪU GIỌNG VĂN — bài luận do chủ dự án sửa tay (27/09/2026), đưa vào cuối system prompt của v3.
 *
 * Vì sao không để trong mã: các bài mẫu viết cho một lá số THẬT, mà repo công khai (luật dự án: không
 * commit lá số thật). Nên mẫu nằm trong Supabase — bảng noi_dung_ai, bề mặt `mau-giong`, khoá `v3` —
 * và mã chỉ đọc lên. Đổi mẫu: sửa dòng ấy (scripts/nap-mau-giong.ts), không cần deploy.
 *
 * Đặt trong SYSTEM (không phải user) vì mẫu giống nhau cho mọi lượt gọi: phần đầu prompt vẫn cố định nên
 * vẫn được nhà cung cấp đệm. Đọc hỏng / chưa có mẫu thì dùng SYSTEM_V3 (hai mẫu cũ trong mã).
 */

const CHART_HASH = 'mau-giong';
const BE_MAT = 'mau-giong';
const HAN_MS = 10 * 60_000;
let dem: { luc: number; system: string } | null = null;

export interface MauGiong {
  cauHoi: string;
  luanGiai: string;
}

export function dungKhoiMau(ds: MauGiong[]): string {
  return `MẪU GIỌNG VĂN (chủ dự án sửa tay) — học CÁCH VIẾT: câu ngắn vừa phải, mỗi đoạn một ý, câu đầu đoạn nói thẳng ý. KHÔNG chép ý, chữ hay cách mở bài của mẫu — mỗi lá số một khác.

${ds.map((m, i) => `Mẫu ${i + 1} — câu hỏi "${m.cauHoi}":\n${m.luanGiai}`).join('\n\n')}`;
}

/** System prompt của v3 kèm mẫu giọng (đệm trong tiến trình 10 phút) */
export async function heThongV3(): Promise<string> {
  if (dem && Date.now() - dem.luc < HAN_MS) return dem.system;
  let system = SYSTEM_V3;
  try {
    const supabase = taoSupabaseAdmin();
    if (supabase) {
      const { data } = await supabase
        .from('noi_dung_ai')
        .select('noi_dung')
        .eq('chart_hash', CHART_HASH)
        .eq('be_mat', BE_MAT)
        .eq('khoa_ky', 'v3')
        .eq('ngon_ngu', 'vi')
        .maybeSingle();
      const ds = (data?.noi_dung as MauGiong[] | undefined)?.filter((m) => m?.luanGiai);
      if (ds?.length) system = [...SYSTEM_V3_KHUNG, dungKhoiMau(ds)].join('\n\n');
    }
  } catch {
    /* giữ SYSTEM_V3 */
  }
  dem = { luc: Date.now(), system };
  return system;
}

export async function luuMauGiong(ds: MauGiong[]): Promise<void> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) throw new Error('Thiếu Supabase');
  const { error } = await supabase
    .from('noi_dung_ai')
    .upsert({ chart_hash: CHART_HASH, be_mat: BE_MAT, khoa_ky: 'v3', ngon_ngu: 'vi', noi_dung: ds }, { onConflict: 'chart_hash,be_mat,khoa_ky,ngon_ngu' });
  if (error) throw new Error(error.message);
  dem = null;
}
