/**
 * P0 — chạy bộ ca có kiểm soát qua đường Focused, ghi INPUT + OUTPUT + toàn bộ vết OFFLINE.
 *
 *   AI_GHIM_MODEL='openai|gpt-5.6-luna' AI_TRAN_USD=2 AI_GIA_VAO_USD=0.2 AI_GIA_RA_USD=1.2 \
 *   CELES_META_KHOA='khoa-meta-eval-tam' \
 *     npx tsx scripts/p0/chay-ca.ts --nhan baseline-6d7292c [--ca P01,H03] [--bo eval/p0/bo-ca-v1.json] \
 *       [--ra D:/Celestia/eval/p0]
 *
 * GỌI MODEL THẬT, không nằm trong CI. Thiếu ghim / trần / giá thì từ chối; trần > $2 thì từ chối.
 *
 * Vì sao vết nằm NGOÀI repo: vết chứa nguyên văn đoạn sách truy hồi (có bản quyền, xem
 * `lib/rag/thu-vien/kieu.ts`) và văn trả lời. Repo chỉ giữ bộ ca + bản tóm tắt không có văn.
 *
 * Ghi gì xuống DB: KHÔNG ghi `retrieval_runs` / `ai_requests` (`ghiNhatKy:false`). `goiVoiFallback`
 * vẫn ghi `ai_usage_logs` (nhãn `<model>@test` nhờ `AI_NHAN=test`) — không có cờ tắt ở mã baseline.
 * Chỉ ĐỌC: `ai_model_configs`, `knowledge_document_versions`, `knowledge_chunks` (dấu vân tay kho).
 *
 * Bất biến: thư mục chạy mang nhãn + giờ, đã có thì từ chối; xong thì đặt mọi tệp chỉ-đọc. Chạy lại
 * là một thư mục MỚI — không bao giờ ghi đè baseline.
 *
 * Bắt chuỗi JSON thô của model (kể cả nháp lần 1 khi bị viết lại): bọc `globalThis.fetch` trong tiến
 * trình này, chỉ ghi thân yêu cầu/đáp của các máy chủ model. KHÔNG ghi header (khoá API) và bỏ query
 * string (Gemini đặt khoá ở `?key=`).
 */
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const ENV = ['.env.local', '../tuvi-ai/.env.local'].find((p) => existsSync(p));
if (ENV) {
  for (const d of readFileSync(ENV, 'utf-8').split(/\r?\n/)) {
    const s = d.trim();
    if (!s || s.startsWith('#')) continue;
    const [k, ...p] = s.split('=');
    const v = p.join('=').trim();
    if (v && process.env[k.trim()] === undefined) process.env[k.trim()] = v;
  }
}

const arg = (k: string) => {
  const i = process.argv.indexOf(k);
  return i !== -1 ? process.argv[i + 1] : null;
};
const NHAN = arg('--nhan');
const BO = arg('--bo') ?? 'eval/p0/bo-ca-v1.json';
const RA = arg('--ra') ?? 'D:/Celestia/eval/p0';
const CHI = arg('--ca')?.split(',') ?? null;

if (!NHAN || !/^[a-z0-9.-]+$/i.test(NHAN)) {
  console.error('Cần --nhan <chữ-số-gạch> (vd baseline-6d7292c).');
  process.exit(2);
}
const thieu = ['AI_GHIM_MODEL', 'AI_TRAN_USD', 'AI_GIA_VAO_USD', 'AI_GIA_RA_USD'].filter((k) => !process.env[k]?.trim());
if (thieu.length) {
  console.error(`Thiếu ${thieu.join(', ')} — phải ghim model và đặt trần tiền.`);
  process.exit(2);
}
if (Number(process.env.AI_TRAN_USD) > 2) {
  console.error(`AI_TRAN_USD=${process.env.AI_TRAN_USD} vượt $2.`);
  process.exit(2);
}
process.env.CELES_FOCUSED_CHAT = '1';
process.env.AI_NHAN = 'test';

/* ------------------------------------------------------------- bắt lời gọi model */

const MAY_MODEL = ['api.openai.com', 'generativelanguage.googleapis.com', 'api.groq.com', 'api.cerebras.ai', 'openrouter.ai', 'api.anthropic.com'];
export interface GoiModelThô {
  diaChi: string;
  ms: number;
  trangThai: number | null;
  yeuCau: unknown;
  dap: string | null;
  loi?: string;
}
let hop: GoiModelThô[] | null = null;
let soEmbedding = 0;
const fetchGoc = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  if (!MAY_MODEL.includes(url.host)) return fetchGoc(input, init);
  if (url.pathname.endsWith('/embeddings') || url.pathname.includes(':embed') || url.pathname.includes(':batchEmbed')) {
    soEmbedding++;
    return fetchGoc(input, init);
  }
  const t = Date.now();
  const ghi: GoiModelThô = { diaChi: url.host + url.pathname, ms: 0, trangThai: null, yeuCau: null, dap: null };
  try {
    ghi.yeuCau = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
  } catch {
    ghi.yeuCau = null;
  }
  try {
    const res = await fetchGoc(input, init);
    ghi.trangThai = res.status;
    ghi.dap = await res.clone().text();
    return res;
  } catch (e) {
    ghi.loi = (e as Error).message;
    throw e;
  } finally {
    ghi.ms = Date.now() - t;
    hop?.push(ghi);
  }
}) as typeof fetch;

