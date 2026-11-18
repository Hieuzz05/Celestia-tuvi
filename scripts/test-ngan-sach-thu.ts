/**
 * X1: kiểm cổng thật tại provider với HTTP và sổ dùng giả. Không đọc .env,
 * không gọi model/DB thật. Có tiến trình con để chứng minh dấu sống qua restart.
 */
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import type { SupabaseClient } from '@supabase/supabase-js';
import { _thayAdminChoTest } from '../lib/supabase/admin';
import {
  docCauHinhThu, kiemTranThu, laLuotThu, luotThuCoPhi, tokenThuDaDung, tongSuDungThu,
  uocTokenLuotThu, VuotNganSachError,
} from '../lib/ai/ngan-sach-thu';
import { goiModel } from '../lib/ai/providers';
import { goiVoiFallback, tienDaTinh, tokenDaDung } from '../lib/ai/fallback';
import { embedLoTaiLieu, embedTruyVan } from '../lib/ai/embedding';
import { chayBatchOpenAi } from '../lib/ai/batch-openai';
import { docSuDungHomNayBatBuoc } from '../lib/ai/usage';

const MODEL = 'openai/gpt-oss-120b';
const req = { system: 'bí mật hệ thống', user: 'bí mật câu hỏi', maxTokens: 32 };
const duKien = uocTokenLuotThu(req);
type Row = { provider: string; model: string; so_request: number; so_loi: number; tokens_vao: number; tokens_ra: number };
let rows: Row[] = [], http = 0, rpc = 0, loiDoc = false, loiGhi = false, thieuV2 = false;
let cheDo: 'ok' | 'loi' | 'loiMotLan' | 'thieu' | 'vuot' | 'mang' | 'server' = 'ok';
let doiHttp: (() => Promise<void>) | undefined;
let choOpenai = false;
const modelRows = [
  { provider: 'openai', model: 'paid', bat: true, uu_tien: 1 },
  { provider: 'groq', model: MODEL, bat: true, uu_tien: 2 },
  { provider: 'groq', model: 'openai/gpt-oss-20b', bat: true, uu_tien: 3 },
].map((r, i) => ({ ...r, id: String(i), api_key_ma: null, ghi_chu: null }));

// Mọi thao tác DB bị thay ngay tại seam có sẵn; không có URL/key DB thật.
const fake = {
  from(table: string) {
    const result = () => ({ data: table === 'ai_model_configs' ? modelRows : rows, error: loiDoc && table === 'ai_usage_logs' ? { message: 'offline error' } : null });
    const q = {
      select() { return q; }, eq() { return q; }, order() { return q; },
      async insert() { return { error: null }; },
      range(tu: number, den: number) { return Promise.resolve({ ...result(), data: rows.slice(tu, den + 1) }); },
      then(resolve: (x: ReturnType<typeof result>) => unknown) { return Promise.resolve(result()).then(resolve); },
    };
    return q;
  },
  async rpc(name: string, p: Record<string, string | number | boolean>) {
    rpc++;
    if (thieuV2 && name.endsWith('_v2')) return { error: { code: 'PGRST202', message: 'could not find the function' } };
    if (loiGhi) return { error: { message: 'offline write failure' } };
    if (!name.startsWith('ghi_nhan_su_dung')) return { error: null };
    rows.push({ provider: String(p.p_provider), model: String(p.p_model), so_request: p.p_loi ? 0 : 1,
      so_loi: p.p_loi ? 1 : 0, tokens_vao: Number(p.p_tokens_vao), tokens_ra: Number(p.p_tokens_ra) });
    return { error: null };
  },
};
const fetchCu = globalThis.fetch;
globalThis.fetch = async (url) => {
  if (String(url).startsWith('https://api.openai.com/')) {
    // Ngoại lệ có phí: chỉ khi test cho phép, và chỉ đúng endpoint chat
    assert.ok(choOpenai, 'gọi OpenAI khi không được phép');
    assert.equal(String(url), 'https://api.openai.com/v1/chat/completions');
  } else assert.match(String(url), /^https:\/\/api\.groq\.com\/openai\/v1\/chat\/completions$/);
  http++;
  if (doiHttp) await doiHttp();
  if (cheDo === 'mang') throw new DOMException('offline timeout', 'AbortError');
  if (cheDo === 'server') return new Response('offline server', { status: 500 });
  if (cheDo === 'loi' || (cheDo === 'loiMotLan' && http === 1)) return new Response('rate limit', { status: 429 });
  return Response.json({
    choices: [{ message: { content: 'offline fixture' } }],
    ...(cheDo === 'thieu' ? {} : { usage: { prompt_tokens: cheDo === 'vuot' ? duKien + 1 : 10,
      completion_tokens: 20, completion_tokens_details: { reasoning_tokens: 12 } } }),
  });
};
_thayAdminChoTest(fake as unknown as SupabaseClient);
const BIEN = ['AI_NHAN', 'AI_MUC_DICH', 'AI_NGAN_SACH_TOKEN', 'AI_GROQ_TRAN_TOKEN_NGAY', 'AI_THU_TRAN_TOKEN_NGAY',
  'AI_THU_TRAN_LUOT_NGAY', 'AI_THU_TEP_DOI_SOAT', 'AI_KHONG_LUI', 'AI_GHIM_MODEL', 'AI_TRAN_USD',
  'AI_GIA_VAO_USD', 'AI_GIA_RA_USD', 'GROQ_API_KEY', 'OPENAI_API_KEY'];
