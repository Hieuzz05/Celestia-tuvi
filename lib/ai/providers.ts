import { AiRetryableError, type ChatRequest, type ChatResult, type ProviderId } from './types';

const TIMEOUT_MS = 55_000;

async function goiApi(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    throw new AiRetryableError(
      e instanceof Error ? e.message : 'Lỗi mạng không xác định',
      'network'
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Quy lỗi HTTP về loại để orchestrator biết có nên chuyển model kế tiếp không */
async function nemLoi(res: Response, provider: ProviderId): Promise<never> {
  const body = await res.text().catch(() => '');
  const ngan = body.slice(0, 300);
  // Xét nội dung lỗi trước mã 429: nhà cung cấp hay dùng chung mã 429 cho cả
  // "gọi quá nhanh" lẫn "hết tiền/hết quota", mà hai việc này khác hẳn nhau khi
  // người quản trị đọc log.
  if (res.status === 402 || /quota|insufficient|credit|billing/i.test(body)) {
    throw new AiRetryableError(`${provider}: hết quota / hết credit — ${ngan}`, 'quota', res.status);
  }
  if (res.status === 429) {
    throw new AiRetryableError(`${provider}: gọi quá nhanh, vượt rate limit — ${ngan}`, 'rate-limit', 429);
  }
  if (res.status === 401 || res.status === 403) {
    throw new AiRetryableError(`${provider}: API key không hợp lệ — ${ngan}`, 'auth', res.status);
  }
  if (res.status >= 500) {
    throw new AiRetryableError(`${provider}: lỗi phía nhà cung cấp — ${ngan}`, 'server', res.status);
  }
  throw new Error(`${provider} trả về ${res.status}: ${ngan}`);
}

async function chatGemini(
  model: string,
  apiKey: string,
  req: ChatRequest
): Promise<ChatResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;
  const res = await goiApi(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: req.system }] },
      contents: [{ role: 'user', parts: [{ text: req.user }] }],
      generationConfig: {
        temperature: req.temperature ?? 0.7,
        maxOutputTokens: req.maxTokens ?? 4096,
        ...(req.tatSuyNghi ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      },
    }),
  });
  if (!res.ok) await nemLoi(res, 'gemini');
  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? '')
    .join('');
  if (!text) {
    // Gemini 3.x tiêu một phần hạn mức output cho "thinking"; nếu hạn mức quá
    // thấp thì candidate trả về rỗng kèm finishReason MAX_TOKENS.
    const lyDo = candidate?.finishReason ?? 'không rõ';
    const suyNghi = data.usageMetadata?.thoughtsTokenCount;
    throw new AiRetryableError(
      `gemini: phản hồi rỗng (finishReason=${lyDo}` +
        (suyNghi ? `, đã tiêu ${suyNghi} token cho thinking` : '') +
        ')',
      'server'
    );
  }
  return {
    text,
    provider: 'gemini',
    model,
    tokensIn: data.usageMetadata?.promptTokenCount,
    tokensOut: data.usageMetadata?.candidatesTokenCount,
  };
}

/**
 * Nhiều nhà cung cấp dùng chung giao thức chat/completions của OpenAI, nên chỉ
 * cần đổi baseUrl là thêm được provider mới — không phải viết adapter riêng.
 */
const BASE_URL_OPENAI_COMPAT: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
  cerebras: 'https://api.cerebras.ai/v1',
};

async function chatOpenAiCompat(
  provider: 'openai' | 'openrouter' | 'groq' | 'cerebras',
  model: string,
  apiKey: string,
  req: ChatRequest
): Promise<ChatResult> {
  const baseUrl = BASE_URL_OPENAI_COMPAT[provider];
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (provider === 'openrouter') {
    headers['X-Title'] = 'Tu Vi AI';
  }
  const res = await goiApi(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: req.user },
      ],
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 2048,
      // Dòng gpt-oss trên Groq/Cerebras là model suy luận: mặc định nó tiêu một
      // phần lớn ngân sách output cho chuỗi nghĩ nội bộ, và phần nghĩ đó nằm ở
      // trường `reasoning` chứ không phải `content`. Với lệnh test kết nối
      // (maxTokens 64) thì nghĩ xong là hết chỗ, `content` rỗng, và trông hệt như
      // model hỏng. Chỉ gửi tham số này cho hai nhà cung cấp hiểu nó — OpenAI
      // thật sẽ từ chối tham số lạ.
      ...(req.tatSuyNghi && (provider === 'groq' || provider === 'cerebras')
        ? { reasoning_effort: 'low' }
        : {}),
    }),
  });
  if (!res.ok) await nemLoi(res, provider);
  const data = await res.json();
  const lua = data.choices?.[0];
  const text: string = lua?.message?.content ?? '';
  if (!text) {
    // KHÔNG lấy `message.reasoning` làm câu trả lời: chuỗi nghĩ nội bộ không phải
    // bài viết cho người đọc. Chỉ nói rõ vì sao rỗng để lần sau khỏi phải mò.
    const vet =
      lua?.finish_reason === 'length' && lua?.message?.reasoning
        ? ' — model dùng hết ngân sách token cho phần suy luận nội bộ, hãy tăng maxTokens hoặc hạ reasoning_effort'
        : '';
    throw new AiRetryableError(`${provider}: phản hồi rỗng${vet}`, 'server');
  }
  return {
    text,
    provider,
    model,
    tokensIn: data.usage?.prompt_tokens,
    tokensOut: data.usage?.completion_tokens,
  };
}

async function chatAnthropic(
  model: string,
  apiKey: string,
  req: ChatRequest
): Promise<ChatResult> {
  const res = await goiApi('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: req.maxTokens ?? 2048,
      temperature: req.temperature ?? 0.7,
      system: req.system,
      messages: [{ role: 'user', content: req.user }],
    }),
  });
  if (!res.ok) await nemLoi(res, 'anthropic');
  const data = await res.json();
  const text: string = (data.content ?? [])
    .map((c: { text?: string }) => c.text ?? '')
    .join('');
  if (!text) throw new AiRetryableError('anthropic: phản hồi rỗng', 'server');
  return {
    text,
    provider: 'anthropic',
    model,
    tokensIn: data.usage?.input_tokens,
    tokensOut: data.usage?.output_tokens,
  };
}

export function goiModel(
  provider: ProviderId,
  model: string,
  apiKey: string,
  req: ChatRequest
): Promise<ChatResult> {
  switch (provider) {
    case 'gemini':
      return chatGemini(model, apiKey, req);
    case 'openai':
    case 'openrouter':
    case 'groq':
    case 'cerebras':
      return chatOpenAiCompat(provider, model, apiKey, req);
    case 'anthropic':
      return chatAnthropic(model, apiKey, req);
  }
}

/** Gửi một request tối thiểu để kiểm tra key + model có dùng được không */
export async function testKetNoi(
  provider: ProviderId,
  model: string,
  apiKey: string
): Promise<{ ok: boolean; thongDiep: string; doTre?: number }> {
  const batDau = Date.now();
  try {
    const r = await goiModel(provider, model, apiKey, {
      system: 'Bạn là trợ lý kiểm tra kết nối. Trả lời đúng một từ.',
      user: 'Trả lời: OK',
      maxTokens: 64,
      temperature: 0,
      tatSuyNghi: true,
    });
    return {
      ok: true,
      thongDiep: `Kết nối thành công — model trả lời: "${r.text.trim().slice(0, 40)}"`,
      doTre: Date.now() - batDau,
    };
  } catch (e) {
    return { ok: false, thongDiep: e instanceof Error ? e.message : 'Lỗi không xác định' };
  }
}
