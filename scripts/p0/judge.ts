/**
 * P0 — AI Judge OFFLINE trên một lần chạy của `chay-ca.ts`.
 *
 *   Ước chi phí (MẶC ĐỊNH — không gọi model):
 *     npx tsx scripts/p0/judge.ts --chay <thư mục chạy>
 *   Chạy thật:
 *     AI_GHIM_MODEL='openai|gpt-5.6-luna' AI_GIA_VAO_USD=0.2 AI_GIA_RA_USD=1.2 \
 *       npx tsx scripts/p0/judge.ts --chay <thư mục> --goi --max-cost-usd 0.5 [--ca P01,P02]
 *   Xuất bộ chấm tay cho chủ dự án (không gọi model, kèm nhãn judge nếu đã có):
 *     npx tsx scripts/p0/judge.ts --chay <thư mục> --cham-tay 40 [--judge <judge.json>]
 *
 * Judge A — claim ↔ căn cứ: mỗi claim của lượt cuối + nguyên văn các F### / E### nó dẫn →
 *   SUPPORTED | PARTIAL | UNSUPPORTED | UNCLEAR. Chỉ dựa vào căn cứ đưa vào, không dùng hiểu biết riêng.
 * Judge C — độ phủ điểm bắt buộc (PROPOSED trong bộ ca) → COVERED | PARTIAL | MISSING.
 * Judge LECH — câu trả lời có trả lời ĐÚNG câu hỏi không → ON | PARTIAL | OFF. Chung lời gọi với C.
 * Không có Judge D (spec batch: không làm).
 *
 * Tất định hết mức provider cho phép: model ghim (không lùi), temperature 0, suy nghĩ 'low', prompt
 * có phiên bản `PHIEN_BAN_JUDGE`. Trần: ước tính TRƯỚC (cùng công thức giữ chỗ bi quan của
 * `lib/ai/fallback.ts`: ký tự/2 × giá vào + maxTokens × giá ra) — vượt `--max-cost-usd` thì từ chối
 * không gọi gì; trong lúc chạy `AI_TRAN_USD` = trần nên fallback tự dừng nếu thực tế vượt.
 *
 * Judge KHÔNG phải sự thật: nhãn đi vào chẩn đoán với nguồn JUDGE_*, và bộ chấm tay ở trên là để
 * chủ dự án đo độ khớp judge ↔ người trước khi tin con số nào.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
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

export const PHIEN_BAN_JUDGE = 'p0-judge-2026.10.1';

const arg = (k: string) => {
  const i = process.argv.indexOf(k);
  return i !== -1 ? process.argv[i + 1] : null;
};
const CHAY = arg('--chay');
const GOI = process.argv.includes('--goi');
const TRAN = arg('--max-cost-usd');
const CHI = arg('--ca')?.split(',') ?? null;
const CHAM_TAY = arg('--cham-tay');
const JUDGE_CO = arg('--judge');
const MAX_RA = 900;

if (!CHAY || !existsSync(CHAY)) {
  console.error('Cần --chay <thư mục chạy của chay-ca.ts>.');
  process.exit(2);
}

/* ------------------------------------------------------------------ prompt */

const SYS_A = `Bạn kiểm căn cứ cho các nhận định của một bài luận Tử Vi. Mỗi nhận định (claim) đi kèm các căn cứ nó dẫn:
F### = dữ kiện lá số do máy tính ra (đúng về mặt dữ liệu); E### = đoạn trích sách.
Gán cho TỪNG claim một nhãn:
- SUPPORTED: các căn cứ được dẫn, đọc theo đúng nghĩa của chúng, đủ để nói claim đó.
- PARTIAL: căn cứ chống đỡ một phần, hoặc claim nói mạnh / rộng / cụ thể hơn căn cứ.
- UNSUPPORTED: căn cứ không nói điều đó, nói ngược, hoặc không liên quan.
- UNCLEAR: không đủ thông tin để quyết.
CHỈ dựa vào căn cứ được đưa. Không dùng hiểu biết Tử Vi riêng để lấp chỗ trống.
Trả DUY NHẤT JSON: {"claims":[{"stt":1,"nhan":"SUPPORTED","lyDo":"≤ 25 từ"}]}`;

const SYS_C = `Bạn chấm một câu trả lời của trợ lý Tử Vi cho người dùng.
1) Với TỪNG điểm bắt buộc: COVERED (câu trả lời làm đúng điều đó), PARTIAL (làm một phần / mơ hồ), MISSING (không làm, hoặc làm ngược).
2) Câu trả lời có trả lời ĐÚNG câu hỏi (đúng chuyện, đúng thời điểm, đúng ngôn ngữ) không: ON | PARTIAL | OFF.
Không chấm văn hay hay dở, không chấm Tử Vi đúng sai.
Trả DUY NHẤT JSON: {"diem":[{"id":"M1","nhan":"COVERED","lyDo":"≤ 25 từ"}],"lech":{"nhan":"ON","lyDo":"≤ 25 từ"}}`;

