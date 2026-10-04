/**
 * Behavior Contract — TẦNG MODEL THẬT. CEL-186 Answer Contract v2, spec 7.1 / commit C.
 *
 *   AI_GHIM_MODEL='openai|gpt-5.6-luna' AI_TRAN_USD=2 AI_GIA_VAO_USD=0.2 AI_GIA_RA_USD=1.2 \
 *     npx tsx scripts/eval-hop-dong-focused.ts [--lan 5] [--flow 1,2,3] [--xuat <tệp.json>]
 *
 * GỌI MODEL THẬT, KHÔNG nằm trong CI. Thiếu ghim / trần / giá thì từ chối; trần > $2 thì từ chối
 * (spec mục 12: I contract + mù ≤ $2). Vượt trần giữa chừng → dừng cả bộ, ghi phần đã có.
 *
 * Mỗi flow của `hop-dong-focused.ts` chạy `--lan` lần (mặc định 5) trong tiến trình, "hôm nay"
 * tiêm cố định 04/10/2026. Chấm:
 *   - cột người / ý / thời gian: `chamHieu` (cùng hàm tầng offline);
 *   - các kiểm `KiemModel`: tín hiệu có cấu trúc (claims, direction, mã, LoiCung của lần cuối, chip,
 *     outOfScope, miễn trừ). Không regex văn phong. Tín hiệu chưa tồn tại ở mã hiện tại (claims trước
 *     commit D, LoiCung trước E, MetaLuot trước F) → "chưa đo", không tính đạt hay trượt.
 * Cột T (nghĩa của văn) không chấm ở đây: văn từng lần ghi vào `--xuat` cho người đọc.
 *
 * Cổng 7.1: flow trọng yếu 5/5; flow khác ≥ 90%; 502 ≤ 3%; viết lại ≤ 20%; p95 ≤ 30 s.
 * Flow `chiTay` (chỉ chấm trên web Preview) bị bỏ qua.
 */
import { readFileSync, writeFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v && process.env[k.trim()] === undefined) process.env[k.trim()] = v;
}

const arg = (k: string) => {
  const i = process.argv.indexOf(k);
  return i !== -1 ? process.argv[i + 1] : null;
};
const LAN = Number(arg('--lan') ?? 5);
const chiFlow = arg('--flow')?.split(',').map(Number) ?? null;
const xuat = arg('--xuat');

const thieu = ['AI_GHIM_MODEL', 'AI_TRAN_USD', 'AI_GIA_VAO_USD', 'AI_GIA_RA_USD'].filter((k) => !process.env[k]?.trim());
if (thieu.length) {
  console.error(`Thiếu ${thieu.join(', ')} — eval Behavior Contract phải ghim model Production và đặt trần tiền.`);
  process.exit(2);
}
if (Number(process.env.AI_TRAN_USD) > 2) {
  console.error(`AI_TRAN_USD=${process.env.AI_TRAN_USD} vượt $2 (spec mục 12).`);
  process.exit(2);
}
process.env.CELES_FOCUSED_CHAT = '1';
process.env.AI_NHAN = 'test';

import type { KetQuaFocused } from '../lib/rag/focused/tra-loi-focused';
import type { FlowHopDong, KiemModel, LuotDaChay } from './hop-dong-focused';

/** Hình claim theo spec 2.2 — đọc lỏng để chạy được cả trước commit D. */
interface ClaimLong {
  claim?: string;
  evidenceIds?: string[];
  direction?: string;
}
const claimsCua = (kq: KetQuaFocused): ClaimLong[] | null =>
  ((kq as unknown as { banNhap?: { claims?: ClaimLong[] } }).banNhap?.claims ?? null);
const outOfScope = (kq: KetQuaFocused): boolean | null => {
  const b = (kq as unknown as { banNhap?: { outOfScope?: boolean } }).banNhap;
  return b ? !!b.outOfScope : null;
};
/** Mã LoiCung của lần gọi cuối (rỗng = văn cuối sạch). null khi mã chưa có validator cứng (trước E). */
const loiCungCuoi = (kq: KetQuaFocused): string[] | null => {
  const lan = kq.vetPreview?.lan ?? [];
  const cuoi = lan[lan.length - 1];
  if (!cuoi || !(kq as unknown as { banNhap?: unknown }).banNhap) return null;
  return (cuoi.loi ?? []).map((l) => l.ma);
};
const huongEngine = (kq: KetQuaFocused): string | null => (kq as unknown as { huongEngine?: string }).huongEngine ?? null;
const metaCua = (kq: KetQuaFocused) =>
  (kq as unknown as { meta?: { ketLuanChinh?: { direction?: string } | null; canCuF?: string[] } }).meta ?? null;

