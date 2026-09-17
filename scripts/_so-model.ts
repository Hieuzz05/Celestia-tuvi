import { readFileSync } from 'node:fs';
for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}
const PROVIDER = (process.argv[2] ?? 'gemini') as 'gemini' | 'openai' | 'groq';
const MODEL = process.argv[3] ?? { gemini: 'gemini-3.6-flash', openai: 'gpt-4o-mini', groq: 'openai/gpt-oss-120b' }[PROVIDER];

async function main() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { dungPrompt } = await import('../lib/ai/prompt');
  const { goiModel } = await import('../lib/ai/providers');
  const { layApiKey } = await import('../lib/ai/config');
  const { soatNgonNgu } = await import('../lib/rag/ngon-ngu');
  const { nhanDangThucThe } = await import('../lib/rag/thuc-the');
  const ls = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' });
  const { system, user } = dungPrompt(ls, 'tong-quan', 2026, 9);
  const t0 = Date.now();
  // Gọi thẳng provider, bỏ qua chuỗi fallback — chuỗi đang đọc từ database nên
  // không ép được bằng biến môi trường
  const kq = await goiModel(PROVIDER, MODEL, layApiKey(PROVIDER), { system, user, maxTokens: 3000 });
  const van = kq.text;
  const tu = van.split(/\s+/).length;
  const cau = van.split(/(?<=[.!?])\s+/).filter((c) => c.length > 20);
  const cauCoSao = cau.filter((c) => nhanDangThucThe(c).some((t) => t.loai === 'STAR')).length;
  const doan = van.split(/\n#{2,3}\s+/).slice(1).map((d) => (d.split('\n')[1] ?? d).slice(0, 60));
  const s = soatNgonNgu(van, doan);
  console.log(`MODEL ${PROVIDER}/${MODEL} · ${Date.now() - t0}ms · ${tu} từ`);
  console.log(`  câu có tên sao: ${cauCoSao}/${cau.length} (${Math.round((cauCoSao / cau.length) * 100)}%)`);
  console.log(`  cổng ngôn ngữ: ${s.dat ? 'đạt' : 'KHÔNG'} · ${s.loi.map((l) => l.ma + (l.viDu ? `(${l.viDu})` : '')).join(', ') || 'sạch'}`);
  console.log('\n' + van.slice(0, 1300) + '\n…');
}
main();
