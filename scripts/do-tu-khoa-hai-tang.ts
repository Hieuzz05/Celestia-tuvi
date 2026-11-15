/**
 * Đo nhánh từ khoá qua ĐÚNG đường app gọi (PostgREST RPC, khoá service role) — CELES-78.
 *   npx tsx scripts/do-tu-khoa-hai-tang.ts        (chạy ở thư mục có .env.local)
 * 1. Mỗi câu trong scripts/du-lieu/tu-khoa-16-ca.json gọi 8 lần liền (qua mốc lần 6,
 *    lúc PL/pgSQL đổi sang kế hoạch chung), so danh sách đoạn với dấu của hàm cũ.
 * 2. 30 lần gọi cùng lúc: lần chậm nhất, số lần lỗi.
 * Chỉ in số đo, không in khoá hay nội dung đoạn. Không tốn tiền model.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
}

interface Ca { ma: string; cumTu: string[]; cauTuLe: string; md5Cu: string }
const { ca: CA } = JSON.parse(readFileSync(new URL('./du-lieu/tu-khoa-16-ca.json', import.meta.url), 'utf-8')) as { ca: Ca[] };
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function goi(c: Ca) {
  const t = Date.now();
  const { data, error } = await sb.rpc('tim_kien_thuc_tu_khoa_cum', {
    cau_tu_le: c.cauTuLe, cum_tu: c.cumTu, so_luong: 15, loc_he_phai: null, loc_thuc_the: null,
  });
  const ms = Date.now() - t;
  if (error) return { ms, loi: error.message, md5: '' };
  const ds = [...(data as { chunk_id: string; diem: number }[])]
    .sort((a, b) => b.diem - a.diem || (a.chunk_id < b.chunk_id ? -1 : a.chunk_id > b.chunk_id ? 1 : 0));
  return { ms, loi: '', md5: createHash('md5').update(ds.map((r) => r.chunk_id).join(',')).digest('hex') };
}

async function main() {
  let khop = 0, cham = 0, loi = 0;
  for (const c of CA) {
    const lan = [];
    for (let i = 0; i < 8; i++) lan.push(await goi(c));
    const sai = lan.filter((l) => l.md5 !== c.md5Cu).length;
    const am = lan.slice(1).map((l) => l.ms);
    loi += lan.filter((l) => l.loi).length;
    if (sai === 0) khop++;
    if (Math.max(...am) >= 500) cham++;
    console.log(`${c.ma.padEnd(10)} khớp=${sai === 0 ? 'có' : `KHÔNG (${sai}/8)`} lần1=${lan[0].ms}ms ấm max=${Math.max(...am)}ms sau-lần6=${lan.slice(6).map((l) => l.ms).join('/')}ms${lan.find((l) => l.loi) ? ' LỖI ' + lan.find((l) => l.loi)!.loi : ''}`);
  }
  const t = Date.now();
  const song = await Promise.all(Array.from({ length: 30 }, (_, i) => goi(CA[i % CA.length])));
  const tong = Date.now() - t;
  const loiSong = song.filter((s) => s.loi);
  console.log(`\n30 lần cùng lúc: chậm nhất ${Math.max(...song.map((s) => s.ms))}ms, tổng ${tong}ms, lỗi ${loiSong.length}${loiSong[0] ? ' (' + loiSong[0].loi + ')' : ''}`);
  console.log(`KẾT: khớp ${khop}/${CA.length} câu, ${cham} câu có lần ấm >= 500ms, lỗi tuần tự ${loi}`);
  if (khop < CA.length || loi || loiSong.length) process.exit(1);
}
main().catch((e) => { console.error('DỪNG:', e instanceof Error ? e.message : e); process.exit(1); });
