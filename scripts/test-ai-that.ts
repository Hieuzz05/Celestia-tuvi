/**
 * Test THẬT với API key trong .env.local — gọi ra nhà cung cấp bên ngoài.
 * Chạy: npx tsx scripts/test-ai-that.ts
 *
 * Khác với test-ai-fallback.ts (dùng fetch giả lập), script này tiêu quota thật,
 * nên chỉ chạy khi cần xác minh key/model, đừng chạy trong vòng lặp.
 */

import { readFileSync } from 'node:fs';

// tsx không tự đọc .env.local như Next.js nên phải nạp tay
for (const dong of readFileSync('.env.local', 'utf-8').split('\n')) {
  const sach = dong.trim();
  if (!sach || sach.startsWith('#')) continue;
  const [khoa, ...phan] = sach.split('=');
  const giaTri = phan.join('=').trim();
  if (giaTri) process.env[khoa.trim()] = giaTri;
}

async function main() {
  const { testKetNoi } = await import('../lib/ai/providers');
  const { goiVoiFallback } = await import('../lib/ai/fallback');
  const { trangThaiModel } = await import('../lib/ai/config');
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { dungPrompt } = await import('../lib/ai/prompt');

  const gach = '─'.repeat(72);
  let loi = 0;
  const ketLuan = (ok: boolean, moTa: string) => {
    console.log(`${ok ? '✓' : '✗'} ${moTa}`);
    if (!ok) loi++;
  };

  console.log('\n### 1. Model đã cấu hình');
  for (const m of trangThaiModel()) {
    console.log(
      `  #${m.priority + 1} ${m.provider.padEnd(11)} ${m.model.padEnd(42)} ${
        m.daCauHinh ? `có key ${m.keyMasked}` : 'chưa có key'
      }`
    );
  }

  console.log('\n### 2. Test kết nối từng nhà cung cấp');
  for (const m of trangThaiModel().filter((x) => x.daCauHinh)) {
    const apiKey = process.env[
      (
        {
          gemini: 'GEMINI_API_KEY',
          groq: 'GROQ_API_KEY',
          cerebras: 'CEREBRAS_API_KEY',
          openrouter: 'OPENROUTER_API_KEY',
          openai: 'OPENAI_API_KEY',
          anthropic: 'ANTHROPIC_API_KEY',
        } as Record<string, string>
      )[m.provider]
    ]!;
    const kq = await testKetNoi(m.provider, m.model, apiKey);
    console.log(`  ${kq.ok ? '✓' : '✗'} ${m.provider}/${m.model}`);
    console.log(`      ${kq.thongDiep.slice(0, 150)}${kq.doTre ? ` (${kq.doTre}ms)` : ''}`);
  }

  console.log('\n### 3. Fallback thật: ưu tiên OpenAI (hết credit) -> phải tự nhảy sang model khác');
  try {
    const kq = await goiVoiFallback(
      { system: 'Trả lời ngắn gọn bằng tiếng Việt.', user: 'Nói đúng một câu về sao Tử Vi.', maxTokens: 300 },
      'openai|gpt-4o-mini'
    );
    console.log(`  Model thực sự trả lời: ${kq.provider}/${kq.model}`);
    console.log(`  Đã thử và hỏng trước đó: ${kq.daThuHong.length} model`);
    for (const t of kq.daThuHong) console.log(`      - ${t.provider}/${t.model}: ${t.loi.slice(0, 90)}`);
    console.log(`  Nội dung: ${kq.text.trim().slice(0, 120)}`);
    ketLuan(
      kq.daThuHong.length > 0 && kq.provider !== 'openai',
      'Model hỏng bị bỏ qua, model kế tiếp trả lời thành công'
    );
  } catch (e) {
    ketLuan(false, `Fallback thất bại: ${e instanceof Error ? e.message : e}`);
  }

  console.log('\n### 4. Luận giải lá số thật (đầu-cuối)');
  const laSo = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 9, gioiTinh: 'nam', hoTen: 'Mẫu A' });
  const { system, user } = dungPrompt(laSo, 'tong-quan', 2026, 9);
  console.log(`  Độ dài prompt: ${user.length} ký tự`);
  const batDau = Date.now();
  try {
    const kq = await goiVoiFallback({ system, user, maxTokens: 6000 });
    const giay = ((Date.now() - batDau) / 1000).toFixed(1);
    console.log(`  Model: ${kq.provider}/${kq.model} — ${giay}s — ${kq.tokensOut ?? '?'} token ra`);
    console.log(gach);
    console.log(kq.text.trim().slice(0, 900));
    console.log(gach);

    const co = (t: string) => kq.text.includes(t);
    ketLuan(kq.text.length > 400, `Luận giải có nội dung thực chất (${kq.text.length} ký tự)`);
    ketLuan(kq.text.includes('##'), 'Có chia đề mục theo markdown như yêu cầu trong prompt');
    ketLuan(
      co('Thái Dương') || co('Thiên Lương') || co('Mệnh'),
      'Có nhắc đúng sao/cung có thật trong lá số (không bịa)'
    );
  } catch (e) {
    ketLuan(false, `Luận giải thất bại: ${e instanceof Error ? e.message : e}`);
  }

  console.log(`\n${loi === 0 ? 'TẤT CẢ ĐỀU ĐẠT.' : `${loi} mục KHÔNG đạt.`}`);
  process.exit(loi === 0 ? 0 : 1);

}

main();
