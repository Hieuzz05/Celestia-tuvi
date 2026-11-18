/**
 * ĐẾM BÀI ĐỆM SẼ VIẾT LẠI SAU ĐỢT 1 (Q7, 22/10/2026) — CHỈ ĐỌC DB, KHÔNG GỌI MODEL.
 *
 *   npx tsx scripts/dem-bai-dem-dot-1.ts --env "D:/SAPP BA/tuvi-ai/.env.local" [--pham-vi production]
 *
 * Tăng `PHUONG_PHAP.phienBan` (X2) làm bài đệm cũ hết hạn theo hai đường:
 *   - 6 bề mặt dùng `kyCoPhienBan` (bài dài, bản đọc sâu, bảng lĩnh vực, bề mặt ngắn, mốc hành trình,
 *     luận hạn…): khoá mang `|v:<PHIEN_BAN_CHU>`, mà phienBan nằm trong băm → khoá cũ không còn được đọc,
 *     bài sinh lại ở lần mở kế.
 *   - Luận giải V3: khoá không đổi (THE_HE_DEM giữ nguyên), từng câu mang dấu `lg`; lệch dấu thì viết lại khi
 *     mở (K2). Câu có dữ kiện nguyệt hạn không còn lùi về bài thế hệ trước (T-05).
 * Script đếm theo từng bề mặt: số bài, số lá số, bao nhiêu bài sẽ viết lại, để chủ dự án ước lượt model.
 * Không ghi gì: chỉ `select`. Phạm vi mặc định là production (khoá không mang tiền tố preview:/local:).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { DAU_VAO_PHIEN_BAN_CHU, PHIEN_BAN_CHU } from '../lib/rag/phien-ban-chu';
import { CAU_HOI_V3 } from '../lib/rag/v3/khung';
import { LOGIC_V3, THE_HE_DEM } from '../lib/rag/v3/xu-ly';
import { PHUONG_PHAP } from '../lib/tuvi/phuong-phap';

const thamSo = (ten: string) => process.argv.flatMap((a, i) => (a === ten ? [process.argv[i + 1]] : []));
const PHIEN_BAN_TRUOC = '2026.10.1';
const phamVi = thamSo('--pham-vi')[0] ?? 'production';

for (const d of readFileSync(thamSo('--env')[0] ?? '.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const khoa = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !khoa) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY');
const sb = createClient(url, khoa, { auth: { persistSession: false } });

/**
 * Băm phiên bản chữ của bản đang chạy trên production (trước khi tăng phienBan). Thay theo VỊ TRÍ (mục thứ 4
 * của DAU_VAO_PHIEN_BAN_CHU), không theo giá trị: PHIEN_BAN_CACH_CUC cũng đang là '2026.10.2'.
 */
const VI_TRI_PHUONG_PHAP = 3;
if (DAU_VAO_PHIEN_BAN_CHU[VI_TRI_PHUONG_PHAP] !== PHUONG_PHAP.phienBan) throw new Error('DAU_VAO_PHIEN_BAN_CHU đã đổi thứ tự — sửa VI_TRI_PHUONG_PHAP');
const chuTruoc = createHash('sha1')
  .update(DAU_VAO_PHIEN_BAN_CHU.map((x, i) => (i === VI_TRI_PHUONG_PHAP ? PHIEN_BAN_TRUOC : x)).join('|'))
  .digest('hex')
  .slice(0, 8);
const LG_TRUOC_DAU = '2026.10.1|2026.10.2|2026.10.1';
const coNguyet = new Set(CAU_HOI_V3.filter((q) => q.van.includes('nguyet')).map((q) => q.id));

const dungPhamVi = (k: string) =>
  phamVi === 'production' ? !/^(preview|local):/.test(k) : k.startsWith(`${phamVi}:`);

type Dong = { chart_hash: string; be_mat: string; khoa_ky: string; tao_luc: string };
async function docHet<T>(cot: string, loc?: (q: ReturnType<typeof sb.from>) => unknown): Promise<T[]> {
  const ra: T[] = [];
  for (let tu = 0; ; tu += 1000) {
    let q = sb.from('noi_dung_ai').select(cot).neq('chart_hash', 'thu-vien').range(tu, tu + 999);
    if (loc) q = loc(q as never) as typeof q;
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    ra.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) return ra;
  }
}

