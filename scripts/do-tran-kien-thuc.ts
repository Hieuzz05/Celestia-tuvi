/**
 * ĐO TRẦN KIẾN THỨC — KIEN-TRUC-LUAN-GIAI.md mục 11.9.
 *
 *   npx tsx scripts/do-tran-kien-thuc.ts <thư mục ra của do-thu-vien.ts> [--ten O]
 *
 * Sinh bản "O": luồng v3 hiện tại + ĐƯA THẲNG đáp án kiến thức (dap-an.json) cho người viết.
 * Đây là MỨC TRẦN, không phải bản dùng được — bài được chấm bằng chính đáp án nó đã thấy.
 * Nó trả lời: khi tri thức ĐÚNG và ĐỦ nằm sẵn trong prompt, khâu viết đưa được bao nhiêu vào bài?
 *   - trần cao (~90%) → nút thắt là NỘI DUNG tri thức (thư viện cần tri thức khác);
 *   - trần thấp (~65%) → nút thắt là KHÂU VIẾT / khuôn bài, thêm tri thức không lên.
 * Chấm: npx tsx scripts/do-kien-thuc.ts <thư mục> --ban A,O
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { boLaSo, CAU_LAT_CAT } from './lat-cat-su-nghiep';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const i = d.indexOf('=');
  if (i < 1 || d.trim().startsWith('#')) continue;
  const k = d.slice(0, i).trim();
  const v = d.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  if (v && !process.env[k]) process.env[k] = v;
}

async function main() {
  const thuMuc = process.argv.slice(2).find((a) => !a.startsWith('--'))!;
  const i = process.argv.indexOf('--ten');
  const ten = i > 0 ? process.argv[i + 1] : 'O';
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { luanNhieuCau } = await import('../lib/rag/v3');
  const dapAn = JSON.parse(readFileSync(join(thuMuc, 'dap-an.json'), 'utf-8')) as Record<string, { diem: { noiDung: string; muc: string }[]; khongDuoc: { noiDung: string }[] }>;
  const la = boLaSo(12);
  const B: unknown[] = [];
  for (let n = 0; n < la.length; n++) {
    const laSo = lapLaSo(la[n]);
    const khoaCua = (id: string) => `L${String(n + 1).padStart(2, '0')}-${id}`;
    const kq = await luanNhieuCau({
      laSo, ids: CAU_LAT_CAT, namXem: 2026, songSong: 5,
      thuNghiem: {
        themVao: (_l, q) => {
          const da = dapAn[khoaCua(q.id)];
          if (!da) return '';
          return `KIẾN THỨC CHUYÊN GIA CHO ĐÚNG LÁ SỐ VÀ CÂU HỎI NÀY (đã phân tích sẵn — bài phải phản ánh các điểm này, diễn đạt bằng lời của bạn, không nêu tên sao):\n${da.diem.map((d) => `- [${d.muc === 'bat-buoc' ? 'bắt buộc' : 'nên có'}] ${d.noiDung}`).join('\n')}\nKHÔNG ĐƯỢC NÓI:\n${da.khongDuoc.map((x) => `- ${x.noiDung}`).join('\n')}`;
        },
      },
    });
    B.push(...kq.map((k) => ({ ...k, khoa: khoaCua(k.id) })));
    console.log(`  lá ${n + 1}/12: ${kq.filter((k) => k.luanGiai).length}/5`);
  }
  writeFileSync(join(thuMuc, `chi-tiet-${ten}.json`), JSON.stringify({ B }, null, 1));
  writeFileSync(join(thuMuc, `${ten}.json`), JSON.stringify({ phien: (B as { khoa: string; cauHoi: string; luanGiai: string }[]).map((k) => ({ id: k.khoa, cauHoi: k.cauHoi, luanGiai: k.luanGiai })) }, null, 1));
  console.log(`Đã ghi ${ten}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