/* ------------------------------------------------------------------ dựng việc */

interface Viec {
  loai: 'A' | 'C';
  ca: string;
  luot: number;
  system: string;
  user: string;
}

interface Duk {
  id: string;
  noiDung: string;
}
interface BanCa {
  ca: { id: string; luot: unknown[]; diemBatBuoc: { id: string; moTa: string }[] };
  luot: {
    stt: number;
    vao: { cauHoi: string };
    ra: { van: string; provider: string; banNhap?: { claims?: { claim: string; evidenceIds?: string[] }[] } | null } | null;
    vet: { duKien?: Duk[]; bangChung?: Duk[] };
  }[];
}

export function docCa(thuMuc: string): BanCa[] {
  return readdirSync(join(thuMuc, 'ca'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(thuMuc, 'ca', f), 'utf-8')) as BanCa);
}

export function canCuCua(l: BanCa['luot'][number]): Map<string, string> {
  const m = new Map<string, string>();
  for (const f of l.vet.duKien ?? []) m.set(f.id, f.noiDung);
  for (const e of l.vet.bangChung ?? []) m.set(e.id, e.noiDung);
  return m;
}

function dungViec(ds: BanCa[]): Viec[] {
  const ra: Viec[] = [];
  for (const b of ds) {
    if (CHI && !CHI.includes(b.ca.id)) continue;
    const l = b.luot[b.luot.length - 1];
    if (!l?.ra) continue;
    const claims = l.ra.banNhap?.claims ?? [];
    if (claims.length) {
      const cc = canCuCua(l);
      const user = claims
        .map((c, i) => {
          const ev = (c.evidenceIds ?? []).map((e) => `  [${e}] ${cc.get(e) ?? '(không có trong gói)'}`).join('\n');
          return `Claim ${i + 1}: ${c.claim}\nCăn cứ dẫn:\n${ev || '  (không dẫn gì)'}`;
        })
        .join('\n\n');
      ra.push({ loai: 'A', ca: b.ca.id, luot: l.stt, system: SYS_A, user });
    }
    if (b.ca.diemBatBuoc.length) {
      const user = `Câu hỏi: ${l.vao.cauHoi}\n\nCâu trả lời:\n${l.ra.van || '(trống — hệ thống không trả lời được)'}\n\nĐiểm bắt buộc:\n${b.ca.diemBatBuoc
        .map((d) => `${d.id}. ${d.moTa}`)
        .join('\n')}`;
      ra.push({ loai: 'C', ca: b.ca.id, luot: l.stt, system: SYS_C, user });
    }
  }
  return ra;
}

const docJson = (s: string): Record<string, unknown> | null => {
  const a = s.indexOf('{');
  const z = s.lastIndexOf('}');
  if (a < 0 || z <= a) return null;
  try {
    return JSON.parse(s.slice(a, z + 1));
  } catch {
    return null;
  }
};

/* ------------------------------------------------------------------ chấm tay */

function xuatChamTay(ds: BanCa[], soCap: number, judge: KetQuaJudge[] | null) {
  const nhanA = new Map<string, { nhan: string; lyDo: string }>();
  for (const j of judge ?? []) {
    if (j.loai !== 'A') continue;
    for (const c of ((j.ket?.claims as { stt: number; nhan: string; lyDo: string }[]) ?? [])) nhanA.set(`${j.ca}#${c.stt}`, c);
  }
  // Rải đều: lần lượt claim 1 của mọi ca, rồi claim 2… → mỗi ca góp ít nhất một cặp trước khi lấy thêm.
  const theoCa = ds.map((b) => {
    const l = b.luot[b.luot.length - 1];
    const cc = l ? canCuCua(l) : new Map();
    return (l?.ra?.banNhap?.claims ?? []).map((c, i) => ({ ca: b.ca.id, stt: i + 1, c, cc }));
  });
  const cap: (typeof theoCa)[number] = [];
  for (let vong = 0; cap.length < soCap && theoCa.some((x) => x.length > vong); vong++)
    for (const x of theoCa) if (x[vong] && cap.length < soCap) cap.push(x[vong]);
  const q = (s: string) => `"${s.replace(/"/g, '""').replace(/\r?\n/g, ' ⏎ ')}"`;
  const dong = ['maCap,ca,claimSo,claim,canCu,nhanJudge,lyDoJudge,nhanChuDuAn,ghiChu'];
  cap.forEach((x, i) => {
    const ev = (x.c.evidenceIds ?? []).map((e: string) => `[${e}] ${x.cc.get(e) ?? '?'}`).join(' | ');
    const j = nhanA.get(`${x.ca}#${x.stt}`);
    dong.push([`C${String(i + 1).padStart(2, '0')}`, x.ca, x.stt, q(x.c.claim), q(ev), j?.nhan ?? '', q(j?.lyDo ?? ''), '', ''].join(','));
  });
  const tep = join(CHAY!, `cham-tay-${cap.length}-cap.csv`);
  writeFileSync(tep, '\uFEFF' + dong.join('\r\n') + '\r\n');
  console.log(`Bộ chấm tay ${cap.length} cặp → ${tep}\nCột nhanChuDuAn: SUPPORTED | PARTIAL | UNSUPPORTED | UNCLEAR.`);
}

