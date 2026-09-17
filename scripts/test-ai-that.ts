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
  const { luanBaiDai } = await import('../lib/rag/bai-dai');

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

  console.log('\n### 4. Bài luận giải thật, đi đúng đường đi của trang (đầu-cuối)');
  const laSo = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 9, gioiTinh: 'nam', hoTen: 'Mẫu A' });
  const batDau = Date.now();
  try {
    const kq = await luanBaiDai({ laSo, chuDe: 'tong-quan', namXem: 2026, thangXem: 9, ghiNhatKy: false });
    const giay = ((Date.now() - batDau) / 1000).toFixed(1);
    console.log(`  Model: ${kq.provider}/${kq.model} — ${giay}s — ${kq.van.split(/\s+/).length} từ`);
    for (const h of kq.daThuHong) console.log(`      đã rơi: ${h.provider}/${h.model}: ${h.loi.slice(0, 90)}`);
    console.log(gach);
    console.log(kq.van.trim().slice(0, 900));
    console.log(gach);

    ketLuan(kq.van.length > 400, `Bài có nội dung thực chất (${kq.van.length} ký tự)`);
    ketLuan(kq.coCauTruc !== null, 'Model trả đúng cấu trúc JSON theo khung §11.3');
    ketLuan(kq.van.includes('##'), 'Bài được dựng thành đề mục, không phải một khối chữ');
    ketLuan(kq.kiemDuyet.dat, `Kiểm duyệt tất định đạt (bỏ ${kq.kiemDuyet.soYBiBo} ý không căn cứ)`);
    ketLuan(kq.goi.duKien.length > 0, `Có dữ kiện lá số đưa vào (${kq.goi.duKien.length} mã F###)`);
  } catch (e) {
    ketLuan(false, `Bài luận giải thất bại: ${e instanceof Error ? e.message : e}`);
  }

  console.log(`\n${loi === 0 ? 'TẤT CẢ ĐỀU ĐẠT.' : `${loi} mục KHÔNG đạt.`}`);
  process.exit(loi === 0 ? 0 : 1);

}

main();
