/**
 * Bộ kiểm tách đệm theo môi trường — npx tsx scripts/test-moi-truong-dem.ts
 *
 * OFFLINE: Supabase là bản giả trong RAM (thay qua `_thayAdminChoTest`), không gọi model. Chạy trong CI.
 *
 * Chứng minh các tiêu chí nghiệm thu của docs/chien-luoc/moi-truong-phat-trien-2026-10.md mục
 * "Việc phát sinh" 1: production, Preview và local dùng chung một DB mà không đọc/đè đệm của nhau,
 * cấu hình đọc chung nhưng chỉ production ghi được, script chỉ xoá đúng phạm vi.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  phamViDem,
  laProductionThat,
  khaiBaoScript,
  _datLaiCheDoScript,
  LoiNgoaiProduction,
  slugNs,
} from '../lib/moi-truong-dem';
import { _thayAdminChoTest } from '../lib/supabase/admin';
import {
  docNoiDung,
  luuNoiDung,
  docNoiDungMoiNhat,
  docNhieuTheoTienTo,
  layHoacSinh,
  xoaDemLaSo,
} from '../lib/rag/noi-dung-ai';
import { xinLuotLaSoMoi } from '../lib/auth/gioi-han-khach';
import { docCauHinhV3, luuCauHinhV3, CAU_HINH_MAC_DINH } from '../lib/rag/v3/cau-hinh';
import { luuMauGiong } from '../lib/rag/v3/mau-giong';
import { luuThuVien, xoaDotTrich, dongGoi } from '../lib/rag/thu-vien/kho';

// ---------------------------------------------------------------------------
// Supabase giả: đủ các phép mà mã thật dùng trên bảng noi_dung_ai

type Dong = Record<string, unknown>;
const bang: Dong[] = [];
const KHOA_DUY_NHAT = ['chart_hash', 'be_mat', 'khoa_ky', 'ngon_ngu'] as const;

/** LIKE của Postgres: % = chuỗi bất kỳ, _ = một ký tự, phân biệt hoa thường, neo hai đầu */
function khopLike(gt: string, mau: string): boolean {
  const re = mau.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.');
  return new RegExp(`^${re}$`, 's').test(gt);
}

function truongCua(d: Dong, cot: string): unknown {
  const m = cot.match(/^(\w+)->>(\w+)$/);
  if (m) return (d[m[1]] as Record<string, unknown> | null)?.[m[2]];
  return d[cot];
}

class TruyVan {
  private loc: ((d: Dong) => boolean)[] = [];
  private gioiHan = Infinity;
  private sapXep: { cot: string; tang: boolean } | null = null;
  private tu = 0;
  constructor(private kieu: 'select' | 'delete') {}
  eq(cot: string, v: unknown) { this.loc.push((d) => truongCua(d, cot) === v); return this; }
  in(cot: string, ds: unknown[]) { this.loc.push((d) => ds.includes(truongCua(d, cot))); return this; }
  like(cot: string, mau: string) { this.loc.push((d) => khopLike(String(truongCua(d, cot)), mau)); return this; }
  not(cot: string, op: string, mau: string) {
    if (op !== 'like') throw new Error(`giả chưa hỗ trợ not ${op}`);
    this.loc.push((d) => !khopLike(String(truongCua(d, cot)), mau));
    return this;
  }
  order(cot: string, o?: { ascending?: boolean }) { this.sapXep = { cot, tang: o?.ascending !== false }; return this; }
  limit(n: number) { this.gioiHan = n; return this; }
  range(a: number, b: number) { this.tu = a; this.gioiHan = b - a + 1; return this; }
  private chay(): { data: Dong[] | null; error: null; count: number } {
    let ds = bang.filter((d) => this.loc.every((f) => f(d)));
    if (this.kieu === 'delete') {
      for (const d of ds) bang.splice(bang.indexOf(d), 1);
      return { data: null, error: null, count: ds.length };
    }
    if (this.sapXep) {
      const { cot, tang } = this.sapXep;
      ds = [...ds].sort((x, y) => (String(x[cot]) < String(y[cot]) ? -1 : 1) * (tang ? 1 : -1));
    }
    ds = ds.slice(this.tu, this.tu + this.gioiHan);
    return { data: ds.map((d) => ({ ...d })), error: null, count: ds.length };
  }
  async maybeSingle() {
    const r = this.chay();
    if ((r.data?.length ?? 0) > 1) return { data: null, error: { message: 'nhiều hơn một dòng' } };
    return { data: r.data?.[0] ?? null, error: null };
  }
  then<A>(ok: (r: { data: Dong[] | null; error: null; count: number }) => A) {
    return Promise.resolve(this.chay()).then(ok);
  }
}

