/** CEL-200: entry point thật, chỉ thay I/O; model giả dừng sau khi nhận prompt. */
import type { DauVaoBaiDai } from '../lib/rag/bai-dai';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { lapLaSo } from '../lib/tuvi/ansao';
import { chuNguonLopHan } from '../lib/rag/kiem-lop-han';

async function main() {
  for (const k of Object.keys(process.env)) if (/SUPABASE|_API_KEY$|^CELES_/.test(k)) delete process.env[k];
  globalThis.fetch = async () => { throw new Error('Bài kiểm cấm mạng'); };
  const root = process.cwd();
  mkdirSync(resolve('scripts/tam-cel200'), { recursive: true });
  const dir = mkdtempSync(resolve('scripts/tam-cel200/env-'));
  try {
    const stub = join(dir,'io.ts');
    writeFileSync(stub, `
export const vet: {system:string;user:string;maxTokens:number}[] = [];
export const dung = new Error('MODEL_GIA_DA_NHAN_PROMPT');
export async function goiVoiFallback(req: typeof vet[number]) { vet.push(req); throw dung; }
export async function goiModel(_p:unknown,_m:unknown,_k:unknown,req:typeof vet[number]) { return goiVoiFallback(req); }
export async function truyHoi() { return { daChon:[], ungVien:[], phienBan:'gia', khoTrong:true }; }
export async function ghiLanTruyHoi() { throw new Error('Bài kiểm cấm ghi DB'); }
`);
    function chep(file: string) {
      const src = resolve(file);
      const text = readFileSync(src,'utf8').replace(/from (['"])([^'"]+)\1/g, (_all, q: string, spec: string) => {
        if (!spec.startsWith('.') && !spec.startsWith('@/')) return `from ${q}${spec}${q}`;
        const target = spec.startsWith('@/') ? resolve(root,spec.slice(2)) : resolve(dirname(src),spec);
        const io = /\/(?:ai\/(?:fallback|providers)|rag\/(?:truy-hoi|nhat-ky))$/.test(target.replaceAll('\\','/'));
        return `from ${q}${(io ? stub : target).replaceAll('\\','/')}${q}`;
      });
      const out = join(dir,file.split('/').at(-1)!);
      writeFileSync(out,text);return pathToFileURL(out).href;
    }
    const io = await import(pathToFileURL(stub).href) as { vet:{system:string;user:string;maxTokens:number}[]; dung:Error };
    const bai = await import(chep('lib/rag/bai-dai.ts')) as typeof import('../lib/rag/bai-dai');
    const bang = await import(chep('lib/rag/bang-linh-vuc.ts')) as typeof import('../lib/rag/bang-linh-vuc');
    const laSo = lapLaSo({ngay:24,thang:8,nam:2000,gio:9,gioiTinh:'nam'});
    const vao = {laSo,namXem:2026,thangXem:1};
    let total = 0;
    for (const epModel of [false,true]) {
      const modes = [undefined,'0','1','0'];
      const captures: typeof io.vet[] = [];
      for (const mode of modes) {
        if (mode === undefined) delete process.env.CELES_LOP_HAN; else process.env.CELES_LOP_HAN = mode;
        io.vet.length = 0;
        if (!epModel) await assert.rejects(bai.luanBaiDai({...vao,chuDe:'van-han',ghiNhatKy:false} satisfies DauVaoBaiDai), e => e===io.dung);
        await assert.rejects(bang.sinhBangLinhVuc({...vao,...(epModel ? {epModel:{provider:'groq' as const,model:'gia',apiKey:'gia'}} : {})}), e => e===io.dung);
        assert.equal(io.vet.length, epModel ? 2 : 3);
        captures.push(structuredClone(io.vet));total += io.vet.length;
      }
      assert.deepEqual(captures[0],captures[1],'Thiếu env = cờ 0');
      assert.deepEqual(captures[0],captures[3],'Tắt lại phải khôi phục từng byte');
      for (let n=0;n<captures[0].length;n++) {
        const cu=captures[0][n], bat=captures[2][n];
        assert.ok(cu.user.includes('LƯU Ý: không có nguồn tham chiếu nào'));
        assert.ok(!bat.user.includes('không có nguồn tham chiếu nào'));
        assert.notEqual(bat.user,cu.user);
        if (!epModel && n===0) { assert.ok(cu.system.includes('hãy nói thẳng là chưa đủ căn cứ')); assert.ok(!bat.system.includes('hãy nói thẳng là chưa đủ căn cứ')); }
        assert.deepEqual(bat,{...cu,system:chuNguonLopHan(cu.system,true),user:chuNguonLopHan(cu.user,true)});
      }
    }
    console.log(`PASS CEL-200 env: ${total} model giả; bài dài, hai nửa bảng và epModel; thiếu/0/1/0 cùng mô-đun, không mạng/DB.`);
  } finally { delete process.env.CELES_LOP_HAN; rmSync(dir,{recursive:true,force:true}); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