/* ------------------------------------------------------------------- bộ ca */

interface LuotCa {
  cauHoi?: string;
  chip?: number;
  taiLai?: boolean;
}
export interface CaP0 {
  id: string;
  tap: 'PILOT' | 'HOLDOUT';
  nguon: string;
  ten: string;
  la: 'chinh' | 'be' | 'nu';
  nn?: 'vi' | 'en' | null;
  trongYeu: boolean;
  luot: LuotCa[];
  kyVongHieu: { nguon: string; luotCuoi: Record<string, unknown> | null };
  diemBatBuoc: { id: string; moTa: string; trangThai: string }[];
}

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

async function main() {
  const { lapLaSo } = await import('../../lib/tuvi/ansao');
  const { bayGioAm } = await import('../../lib/tuvi/bay-gio');
  const { traLoiFocused, PHIEN_BAN_FOCUSED } = await import('../../lib/rag/focused/tra-loi-focused');
  const { phienBanHienTai } = await import('../../lib/rag/tra-loi');
  const { truyHoi } = await import('../../lib/rag/truy-hoi');
  const { dungPromptFocused } = await import('../../lib/rag/focused/prompt');
  const { tienDaTinh, VuotNganSachError } = await import('../../lib/ai/fallback');
  const { TEN_MODEL_EMBEDDING } = await import('../../lib/ai/embedding');
  const { taoSupabaseAdmin } = await import('../../lib/supabase/admin');
  const pb = {
    planner: (await import('../../lib/rag/planner')).PHIEN_BAN_PLANNER,
    truyHoi: (await import('../../lib/rag/truy-hoi')).PHIEN_BAN_TRUY_HOI,
    schemaOutput: (await import('../../lib/rag/bang-chung')).PHIEN_BAN_SCHEMA_OUTPUT,
    nghieng: (await import('../../lib/rag/nghieng-ve')).PHIEN_BAN_NGHIENG,
    cachCuc: (await import('../../lib/tuvi/cach-cuc')).PHIEN_BAN_CACH_CUC,
    validatorCu: (await import('../../lib/rag/kiem-duyet')).PHIEN_BAN_VALIDATOR,
    ngonNgu: (await import('../../lib/rag/ngon-ngu')).PHIEN_BAN_NGON_NGU,
    uuTien: (await import('../../lib/rag/uu-tien-nguon')).PHIEN_BAN_UU_TIEN,
    dauAn: (await import('../../lib/rag/dau-an')).PHIEN_BAN_DAU_AN,
    engine: (await import('../../lib/rag/boi-canh-la-so')).PHIEN_BAN_ENGINE,
    chu: (await import('../../lib/rag/phien-ban-chu')).PHIEN_BAN_CHU,
    focused: PHIEN_BAN_FOCUSED,
  };

  const boTho = readFileSync(BO, 'utf-8');
  const bo = JSON.parse(boTho) as { phienBan: string; homNay: string; ca: CaP0[] };
  const ds = bo.ca.filter((c) => !CHI || CHI.includes(c.id));
  const [y, m, d] = bo.homNay.split('-').map(Number);
  const HOM_NAY = bayGioAm(new Date(y, m - 1, d));
  const LA: Record<CaP0['la'], Parameters<typeof lapLaSo>[0]> = {
    chinh: { ngay: 14, thang: 3, nam: 1992, gio: 8, gioiTinh: 'nam' },
    be: { ngay: 22, thang: 5, nam: 2026, gio: 16, gioiTinh: 'nu' },
    nu: { ngay: 2, thang: 9, nam: 1995, gio: 20, gioiTinh: 'nu' },
  };

  /* ---- manifest: ghi TRƯỚC khi chạy, để một lần chạy dở vẫn biết nó chạy trên gì */
  const sb = taoSupabaseAdmin();
  let kho: Record<string, unknown> = { loi: 'không có Supabase admin' };
  let modelCauHinh: unknown = null;
  if (sb) {
    const v = await sb.from('knowledge_document_versions').select('id, document_id, checksum, so_chunk, model_embedding').eq('trang_thai', 'da_xuat_ban');
    const c = await sb.from('knowledge_chunks').select('id', { count: 'exact', head: true }).eq('trang_thai', 'hoat_dong');
    const hang = (v.data ?? []).map((r) => `${r.document_id}|${r.id}|${r.checksum}|${r.so_chunk}`).sort();
    kho = {
      soBanXuatBan: hang.length,
      soChunkHoatDong: c.count,
      dauVanTay: sha(hang.join('\n')).slice(0, 16),
      nhanModelEmbeddingTrongDb: [...new Set((v.data ?? []).map((r) => r.model_embedding))],
      modelEmbeddingTruyVan: TEN_MODEL_EMBEDDING,
      ghiChu: 'Nhãn model_embedding trong DB ghi gemini nhưng vector thật là OpenAI text-embedding-3-small (đo 05/10/2026: cosine 1.0000 trên 3 đoạn) — nhãn sai, truy hồi không lệch.',
    };
    modelCauHinh = (await sb.from('ai_model_configs').select('provider, model, uu_tien, bat').order('uu_tien')).data;
  }
  const git = (c: string) => {
    try {
      return execSync(c, { encoding: 'utf-8' }).trim();
    } catch {
      return null;
    }
  };
  const luc = new Date().toISOString().replace(/[:.]/g, '-');
  const thuMuc = join(RA, `${NHAN}-${luc}`);
  if (existsSync(thuMuc)) throw new Error(`${thuMuc} đã có — không ghi đè.`);
  mkdirSync(join(thuMuc, 'ca'), { recursive: true });
  const manifest = {
    nhan: NHAN,
    luc: new Date().toISOString(),
    git: { sha: git('git rev-parse HEAD'), nhanh: git('git rev-parse --abbrev-ref HEAD'), sach: git('git status --porcelain -- lib app components') === '' },
    model: {
      ghim: process.env.AI_GHIM_MODEL,
      giaUsdTrieuToken: { vao: Number(process.env.AI_GIA_VAO_USD), ra: Number(process.env.AI_GIA_RA_USD) },
      tranUsd: Number(process.env.AI_TRAN_USD),
      cauHinhProductionDocTuDb: modelCauHinh,
      thamSo: {
        vietFocused: 'maxTokens 6000, không đặt temperature (provider mặc định; nhánh gpt-5+ không gửi temperature, max_completion_tokens = maxTokens + 2048), không seed',
        phanLoaiPlanner: 'maxTokens 60, không đặt temperature',
        hanChotLuotMs: 50000,
        vietLaiToiDa: 1,
      },
    },
    co: {
      CELES_FOCUSED_CHAT: '1 (ép trong harness)',
      CELES_OWNER_KNOWLEDGE_FOCUSED: process.env.CELES_OWNER_KNOWLEDGE_FOCUSED ?? '(không đặt)',
      CELES_META_KHOA: process.env.CELES_META_KHOA ? '(đặt — giá trị không ghi)' : '(không đặt — F2 chờ / giải thích lượt trước không chạy từ meta)',
      AI_NHAN: 'test',
    },
    phienBan: pb,
    homNay: bo.homNay,
    homNayAm: HOM_NAY,
    bo: { duongDan: BO, phienBan: bo.phienBan, sha256: sha(boTho), soCa: ds.length },
    kho,
    ghiDb: 'không retrieval_runs/ai_requests; ai_usage_logs vẫn ghi với nhãn @test',
  };
  writeFileSync(join(thuMuc, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`→ ${thuMuc}\nModel ghim ${process.env.AI_GHIM_MODEL} · trần $${process.env.AI_TRAN_USD} · ${ds.length} ca`);

  /* ---- chạy */
  const tong: Record<string, unknown>[] = [];
  let dungTai: string | null = null;
  try {
    for (const ca of ds) {
      dungTai = ca.id;
      const laSo = lapLaSo(LA[ca.la]);
      const lichSu: { vaiTro: 'nguoi-dung' | 'tro-ly'; noiDung: string }[] = [];
      let truoc: Awaited<ReturnType<typeof traLoiFocused>> | null = null;
      const cacLuot: Record<string, unknown>[] = [];
      for (const [i, l] of ca.luot.entries()) {
        const cauHoi = l.chip !== undefined ? truoc?.coCauTruc?.goiYTiep?.[l.chip] ?? '' : l.cauHoi ?? '';
        let meta = (truoc as { meta?: unknown } | null)?.meta;
        if (meta !== undefined && l.taiLai) meta = JSON.parse(JSON.stringify(meta));
        const vao = {
          laSo,
          cauHoi,
          namXem: HOM_NAY.nam,
          thangXem: HOM_NAY.thang,
          ghiNhatKy: false,
          lichSu: [...lichSu],
          laTiepTuChip: l.chip !== undefined,
          requestId: `${NHAN}:${ca.id}:${i + 1}`,
          ...(meta !== undefined ? { luotTruoc: meta } : {}),
          ...(ca.nn ? { ngonNgu: ca.nn } : {}),
        } as Parameters<typeof traLoiFocused>[0];

        const vetTruyHoi: Record<string, unknown>[] = [];
        const truyHoiGhi: typeof truyHoi = async (kh, cfg) => {
          const kq = await truyHoi(kh, cfg);
          vetTruyHoi.push({ keHoach: kh, cauHinh: kq.cauHinh, truyVan: kq.truyVan, khoTrong: kq.khoTrong, doTreMs: kq.doTreMs, ungVien: kq.ungVien, daChonIds: kq.daChon.map((x) => x.chunkId) });
          return kq;
        };
        hop = [];
        const embTruoc = soEmbedding;
        const tienTruoc = tienDaTinh();
        const t = Date.now();
        let kq: Awaited<ReturnType<typeof traLoiFocused>> | null = null;
        let loi: string | null = null;
        try {
          kq = await traLoiFocused(vao, phienBanHienTai, async () => [], HOM_NAY, { truyHoi: truyHoiGhi });
        } catch (e) {
          if (e instanceof VuotNganSachError) throw e;
          loi = `${(e as Error).name}: ${(e as Error).message}`;
        }
        const ms = Date.now() - t;
        const dauVaoPrompt = kq?.vetFocused?.dauVaoPrompt;
        cacLuot.push({
          stt: i + 1,
          vao: { cauHoi, laTiepTuChip: vao.laTiepTuChip, coLuotTruoc: meta !== undefined, taiLai: !!l.taiLai, soTinLichSu: lichSu.length, ngonNgu: ca.nn ?? 'vi' },
          ra: kq
            ? {
                van: kq.van,
                coCauTruc: kq.coCauTruc,
                banNhap: kq.banNhap,
                provider: kq.provider,
                model: kq.model,
                khongTinhLuot: !!kq.khongTinhLuot,
                huongEngine: kq.huongEngine,
                phienBan: kq.phienBan,
                doTreMs: kq.doTreMs,
                coMeta: !!kq.meta,
              }
            : null,
          loi,
          vet: kq
            ? {
                preview: kq.vetPreview,
                focused: kq.vetFocused ? { lanGoi: kq.vetFocused.lanGoi, thuLai: kq.vetFocused.thuLai, loi: kq.vetFocused.loi, lan: kq.vetFocused.lan } : null,
                duKien: kq.goi?.duKien ?? [],
                bangChung: kq.goi?.bangChung ?? [],
                truyHoi: vetTruyHoi,
                prompt: dauVaoPrompt ? dungPromptFocused(dauVaoPrompt) : null,
                goiModel: hop,
                soEmbedding: soEmbedding - embTruoc,
              }
            : { truyHoi: vetTruyHoi, goiModel: hop },
          ms,
          usd: Number((tienDaTinh() - tienTruoc).toFixed(6)),
        });
        hop = null;
        lichSu.push({ vaiTro: 'nguoi-dung', noiDung: cauHoi });
        if (kq?.van) lichSu.push({ vaiTro: 'tro-ly', noiDung: kq.van });
        truoc = kq;
      }
      const ban = { ca, luot: cacLuot };
      writeFileSync(join(thuMuc, 'ca', `${ca.id}.json`), JSON.stringify(ban, null, 1));
      const cuoi = cacLuot[cacLuot.length - 1] as { ra: { model: string; van: string } | null; loi: string | null; ms: number };
      tong.push({ id: ca.id, tap: ca.tap, soLuot: cacLuot.length, duong: cuoi.ra?.model ?? 'LOI', coVan: !!cuoi.ra?.van, loi: cuoi.loi, ms: cuoi.ms });
      console.log(`${ca.id} ${ca.tap.padEnd(7)} ${String(cuoi.ra?.model ?? 'LOI').padEnd(26)} ${cuoi.ra?.van ? 'van' : '502/rỗng'} ${cuoi.ms}ms · $${tienDaTinh().toFixed(4)}`);
      dungTai = null;
    }
  } catch (e) {
    if (!(e instanceof VuotNganSachError)) throw e;
    console.error(`VƯỢT TRẦN tại ${dungTai} — dừng, giữ phần đã chạy.`);
  }

  writeFileSync(join(thuMuc, 'tong.json'), JSON.stringify({ xong: dungTai === null, dungTai, usd: tienDaTinh(), soEmbedding, ca: tong }, null, 1));
  for (const f of ['manifest.json', 'tong.json']) chmodSync(join(thuMuc, f), 0o444);
  for (const f of readdirSync(join(thuMuc, 'ca'))) chmodSync(join(thuMuc, 'ca', f), 0o444);
  console.log(`Xong · $${tienDaTinh().toFixed(4)} · ${thuMuc}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
