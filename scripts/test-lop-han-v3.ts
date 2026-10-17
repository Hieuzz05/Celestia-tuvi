import { khoiDuKienV3 } from '../lib/rag/v3/index';
/** CEL-200 Commit4 máy2: thứ tự dữ kiện, giữ nền gốc, hoá đại vận, regex và cờ tắt. Offline. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { lapLaSo } from '../lib/tuvi/ansao';
import { tuHoaDaiVan } from '../lib/tuvi/tu-hoa-han';
import { dungDuKien, hoiThoiDiem, tuoiAm } from '../lib/rag/v3/du-kien';
import { CAU_HOI_V3 } from '../lib/rag/v3/khung';
import { bocHoaVan } from '../lib/rag/v3/truy-hoi-v3';
import { SYSTEM_V3, systemLopHanV3 } from '../lib/rag/v3/prompt-v3';
for (const k of Object.keys(process.env)) if (/SUPABASE|_API_KEY$|^CELES_/.test(k)) delete process.env[k];
globalThis.fetch = async () => { throw new Error('Test CEL-200 v3 cấm mạng'); };
const hash = (s: unknown) => createHash('sha256').update(JSON.stringify(s)).digest('hex');
const fixture = resolve('scripts/mau-lop-han-v3-off.json');
const mau = JSON.parse(readFileSync('scripts/mau-ansao.json','utf8')).mau;
const la = Object.keys(mau).slice(0, 6).map((k) => {
  const m = k.match(/^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu)$/)!;
  return lapLaSo({ ngay: +m[1], thang: +m[2], nam: +m[3], gio: +m[4], gioiTinh: m[5] as 'nam' | 'nu' });
});
async function main() {
  const baseIndex = process.argv.indexOf('--base-root');
  const root = baseIndex >= 0 ? resolve(process.argv[baseIndex + 1]) : process.cwd();
  const mod = await import(pathToFileURL(resolve(root,'lib/rag/v3/du-kien.ts')).href) as typeof import('../lib/rag/v3/du-kien');
  const prompt = await import(pathToFileURL(resolve(root,'lib/rag/v3/prompt-v3.ts')).href) as typeof import('../lib/rag/v3/prompt-v3');
  const khung = await import(pathToFileURL(resolve(root,'lib/rag/v3/khung.ts')).href) as typeof import('../lib/rag/v3/khung');
  const snap: string[] = [hash(prompt.SYSTEM_V3),hash(khung.CAU_HOI_V3)];
  for (const l of la) for (const q of khung.CAU_HOI_V3) snap.push(hash(mod.dungDuKien(l,q,2026)));
  if (process.argv.includes('--ghi-mau')) {
    assert.ok(baseIndex>=0 && process.argv.includes('--base-commit'),'Ghi mẫu cần base-root và base-commit độc lập');
    const base=process.argv[process.argv.indexOf('--base-commit')+1];
    const patch='scripts/dong-bang/lop-han-v3-b4.patch';
    const git=(...args:string[])=>execFileSync('git',args,{encoding:'utf8'});
    assert.equal(git('diff','25ad334',base,'--','lib'),readFileSync(patch,'utf8').replaceAll('\r\n','\n'),'Base chỉ được cộng đúng bản vá B4 đã lưu');
    // Không cho một root hiện tại/thiếu tệp mượn nhãn SHA lịch sử để ghi mẫu.
    for (const file of git('ls-tree','-r','--name-only',base,'lib').trim().split('\n')) {
      const raw=execFileSync('git',['show',`${base}:${file}`]);
      const actual=readFileSync(resolve(root,file));
      let text:string;
      try { text=new TextDecoder('utf-8',{fatal:true}).decode(raw); }
      catch { assert.ok(raw.equals(actual),`Base binary lệch: ${file}`); continue; }
      const expected=text.replace(/['"]@\/([^'"]+)['"]/g,(_m,spec:string)=>{
        const rel=(relative(dirname(resolve(root,file)),resolve(root,spec)) || '.').replaceAll('\\','/');
        return `'${rel.startsWith('.') ? rel : './'+rel}'`;
      });
      assert.equal(actual.toString('utf8').replaceAll('\r\n','\n'),expected.replaceAll('\r\n','\n'),`Base-root không khớp commit: ${file}`);
    }
    const baseTree=git('rev-parse',`${base}^{tree}`).trim();
    writeFileSync(fixture,JSON.stringify({base,baseTree,patch,reason:'25ad334 + B4 only (du-kien, TQ10, TC01); no layer feature',sha256:snap},null,2)+'\n');
    return;
  }
  assert.deepEqual(snap, JSON.parse(readFileSync(fixture,'utf8')).sha256, 'Đường tắt v3 lệch baseline B4 độc lập');
  assert.equal(systemLopHanV3(SYSTEM_V3), SYSTEM_V3);
  assert.equal(systemLopHanV3(SYSTEM_V3,false), SYSTEM_V3);
  assert.ok(!systemLopHanV3(SYSTEM_V3,true).includes('6. Cân cả hai mặt'));
  assert.ok(!systemLopHanV3(SYSTEM_V3,true).includes('17. TAM PHƯƠNG'));
  assert.ok(systemLopHanV3(SYSTEM_V3,true).includes('Nền cung gốc phải được đọc cùng vận'));
  assert.ok(systemLopHanV3(SYSTEM_V3,true).includes('không dùng chúng để đảo chiều nhận định'));
  // Hai lá số có thật do engine tìm; kiểm trực tiếp dữ kiện Mệnh, không tự gắn sao.
  const ca = new Map<string, typeof la[number]>();
  for (let nam=1980;nam<=2010 && ca.size<2;nam++) for (let thang=1;thang<=12 && ca.size<2;thang++) {
    const l=lapLaSo({ngay:15,thang,nam,gio:9,gioiTinh:'nam'});
    const menh=l.cungs.find(c=>c.tenCung==='Mệnh')!;
    if (menh.coTuan) ca.set('Tuần',l);
    if (menh.coTriet) ca.set('Triệt',l);
  }
  assert.equal(ca.size,2);
  for (const [ten,l] of ca) for (const bat of [false,true]) {
    const q=CAU_HOI_V3.find(q=>q.id==='TQ10')!;
    const text=dungDuKien(l,q,2026,1,bat).filter(d=>d.cung==='Mệnh').map(d=>d.noiDung).join('\n');
    if (ten==='Tuần') { assert.ok(text.includes('nhẹ hơn Triệt nhưng dai, theo suốt đời')); assert.ok(!/Tuần:[^;\n]*hậu vận/u.test(text)); }
    else { assert.ok(text.includes('rõ nhất ở quãng đầu đời, nhạt dần khi đã tự lập')); assert.ok(!/Triệt:[^;\n]*30/u.test(text)); }
  }
  for (const id of ['TQ10','TC01']) {
    const q=CAU_HOI_V3.find(q=>q.id===id)!;
    assert.ok(!/Tuần \(hậu vận\)/u.test(q.yBatBuoc+q.yeuToThem));
    assert.ok((q.yBatBuoc+q.yeuToThem).includes('suốt đời'));
  }
  let so = 0;
  for (const l of la) for (const q of CAU_HOI_V3) {
    const cu = dungDuKien(l,q,2026);
    const tat = dungDuKien(l,q,2026,1,false);
    assert.deepEqual(tat,cu);
    const moi = dungDuKien(l,q,2026,1,true);
    if (!hoiThoiDiem(q)) { assert.deepEqual(moi,cu);continue; }
    so++;
    assert.equal(moi.length,cu.length,`${q.id}: không làm mất F gốc`);
    assert.equal(new Set(moi.map((d) => d.id)).size,moi.length);
    for (const d of cu) {
      const giu = moi.find((x) => x.id===d.id)!;
      assert.ok(giu,`${q.id}: mất ${d.id}`);
      assert.ok(d.sao.every((s) => giu.sao.includes(s)),`${q.id}: mất sao gốc ${d.id}`);
      assert.equal(giu.vaiTro,d.vaiTro);
      if (d.vaiTro === 'đại vận đang chạy') assert.ok(giu.noiDung.startsWith(d.noiDung));
      else assert.equal(giu.noiDung,d.noiDung,`${q.id}: sửa dữ kiện gốc ${d.id}`);
    }
    const hang = moi.map((d) => d.lopHan==='han'?0:d.lopHan==='nen'?1:2);
    assert.deepEqual(hang,[...hang].sort((a,b)=>a-b),`${q.id}: sai thứ tự hạn→nền`);
    const nen = moi.filter((d) => d.lopHan==='nen');
    assert.ok(nen.some((d) => d.vaiTro.includes('chính')),`${q.id}: thiếu nền cung hỏi`);
    for (const cc of cu.filter((d) => d.vaiTro==='cách cục' && nen.some((n) => n.cung===d.cung))) {
      assert.ok(nen.some((n) => n.id===cc.id),`${q.id}: cách cục gốc không đứng cùng nền`);
    }
    const dv = moi.find((d) => d.vaiTro==='đại vận đang chạy');
    if (dv) {
      const hoa = tuHoaDaiVan(l,tuoiAm(l,2026));
      for (const h of hoa) {
        assert.ok(dv.noiDung.includes(`${h.hoa} vào ${h.sao} (${h.tenCung})`));
        assert.ok(bocHoaVan(moi,true).some((x) => x.vaiTro===dv.vaiTro && x.hoa===h.hoa && x.sao===h.sao && x.cung===h.tenCung));
      }
      assert.equal(bocHoaVan([dv],false).length,0,'Đường tắt không bóc đại vận');
    }
    // Oracle off độc lập: đúng bộ lọc và regex cũ, không gọi parser mới để tự xác nhận.
    const docCu = cu.filter((d) => d.vaiTro.startsWith('vận năm')).slice(0,1).flatMap((d) => [...d.noiDung.matchAll(/(Hóa (?:Lộc|Quyền|Khoa|Kỵ)) vào ([^(]+?) \(([^)]+)\)/g)].map((m) => ({hoa:m[1],sao:m[2].trim(),cung:m[3],vaiTro:d.vaiTro})));
    assert.deepEqual(bocHoaVan(cu),docCu);
    assert.equal(bocHoaVan([...moi,...moi],true).length,bocHoaVan(moi,true).length,'Không nhân đôi cùng quan hệ/vai trò');
  }
  // Cung hạn trùng cung phụ không bị nhãn nền cũ hạ vai trò.
  const qNhieu = CAU_HOI_V3.find((q) => q.id === 'TB05')!;
  const nhieu = dungDuKien(la[0], qNhieu, 2026, 1, true);
  const phu = new Set(nhieu.filter((d) => d.cung).map((d) => d.cung!));
  const chu = khoiDuKienV3(nhieu, phu, true);
  for (const dong of chu.split('\n').filter((d) => d.includes('LỚP HẠN') || d.includes('NỀN CUNG GỐC'))) assert.ok(!dong.includes('chỉ dùng để đỡ ý'));
  const cu = dungDuKien(la[0], qNhieu, 2026);
  const chuCu = `DỮ KIỆN LÁ SỐ (engine tính, không được sửa hay thêm):\n${cu.map((d) => `${d.id} [${d.vaiTro}${d.cung && phu.has(d.cung) ? ' — NỀN: câu khác của chủ đề đi sâu cung này, ở đây chỉ dùng để đỡ ý' : ''}] ${d.noiDung}`).join('\n')}`;
  assert.equal(khoiDuKienV3(cu, phu), chuCu);
  for (const id of ['TQ08','TQ09']) {
    const q=CAU_HOI_V3.find((q)=>q.id===id)!; const ds=dungDuKien(la[0],q,2026,1,true);
    assert.equal(ds[0].lopHan,'han');
    const i=ds.findIndex((d)=>d.lopHan==='nen');assert.ok(i>0 && ds.slice(0,i).every((d)=>d.lopHan==='han'));
  }
  console.log(`PASS CEL-200 v3: ${snap.length} snapshot base; ${so} câu thời điểm giữ sao/cách cục, hạn→nền, hoá đại vận và regex.`);
}
main().catch((e)=>{ console.error(e);process.exitCode=1; });