const CO_DAU_VIET = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/iu;

/** Một kiểm: true đạt, false trượt, null chưa đo. */
function kiem(k: KiemModel, l: LuotDaChay, truoc: LuotDaChay | null): boolean | null {
  const kq = l.kq;
  const claims = claimsCua(kq);
  const chip = kq.coCauTruc?.goiYTiep ?? [];
  const nguyet = new Set((kq.vetPreview?.cuaSo ?? []).map((c) => c.ma));
  switch (k) {
    case 'chieu-khop-engine': {
      const h = huongEngine(kq);
      if (!claims || !h) return null;
      return claims[0]?.direction === h;
    }
    case 'khong-moc-nho-hon-nam': {
      const loi = loiCungCuoi(kq);
      return loi && !loi.includes('MOC_NHO_HON_NAM');
    }
    case 'khong-chon-ho': {
      const loi = loiCungCuoi(kq);
      return loi && !loi.includes('CHON_HO');
    }
    case 'claim-dan-ma-nguyet': {
      if (!claims) return null;
      const maNguyet = new Set((kq.vetPreview?.maDuKien ?? []).filter((m) => nguyet.has(m)));
      // Mã nguyệt của cửa sổ: vết chỉ giữ mã cửa sổ; dẫn mã F nguyệt hạn đọc từ timeRefs + mã.
      return claims.some((c) => (c.evidenceIds ?? []).some((m) => maNguyet.has(m)) || ((c as { timeRefs?: string[] }).timeRefs ?? []).some((t) => nguyet.has(t)));
    }
    case 'chieu-nhu-luot-truoc': {
      const m = truoc ? metaCua(truoc.kq) : null;
      if (!claims || !m?.ketLuanChinh?.direction) return null;
      return claims[0]?.direction === m.ketLuanChinh.direction;
    }
    case 'dung-lai-ma-luot-truoc': {
      const m = truoc ? metaCua(truoc.kq) : null;
      if (!claims || !m?.canCuF) return null;
      const cu = new Set(m.canCuF);
      return claims.some((c) => (c.evidenceIds ?? []).some((x) => cu.has(x)));
    }
    case 'khong-cau-hai-ve':
      return !kq.van.includes('chưa đủ để kết luận một phương án chắc chắn tốt hơn');
    case 'mien-tru-tam-ly':
      return null; // flow 17 — chấm ở eval-focused (SENS) và cột T
    case 'tieng-anh':
      return !!kq.van && !CO_DAU_VIET.test([kq.van, ...chip].join(' ').replace(/(?<!\p{L})[A-ZÀ-Ỹ][\p{L}]*(?:[A-ZÀ-Ỹ][\p{L}]*)*/gu, ''));
    case 'chip-la-cau-hoi':
      return chip.every((c) => /[?？]$/.test(c.trim()) && c.length <= 40);
    case 'ngoai-pham-vi': {
      const o = outOfScope(kq);
      return o === null ? (kq.coCauTruc ? !!(kq.coCauTruc as { ngoaiPhamVi?: boolean }).ngoaiPhamVi : null) : o;
    }
    case 'khong-moc-2027-trong-van':
      return !!kq.van && !kq.van.includes('2027');
    case 'chip-sang-nam':
      return chip.some((c) => /sang năm|2027|next year/iu.test(c));
  }
}

interface KetQuaLuot {
  flow: number;
  lan: number;
  luot: number;
  cauHoi: string;
  van: string;
  chip: string[];
  ms: number;
  /** Lượt đi tới model (không phải lối dừng bằng mã) */
  coModel: boolean;
  loi502: boolean;
  vietLai: boolean;
  lechHieu: string[];
  kiem: Record<string, boolean | null>;
  dat: boolean;
}

