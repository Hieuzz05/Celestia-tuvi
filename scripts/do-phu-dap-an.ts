/**
 * CỔNG ĐỘ PHỦ ĐÁP ÁN — tất định, không gọi model (KIEN-TRUC-LUAN-GIAI.md 11.8).
 *
 *   npx tsx scripts/do-phu-dap-an.ts <thư mục có dap-an.json> [--dot sn-2]
 *
 * Với mỗi điểm BẮT BUỘC trong đáp án kiến thức: S = các SAO LỚN của điểm (chính tinh, lục
 * cát, lục sát, tứ hoá, Lộc Tồn, Thiên Mã). Điểm được PHỦ khi có một mục thư viện khớp lá
 * số (bất kỳ cung nào) chứa đủ S. Phủ CÓ ĐỘ SÁNG khi điểm có nói độ sáng và mục ấy mang
 * điều kiện độ sáng cho ít nhất một sao của S. Điểm không có sao lớn thì bỏ khỏi mẫu.
 * Chạy trước khi tốn tiền sinh bài.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { boLaSo } from './lat-cat-su-nghiep';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const i = d.indexOf('=');
  if (i < 1 || d.trim().startsWith('#')) continue;
  const k = d.slice(0, i).trim();
  const v = d.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  if (v && !process.env[k]) process.env[k] = v;
}

async function main() {
  const thuMuc = process.argv.slice(2).find((a) => !a.startsWith('--'))!;
  const i = process.argv.indexOf('--dot');
  const dot = i > 0 ? process.argv[i + 1] : undefined;
  const { nhanDangThucThe, boDau } = await import('../lib/rag/thuc-the');
  const { docThuVien } = await import('../lib/rag/thu-vien/kho');
  const { khopThuVien } = await import('../lib/rag/thu-vien/khop');
  const { SAO_LON } = await import('../lib/rag/thu-vien/cho-prompt');
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const tv = await docThuVien('su-nghiep', dot);
  const da = JSON.parse(readFileSync(join(thuMuc, 'dap-an.json'), 'utf-8')) as Record<string, { diem: { muc: string; sao?: string[] }[] }>;
  const la = boLaSo(12).map((l) => lapLaSo(l));
  const khopTheoLa = la.map((l) => khopThuVien(l, tv, l.cungs.map((c) => c.tenCung)));
  let n = 0, phu = 0, canSang = 0, phuSang = 0;
  for (const [khoa, d] of Object.entries(da)) {
    const khop = khopTheoLa[Number(khoa.slice(1, 3)) - 1];
    for (const p of d.diem) {
      if (p.muc !== 'bat-buoc') continue;
      const txt = (p.sao ?? []).join(' ; ');
      const S = [...new Set(nhanDangThucThe(txt).filter((t) => t.loai === 'STAR' || t.loai === 'TRANSFORMATION').map((t) => t.ten))].filter((s) => SAO_LON.has(s));
      if (!S.length) continue;
      n++;
      const coSao = (k: (typeof khop)[number], s: string) => k.muc.dieuKien.sao.some((x) => x.ten === s) || (k.muc.dieuKien.nhom ?? []).some((n) => n.ten.includes(s));
      const muc = khop.filter((k) => S.every((s) => coSao(k, s)));
      if (muc.length) phu++;
      if (/ham|mieu|vuong|dac|binh/.test(boDau(txt))) {
        canSang++;
        if (muc.some((k) => k.muc.dieuKien.sao.some((x) => S.includes(x.ten) && x.doSang?.length))) phuSang++;
      }
    }
  }
  const p = (a: number, b: number) => `${Math.round((1000 * a) / (b || 1)) / 10}%`;
  console.log(`Thư viện ${tv.length} mục${dot ? ` (đợt ${dot})` : ''} · điểm bắt buộc có sao lớn: ${n}`);
  console.log(`PHỦ: ${phu}/${n} = ${p(phu, n)} (cổng ≥ 50%) · PHỦ CÓ ĐỘ SÁNG: ${phuSang}/${n} = ${p(phuSang, n)} (cổng ≥ 30%; trong số điểm cần độ sáng: ${phuSang}/${canSang})`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
