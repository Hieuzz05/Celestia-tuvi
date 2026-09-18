import { taoSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Bộ nhớ đệm cho nội dung do AI sinh ra.
 *
 * Ba bề mặt — Hôm nay, Hành trình, và các mốc thời gian — trước đây là chữ tất
 * định nên mở bao nhiêu lần cũng ra đúng một bài. Chuyển sang gọi model thì mất
 * đúng tính chất đó, mà tính chất đó không phải tác dụng phụ: người dùng mở lại
 * trang trong ngày phải thấy đúng bài họ đọc lúc sáng, bằng không họ không tin
 * được cái gì cả.
 *
 * Nên nội dung sinh một lần rồi cất theo kỳ. Hết kỳ thì khoá đổi và sinh lại;
 * bài của kỳ cũ vẫn nằm đó, đọc lại vẫn ra đúng bài cũ.
 *
 * Thiếu bảng hoặc thiếu Supabase thì mọi hàm ở đây im lặng trả null. Đó là cố
 * ý: lớp gọi phải có đường lùi về chữ tất định, và một bảng chưa tạo không được
 * phép làm trắng màn hình người dùng.
 */

export type BeMat =
  | 'diem-noi-bat'
  | 'nhip-hien-tai'
  | 'moc-giai-doan'
  | 'moc-nam'
  | 'moc-thang'
  | 'luan-han-chi-tiet'
  | 'bang-linh-vuc';

export interface BanGhiNoiDung<T> {
  noiDung: T;
  provider: string | null;
  model: string | null;
  taoLuc: string;
}

interface Khoa {
  chartHash: string;
  beMat: BeMat;
  khoaKy: string;
  ngonNgu: string;
}

export async function docNoiDung<T>(k: Khoa): Promise<BanGhiNoiDung<T> | null> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('noi_dung_ai')
      .select('noi_dung, provider, model, tao_luc')
      .eq('chart_hash', k.chartHash)
      .eq('be_mat', k.beMat)
      .eq('khoa_ky', k.khoaKy)
      .eq('ngon_ngu', k.ngonNgu)
      .maybeSingle();

    if (error || !data) return null;
    return {
      noiDung: data.noi_dung as T,
      provider: data.provider,
      model: data.model,
      taoLuc: data.tao_luc,
    };
  } catch {
    return null;
  }
}

export async function luuNoiDung(
  k: Khoa,
  noiDung: unknown,
  meta: { provider?: string; model?: string; phienBan?: Record<string, string>; runId?: string | null }
): Promise<void> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return;

  try {
    // Hai tab mở cùng lúc là hai lượt sinh song song. Thua cuộc thì ghi đè bản
    // của người thắng cũng không sao — hai bản đều hợp lệ cho cùng một kỳ, và
    // thà ghi đè còn hơn ném lỗi lên màn hình vì một ràng buộc trùng khoá.
    await supabase.from('noi_dung_ai').upsert(
      {
        chart_hash: k.chartHash,
        be_mat: k.beMat,
        khoa_ky: k.khoaKy,
        ngon_ngu: k.ngonNgu,
        noi_dung: noiDung,
        provider: meta.provider ?? null,
        model: meta.model ?? null,
        phien_ban: meta.phienBan ?? null,
        run_id: meta.runId ?? null,
      },
      { onConflict: 'chart_hash,be_mat,khoa_ky,ngon_ngu' }
    );
  } catch {
    // Không cất được thì lần sau sinh lại — tốn tiền, nhưng không hỏng gì
  }
}

/**
 * Đọc đệm trước, thiếu thì sinh rồi cất.
 *
 * `sinh` được phép ném hoặc trả null khi model hỏng, hết hạn mức, hoặc bài
 * không qua kiểm duyệt. Khi đó hàm này trả null và lớp gọi lùi về chữ tất định.
 */
export async function layHoacSinh<T>(
  k: Khoa,
  sinh: () => Promise<{
    noiDung: T;
    provider?: string;
    model?: string;
    phienBan?: Record<string, string>;
    runId?: string | null;
  } | null>
): Promise<{ noiDung: T; tuDem: boolean } | null> {
  const dem = await docNoiDung<T>(k);
  if (dem) return { noiDung: dem.noiDung, tuDem: true };

  let ra: Awaited<ReturnType<typeof sinh>> = null;
  try {
    ra = await sinh();
  } catch (e) {
    console.warn('[noi-dung-ai] Sinh hỏng:', e instanceof Error ? e.message : e);
    return null;
  }
  if (!ra) return null;

  await luuNoiDung(k, ra.noiDung, ra);
  return { noiDung: ra.noiDung, tuDem: false };
}

/** Khoá kỳ theo ngày dương — dùng cho thứ đổi mỗi ngày */
export function kyTheoNgay(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `ngay:${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Khoá kỳ theo tháng ÂM LỊCH — lá số đếm tháng theo tuần trăng, không theo lịch dương */
export function kyTheoThangAm(namAm: number, thangAm: number): string {
  return `thang:${namAm}-${String(thangAm).padStart(2, '0')}`;
}
