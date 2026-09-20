/** Sinh một bản đọc sâu đầy đủ rồi ghi ra markdown để đọc bằng mắt. Chạy tay. */
import { readFileSync, writeFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

const ra = process.argv[2] ?? 'bai.md';

async function chay() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { sinhBanDocSau } = await import('../lib/rag/ban-doc-sau');
  const { namAmHienTai, thangAmHienTai } = await import('../lib/tuvi/bay-gio');

  const laSo = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 20, gioiTinh: 'nam' });
  const t0 = Date.now();
  const bai = await sinhBanDocSau({
    laSo,
    namXem: namAmHienTai(),
    thangXem: thangAmHienTai(),
    khiXongChang: (c) =>
      console.log(`  ok ${c.thuTu}. ${c.tieuDe} — ${((Date.now() - t0) / 1000).toFixed(0)}s`),
  });
  if (!bai) {
    console.log('KHONG DUNG DUOC BAI');
    process.exit(1);
  }

  const d: string[] = [];
  for (const c of bai.chang) {
    d.push(`\n\n# Chặng ${c.thuTu}. ${c.tieuDe}\n\n_${c.subtitle}_`);
    for (const m of c.muc) {
      d.push(`\n\n## ${m.tieuDe}`);
      d.push(`\n\n\`${m.cungGoc} · ${m.cungTamHop.join(', ')} · soi qua ${m.cungGuong} · nổi ${m.doNoiBat}\``);
      if (m.thieuCanCu) {
        d.push('\n\n(thiếu căn cứ)');
        continue;
      }
      d.push(`\n\n**${m.ketLuan}**`);
      for (const t of m.tieuChi) {
        d.push(`\n\n### ${t.nhan}${t.laGuong ? ' [GƯƠNG]' : ''}\n\n${t.noiDung}`);
        if (t.luongNguoc) d.push(`\n\n> ${t.luongNguoc}`);
      }
    }
    if (c.doanKhau) d.push(`\n\n---\n\n_Khâu:_ ${c.doanKhau}`);
    if (c.cauBacCau) d.push(`\n\n_Bắc cầu:_ ${c.cauBacCau}`);
  }
  writeFileSync(ra, d.join(''), 'utf-8');
  console.log(`ghi: ${ra}`);
}

void chay();
