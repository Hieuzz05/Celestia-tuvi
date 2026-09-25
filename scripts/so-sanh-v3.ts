/**
 * SO SÁNH MÙ TỪNG CẶP hai lượt đo — npx tsx scripts/so-sanh-v3.ts <x.json> <y.json> [--giam-khao provider|model]
 *
 * Điểm tuyệt đối 1–5 của giám khảo dao động ±0,2 giữa hai lần chấm cùng một bài,
 * lớn hơn mức chênh cần đo. So từng cặp (cùng câu hỏi, cùng lá số, hai bản xáo
 * thứ tự) nhạy hơn nhiều: giám khảo chỉ phải chọn bản nào hay hơn.
 *
 * Hai tệp là đầu ra `--ra` của scripts/do-chat-luong-v3.ts trên CÙNG lá số.
 * In tỉ lệ thắng của y so với x, chung và theo loại (tổng quan / chuyên sâu).
 */
import { readFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

type Cau = { id: string; cauHoi: string; luanGiai: string };

async function main() {
  const [fx, fy] = process.argv.slice(2).filter((a) => a.endsWith('.json'));
  const i = process.argv.indexOf('--giam-khao');
  const uuTien = i > 0 ? process.argv[i + 1] : 'gemini|gemini-3.6-flash';
  const { goiVoiFallback } = await import('../lib/ai/fallback');
  const { docObjectJson } = await import('../lib/rag/doc-json');
  const X: Cau[] = JSON.parse(readFileSync(fx, 'utf-8')).phien;
  const Y: Cau[] = JSON.parse(readFileSync(fy, 'utf-8')).phien;
  const cap = X.map((x) => ({ x, y: Y.find((y) => y.id === x.id) })).filter(
    (c): c is { x: Cau; y: Cau } => Boolean(c.y && c.x.luanGiai && c.y.luanGiai)
  );
  // Xáo thứ tự cố định theo id để chạy lại ra cùng một đề
  const daoCho = (id: string) => [...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 2 === 1;

  const system =
    'Bạn là biên tập viên khó tính chấm bài luận giải tử vi cho người đọc phổ thông. Với mỗi câu hỏi có hai bản (1 và 2) viết cho CÙNG một lá số. Chọn bản tốt hơn theo: đọc như một người thật đang ngồi xem lá số của người đọc và nói chuyện với họ (không như bài trắc nghiệm tính cách), mượt; cụ thể, không chung chung; có giá trị (người đọc biết thêm, làm được gì). Nếu ngang nhau thật sự thì ghi 0. Chỉ trả JSON.';
  const j = process.argv.indexOf('--lo');
  const lo = j > 0 ? Number(process.argv[j + 1]) : 6;
  const ketQua: { id: string; yThang: number }[] = [];
  for (let k = 0; k < cap.length; k += lo) {
    const phan = cap.slice(k, k + lo);
    const user =
      phan
        .map((c, j) => {
          const dao = daoCho(c.x.id);
          const [b1, b2] = dao ? [c.y.luanGiai, c.x.luanGiai] : [c.x.luanGiai, c.y.luanGiai];
          return `### Câu ${j + 1}: ${c.x.cauHoi}\n[Bản 1]\n${b1}\n\n[Bản 2]\n${b2}`;
        })
        .join('\n\n') +
      `\n\nJSON: {"chon":[{"cau":1,"tot":1|2|0,"vi":"một câu lý do"}]}`;
    const g = await goiVoiFallback({ system, user, maxTokens: 3000, temperature: 0 }, uuTien, 150_000);
    const o = docObjectJson(g.text) as { chon?: { cau: number; tot: number; vi?: string }[] } | null;
    for (const ch of o?.chon ?? []) {
      const c = phan[ch.cau - 1];
      if (!c) continue;
      const dao = daoCho(c.x.id);
      const yThang = ch.tot === 0 ? 0.5 : (ch.tot === 2) !== dao ? 1 : 0;
      ketQua.push({ id: c.x.id, yThang });
      console.log(`  ${c.x.id.padEnd(5)} ${yThang === 1 ? 'Y' : yThang === 0 ? 'X' : '='}  ${(ch.vi ?? '').slice(0, 110)}`);
    }
    console.log(`  (giám khảo ${g.provider}/${g.model})`);
  }
  const ti = (ds: { yThang: number }[]) => (ds.length ? Math.round((ds.reduce((a, c) => a + c.yThang, 0) / ds.length) * 100) : 0);
  console.log(
    JSON.stringify({
      soCap: ketQua.length,
      yThangChung: ti(ketQua),
      yThangTongQuan: ti(ketQua.filter((c) => c.id.startsWith('TQ'))),
      yThangChuyenSau: ti(ketQua.filter((c) => !c.id.startsWith('TQ'))),
    })
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
