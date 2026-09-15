/**
 * Kiểm chứng cơ chế fallback mà không cần API key thật: thay global fetch bằng
 * bản giả lập để dựng các tình huống hết quota / lỗi server / thành công.
 * Chạy: npx tsx scripts/test-ai-fallback.ts
 */

process.env.GEMINI_API_KEY = 'key-gemini';
process.env.OPENROUTER_API_KEY = 'key-openrouter';
process.env.OPENAI_API_KEY = 'key-openai';
process.env.AI_FALLBACK_ORDER =
  'gemini|gemini-2.5-flash,openrouter|deepseek/deepseek-chat-v3-0324:free,openai|gpt-4o-mini';

const daGoi: string[] = [];

type KichBan = Record<string, { status: number; body: unknown }>;

function datFetch(kichBan: KichBan) {
  daGoi.length = 0;
  global.fetch = (async (url: string | URL | Request) => {
    const href = String(url);
    const nhaCungCap = href.includes('googleapis')
      ? 'gemini'
      : href.includes('openrouter')
        ? 'openrouter'
        : href.includes('api.openai')
          ? 'openai'
          : 'anthropic';
    daGoi.push(nhaCungCap);
    const kb = kichBan[nhaCungCap] ?? { status: 500, body: { error: 'không khai báo' } };
    return new Response(JSON.stringify(kb.body), {
      status: kb.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

const traLoiGemini = {
  candidates: [{ content: { parts: [{ text: 'Nội dung từ Gemini' }] } }],
  usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 },
};
const traLoiOpenAiCompat = {
  choices: [{ message: { content: 'Nội dung từ OpenRouter' } }],
  usage: { prompt_tokens: 10, completion_tokens: 20 },
};

async function chay() {
  const { goiVoiFallback, KhongCoModelError } = await import('../lib/ai/fallback');
  const req = { system: 'test', user: 'test' };
  let loi = 0;
  const kiemTra = (dieuKien: boolean, moTa: string) => {
    console.log(`${dieuKien ? '✓' : '✗'} ${moTa}`);
    if (!dieuKien) loi++;
  };

  // 1. Model đầu tiên chạy được -> không đụng tới model sau
  datFetch({ gemini: { status: 200, body: traLoiGemini } });
  let kq = await goiVoiFallback(req);
  kiemTra(kq.provider === 'gemini' && daGoi.length === 1, 'Model ưu tiên 1 trả lời -> dừng ngay');

  // 2. Model đầu hết quota (429) -> tự chuyển sang model kế tiếp
  datFetch({
    gemini: { status: 429, body: { error: 'Resource exhausted' } },
    openrouter: { status: 200, body: traLoiOpenAiCompat },
  });
  kq = await goiVoiFallback(req);
  kiemTra(
    kq.provider === 'openrouter' && kq.daThuHong.length === 1,
    'Gemini 429 -> fallback sang OpenRouter, có ghi lại model hỏng'
  );

  // 3. Hai model đầu chết -> xuống model thứ ba
  datFetch({
    gemini: { status: 429, body: { error: 'quota' } },
    openrouter: { status: 503, body: { error: 'service down' } },
    openai: { status: 200, body: traLoiOpenAiCompat },
  });
  kq = await goiVoiFallback(req);
  kiemTra(
    kq.provider === 'openai' && daGoi.join(',') === 'gemini,openrouter,openai',
    'Thử đúng thứ tự ưu tiên khi nhiều model lỗi'
  );

  // 4. Người dùng chọn model -> model đó chạy trước, phần còn lại vẫn là lưới an toàn
  datFetch({
    gemini: { status: 200, body: traLoiGemini },
    openrouter: { status: 200, body: traLoiOpenAiCompat },
  });
  kq = await goiVoiFallback(req, 'openrouter|deepseek/deepseek-chat-v3-0324:free');
  kiemTra(kq.provider === 'openrouter' && daGoi[0] === 'openrouter', 'Model người dùng chọn chạy trước');

  // 5. Key sai (401) cũng phải fallback chứ không làm sập cả luồng
  datFetch({
    gemini: { status: 401, body: { error: 'invalid key' } },
    openrouter: { status: 200, body: traLoiOpenAiCompat },
  });
  kq = await goiVoiFallback(req);
  kiemTra(kq.provider === 'openrouter', 'Key sai -> vẫn fallback sang model kế tiếp');

  // 6. Tất cả đều chết -> báo lỗi tổng hợp, liệt kê từng model
  datFetch({
    gemini: { status: 429, body: {} },
    openrouter: { status: 429, body: {} },
    openai: { status: 429, body: {} },
  });
  try {
    await goiVoiFallback(req);
    kiemTra(false, 'Phải ném lỗi khi mọi model đều hỏng');
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    kiemTra(
      msg.includes('gemini') && msg.includes('openrouter') && msg.includes('openai'),
      'Mọi model hỏng -> lỗi tổng hợp có nêu tên từng model'
    );
  }

  // 7. Không có key nào -> báo lỗi "chưa cấu hình" riêng để UI hiển thị đúng
  delete process.env.GEMINI_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    await goiVoiFallback(req);
    kiemTra(false, 'Phải báo chưa cấu hình khi không có key nào');
  } catch (e) {
    kiemTra(e instanceof KhongCoModelError, 'Không có API key -> lỗi KhongCoModelError');
  }

  console.log(loi === 0 ? '\nTất cả kịch bản fallback đều đúng.' : `\n${loi} kịch bản sai.`);
  if (loi > 0) process.exit(1);
}

chay();