async function main() {
  const { HOP_DONG, HOM_NAY, chayFlow, chamHieu } = await import('./hop-dong-focused');
  const { traLoiFocused } = await import('../lib/rag/focused/tra-loi-focused');
  const { phienBanHienTai } = await import('../lib/rag/tra-loi');
  const { tienDaTinh, VuotNganSachError } = await import('../lib/ai/fallback');

  const goi = (vao: Parameters<typeof traLoiFocused>[0]) => traLoiFocused(vao, phienBanHienTai, async () => [], HOM_NAY);
  const flows: FlowHopDong[] = HOP_DONG.filter((f) => !f.chiTay && (!chiFlow || chiFlow.includes(f.so)));
  const ra: KetQuaLuot[] = [];
  let dungTai: string | null = null;

  console.log(`Model ghim ${process.env.AI_GHIM_MODEL} · trần $${process.env.AI_TRAN_USD} · ${flows.length} flow × ${LAN} lần`);
  try {
    for (const flow of flows) {
      for (let lan = 1; lan <= LAN; lan++) {
        dungTai = `flow ${flow.so} lần ${lan}`;
        const ds = await chayFlow(flow, goi);
        ds.forEach((l, i) => {
          const lech = chamHieu(l.luot.hieu, l.kq);
          const k: Record<string, boolean | null> = {};
          for (const ten of l.luot.model ?? []) k[ten] = kiem(ten, l, ds[i - 1] ?? null);
          const coModel = l.kq.provider !== 'ma';
          const r: KetQuaLuot = {
            flow: flow.so,
            lan,
            luot: i + 1,
            cauHoi: l.cauHoi,
            van: l.kq.van,
            chip: l.kq.coCauTruc?.goiYTiep ?? [],
            ms: l.ms,
            coModel,
            loi502: coModel && !l.kq.van,
            vietLai: (l.kq.vetPreview?.lan.length ?? 0) > 1,
            lechHieu: lech,
            kiem: k,
            dat: !lech.length && Object.values(k).every((v) => v !== false) && !(coModel && !l.kq.van),
          };
          ra.push(r);
        });
        const dat = ra.filter((r) => r.flow === flow.so && r.lan === lan).every((r) => r.dat);
        console.log(`  flow ${String(flow.so).padEnd(4)} lần ${lan}: ${dat ? 'đạt' : 'TRƯỢT'}  $${tienDaTinh().toFixed(3)}`);
      }
    }
    dungTai = null;
  } catch (e) {
    if (!(e instanceof VuotNganSachError)) throw e;
    console.error(`\nVƯỢT TRẦN tại ${dungTai} — dừng, ghi phần đã có.`);
  }

  // Tổng hợp theo cổng 7.1
  const dong: [string, string, boolean][] = [];
  for (const flow of flows) {
    const lanDat = new Set<number>();
    const lanCo = new Set(ra.filter((r) => r.flow === flow.so).map((r) => r.lan));
    for (const l of lanCo) if (ra.filter((r) => r.flow === flow.so && r.lan === l).every((r) => r.dat)) lanDat.add(l);
    const tl = lanCo.size ? lanDat.size / lanCo.size : 0;
    const chuaDo = ra.filter((r) => r.flow === flow.so).flatMap((r) => Object.entries(r.kiem).filter(([, v]) => v === null).map(([t]) => t));
    dong.push([
      `flow ${flow.so} ${flow.ten}${flow.trongYeu ? ' [trọng yếu]' : ''}`,
      `${lanDat.size}/${lanCo.size}${chuaDo.length ? ` · chưa đo: ${[...new Set(chuaDo)].join(', ')}` : ''}`,
      flow.trongYeu ? tl === 1 : tl >= 0.9,
    ]);
  }
  const coModel = ra.filter((r) => r.coModel);
  const n502 = ra.filter((r) => r.loi502).length;
  const nVietLai = ra.filter((r) => r.vietLai).length;
  const ms = coModel.map((r) => r.ms).sort((a, b) => a - b);
  const p = (q: number) => (ms.length ? ms[Math.min(ms.length - 1, Math.floor(ms.length * q))] : 0);
  dong.push(['502', `${n502}/${coModel.length}`, n502 / Math.max(1, coModel.length) <= 0.03]);
  dong.push(['Viết lại', `${nVietLai}/${coModel.length}`, nVietLai / Math.max(1, coModel.length) <= 0.2]);
  dong.push(['Độ trễ p50 / p95', `${p(0.5)} / ${p(0.95)} ms`, p(0.95) <= 30000]);

  console.log('\n=== TỔNG ===');
  for (const [ten, so, dat] of dong) console.log(`${dat ? 'ĐẠT  ' : 'TRƯỢT'} ${ten.padEnd(52)} ${so}`);
  console.log(`Tiền đã tính: $${tienDaTinh().toFixed(4)} / $${process.env.AI_TRAN_USD}`);
  if (xuat) {
    writeFileSync(xuat, JSON.stringify({ luc: new Date().toISOString(), model: process.env.AI_GHIM_MODEL, tien: tienDaTinh(), dungTai, ketQua: ra, tong: dong }, null, 2));
    console.log(`Đã ghi ${xuat}`);
  }
  process.exit(dungTai ? 3 : dong.every(([, , d]) => d) ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