let dongHo = 0;
const clientGia = {
  from(ten: string) {
    if (ten !== 'noi_dung_ai') throw new Error(`giả không có bảng ${ten}`);
    return {
      select: () => new TruyVan('select'),
      delete: () => new TruyVan('delete'),
      async upsert(x: Dong | Dong[]) {
        for (const moi of Array.isArray(x) ? x : [x]) {
          const cu = bang.find((d) => KHOA_DUY_NHAT.every((k) => d[k] === moi[k]));
          const dong = { provider: null, model: null, phien_ban: null, ...moi, tao_luc: new Date(Date.UTC(2026, 9, 3) + ++dongHo * 1000).toISOString() };
          if (cu) Object.assign(cu, dong);
          else bang.push(dong);
        }
        return { error: null };
      },
    };
  },
} as unknown as SupabaseClient;

// ---------------------------------------------------------------------------

let loi = 0;
let ca = 0;
function kiem(ten: string, dung: boolean, chiTiet = '') {
  ca += 1;
  if (!dung) loi += 1;
  console.log(`${dung ? 'PASS' : 'FAIL'}  ${ten}${!dung && chiTiet ? `\n      ${chiTiet}` : ''}`);
}
async function nem(f: () => Promise<unknown>): Promise<unknown> {
  try {
    await f();
    return null;
  } catch (e) {
    return e;
  }
}

const ENV_GOC = { ...process.env };
function datEnv(e: Record<string, string>) {
  for (const k of ['VERCEL', 'VERCEL_ENV', 'NODE_ENV', 'VERCEL_GIT_COMMIT_REF', 'CELES_CACHE_NAMESPACE']) delete process.env[k];
  Object.assign(process.env, e);
}
const PROD = { VERCEL: '1', VERCEL_ENV: 'production', NODE_ENV: 'production' };
const PREVIEW_A = { VERCEL: '1', VERCEL_ENV: 'preview', NODE_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'viec/nhanh_a' };
const PREVIEW_B = { VERCEL: '1', VERCEL_ENV: 'preview', NODE_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'viec/nhanh-a' };
const LOCAL = { NODE_ENV: 'development' };

const CH = 'abcdef0123456789';
const k = (beMat: 'diem-noi-bat' | 'luan-giai-v3' | 'bang-linh-vuc', khoaKy: string) => ({ chartHash: CH, beMat, khoaKy, ngonNgu: 'vi' });
const dongCua = (khoaKy: string) => bang.filter((d) => d.chart_hash === CH && d.khoa_ky === khoaKy);

