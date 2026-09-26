import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import type { ProviderId } from './types';

/**
 * Hạn mức MIỄN PHÍ ước tính mỗi ngày, dùng để cảnh báo và chủ động bỏ qua model
 * sắp cạn thay vì đợi nhà cung cấp trả 429.
 *
 * Đây là con số ước lượng, không phải hạn mức chính thức — nhà cung cấp đổi
 * chính sách thường xuyên. Đặt hơi thấp còn hơn để tràn.
 */
export const HAN_MUC_NGAY: Record<ProviderId, number | null> = {
  // Đo ngày 18/09/2026: GenerateRequestsPerDayPerProjectPerModel-FreeTier = 20, không phải 250.
  // Ghi sai con so nay la luoi chan han muc khong bao gio kich, moi bai ton mot vong 429 roi moi roi.
  gemini: 20, // free tier với API key
  groq: 900, // ~1000 request/ngày, chừa lại chút biên
  cerebras: 900,
  openrouter: 50, // các model :free giới hạn theo ngày
  openai: null, // trả phí, không chặn theo lượt
  anthropic: null,
};

/** Còn dưới ngần này lượt thì coi như đã cạn, chừa lại cho việc khác */
export const NGUONG_CAN_KIET = 5;

/**
 * Model này đã cạn hạn mức miễn phí hôm nay chưa?
 * Tách thành hàm thuần để kiểm chứng được mà không cần database.
 */
export function daCanHanMuc(provider: string, soLuotDaDung: number): boolean {
  const hanMuc = HAN_MUC_NGAY[provider as ProviderId];
  if (hanMuc === null || hanMuc === undefined) return false;
  return soLuotDaDung >= hanMuc - NGUONG_CAN_KIET;
}

export interface DongSuDung {
  provider: string;
  model: string;
  soRequest: number;
  soLoi: number;
  tokensVao: number;
  tokensRa: number;
}

/**
 * Ghi nhận một lượt gọi. Cố tình nuốt lỗi: thống kê hỏng thì cũng không được
 * làm chết luồng luận giải của người dùng.
 */
/** Hàm ghi v2 (có token đệm / suy nghĩ) đã có trên DB chưa — null = chưa biết */
let hamV2: boolean | null = null;

export async function ghiNhanSuDung(
  provider: string,
  model: string,
  tokensVao = 0,
  tokensRa = 0,
  laLoi = false,
  /** Phần token vào được đệm (~1/10 giá) và phần token ra là suy nghĩ — cần supabase/va-chi-phi-token.sql */
  them: { dem?: number; nghi?: number } = {}
): Promise<void> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return;
  try {
    if (hamV2 !== false) {
      const { error } = await supabase.rpc('ghi_nhan_su_dung_v2', {
        p_provider: provider,
        p_model: model,
        p_tokens_vao: tokensVao,
        p_tokens_ra: tokensRa,
        p_loi: laLoi,
        p_tokens_dem: them.dem ?? 0,
        p_tokens_nghi: them.nghi ?? 0,
      });
      if (!error) {
        hamV2 = true;
        return;
      }
      // Chưa chạy SQL v2 → nhớ lại, từ giờ gọi thẳng hàm cũ
      if (error.code === 'PGRST202' || /could not find the function/i.test(error.message)) hamV2 = false;
      else throw new Error(error.message);
    }
    await supabase.rpc('ghi_nhan_su_dung', {
      p_provider: provider,
      p_model: model,
      p_tokens_vao: tokensVao,
      p_tokens_ra: tokensRa,
      p_loi: laLoi,
    });
  } catch (e) {
    console.warn('[usage] Không ghi được nhật ký:', e instanceof Error ? e.message : e);
  }
}

/** Số lượt gọi thành công hôm nay theo từng provider */
export async function soLuotHomNay(): Promise<Record<string, number>> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return {};
  try {
    const homNay = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select('provider, so_request')
      .eq('ngay', homNay);
    if (error || !data) return {};

    const tong: Record<string, number> = {};
    for (const d of data as { provider: string; so_request: number }[]) {
      tong[d.provider] = (tong[d.provider] ?? 0) + d.so_request;
    }
    return tong;
  } catch {
    return {};
  }
}

/** Nhật ký chi tiết vài ngày gần đây, cho trang quản trị */
export async function nhatKyGanDay(soNgay = 7): Promise<(DongSuDung & { ngay: string })[]> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return [];
  try {
    const tu = new Date(Date.now() - soNgay * 86400_000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .gte('ngay', tu)
      .order('ngay', { ascending: false });
    if (error || !data) return [];

    return (
      data as {
        ngay: string;
        provider: string;
        model: string;
        so_request: number;
        so_loi: number;
        tokens_vao: number;
        tokens_ra: number;
      }[]
    ).map((d) => ({
      ngay: d.ngay,
      provider: d.provider,
      model: d.model,
      soRequest: d.so_request,
      soLoi: d.so_loi,
      tokensVao: d.tokens_vao,
      tokensRa: d.tokens_ra,
    }));
  } catch {
    return [];
  }
}
