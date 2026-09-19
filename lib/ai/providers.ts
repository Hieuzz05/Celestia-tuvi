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
  // Dòng gpt-5 trở lên (và o-series) của OpenAI đổi giao kèo: `max_tokens` bị từ
  // chối thẳng, phải gọi là `max_completion_tokens`; nhiệt độ chỉ nhận giá trị
  // mặc định. Gửi sai một trong hai thì trả 400 ngay từ nút "Thử kết nối", nên
  // trước bản sửa này mọi model mới đều trông như "key hỏng".
  const laDongMoiOpenAi = provider === 'openai' && /^(?:gpt-[5-9]|gpt-\d\d|o[1-9])/.test(model);

  const than: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: req.system },
      { role: 'user', content: req.user },
    ],
  };

  if (laDongMoiOpenAi) {
    // Token nghĩ nội bộ cũng trừ vào ngân sách này. Không cộng thêm chỗ thì bài
    // dài bị cắt giữa chừng và JSON gãy — trông hệt như model không biết trả
    // đúng cấu trúc.
    than.max_completion_tokens = (req.maxTokens ?? 2048) + 2048;
    // 'minimal' không còn được nhận ở gpt-5.5; 'low' là mức thấp nhất mà cả
    // dòng cũ lẫn dòng mới đều hiểu.
    /*
     * Mức nghĩ mặc định là 'low', và đây là một lựa chọn có số đo đỡ lưng.
     *
     * Đo trên chính màn Bức tranh đầy đủ: gpt-5.4-mini ở mức 'medium' VƯỢT trần
     * 55 giây của `goiApi` và bị huỷ — hỏng theo cách không phân biệt được với
     * một model chết. Cùng màn ấy, gpt-5.6-luna ở mức 'low' mất 36 giây và cho
     * 89% số phần nêu được tên cách cục, so với 29% của gpt-4o-mini.
     *
     * Nói cách khác: với việc này, nghĩ thêm KHÔNG mua được chất lượng, nó chỉ
     * mua thêm độ trễ và tiền — token nghĩ nội bộ tính tiền y như token ra.
     *
     * Chỗ nào thật sự cần nghĩ sâu thì truyền `mucSuyNghi` rõ ràng, và phải cân
     * lại trần thời gian trước khi làm vậy.
     */
    if (req.tatSuyNghi) than.reasoning_effort = 'low';
    else than.reasoning_effort = req.mucSuyNghi ?? 'low';
  } else {
    than.temperature = req.temperature ?? 0.7;
    than.max_tokens = req.maxTokens ?? 2048;
    // Dòng gpt-oss trên Groq/Cerebras là model suy luận: mặc định nó tiêu một
    // phần lớn ngân sách output cho chuỗi nghĩ nội bộ, và phần nghĩ đó nằm ở
    // trường `reasoning` chứ không phải `content`. Với lệnh test kết nối
    // (maxTokens 64) thì nghĩ xong là hết chỗ, `content` rỗng, và trông hệt như
    // model hỏng. Chỉ gửi tham số này cho hai nhà cung cấp hiểu nó.
    if (req.tatSuyNghi && (provider === 'groq' || provider === 'cerebras')) {
      than.reasoning_effort = 'low';
    }
  }

  const res = await goiApi(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(than),
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