async function main() {
  // ===== 1. Nhận diện môi trường (hàm thuần) =====
  console.log('\n--- Nhận diện môi trường ---');
  kiem('Không có gì → local', phamViDem({}).ns === 'local:local:');
  kiem('Spoof: chỉ VERCEL_ENV=production (VERCEL không phải 1) → KHÔNG production', phamViDem({ VERCEL_ENV: 'production', NODE_ENV: 'production' }).moiTruong === 'local');
  kiem('Spoof: VERCEL=1 + VERCEL_ENV=production dưới next dev (NODE_ENV=development) → local', phamViDem({ ...PROD, NODE_ENV: 'development' }).moiTruong === 'local');
  const p = phamViDem(PROD);
  kiem('VERCEL=1 + VERCEL_ENV=production → khoá cũ, không tiền tố', p.moiTruong === 'production' && p.ns === '' && p.phamViDem === 'production');
  const a = phamViDem(PREVIEW_A), b = phamViDem(PREVIEW_B);
  kiem('VERCEL=1 + VERCEL_ENV=preview → namespace preview', a.moiTruong === 'preview' && /^preview:viec-nhanh-a-[0-9a-f]{8}:$/.test(a.ns), a.ns);
  kiem('Hai nhánh cùng slug (nhanh_a / nhanh-a) vẫn khác namespace', a.ns !== b.ns);
  kiem('Preview không có tên nhánh → preview:khong-ro', phamViDem({ ...PREVIEW_A, VERCEL_GIT_COMMIT_REF: '' }).ns === 'preview:khong-ro:');
  kiem('vercel dev (VERCEL_ENV=development) → local', phamViDem({ ...PROD, VERCEL_ENV: 'development' }).moiTruong === 'local');
  kiem('Tên local được chuẩn hoá, không còn % _ :', phamViDem({ CELES_CACHE_NAMESPACE: 'Máy_Hiếu:1%' }).ns === 'local:may-hieu-1:');
  for (const s of ['a_b', 'x%y', 'p:q', 'Đường/nhánh__', '', '----']) {
    const r = slugNs(s, 'mac-dinh');
    kiem(`slug "${s}" sạch và tất định`, /^[a-z0-9-]+$/.test(r) && r === slugNs(s, 'mac-dinh'), r);
  }
  kiem('Ngoài production: laProductionThat = false', !laProductionThat(PREVIEW_A) && !laProductionThat(LOCAL));

  datEnv(PROD);
  kiem('Script không có cờ → local, dù env nói production', khaiBaoScript(['node', 'x.ts']).moiTruong === 'local' && !laProductionThat());
  datEnv(LOCAL);
  kiem('Script có --ghi-production → production', khaiBaoScript(['node', 'x.ts', '--ghi-production']).moiTruong === 'production');
  _datLaiCheDoScript();

  // Mã web không được tự khai báo là script
  const viPham: string[] = [];
  const quet = (thuMuc: string) => {
    for (const t of readdirSync(thuMuc)) {
      const duong = join(thuMuc, t);
      if (statSync(duong).isDirectory()) quet(duong);
      else if (/\.(ts|tsx)$/.test(t) && !duong.replace(/\\/g, '/').endsWith('lib/moi-truong-dem.ts') && readFileSync(duong, 'utf-8').includes('khaiBaoScript')) viPham.push(duong);
    }
  };
  for (const d of ['app', 'lib', 'components']) quet(d);
  kiem('Không tệp nào trong app/ lib/ components/ gọi khaiBaoScript', viPham.length === 0, viPham.join(', '));

  // ===== 2. Đệm nội dung =====
  _thayAdminChoTest(clientGia);
  console.log('\n--- Đệm nội dung ---');
  // Bản production có sẵn từ trước khi sửa: khoá trần, không tiền tố
  bang.push({ chart_hash: CH, be_mat: 'diem-noi-bat', khoa_ky: 'ngay:2026-10-03', ngon_ngu: 'vi', noi_dung: 'PROD', provider: null, model: null, phien_ban: null, tao_luc: '2026-10-01T00:00:00Z' });
  bang.push({ chart_hash: CH, be_mat: 'luan-giai-v3', khoa_ky: 'v3|tq|th:6', ngon_ngu: 'vi', noi_dung: 'PROD-V3', provider: null, model: null, phien_ban: null, tao_luc: '2026-10-01T00:00:00Z' });

  datEnv(PROD);
  kiem('Prod đọc được đệm cũ (khoá không đổi)', (await docNoiDung<string>(k('diem-noi-bat', 'ngay:2026-10-03')))?.noiDung === 'PROD');

  datEnv(PREVIEW_A);
  kiem('Preview không đọc được bài production', (await docNoiDung(k('diem-noi-bat', 'ngay:2026-10-03'))) === null);
  await luuNoiDung(k('diem-noi-bat', 'ngay:2026-10-03'), 'A', {});
  kiem('Preview ghi không đè production', dongCua('ngay:2026-10-03')[0]?.noi_dung === 'PROD' && bang.some((d) => d.khoa_ky === `${phamViDem().ns}ngay:2026-10-03` && d.noi_dung === 'A'));

  datEnv(PREVIEW_B);
  kiem('Preview B không đọc được bài Preview A', (await docNoiDung(k('diem-noi-bat', 'ngay:2026-10-03'))) === null);
  await luuNoiDung(k('diem-noi-bat', 'ngay:2026-10-03'), 'B', {});
  datEnv(PREVIEW_A);
  kiem('Preview B ghi không đè Preview A', (await docNoiDung<string>(k('diem-noi-bat', 'ngay:2026-10-03')))?.noiDung === 'A');

  datEnv(LOCAL);
  kiem('Local không đọc được production', (await docNoiDung(k('diem-noi-bat', 'ngay:2026-10-03'))) === null);
  await luuNoiDung(k('diem-noi-bat', 'ngay:2026-10-03'), 'L', {});
  datEnv(PROD);
  kiem('Local ghi không đè production', (await docNoiDung<string>(k('diem-noi-bat', 'ngay:2026-10-03')))?.noiDung === 'PROD');

  // docNoiDungMoiNhat
  datEnv(PREVIEW_A);
  kiem('Mới nhất theo tiền tố: Preview không thấy bản production', (await docNoiDungMoiNhat(k('luan-giai-v3', ''), 'v3|')) === null);
  await luuNoiDung(k('luan-giai-v3', 'v3|tq|th:6'), 'A-V3', {});
  kiem('Mới nhất theo tiền tố: Preview thấy bản của mình', (await docNoiDungMoiNhat<string>(k('luan-giai-v3', ''), 'v3|'))?.noiDung === 'A-V3');
  datEnv(PROD);
  kiem('Mới nhất theo tiền tố: production không thấy bản Preview (dù mới hơn)', (await docNoiDungMoiNhat<string>(k('luan-giai-v3', ''), 'v3|'))?.noiDung === 'PROD-V3');

  // docNhieuTheoTienTo
  const nhieuProd = await docNhieuTheoTienTo<string>(k('luan-giai-v3', ''), 'v3|');
  kiem('Nhiều theo tiền tố: production chỉ thấy bản production', nhieuProd.length === 1 && nhieuProd[0].noiDung === 'PROD-V3');
  datEnv(PREVIEW_A);
  const nhieuA = await docNhieuTheoTienTo<string>(k('luan-giai-v3', ''), 'v3|', '|th:6');
  kiem('Nhiều theo tiền tố: Preview chỉ thấy bản mình, khoá trả ra đã cắt tiền tố', nhieuA.length === 1 && nhieuA[0].khoaKy === 'v3|tq|th:6' && nhieuA[0].noiDung === 'A-V3', JSON.stringify(nhieuA));

  // Tiền tố rỗng: không bao giờ LIKE '%'
  kiem('Tiền tố rỗng: mới nhất trả null', (await docNoiDungMoiNhat(k('luan-giai-v3', ''), '')) === null);
  kiem('Tiền tố rỗng: nhiều trả []', (await docNhieuTheoTienTo(k('luan-giai-v3', ''), '')).length === 0);
  datEnv(PROD);
  kiem('Tiền tố rỗng ở production cũng trả null/[]', (await docNoiDungMoiNhat(k('luan-giai-v3', ''), '')) === null && (await docNhieuTheoTienTo(k('luan-giai-v3', ''), '')).length === 0);
  kiem('Tiền tố có ký tự đại diện bị từ chối', (await docNhieuTheoTienTo(k('luan-giai-v3', ''), 'v3_')).length === 0);

  // Đệm RAM: cùng tiến trình đổi môi trường không được trả nhầm bài
  datEnv(PROD);
  const r1 = await layHoacSinh(k('bang-linh-vuc', 'nam:2026'), async () => ({ noiDung: 'PROD-BLV' }));
  datEnv(PREVIEW_A);
  const r2 = await layHoacSinh(k('bang-linh-vuc', 'nam:2026'), async () => ({ noiDung: 'A-BLV' }));
  kiem('Đệm RAM tách theo môi trường', r1?.noiDung === 'PROD-BLV' && r2?.noiDung === 'A-BLV' && !r2.tuDem);

  // ===== 3. Giới hạn khách =====
  console.log('\n--- Giới hạn khách ---');
  const req = () => new Request('https://x.test', { headers: { 'x-real-ip': '203.0.113.9' } });
  datEnv(LOCAL);
  const luot: boolean[] = [];
  for (let i = 0; i < 4; i++) luot.push((await xinLuotLaSoMoi(req(), `la-so-${i}`)).duocPhep);
  kiem('Local: hết 3 lượt thì chặn lượt 4', luot.join() === 'true,true,true,false', luot.join());
  datEnv(PROD);
  const prod = await xinLuotLaSoMoi(req(), 'la-so-0');
  kiem('Local dùng hết lượt không ăn vào lượt production', prod.duocPhep && prod.daDung === 1, JSON.stringify(prod));
  kiem('Sổ đếm local mang tiền tố local:', bang.filter((d) => d.be_mat === 'gioi-han-khach' && String(d.khoa_ky).startsWith('local:local:')).length === 3);

  // ===== 4. Cấu hình dùng chung =====
  console.log('\n--- Cấu hình ---');
  const chMoi = { ...CAU_HINH_MAC_DINH, tranGoiY: 42 };
  bang.push({ chart_hash: 'cau-hinh', be_mat: 'cau-hinh-v3', khoa_ky: 'v3', ngon_ngu: 'vi', noi_dung: { hienTai: { cauHinh: chMoi, nhan: 'x', luc: 'x' }, lichSu: [] } });
  datEnv(PREVIEW_A);
  kiem('Preview đọc được cấu hình production (không namespace)', (await docCauHinhV3()).tranGoiY === 42);
  const truoc = JSON.stringify(bang);
  for (const env of [PREVIEW_A, LOCAL]) {
    datEnv(env);
    const ten = env === LOCAL ? 'local' : 'Preview';
    kiem(`${ten}: lưu cấu hình v3 bị chặn`, (await nem(() => luuCauHinhV3(CAU_HINH_MAC_DINH, 'thử'))) instanceof LoiNgoaiProduction);
    kiem(`${ten}: lưu mẫu giọng bị chặn`, (await nem(() => luuMauGiong([{ cauHoi: 'a', luanGiai: 'b' }]))) instanceof LoiNgoaiProduction);
    kiem(`${ten}: lưu / dựng gói / xoá đợt thư viện bị chặn`,
      (await nem(() => luuThuVien([]))) instanceof LoiNgoaiProduction &&
      (await nem(() => dongGoi(['sn-1']))) instanceof LoiNgoaiProduction &&
      (await nem(() => xoaDotTrich('sn-1'))) instanceof LoiNgoaiProduction);
  }
  kiem('Bảng không đổi sau các lần ghi cấu hình bị chặn', JSON.stringify(bang) === truoc);
  datEnv(LOCAL);
  khaiBaoScript(['node', 'x.ts']);
  kiem('Script không cờ: lưu cấu hình vẫn bị chặn', (await nem(() => luuCauHinhV3(CAU_HINH_MAC_DINH, 'thử'))) instanceof LoiNgoaiProduction);
  _datLaiCheDoScript();
  datEnv(PROD);
  await luuCauHinhV3({ ...CAU_HINH_MAC_DINH, tranGoiY: 50 }, 'prod');
  kiem('Production lưu được cấu hình', (bang.find((d) => d.be_mat === 'cau-hinh-v3')?.noi_dung as { hienTai: { cauHinh: { tranGoiY: number } } }).hienTai.cauHinh.tranGoiY === 50);

  // ===== 5. Script xoá đệm =====
  console.log('\n--- Script xoá đệm ---');
  const BM = ['diem-noi-bat', 'bang-linh-vuc', 'luan-han-chi-tiet'] as const;
  const soDong = () => bang.length;
  const coKhoa = (khoa: string, beMat: string) => bang.some((d) => d.chart_hash === CH && d.be_mat === beMat && d.khoa_ky === khoa);
  const nsA = phamViDem(PREVIEW_A).ns; // tính TRƯỚC khi script khai báo: khai báo rồi thì env bị bỏ qua
  datEnv(PROD); // env nói production nhưng script không có cờ → local
  khaiBaoScript(['node', 'chay-lai-luan-giai.ts']);
  const nsLocal = phamViDem().ns;
  const xLocal = await xoaDemLaSo(CH, [...BM]);
  kiem('Local không cờ: chỉ xoá bản local, production còn nguyên',
    !xLocal.loi && xLocal.soBan === 1 && coKhoa('ngay:2026-10-03', 'diem-noi-bat') && !coKhoa(`${nsLocal}ngay:2026-10-03`, 'diem-noi-bat'), JSON.stringify(xLocal));
  khaiBaoScript(['node', 'chay-lai-luan-giai.ts', '--ghi-production']);
  const truocProd = soDong();
  const xProd = await xoaDemLaSo(CH, [...BM]);
  kiem('--ghi-production: xoá bản production của đúng các bề mặt yêu cầu',
    !xProd.loi && !coKhoa('ngay:2026-10-03', 'diem-noi-bat') && !coKhoa('nam:2026', 'bang-linh-vuc') && soDong() === truocProd - 2, JSON.stringify(xProd));
  kiem('--ghi-production: không xoá bản Preview', coKhoa(`${nsA}ngay:2026-10-03`, 'diem-noi-bat') && coKhoa(`${nsA}nam:2026`, 'bang-linh-vuc'));
  kiem('--ghi-production: không xoá bề mặt không yêu cầu (luan-giai-v3)', coKhoa('v3|tq|th:6', 'luan-giai-v3'));
  kiem('Không bao giờ xoá cấu hình qua đệm', Boolean((await xoaDemLaSo('cau-hinh', ['cau-hinh-v3'])).loi) && bang.some((d) => d.be_mat === 'cau-hinh-v3'));
  kiem('Thiếu bề mặt → không xoá gì', Boolean((await xoaDemLaSo(CH, [])).loi));
  _datLaiCheDoScript();

  _thayAdminChoTest(null);
  process.env = ENV_GOC;
  console.log(`\n${ca - loi}/${ca} PASS`);
  process.exit(loi ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
