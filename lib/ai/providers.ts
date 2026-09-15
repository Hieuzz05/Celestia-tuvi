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
  if (res.status === 429) {
    throw new AiRetryableError(`${provider}: hết lượt / vượt rate limit — ${ngan}`, 'rate-limit', 429);
  }
  if (res.status === 402 || /quota|insufficient|credit/i.test(body)) {
    throw new AiRetryableError(`${provider}: hết quota — ${ngan}`, 'quota', res.status);
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
        maxOutputTokens: req.maxTokens ?? 2048,
      },
    }),
  });
  if (!res.ok) await nemLoi(res, 'gemini');
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? '')
    .join('');
  if (!text) throw new AiRetryableError('gemini: phản hồi rỗng', 'server');
  return {
    text,
    provider: 'gemini',
    model,
    tokensIn: data.usageMetadata?.promptTokenCount,
    tokensOut: data.usageMetadata?.candidatesTokenCount,
  };
}

/** OpenAI và OpenRouter dùng chung giao thức chat/completions */
async function chatOpenAiCompat(
  provider: 'openai' | 'openrouter',
  model: string,
  apiKey: string,
  req: ChatRequest
): Promise<ChatResult> {
  const baseUrl =
    provider === 'openai' ? 'https://api.openai.com/v1' : 'https://openrouter.ai/api/v1';
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
    }),
  });
  if (!res.ok) await nemLoi(res, provider);
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? '';
  if (!text) throw new AiRetryableError(`${provider}: phản hồi rỗng`, 'server');
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
      maxTokens: 16,
      temperature: 0,
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
