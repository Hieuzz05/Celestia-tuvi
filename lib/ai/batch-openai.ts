import { createHash } from 'node:crypto';
import { ghiNhanSuDung } from './usage';

/**
 * OPENAI BATCH API — cho việc KHÔNG cần kết quả ngay: dựng thư viện, chấm, đo (26/09/2026).
 *
 * Batch tính khoảng NỬA GIÁ so với gọi thường, đổi lại kết quả về trong vài phút tới tối đa 24 giờ.
 * Người dùng thật không bao giờ đi đường này — chỉ script offline.
 *
 * Luồng: dựng tệp JSONL (mỗi dòng một request chat/completions) → tải lên → tạo batch → chờ →
 * tải tệp kết quả → trả Map theo `id`. Request hỏng trong batch trả về `loi`, không làm hỏng cả lô.
 */

export interface YeuCauBatch {
  id: string;
  system: string;
  user: string;
  model: string;
  maxTokens: number;
  temperature?: number;
}

export interface KetQuaBatch {
  text: string;
  tokensIn: number;
  tokensOut: number;
  tokensDem: number;
  loi?: string;
}

const GOC = 'https://api.openai.com/v1';

function laDongMoi(model: string) {
  return /^(?:gpt-[5-9]|gpt-\d\d|o[1-9])/.test(model);
}

async function goi(path: string, init: RequestInit, key: string) {
  const res = await fetch(`${GOC}${path}`, { ...init, headers: { Authorization: `Bearer ${key}`, ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`Batch ${path}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res;
}

export async function chayBatchOpenAi(
  yeuCau: YeuCauBatch[],
  opts: { nhan?: string; choToiDaMs?: number; moiLanChoMs?: number; khiCho?: (trangThai: string, xong: number, tong: number) => void } = {}
): Promise<Map<string, KetQuaBatch>> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('Thiếu OPENAI_API_KEY cho Batch API');
  if (!yeuCau.length) return new Map();

  const dong = yeuCau.map((r) => {
    const body: Record<string, unknown> = {
      model: r.model,
      messages: [
        { role: 'system', content: r.system },
        { role: 'user', content: r.user },
      ],
      // Cùng luật với đường gọi thường (providers.ts) để kết quả tương đương
      prompt_cache_key: `sys:${createHash('sha1').update(r.system).digest('hex').slice(0, 16)}`,
    };
    if (laDongMoi(r.model)) {
      body.max_completion_tokens = r.maxTokens + 2048;
      body.reasoning_effort = 'low';
    } else {
      body.max_tokens = r.maxTokens;
      body.temperature = r.temperature ?? 0.7;
    }
    return JSON.stringify({ custom_id: r.id, method: 'POST', url: '/v1/chat/completions', body });
  });

  const form = new FormData();
  form.append('purpose', 'batch');
  form.append('file', new Blob([dong.join('\n')], { type: 'application/jsonl' }), `celestia-${opts.nhan ?? 'batch'}.jsonl`);
  const tep = (await (await goi('/files', { method: 'POST', body: form }, key)).json()) as { id: string };

  const batch = (await (
    await goi(
      '/batches',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_file_id: tep.id, endpoint: '/v1/chat/completions', completion_window: '24h', metadata: { nhan: opts.nhan ?? '' } }),
      },
      key
    )
  ).json()) as { id: string };

  const batDau = Date.now();
  const toiDa = opts.choToiDaMs ?? 6 * 3600_000;
  let tt: { status: string; output_file_id?: string; error_file_id?: string; request_counts?: { completed: number; total: number } };
  for (;;) {
    tt = await (await goi(`/batches/${batch.id}`, { method: 'GET' }, key)).json();
    opts.khiCho?.(tt.status, tt.request_counts?.completed ?? 0, tt.request_counts?.total ?? yeuCau.length);
    if (['completed', 'failed', 'expired', 'cancelled'].includes(tt.status)) break;
    if (Date.now() - batDau > toiDa) throw new Error(`Batch ${batch.id} chưa xong sau ${Math.round(toiDa / 60000)} phút (vẫn chạy ở OpenAI; lấy lại sau bằng id này)`);
    await new Promise((r) => setTimeout(r, opts.moiLanChoMs ?? 20_000));
  }
  if (tt.status !== 'completed' && !tt.output_file_id) throw new Error(`Batch ${batch.id} kết thúc: ${tt.status}`);

  const ra = new Map<string, KetQuaBatch>();
  const docTep = async (id?: string) => (id ? (await (await goi(`/files/${id}/content`, { method: 'GET' }, key)).text()).split('\n').filter(Boolean) : []);
  const tong = { vao: 0, ra: 0, dem: 0 };
  for (const d of await docTep(tt.output_file_id)) {
    const o = JSON.parse(d) as { custom_id: string; response?: { status_code: number; body: { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } } } } };
    const b = o.response?.body;
    const u = b?.usage ?? {};
    tong.vao += u.prompt_tokens ?? 0;
    tong.ra += u.completion_tokens ?? 0;
    tong.dem += u.prompt_tokens_details?.cached_tokens ?? 0;
    ra.set(o.custom_id, {
      text: b?.choices?.[0]?.message?.content ?? '',
      tokensIn: u.prompt_tokens ?? 0,
      tokensOut: u.completion_tokens ?? 0,
      tokensDem: u.prompt_tokens_details?.cached_tokens ?? 0,
      ...(o.response?.status_code === 200 ? {} : { loi: `HTTP ${o.response?.status_code}` }),
    });
  }
  for (const d of await docTep(tt.error_file_id)) {
    const o = JSON.parse(d) as { custom_id: string; error?: { message?: string } };
    if (!ra.has(o.custom_id)) ra.set(o.custom_id, { text: '', tokensIn: 0, tokensOut: 0, tokensDem: 0, loi: o.error?.message ?? 'lỗi' });
  }
  // Ghi chi phí vào sổ, đánh dấu riêng để không lẫn với người dùng thật
  await ghiNhanSuDung('openai', `${yeuCau[0].model}@batch`, tong.vao, tong.ra, false, { dem: tong.dem });
  return ra;
}
