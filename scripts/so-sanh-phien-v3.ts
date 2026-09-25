/**
 * SO SÁNH CẢ PHIÊN ĐỌC của một chủ đề — npx tsx scripts/so-sanh-phien-v3.ts <x.json> <y.json> --nhom su-nghiep
 *
 * so-sanh-v3.ts chấm TỪNG CẶP câu nên không thấy được lỗi review 25/09/2026 chỉ ra:
 * "Celes hiểu tôi từ 2–3 ý rồi diễn giải lại chính các ý đó theo 8 câu hỏi". Ở đây
 * giám khảo đọc trọn hai bộ (xáo tên), đếm số câu MỞ LỚP MỚI và chọn bộ đọc như
 * "một con đường" hơn. Hai bộ được phép khác câu hỏi (khung cũ và khung mới).
 * Rẻ: một lượt gọi cho mỗi giám khảo; chuỗi rẻ → đắt, dừng khi hai giám khảo đồng ý.
 */
import { readFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

const thamSo = (ten: string, macDinh = '') => {
  const i = process.argv.indexOf(`--${ten}`);
  return i > 0 ? process.argv[i + 1] : macDinh;
};

type Tep = { phien: { id: string; nhom: string; cauHoi: string; luanGiai: string }[]; tomLai?: Record<string, string> };

async function main() {
  const [fx, fy] = process.argv.slice(2).filter((a) => a.endsWith('.json'));
  const nhom = thamSo('nhom');
  const chuoi = thamSo('giam-khao', 'groq|openai/gpt-oss-120b,openai|gpt-4o-mini,openai|gpt-5.6-luna').split(',');
  const { goiVoiFallback } = await import('../lib/ai/fallback');
  const { docObjectJson } = await import('../lib/rag/doc-json');
  const bo = (f: string) => {
    const t: Tep = JSON.parse(readFileSync(f, 'utf-8'));
    const cau = t.phien.filter((c) => c.nhom === nhom && c.luanGiai);
    return cau.map((c, i) => `Câu ${i + 1}: ${c.cauHoi}\n${c.luanGiai}`).join('\n\n') + (t.tomLai?.[nhom] ? `\n\nTÓM LẠI\n${t.tomLai[nhom]}` : '');
  };
  const [bx, by] = [bo(fx), bo(fy)];
  const system =
    'Bạn là người đọc khó tính vừa xem trọn phần luận giải một chủ đề của lá số mình. Có hai bộ (BỘ 1, BỘ 2) cho CÙNG một lá số. Chỉ trả JSON.';
  const user = `BỘ 1\n${by}\n\n====\n\nBỘ 2\n${bx}\n\nĐÁNH GIÁ:
- lopMoi: trong mỗi bộ, bao nhiêu câu mở ra một lớp MỚI về người này (không chỉ diễn giải lại ý của câu trước)?
- lapLai: mỗi bộ có bao nhiêu câu chủ yếu lặp lại mô-típ đã nói?
- tot: bộ nào đọc giống "được đọc ra một con đường riêng" hơn, ít giống bài huấn luyện nghề nghiệp chung chung hơn, và có nhiều khoảnh khắc "đúng, mình chính xác như vậy" hơn? (1 hoặc 2)
JSON: {"lopMoi":[số bộ 1, số bộ 2],"lapLai":[số bộ 1, số bộ 2],"tot":1}`;
  // BỘ 1 là y (bản mới), BỘ 2 là x — đổi chỗ ở lượt thứ hai của mỗi giám khảo để triệt thiên lệch vị trí
  const user2 = user.replace(`BỘ 1\n${by}\n\n====\n\nBỘ 2\n${bx}`, `BỘ 1\n${bx}\n\n====\n\nBỘ 2\n${by}`);
  const ket: { gk: string; yThang: number; lopMoi: string; lapLai: string }[] = [];
  let token = 0;
  for (const gk of chuoi) {
    let yThang = 0;
    const lm: string[] = [];
    const ll: string[] = [];
    let thucTe = gk;
    for (const [u, yLa1] of [[user, true], [user2, false]] as const) {
      const g = await goiVoiFallback({ system, user: u, maxTokens: 300, temperature: 0 }, gk, 150_000);
      token += (g.tokensIn ?? 0) + (g.tokensOut ?? 0);
      thucTe = `${g.provider}|${g.model}`;
      const o = docObjectJson(g.text) as { lopMoi?: number[]; lapLai?: number[]; tot?: number } | null;
      if (!o) continue;
      if ((o.tot === 1) === yLa1) yThang += 0.5;
      const [a, b] = yLa1 ? [0, 1] : [1, 0];
      lm.push(`cũ ${o.lopMoi?.[b]} / mới ${o.lopMoi?.[a]}`);
      ll.push(`cũ ${o.lapLai?.[b]} / mới ${o.lapLai?.[a]}`);
    }
    ket.push({ gk: thucTe, yThang, lopMoi: lm.join(' ; '), lapLai: ll.join(' ; ') });
    console.log(`  ${thucTe.padEnd(34)} bản mới thắng ${yThang * 100}% · lớp mới ${lm.join(' ; ')} · lặp ${ll.join(' ; ')}`);
    const hai = ket.slice(-2);
    if (hai.length === 2 && hai.every((k) => k.yThang >= 1) ) break;
    if (hai.length === 2 && hai.every((k) => k.yThang <= 0)) break;
  }
  console.log(JSON.stringify({ nhom, ket, token }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