const cu = Object.fromEntries(BIEN.map((k) => [k, process.env[k]]));
const child = process.argv.includes('--restart-probe');
const thuMuc = child ? undefined : mkdtempSync(join(tmpdir(), 'celes-x1-'));
const marker = child ? process.env.AI_THU_TEP_DOI_SOAT! : join(thuMuc!, 'doi-soat.json');
function reset() {
  for (const k of BIEN) delete process.env[k];
  Object.assign(process.env, { AI_NHAN: 'test', AI_NGAN_SACH_TOKEN: '10000000', AI_GROQ_TRAN_TOKEN_NGAY: '10000000',
    AI_THU_TRAN_TOKEN_NGAY: '10000000', AI_THU_TRAN_LUOT_NGAY: '10000', AI_THU_TEP_DOI_SOAT: marker,
    GROQ_API_KEY: 'offline-only', OPENAI_API_KEY: 'offline-only' });
  rows = []; http = 0; rpc = 0; choOpenai = false; loiDoc = false; loiGhi = false; cheDo = 'ok'; doiHttp = undefined;
}
function xoaDauThu() { if (existsSync(marker)) unlinkSync(marker); }
function kiemRestart() {
  const probe = spawnSync(process.execPath, [...process.execArgv, __filename, '--restart-probe'], {
    env: { ...process.env }, encoding: 'utf8', timeout: 20000,
  });
  assert.equal(probe.status, 0, probe.stdout + probe.stderr);
  assert.match(probe.stdout, /restart blocked/);
}
const goi = () => goiModel('groq', MODEL, 'offline-only', req);
async function chan(fn: () => Promise<unknown>) {
  const truoc = http;
  await assert.rejects(fn, VuotNganSachError);
  assert.equal(http, truoc, 'phải chặn trước HTTP');
}
let soMuc = 0;
async function muc(ten: string, fn: () => unknown | Promise<unknown>) {
  reset(); await fn(); soMuc++; console.log('ĐẠT: ' + ten);
}