/* ------------------------------------------------------------------ chạy */

interface KetQuaJudge {
  loai: 'A' | 'C';
  ca: string;
  luot: number;
  ket: Record<string, unknown> | null;
  tho?: string;
  loi?: string;
  usd?: number;
}

async function main() {
  const ds = docCa(CHAY!);
  if (CHAM_TAY) {
    const j = JUDGE_CO ? (JSON.parse(readFileSync(JUDGE_CO, 'utf-8')).ket as KetQuaJudge[]) : null;
    xuatChamTay(ds, Math.min(50, Math.max(30, Number(CHAM_TAY))), j);
    return;
  }
  const viec = dungViec(ds);
  const giaVao = Number(process.env.AI_GIA_VAO_USD ?? 0.2);
  const giaRa = Number(process.env.AI_GIA_RA_USD ?? 1.2);
  const uoc = viec.reduce((s, v) => s + (Math.ceil((v.system.length + v.user.length) / 2) * giaVao + MAX_RA * giaRa) / 1e6, 0);
  console.log(
    `${viec.length} lời gọi (${viec.filter((v) => v.loai === 'A').length} A, ${viec.filter((v) => v.loai === 'C').length} C+LECH) · ` +
      `ước bi quan $${uoc.toFixed(4)} ở giá ${giaVao}/${giaRa} USD/1M token`
  );
  if (!GOI) {
    console.log('Không gọi model (thiếu --goi).');
    return;
  }
  if (!process.env.AI_GHIM_MODEL?.trim() || !TRAN || !process.env.AI_GIA_VAO_USD || !process.env.AI_GIA_RA_USD) {
    console.error('--goi cần AI_GHIM_MODEL, AI_GIA_VAO_USD, AI_GIA_RA_USD và --max-cost-usd.');
    process.exit(2);
  }
  if (uoc > Number(TRAN)) {
    console.error(`Ước $${uoc.toFixed(4)} vượt --max-cost-usd ${TRAN} — không gọi.`);
    process.exit(2);
  }
  process.env.AI_TRAN_USD = TRAN;
  process.env.AI_NHAN = 'test';
  const { goiVoiFallback, tienDaTinh, VuotNganSachError } = await import('../../lib/ai/fallback');

  const ket: KetQuaJudge[] = [];
  try {
    for (const v of viec) {
      const t0 = tienDaTinh();
      const r: KetQuaJudge = { loai: v.loai, ca: v.ca, luot: v.luot, ket: null };
      try {
        const kq = await goiVoiFallback({ system: v.system, user: v.user, maxTokens: MAX_RA, temperature: 0, mucSuyNghi: 'low' });
        r.ket = docJson(kq.text);
        if (!r.ket) r.tho = kq.text;
      } catch (e) {
        if (e instanceof VuotNganSachError) throw e;
        r.loi = (e as Error).message.slice(0, 200);
      }
      r.usd = Number((tienDaTinh() - t0).toFixed(6));
      ket.push(r);
      console.log(`${v.ca} ${v.loai} ${r.ket ? 'ok' : r.loi ? 'LỖI' : 'không đọc được JSON'}`);
    }
  } catch (e) {
    if (!(e instanceof VuotNganSachError)) throw e;
    console.error('VƯỢT TRẦN — dừng, giữ phần đã chấm.');
  }
  const ra = join(CHAY!, 'judge');
  mkdirSync(ra, { recursive: true });
  const tep = join(ra, `judge-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(tep, JSON.stringify({ phienBan: PHIEN_BAN_JUDGE, model: process.env.AI_GHIM_MODEL, usd: tienDaTinh(), ket }, null, 1));
  console.log(`Xong · $${tienDaTinh().toFixed(4)} · ${tep}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
