/**
 * Chạy LUỒNG v3 THẬT từ đầu đến cuối trên một lá số: engine → RAG → Celes viết
 * → kiểm → sửa. Không có bước nào do người (hay Claude) viết hộ.
 *
 *   npx tsx scripts/test-luan-giai-v3.ts <ngày> <tháng> <năm> <giờ> <nam|nu> --ra <tệp.json>
 *        [--ids TQ01,TC01,...] [--tq] [--cs] [--nam 2026] [--song-song 4]
 *
 * Dữ liệu sinh chỉ đi qua tham số dòng lệnh, không ghi vào tệp nào trong repo.
 * GỌI MODEL THẬT — tốn tiền, và dùng chung hạn mức với máy kia (AI-PHOI-HOP §8).
 */
import { readFileSync, writeFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
}

const arg = (ten: string) => {
  const i = process.argv.indexOf(ten);
  return i !== -1 ? process.argv[i + 1] : undefined;
};

async function main() {
  const [ngay, thang, nam, gio, gt] = process.argv.slice(2);
  const ra = arg('--ra');
  if (!ra || !gt) throw new Error('Thiếu tham số — xem đầu tệp');
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { luanNhieuCau, CAU_HOI_V3, PHIEN_BAN_V3 } = await import('../lib/rag/v3');
  const laSo = lapLaSo({ ngay: +ngay, thang: +thang, nam: +nam, gio: +gio, gioiTinh: gt as 'nam' | 'nu' });
  const namXem = Number(arg('--nam') ?? 2026);
  let ids = arg('--ids')?.split(',') ?? [];
  if (process.argv.includes('--tq')) ids.push(...CAU_HOI_V3.filter((q) => q.loai === 'tong-quan').map((q) => q.id));
  if (process.argv.includes('--cs')) ids.push(...CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau').map((q) => q.id));
  ids = [...new Set(ids)];
  const t0 = Date.now();
  const kq = await luanNhieuCau({
    laSo,
    ids,
    namXem,
    songSong: Number(arg('--song-song') ?? 4),
    khiXong: (k) =>
      console.log(
        `${k.dat ? '✓' : '✗'} ${k.id} ${k.model} ${Math.round(k.ms / 1000)}s gọi=${k.soLanGoi} nguồn=${k.nguon.length} ` +
          `lỗi đầu=${k.loiBanDau.filter((l) => l.chan).length} còn=${k.loiConLai.filter((l) => l.chan).length}` +
          (k.loiConLai.length ? ` | ${k.loiConLai.map((l) => l.moTa).join(' ; ')}` : '')
      ),
  });
  writeFileSync(ra, JSON.stringify({ phienBan: PHIEN_BAN_V3, namXem, giay: Math.round((Date.now() - t0) / 1000), ketQua: kq }, null, 1));
  const dat = kq.filter((k) => k.dat).length;
  console.log(`\nXONG ${dat}/${kq.length} đạt luật đếm được · ${Math.round((Date.now() - t0) / 1000)}s · ghi ${ra}`);
}
main();
