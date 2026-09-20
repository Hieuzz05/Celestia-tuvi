import { readFileSync } from 'node:fs';
for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim(); if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('='); const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}
async function main() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { sinhBanDocSau, soBaoPhu, soatBanDocSau } = await import('../lib/rag/ban-doc-sau');
  const { namAmHienTai, thangAmHienTai } = await import('../lib/tuvi/bay-gio');
  const laSo = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 20, gioiTinh: 'nam' });
  const t0 = Date.now();
  const bai = await sinhBanDocSau({
    laSo, namXem: namAmHienTai(), thangXem: thangAmHienTai(),
    khiXongChang: (c) => console.log(`  ✓ ${c.thuTu}. ${c.tieuDe} — ${c.muc.filter((m) => !m.thieuCanCu).length}/3 phần · ${((Date.now() - t0) / 1000).toFixed(1)}s`),
  });
  if (!bai) { console.log('NULL'); return; }
  const so = soBaoPhu(bai);
  console.log('\nSO BAO PHU:', JSON.stringify(so));
  console.log('CONG NGON NGU:', JSON.stringify(soatBanDocSau(bai).loi.map((l) => `${l.ma}/${l.mucDo}`)));
  const m = bai.chang[0].muc[0];
  const tong = bai.chang.flatMap((c) => c.muc).filter((x) => !x.thieuCanCu);
  console.log('So tu moi phan:', tong.map((x) => x.tieuChi.reduce((s, t) => s + t.soTu, 0)).join(', '));
  console.log('\n=== MAU:', m.tieuDe, '===');
  console.log(m.ketLuan, '\n');
  for (const t of m.tieuChi.slice(0, 3)) {
    console.log(`[${t.nhan}]${t.laGuong ? ' (GƯƠNG)' : ''} (${t.soTu} từ)`);
    console.log(t.noiDung.slice(0, 260));
    if (t.luongNguoc) console.log('  ↳ lực ngược:', t.luongNguoc.slice(0, 140));
    console.log();
  }
}
main().catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
