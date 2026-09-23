/**
 * CHẤM NGỮ NGHĨA bài luận giải v3 — những luật KHÔNG đếm được bằng mã.
 *
 *   npx tsx scripts/cham-luan-giai-v3.ts <kết-quả.json> [--giam-khao gemini|gemini-3.6-flash]
 *
 * Giám khảo ưu tiên một model KHÁC model viết bài (mặc định gemini), để bớt cảnh
 * tự chấm bài mình. Nó thấy đúng thứ người viết đã thấy — dữ kiện F### và nguồn
 * E### — nên chấm được "câu này có căn cứ không", thứ mà mắt người đọc bài
 * không tự kiểm được.
 *
 * Ghi điểm ngược vào chính tệp kết quả (trường `cham`). GỌI MODEL THẬT.
 */
import { readFileSync, writeFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
}

const SYSTEM = `Bạn là giám khảo chấm bài luận giải Tử Vi của Celes. Chấm KHẮT KHE, bằng chứng cụ thể.

Tiêu chí, mỗi tiêu chí 1–5 điểm (5 = đạt trọn):
1. traLoiThang — câu mở đầu trả lời thẳng câu hỏi của người đọc.
2. cuThe — có chi tiết nhận ra được trong đời (tên nghề, nguồn tiền, kiểu người, hành vi, mốc tuổi). 1 = toàn câu chung chung đúng với ai cũng được.
3. bamCanCu — mọi nhận định trong bài đi ra từ DỮ KIỆN hoặc NGUỒN được cấp. Trừ điểm mỗi nhận định không tìm thấy căn cứ, hoặc suy luận sai hướng (ví dụ sao xấu mà suy ra điều tốt).
4. lienMach — văn liền mạch, có chuyển tiếp, quan hệ nguyên nhân – kết quả; không phải chuỗi "Bạn A. Bạn B. Bạn C."
5. giongNguoi — như một người đang nói với mình; không giọng báo cáo, không từ "AI", không thần bí.
6. loiKhuyen — lời khuyên đi ra từ phần luận, gắn với câu hỏi; không chung chung.
7. viSao — phần "Vì sao" giải thích đúng căn cứ, mỗi sao kèm nghĩa, không nêu sao ngoài dữ kiện.

Chỉ trả JSON:
{"diem":{"traLoiThang":n,"cuThe":n,"bamCanCu":n,"lienMach":n,"giongNguoi":n,"loiKhuyen":n,"viSao":n},
 "khongCanCu":["nhận định không có căn cứ, trích nguyên văn ngắn"],
 "nhanXet":"1-2 câu nêu điểm yếu lớn nhất"}`;

async function main() {
  const tep = process.argv[2];
  const iGk = process.argv.indexOf('--giam-khao');
  const gk = iGk !== -1 ? process.argv[iGk + 1] : 'gemini|gemini-3.6-flash';
  const { goiVoiFallback } = await import('../lib/ai/fallback');
  const { docObjectJson } = await import('../lib/rag/doc-json');
  const du = JSON.parse(readFileSync(tep, 'utf-8'));
  let i = 0;
  const ds = du.ketQua as Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  const tho = async () => {
    while (i < ds.length) {
      const k = ds[i++];
      if (!k.luanGiai || k.cham) continue;
      const user = [
        `CÂU HỎI: ${k.cauHoi}`,
        `DỮ KIỆN:\n${k.duKien.map((d: { id: string; noiDung: string }) => `${d.id} ${d.noiDung}`).join('\n')}`,
        `NGUỒN:\n${k.nguon.map((n: { id: string; noiDung: string }) => `${n.id} ${n.noiDung}`).join('\n')}`,
        `BÀI LUẬN:\n${k.luanGiai}`,
        `PHẦN VÌ SAO:\n${k.viSao}`,
      ].join('\n\n');
      try {
        const r = await goiVoiFallback({ system: SYSTEM, user, maxTokens: 3000 }, gk, 90_000);
        const o = docObjectJson(r.text);
        if (o) k.cham = { ...o, giamKhao: `${r.provider}/${r.model}` };
        const d = (o?.diem ?? {}) as Record<string, number>;
        console.log(`${k.id} ${r.provider}/${r.model} ${Object.values(d).join(' ')} | ${(o?.nhanXet as string) ?? ''}`);
      } catch (e) {
        console.log(`${k.id} lỗi chấm: ${(e as Error).message.slice(0, 120)}`);
      }
    }
  };
  // Giám khảo gemini ở bậc miễn phí trả 429 khi chạy ba luồng — lượt 5 chỉ 2/30 bài
  // được gemini chấm, phần còn lại lùi về chính model viết bài. Mặc định hai luồng.
  const iSs = process.argv.indexOf('--song-song');
  const soLuong = iSs !== -1 ? Number(process.argv[iSs + 1]) : 2;
  await Promise.all(Array.from({ length: soLuong }, tho));
  writeFileSync(tep, JSON.stringify(du, null, 1));
  const co = ds.filter((k) => k.cham?.diem);
  const tb: Record<string, number> = {};
  for (const k of co) for (const [t, v] of Object.entries(k.cham.diem as Record<string, number>)) tb[t] = (tb[t] ?? 0) + v / co.length;
  console.log('\nTRUNG BÌNH', co.length, 'bài:', Object.entries(tb).map(([t, v]) => `${t}=${v.toFixed(2)}`).join(' '));
  console.log('Nhận định không căn cứ:', co.reduce((a, k) => a + (k.cham.khongCanCu?.length ?? 0), 0));
}
main();