async function main() {
  console.log(`Phạm vi: ${phamVi} · phienBan ${PHIEN_BAN_TRUOC} → ${PHUONG_PHAP.phienBan} · chữ v:${chuTruoc} → v:${PHIEN_BAN_CHU} · THE_HE_DEM ${THE_HE_DEM}\n`);
  const dong = (await docHet<Dong>('chart_hash, be_mat, khoa_ky, tao_luc')).filter((d) => dungPhamVi(d.khoa_ky));

  const theoBeMat = new Map<string, { bai: number; laSo: Set<string>; dangDoc: number; seVietLai: number; moiNhat: string }>();
  for (const d of dong) {
    const m = theoBeMat.get(d.be_mat) ?? { bai: 0, laSo: new Set(), dangDoc: 0, seVietLai: 0, moiNhat: '' };
    m.bai++;
    m.laSo.add(d.chart_hash);
    if (d.khoa_ky.includes(`|v:${chuTruoc}`)) (m.dangDoc++, m.seVietLai++);
    if (d.tao_luc > m.moiNhat) m.moiNhat = d.tao_luc;
    theoBeMat.set(d.be_mat, m);
  }

  console.log('Bề mặt               bài   lá số   khoá đang đọc (v:cũ) → sẽ viết lại   mới nhất');
  for (const [beMat, m] of [...theoBeMat].sort((a, b) => b[1].bai - a[1].bai)) {
    if (beMat === 'luan-giai-v3') continue;
    console.log(`${beMat.padEnd(20)} ${String(m.bai).padStart(5)} ${String(m.laSo.size).padStart(7)}   ${String(m.seVietLai).padStart(22)}   ${m.moiNhat.slice(0, 10)}`);
  }

  // Luận giải V3: đếm từng câu theo dấu lg ở thế hệ đang chạy
  const v3 = await docHet<Dong & { noi_dung: unknown }>('chart_hash, be_mat, khoa_ky, tao_luc, noi_dung', (q) =>
    (q as unknown as { eq: (c: string, v: string) => unknown }).eq('be_mat', 'luan-giai-v3')
  );
  const theHe = `|th:${THE_HE_DEM}`;
  const dem = { nhom: 0, laSo: new Set<string>(), cau: 0, dungDau: 0, lechDau: 0, lechCoNguyet: 0, tom: 0 };
  for (const d of v3.filter((x) => dungPhamVi(x.khoa_ky) && x.khoa_ky.includes(theHe))) {
    dem.laSo.add(d.chart_hash);
    if (!Array.isArray(d.noi_dung)) {
      dem.tom++;
      continue;
    }
    dem.nhom++;
    for (const c of d.noi_dung as { id: string; lg?: string; chuaViet?: boolean }[]) {
      if (c.chuaViet) continue;
      dem.cau++;
      if ((c.lg ?? LG_TRUOC_DAU) === LOGIC_V3) dem.dungDau++;
      else {
        dem.lechDau++;
        if (coNguyet.has(c.id)) dem.lechCoNguyet++;
      }
    }
  }
  console.log(
    `\nluan-giai-v3 (th:${THE_HE_DEM}): ${dem.nhom} nhóm · ${dem.laSo.size} lá số · ${dem.cau} câu · ` +
      `${dem.lechDau} câu lệch dấu sẽ viết lại khi mở (trong đó ${dem.lechCoNguyet} câu có nguyệt hạn) · ` +
      `${dem.dungDau} câu đã đúng dấu · ${dem.tom} bản tóm lại / bức tranh lớn`
  );
  // Đo 22/10 (cổng 10.22): ~24.700 token mỗi câu V3 gồm cả vòng sửa
  console.log(`Ước token nếu MỌI câu lệch dấu được mở lại: ~${Math.round((dem.lechDau * 24_700) / 1000)}k token (viết lại dần khi người dùng mở, không một lúc)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