async function main() {
  if (child) {
    assert.equal(tokenThuDaDung(), 0);
    await chan(goi);
    assert.equal(rpc, 0);
    console.log('restart blocked');
    return;
  }
  await muc('Cờ rỗng/0/NaN vẫn là thử; cấu hình thiếu dừng', async () => {
    assert.equal(laLuotThu({}), false);
    for (const k of ['AI_NHAN', 'AI_NGAN_SACH_TOKEN', 'AI_MUC_DICH']) {
      for (const v of ['', '0', 'NaN']) assert.equal(laLuotThu({ [k]: v }), true);
    }
    for (const v of ['', '0', '-1', 'NaN', '1.5']) {
      process.env.AI_NGAN_SACH_TOKEN = v; await chan(goi);
    }
    delete process.env.AI_NGAN_SACH_TOKEN; await chan(goi);
  });
  await muc('Tổng ngày gồm người dùng, mọi nhãn và lượt lỗi; chặn lượt kế tiếp', () => {
    const r = [
      { provider: 'groq', model: MODEL, soRequest: 2, soLoi: 1, tokensVao: 40, tokensRa: 10 },
      { provider: 'groq', model: MODEL + '@nen', soRequest: 1, soLoi: 2, tokensVao: 30, tokensRa: 20 },
      { provider: 'openai', model: 'old@test', soRequest: 1, soLoi: 1, tokensVao: 10, tokensRa: 10 },
    ];
    assert.deepEqual(tongSuDungThu(r), { groqToken: 100, thuToken: 70, thuLuot: 5 });
    const cfg = { ...docCauHinhThu(), groqTokenNgay: 100 + duKien, thuTokenNgay: 70 + duKien, thuLuotNgay: 6, tokenTienTrinh: duKien };
    kiemTranThu(cfg, r, 0, duKien);
    for (const k of ['groqTokenNgay', 'thuTokenNgay', 'thuLuotNgay', 'tokenTienTrinh'] as const)
      assert.throws(() => kiemTranThu({ ...cfg, [k]: cfg[k] - 1 }, r, 0, duKien), VuotNganSachError);
  });
  await muc('Provider trực tiếp chỉ cho model đã duyệt; không gọi trả phí', async () => {
    await chan(() => goiModel('openai', 'paid', 'offline-only', req));
    await chan(() => goiModel('groq', 'unknown', 'offline-only', req));
    await goi();
    assert.equal(http, 1); assert.equal(rpc, 1); assert.equal(rows[0].model, MODEL + '@test');
    assert.equal(rows[0].tokens_vao + rows[0].tokens_ra, 30, 'không cộng reasoning hai lần');
    assert.equal(existsSync(marker), false);
  });
  await muc('Trần ngày/token thử/lượt thử và tiến trình đều chặn trước HTTP', async () => {
    rows = [{ provider: 'groq', model: MODEL + '@background', so_request: 1, so_loi: 1, tokens_vao: 100, tokens_ra: 50 }];
    process.env.AI_GROQ_TRAN_TOKEN_NGAY = String(150 + duKien - 1); await chan(goi);
    process.env.AI_GROQ_TRAN_TOKEN_NGAY = '10000000';
    process.env.AI_THU_TRAN_TOKEN_NGAY = String(150 + duKien - 1); await chan(goi);
    process.env.AI_THU_TRAN_TOKEN_NGAY = '10000000';
    process.env.AI_THU_TRAN_LUOT_NGAY = '2'; await chan(goi);
    process.env.AI_THU_TRAN_LUOT_NGAY = '10000';
    process.env.AI_NGAN_SACH_TOKEN = String(tokenThuDaDung() + duKien - 1); await chan(goi);
  });
  await muc('Lỗi đọc/thiếu số liệu sổ dùng và thiếu thư mục đều dừng', async () => {
    loiDoc = true; await chan(goi); loiDoc = false;
    rows = [{ provider: 'groq', model: MODEL, so_request: 1, so_loi: 0, tokens_vao: NaN, tokens_ra: 0 }];
    await chan(goi); rows = [];
    process.env.AI_THU_TEP_DOI_SOAT = join(thuMuc!, 'khong-co', 'marker'); await chan(goi);
  });
  await muc('Phân trang sổ dùng không bỏ các dòng sau 1000', async () => {
    rows = Array.from({ length: 1001 }, () => ({ provider: 'groq', model: MODEL, so_request: 1, so_loi: 0, tokens_vao: 1, tokens_ra: 0 }));
    assert.equal((await docSuDungHomNayBatBuoc()).length, 1001);
    process.env.AI_GROQ_TRAN_TOKEN_NGAY = String(1000 + duKien); await chan(goi);
  });
  await muc('Ghi usage hỏng giữ dấu và chặn cả sau restart', async () => {
    loiGhi = true; await assert.rejects(goi, VuotNganSachError);
    assert.equal(http, 1); assert.equal(existsSync(marker), true);
    const dau = readFileSync(marker, 'utf8');
    assert.ok(!dau.includes('offline-only') && !dau.includes('bí mật'));
    loiGhi = false; await chan(goi);
    kiemRestart();
    xoaDauThu();
  });
  await muc('Thiếu usage hoặc vượt dự kiến giữ dấu; không giả là miễn phí', async () => {
    for (const mode of ['thieu', 'vuot'] as const) {
      cheDo = mode; await assert.rejects(goi, VuotNganSachError);
      assert.equal(existsSync(marker), true);
      await chan(goi); xoaDauThu();
    }
    assert.equal(rows.length, 2);
  });
  await muc('Timeout/mất mạng/lỗi server giữ dấu, không fallback và restart vẫn dừng', async () => {
    for (const mode of ['mang', 'server'] as const) {
      cheDo = mode;
      const truoc = http;
      await assert.rejects(() => goiVoiFallback(req), VuotNganSachError);
      assert.equal(http, truoc + 1, 'không gọi Groq thứ hai');
      assert.equal(existsSync(marker), true);
      await chan(goi); kiemRestart(); xoaDauThu();
    }
    assert.equal(rows.length, 2);
  });
  await muc('Lượt lỗi tính dự kiến một lần; không lùi khi không chỉ định ưu tiên', async () => {
    cheDo = 'loi'; process.env.AI_KHONG_LUI = '1';
    const truoc = tokenThuDaDung();
    await assert.rejects(() => goiVoiFallback(req));
    assert.equal(http, 1); assert.equal(rows.length, 1);
    assert.equal(rows[0].so_loi, 1); assert.equal(rows[0].model, MODEL + '@test');
    assert.equal(tokenThuDaDung() - truoc, duKien);
    assert.equal(existsSync(marker), false);
  });
  await muc('Fallback chỉ dùng Groq; đếm tại provider một lần, giữ tổng trực tiếp', async () => {
    await goi();
    const truoc = tokenThuDaDung();
    const kq = await goiVoiFallback(req);
    assert.equal(kq.provider, 'groq'); assert.equal(http, 2); assert.equal(rows.length, 2);
    assert.equal(tokenDaDung(), truoc + 30);
    assert.equal((globalThis as { __celestiaTokenDaDung?: number }).__celestiaTokenDaDung, tokenDaDung());
  });
  await muc('429 rồi Groq tiếp theo thành công: hai attempt, không provider trả phí', async () => {
    cheDo = 'loiMotLan';
    const kq = await goiVoiFallback(req);
    assert.equal(kq.model, 'openai/gpt-oss-20b');
    assert.equal(kq.daThuHong.length, 1);
    assert.equal(http, 2); assert.equal(rows.length, 2);
    assert.equal(rows[0].so_loi, 1); assert.equal(rows[1].so_request, 1);
  });
  await muc('429 tính vào trần: không cho attempt tiếp theo vượt trần lượt', async () => {
    cheDo = 'loiMotLan'; process.env.AI_THU_TRAN_LUOT_NGAY = '1';
    await assert.rejects(() => goiVoiFallback(req), VuotNganSachError);
    assert.equal(http, 1); assert.equal(rows.length, 1);
  });
  await muc('Không chạy hai lượt thử đồng thời', async () => {
    let mo!: () => void;
    doiHttp = () => new Promise<void>((r) => { mo = r; });
    const dau = goi();
    while (!mo) await new Promise<void>((r) => setImmediate(r));
    await chan(goi); mo(); await dau;
    assert.equal(http, 1);
  });
  await muc('Embedding đơn/lô và OpenAI batch đều dừng trước HTTP', async () => {
    await chan(() => embedTruyVan('fixture'));
    await chan(() => embedLoTaiLieu(['fixture']));
    await chan(() => chayBatchOpenAi([{ id: '1', model: 'paid', ...req }]));
  });
  await muc('RPC v2 chưa có dùng v1; v1 lỗi vẫn giữ dấu', async () => {
    thieuV2 = true; await goi(); assert.equal(rpc, 2);
    loiGhi = true; await assert.rejects(goi, VuotNganSachError);
    assert.equal(existsSync(marker), true); xoaDauThu();
  });
  // T-04 (22/10/2026): ngoại lệ có phí cho so mù / cổng 10.22 — hẹp, có trần, production không có
  await muc('Ngoại lệ có phí: thiếu trần tiền / giá / ghim thì không có, model trả phí vẫn bị chặn', async () => {
    choOpenai = true;
    const ghimDu = { AI_GHIM_MODEL: 'openai|paid', AI_TRAN_USD: '0.01', AI_GIA_VAO_USD: '1', AI_GIA_RA_USD: '1' };
    for (const thieu of Object.keys(ghimDu)) {
      const env = { ...process.env, ...ghimDu, [thieu]: thieu === 'AI_GHIM_MODEL' ? '' : '0' };
      assert.equal(luotThuCoPhi(env), null, `thiếu ${thieu} vẫn mở`);
    }
    assert.equal(luotThuCoPhi({ ...ghimDu }), null, 'không phải lượt thử (production) thì không có ngoại lệ');
    process.env.AI_GHIM_MODEL = 'openai|paid';
    await assert.rejects(() => goiVoiFallback(req), VuotNganSachError);
    assert.equal(http, 0, 'không có AI_TRAN_USD thì không được gọi model trả phí');
  });
  await muc('Ngoại lệ có phí: chỉ qua fallback đã giữ chỗ; gọi provider trực tiếp vẫn chặn', async () => {
    choOpenai = true;
    Object.assign(process.env, { AI_GHIM_MODEL: 'openai|paid', AI_TRAN_USD: '1', AI_GIA_VAO_USD: '1', AI_GIA_RA_USD: '1' });
    await chan(() => goiModel('openai', 'paid', 'offline-only', req));
    const kq = await goiVoiFallback(req);
    assert.equal(kq.provider, 'openai'); assert.equal(http, 1);
    assert.equal(rows.length, 1); assert.equal(rows[0].model, 'paid@test', 'lượt có phí vẫn ghi nhãn @test');
    assert.ok(tienDaTinh() > 0);
  });
  await muc('Ngoại lệ có phí: vượt trần tiền thì dừng trước HTTP', async () => {
    choOpenai = true;
    Object.assign(process.env, { AI_GHIM_MODEL: 'openai|paid', AI_GIA_VAO_USD: '1', AI_GIA_RA_USD: '1' });
    process.env.AI_TRAN_USD = String(tienDaTinh() + 1e-6);
    await assert.rejects(() => goiVoiFallback(req), VuotNganSachError);
    assert.equal(http, 0);
  });
  await muc('Không có cờ thử: provider production giữ đường cũ', async () => {
    for (const k of ['AI_NHAN', 'AI_NGAN_SACH_TOKEN', 'AI_MUC_DICH']) delete process.env[k];
    await goi(); assert.equal(http, 1); assert.equal(rpc, 0);
    // Production không đọc ngoại lệ có phí: đặt đủ biến mà không có cờ thử thì vẫn không có
    Object.assign(process.env, { AI_GHIM_MODEL: 'openai|paid', AI_TRAN_USD: '1', AI_GIA_VAO_USD: '1', AI_GIA_RA_USD: '1' });
    assert.equal(luotThuCoPhi(), null);
  });
  console.log('TẤT CẢ ĐẠT: ' + soMuc + ' nhóm X1, không gọi dịch vụ thật.');
}

void main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => {
  globalThis.fetch = fetchCu; _thayAdminChoTest(null);
  for (const k of BIEN) { if (cu[k] === undefined) delete process.env[k]; else process.env[k] = cu[k]; }
  if (!child) { xoaDauThu(); rmdirSync(thuMuc!); }
});
