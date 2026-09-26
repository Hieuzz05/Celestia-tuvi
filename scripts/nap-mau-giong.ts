/**
 * NẠP MẪU GIỌNG VĂN vào Supabase — npx tsx scripts/nap-mau-giong.ts <mẫu.json> <mã câu,…>
 *
 * <mẫu.json>: {"cau": {"SN02": {"cauHoi": "...", "luanGiai": "..."}, …}} — chuyển từ tệp Excel chủ dự án
 * gửi, để NGOÀI repo (bài viết cho lá số thật; repo công khai). Chỉ các mã câu được chọn được nạp.
 * Không gọi model.
 */
import { readFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const i = d.indexOf('=');
  if (i < 1 || d.trim().startsWith('#')) continue;
  const k = d.slice(0, i).trim();
  const v = d.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  if (v && !process.env[k]) process.env[k] = v;
}

async function main() {
  const [tep, ma] = process.argv.slice(2);
  if (!tep || !ma) throw new Error('Cách dùng: npx tsx scripts/nap-mau-giong.ts <mẫu.json> SN02,TB01');
  const cau = (JSON.parse(readFileSync(tep, 'utf-8')) as { cau: Record<string, { cauHoi: string; luanGiai: string }> }).cau;
  const ds = ma.split(',').map((m) => cau[m.trim()]).filter(Boolean).map((c) => ({ cauHoi: c.cauHoi, luanGiai: c.luanGiai }));
  if (!ds.length) throw new Error('Không có mã câu nào khớp');
  const { luuMauGiong, heThongV3 } = await import('../lib/rag/v3/mau-giong');
  await luuMauGiong(ds);
  const sys = await heThongV3();
  console.log(`Đã nạp ${ds.length} mẫu (${ds.map((d) => d.luanGiai.split(/\s+/).length).join(', ')} chữ). System v3 giờ ${sys.length} ký tự.`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
