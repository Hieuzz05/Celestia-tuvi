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
  | 'bang-linh-vuc'
  /*
   * Bản đọc sâu, đệm THEO TỪNG CHẶNG chứ không theo cả bài.
   *
   * Cả bài mất 153 giây — gấp hai lần rưỡi trần 60 giây của route trên Vercel.
   * Chia theo chặng thì mỗi lượt khoảng 40 giây, nằm gọn trong trần, và người
   * đọc thấy chặng một trong khi chặng hai đang viết. Đó đúng là trải nghiệm
   * spec mô tả, chỉ khác cách thực hiện: nhiều lượt gọi thay vì một dòng SSE.
   */
  | 'ban-doc-sau'
  /** Luận giải v3 — đệm theo NHÓM câu hỏi (tổng quan / từng chủ đề chuyên sâu) */
  | 'luan-giai-v3';

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
/*
 * Lớp đệm thứ hai, nằm trong bộ nhớ của chính tiến trình.
 *
 * Lý do phải có dù đã có bảng: bảng có thể chưa được tạo. Khi đó `docNoiDung`
 * im lặng trả null và mọi lần mở trang lại sinh lại từ đầu — mười lăm giây và
 * một lần trả tiền cho mỗi lần tải. Một người dùng bấm qua lại vài màn là đủ
 * cạn hạn mức ngày.
 *
 * Instance serverless sống lại giữa các request nên lớp này hứng được phần lớn
 * lượt lặp. Nó KHÔNG thay bảng: bộ nhớ tiến trình không chia sẻ giữa các
 * instance và mất khi instance bị thu hồi, nên hai người đọc cùng lá số vẫn có
 * thể ra hai bài nếu chưa chạy SQL. Đây là lưới đỡ, không phải lời giải.
 */
const TRAN_DEM_RAM = 200;
const HAN_DEM_RAM_MS = 30 * 60 * 1000;
const demRam = new Map<string, { luc: number; giaTri: unknown }>();

function khoaChuoi(k: Khoa): string {
  return `${k.chartHash}|${k.beMat}|${k.khoaKy}|${k.ngonNgu}`;
}

function docRam<T>(k: Khoa): T | null {
  const o = demRam.get(khoaChuoi(k));
  if (!o) return null;
  if (Date.now() - o.luc > HAN_DEM_RAM_MS) {
    demRam.delete(khoaChuoi(k));
    return null;
  }
  return o.giaTri as T;
}

function ghiRam(k: Khoa, giaTri: unknown): void {
  // Chặn trên để một tiến trình sống lâu không phình mãi
  if (demRam.size >= TRAN_DEM_RAM) {
    const cu = demRam.keys().next().value;
    if (cu) demRam.delete(cu);
  }
  demRam.set(khoaChuoi(k), { luc: Date.now(), giaTri });
}

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
  const ram = docRam<T>(k);
  if (ram) return { noiDung: ram, tuDem: true };

  const dem = await docNoiDung<T>(k);
  if (dem) {
    ghiRam(k, dem.noiDung);
    return { noiDung: dem.noiDung, tuDem: true };
  }

  let ra: Awaited<ReturnType<typeof sinh>> = null;
  try {
    ra = await sinh();
  } catch (e) {
    console.warn('[noi-dung-ai] Sinh hỏng:', e instanceof Error ? e.message : e);
    return null;
  }
  if (!ra) return null;

  ghiRam(k, ra.noiDung);
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
