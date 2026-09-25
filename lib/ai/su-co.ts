import { taoSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * SỰ CỐ AI — ghi lại và báo khi chuỗi model hỏng.
 *
 * Vì sao có tệp này: ngày 24/09/2026 OpenAI hết credit. Model viết chính và
 * embedding của RAG cùng hỏng, bài mới lỗi hoặc lùi về bản tất định — và không
 * ai biết cho tới khi chạy thử tình cờ thấy. `ai_usage_logs` chỉ đếm số lỗi theo
 * ngày, không giữ LÝ DO, nên nhìn vào cũng không phân biệt được "hết credit"
 * (phải nạp tiền) với "gọi hơi nhanh" (tự hết sau một phút).
 *
 * Hai mức:
 *   - NẶNG ('quota', 'auth'): không tự khỏi, phải có người làm gì đó → ghi + báo
 *     webhook ngay, giãn cách 1 giờ cho mỗi (nguồn, nhà cung cấp, loại).
 *   - NHẸ ('rate-limit', 'server', 'network'): thường tự khỏi → chỉ ghi, giãn cách
 *     10 phút để một đợt 429 không thành nghìn dòng.
 *
 * Webhook là TUỲ CHỌN: đặt `CANH_BAO_WEBHOOK_URL` (Slack, Discord, Google Chat
 * đều nhận JSON có `text`/`content`). Không đặt thì chỉ ghi bảng, trang quản trị
 * vẫn hiện dải cảnh báo. Bảng `su_co_ai` tạo bằng supabase/va-su-co-ai.sql;
 * chưa chạy SQL thì ghi hỏng im lặng — cảnh báo không được làm hỏng luồng chính.
 */

export type LoaiSuCo = 'quota' | 'auth' | 'rate-limit' | 'server' | 'network';
export type NguonSuCo = 'chat' | 'embedding' | 'kiem-tra';

const NANG: LoaiSuCo[] = ['quota', 'auth'];
const GIAN_CACH_NANG_MS = 60 * 60 * 1000;
const GIAN_CACH_NHE_MS = 10 * 60 * 1000;

/** Lần ghi gần nhất theo khoá — sống trong tiến trình, đủ để chặn ghi dồn */
const lanCuoi = new Map<string, number>();

export function laSuCoNang(loai: LoaiSuCo): boolean {
  return NANG.includes(loai);
}

const MO_TA: Record<LoaiSuCo, string> = {
  quota: 'HẾT CREDIT / HẾT QUOTA — cần nạp tiền hoặc đổi key',
  auth: 'API KEY KHÔNG HỢP LỆ — cần thay key',
  'rate-limit': 'gọi quá nhanh (thường tự hết)',
  server: 'lỗi phía nhà cung cấp (thường tự hết)',
  network: 'lỗi mạng (thường tự hết)',
};

export async function ghiSuCo(vao: {
  nguon: NguonSuCo;
  provider: string;
  model?: string;
  loai: LoaiSuCo;
  thongDiep: string;
}): Promise<void> {
  const khoa = `${vao.nguon}|${vao.provider}|${vao.loai}`;
  const nang = laSuCoNang(vao.loai);
  const bayGio = Date.now();
  if (bayGio - (lanCuoi.get(khoa) ?? 0) < (nang ? GIAN_CACH_NANG_MS : GIAN_CACH_NHE_MS)) return;
  lanCuoi.set(khoa, bayGio);

  const db = taoSupabaseAdmin();
  if (db) {
    const { error } = await db.from('su_co_ai').insert({
      nguon: vao.nguon,
      provider: vao.provider,
      model: vao.model ?? null,
      loai: vao.loai,
      nang,
      thong_diep: vao.thongDiep.slice(0, 500),
    });
    if (error) console.warn('[su-co] Không ghi được sự cố:', error.message);
  }

  if (nang) await baoWebhook(vao);
}

async function baoWebhook(vao: { nguon: NguonSuCo; provider: string; model?: string; loai: LoaiSuCo; thongDiep: string }) {
  const url = process.env.CANH_BAO_WEBHOOK_URL?.trim();
  if (!url) return;
  const text =
    `⚠️ Celestia — sự cố AI: ${vao.provider}${vao.model ? `/${vao.model}` : ''} (${vao.nguon})\n` +
    `${MO_TA[vao.loai]}\n` +
    `${vao.thongDiep.slice(0, 300)}`;
  try {
    // `text` cho Slack/Google Chat, `content` cho Discord — gửi cả hai cho đỡ phải cấu hình
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, content: text }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    console.warn('[su-co] Không gửi được webhook:', e instanceof Error ? e.message : e);
  }
}

export interface DongSuCo {
  nguon: NguonSuCo;
  provider: string;
  model: string | null;
  loai: LoaiSuCo;
  nang: boolean;
  thong_diep: string;
  luc: string;
}

/** Sự cố trong N giờ gần đây, mới nhất trước — cho trang quản trị */
export async function suCoGanDay(soGio = 24): Promise<DongSuCo[]> {
  const db = taoSupabaseAdmin();
  if (!db) return [];
  const { data, error } = await db
    .from('su_co_ai')
    .select('nguon, provider, model, loai, nang, thong_diep, luc')
    .gte('luc', new Date(Date.now() - soGio * 60 * 60 * 1000).toISOString())
    .order('luc', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data as DongSuCo[];
}
