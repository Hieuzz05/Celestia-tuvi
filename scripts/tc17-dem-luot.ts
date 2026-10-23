/**
 * TC-17 (đợt 1): đếm lượt model, token và ước tiền của một vòng test Preview; tách bài đã lưu theo
 * Preview / production / máy.
 *
 * CHỈ ĐỌC DB, không gọi model. Hai bước, chạy từ thư mục repo:
 *   1. TRƯỚC khi test, chụp mốc:
 *        npx tsx scripts/tc17-dem-luot.ts --env "D:/SAPP BA/tuvi-ai/.env.local" --chup
 *   2. SAU khi test, đếm (lấy mốc ở bước 1; giờ bắt đầu lấy từ mốc):
 *        npx tsx scripts/tc17-dem-luot.ts --env "D:/SAPP BA/tuvi-ai/.env.local"
 *      Thêm giá để ra tiền (USD cho 1 triệu token, lặp được):
 *        --gia "openai|gpt-5-mini=0.25,2"
 *
 * Hai giới hạn của dữ liệu, script in rõ khi chạy:
 *   - `ai_usage_logs` cộng dồn theo NGÀY và dùng chung cho Preview lẫn production (cùng một DB), nên số
 *     lượt là "cả hệ thống trong lúc test", gồm cả người dùng thật nếu có.
 *   - Tách Preview / production dựa trên bài MỚI lưu trong `noi_dung_ai` (Preview mang tiền tố `preview:`
 *     ở khoa_ky). Bài production được VIẾT LẠI đè lên dòng cũ giữ nguyên tao_luc, nên không đếm được ở đây.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const thamSo = (ten: string) => process.argv.flatMap((a, i) => (a === ten ? [process.argv[i + 1]] : []));
const co = (ten: string) => process.argv.includes(ten);
for (const d of readFileSync(thamSo('--env')[0] ?? '.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim().replace(/^["']|["']$/g, '');
  if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const khoa = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !khoa) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY');
const sb = createClient(url, khoa, { auth: { persistSession: false } });

const TEP_MOC = thamSo('--moc')[0] ?? 'D:/Celestia/tc17-moc.json';
type Dong = { ngay: string; provider: string; model: string; so_request: number; so_loi: number; tokens_vao: number; tokens_ra: number };
type Moc = { luc: string; dong: Dong[] };
const khoaDong = (d: Dong) => `${d.ngay}|${d.provider}|${d.model}`;

async function docSuDung(tuNgay: string): Promise<Dong[]> {
  const { data, error } = await sb
    .from('ai_usage_logs')
    .select('ngay, provider, model, so_request, so_loi, tokens_vao, tokens_ra')
    .gte('ngay', tuNgay)
    .limit(5000);
  if (error) throw new Error(`Đọc ai_usage_logs lỗi: ${error.message}`);
  return (data ?? []) as Dong[];
}

async function main() {
  if (co('--chup')) {
    const luc = new Date().toISOString();
    const dong = await docSuDung(luc.slice(0, 10));
    writeFileSync(TEP_MOC, JSON.stringify({ luc, dong } satisfies Moc, null, 2));
    console.log(`Đã chụp mốc lúc ${new Date(luc).toLocaleString('vi-VN')} (${dong.length} dòng) vào ${TEP_MOC}`);
    console.log('Test xong thì chạy lại lệnh này BỎ --chup.');
    return;
  }

  if (!existsSync(TEP_MOC)) throw new Error(`Chưa có mốc ${TEP_MOC}. Chạy với --chup TRƯỚC khi test.`);
  const moc = JSON.parse(readFileSync(TEP_MOC, 'utf-8')) as Moc;
  const truoc = new Map(moc.dong.map((d) => [khoaDong(d), d]));
  const sau = await docSuDung(moc.luc.slice(0, 10));

  const gia = new Map(
    thamSo('--gia').map((g) => {
      const [ten, so] = g.split('=');
      const [vao, ra] = (so ?? '').split(',').map(Number);
      return [ten.trim(), { vao, ra }] as const;
    })
  );

  type Tong = { req: number; loi: number; vao: number; ra: number };
  const theoModel = new Map<string, Tong>();
  for (const d of sau) {
    const t = truoc.get(khoaDong(d));
    const them: Tong = {
      req: d.so_request - (t?.so_request ?? 0),
      loi: d.so_loi - (t?.so_loi ?? 0),
      vao: d.tokens_vao - (t?.tokens_vao ?? 0),
      ra: d.tokens_ra - (t?.tokens_ra ?? 0),
    };
    if (!them.req && !them.loi && !them.vao && !them.ra) continue;
    const k = `${d.provider}|${d.model}`;
    const c = theoModel.get(k) ?? { req: 0, loi: 0, vao: 0, ra: 0 };
    theoModel.set(k, { req: c.req + them.req, loi: c.loi + them.loi, vao: c.vao + them.vao, ra: c.ra + them.ra });
  }

  const so = (n: number) => n.toLocaleString('vi-VN');
  console.log(`Từ mốc ${new Date(moc.luc).toLocaleString('vi-VN')} đến ${new Date().toLocaleString('vi-VN')}`);
  console.log('Lưu ý: số lượt gồm cả Preview lẫn production (chung một DB).\n');
  console.log('Model                                         Lượt   Lỗi   Token vào    Token ra    USD');
  let tong: Tong = { req: 0, loi: 0, vao: 0, ra: 0 };
  let usd = 0;
  let thieuGia = false;
  for (const [k, t] of [...theoModel].sort((a, b) => b[1].vao + b[1].ra - (a[1].vao + a[1].ra))) {
    const g = gia.get(k);
    const tien = g && Number.isFinite(g.vao) && Number.isFinite(g.ra) ? (t.vao * g.vao + t.ra * g.ra) / 1e6 : null;
    if (tien === null) thieuGia = true;
    else usd += tien;
    tong = { req: tong.req + t.req, loi: tong.loi + t.loi, vao: tong.vao + t.vao, ra: tong.ra + t.ra };
    console.log(`${k.padEnd(44)} ${so(t.req).padStart(5)} ${so(t.loi).padStart(5)} ${so(t.vao).padStart(11)} ${so(t.ra).padStart(11)}   ${tien === null ? '—' : tien.toFixed(4)}`);
  }
  console.log(`${'TỔNG'.padEnd(44)} ${so(tong.req).padStart(5)} ${so(tong.loi).padStart(5)} ${so(tong.vao).padStart(11)} ${so(tong.ra).padStart(11)}   ${usd.toFixed(4)}${thieuGia ? ' (+ model chưa có giá)' : ''}`);
  console.log(`Tổng token: ${so(tong.vao + tong.ra)} — so với ước ~1,8–2,2 triệu cho cả vòng (mục 6 hướng dẫn).`);
  if (thieuGia) console.log('Model ghi "—" chưa có giá: thêm --gia "provider|model=vào,ra" (USD / 1 triệu token), hoặc xem bảng điều khiển nhà cung cấp.');

  // Bài mới lưu trong khung giờ, tách theo môi trường
  const { data, error } = await sb
    .from('noi_dung_ai')
    .select('be_mat, khoa_ky')
    .gte('tao_luc', moc.luc)
    .neq('chart_hash', 'thu-vien')
    .limit(10000);
  if (error) throw new Error(`Đọc noi_dung_ai lỗi: ${error.message}`);
  const dem = new Map<string, number>();
  for (const r of (data ?? []) as { be_mat: string; khoa_ky: string }[]) {
    const mt = r.khoa_ky.startsWith('preview:') ? 'preview' : r.khoa_ky.startsWith('local:') ? 'máy' : 'production';
    dem.set(`${mt}|${r.be_mat}`, (dem.get(`${mt}|${r.be_mat}`) ?? 0) + 1);
  }
  console.log('\nBài MỚI lưu từ mốc (không gồm bài viết đè dòng cũ):');
  if (!dem.size) console.log('  (không có)');
  for (const mt of ['preview', 'production', 'máy']) {
    const ds = [...dem].filter(([k]) => k.startsWith(`${mt}|`));
    if (!ds.length) continue;
    console.log(`  ${mt}: ${ds.reduce((s, [, n]) => s + n, 0)} bài — ${ds.map(([k, n]) => `${k.split('|')[1]} ${n}`).join(', ')}`);
  }
  console.log('\nĐạt TC-17 khi: tổng token trong ước, và production KHÔNG có bài mới bất thường trong lúc chỉ test Preview.');
}

main().catch((e) => {
  console.error('Lỗi:', e instanceof Error ? e.message : e);
  process.exit(1);
});
