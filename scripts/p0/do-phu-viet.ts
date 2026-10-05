/**
 * P0 §14 — ĐỘ PHỦ TẦNG VIẾT trên một lần chạy `chay-ca.ts` (không gọi model).
 *
 *   npx tsx scripts/p0/do-phu-viet.ts --chay <thư mục> [--judge <judge.json>]
 *   So hai lần chạy (thí nghiệm Writer: baseline ↔ candidate, cùng bộ ca, cùng model ghim):
 *   npx tsx scripts/p0/do-phu-viet.ts --chay <A> --judge <jA> --so <B> --judge-so <jB>
 *
 * Hai lớp số, KHÔNG trộn:
 *  - TẤT ĐỊNH (đọc thẳng bản nháp model + vết): claim có ≥1 F###, claim chỉ dẫn E###, độ phủ dữ kiện
 *    (F distinct được dẫn / F trong gói), số claim, câu trống.
 *  - JUDGE (nếu có --judge): điểm bắt buộc COVERED / PARTIAL / MISSING (Judge C), claim SUPPORTED /
 *    PARTIAL / UNSUPPORTED (Judge A). Điểm bắt buộc của bộ ca đang PROPOSED, chưa có người chấm —
 *    con số là của judge, chưa phải sự thật. Tách PILOT / HOLDOUT: chỉnh Writer theo PILOT, đo trên HOLDOUT.
 *
 * Không dùng con số "71.2%" của bài dài làm mốc cho chat: hai bề mặt khác hợp đồng trả lời.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface Claim {
  evidenceIds?: string[];
}
interface Luot {
  stt: number;
  ra?: { van?: string; banNhap?: { claims?: Claim[] } } | null;
  vet?: { preview?: { maDuKien?: string[] } } | null;
}
export interface BanGhiCa {
  ca: { id: string; tap: 'PILOT' | 'HOLDOUT' };
  luot: Luot[];
}
export interface KetJudge {
  loai: 'A' | 'C';
  ca: string;
  luot: number;
  ket: { claims?: { nhan: string }[]; diem?: { nhan: string }[] };
}

export interface DoPhuCa {
  id: string;
  tap: 'PILOT' | 'HOLDOUT';
  trong: boolean;
  soClaim: number;
  claimCoF: number;
  claimChiE: number;
  fTrongGoi: number;
  fDuocDan: number;
  diem: Record<string, number>;
  claimJudge: Record<string, number>;
}

const dem = (ds: string[]) => ds.reduce<Record<string, number>>((a, x) => ((a[x] = (a[x] ?? 0) + 1), a), {});

/** Hàm thuần: một ca → số đo lượt cuối. Test offline gọi thẳng. */
export function doPhuCa(b: BanGhiCa, judge: readonly KetJudge[] = []): DoPhuCa {
  const cuoi = [...b.luot].reverse().find((l) => l.ra) ?? b.luot[b.luot.length - 1];
  const claims = cuoi?.ra?.banNhap?.claims ?? [];
  const goi = new Set((cuoi?.vet?.preview?.maDuKien ?? []).filter((m) => m.startsWith('F')));
  const dan = new Set(claims.flatMap((c) => (c.evidenceIds ?? []).filter((m) => m.startsWith('F'))));
  const jCa = judge.filter((j) => j.ca === b.ca.id && j.luot === cuoi?.stt);
  return {
    id: b.ca.id,
    tap: b.ca.tap,
    trong: !cuoi?.ra?.van,
    soClaim: claims.length,
    claimCoF: claims.filter((c) => (c.evidenceIds ?? []).some((m) => m.startsWith('F'))).length,
    claimChiE: claims.filter((c) => (c.evidenceIds ?? []).length > 0 && (c.evidenceIds ?? []).every((m) => m.startsWith('E'))).length,
    fTrongGoi: goi.size,
    fDuocDan: [...dan].filter((m) => goi.has(m)).length,
    diem: dem(jCa.filter((j) => j.loai === 'C').flatMap((j) => (j.ket.diem ?? []).map((d) => d.nhan))),
    claimJudge: dem(jCa.filter((j) => j.loai === 'A').flatMap((j) => (j.ket.claims ?? []).map((c) => c.nhan))),
  };
}

const pt = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)}%` : '—');

/** Hàm thuần: gộp theo tập. */
export function tongHop(ds: readonly DoPhuCa[]) {
  const cong = (k: (d: DoPhuCa) => number) => ds.reduce((s, d) => s + k(d), 0);
  const gop = (k: 'diem' | 'claimJudge') =>
    ds.reduce<Record<string, number>>((a, d) => {
      for (const [n, v] of Object.entries(d[k])) a[n] = (a[n] ?? 0) + v;
      return a;
    }, {});
  const diem = gop('diem');
  const tongDiem = Object.values(diem).reduce((s, v) => s + v, 0);
  const cj = gop('claimJudge');
  const tongCj = Object.values(cj).reduce((s, v) => s + v, 0);
  return {
    soCa: ds.length,
    trong: cong((d) => +d.trong),
    soClaim: cong((d) => d.soClaim),
    claimCoF: pt(cong((d) => d.claimCoF), cong((d) => d.soClaim)),
    claimChiE: cong((d) => d.claimChiE),
    doPhuDuKien: pt(cong((d) => d.fDuocDan), cong((d) => d.fTrongGoi)),
    diemCovered: pt(diem.COVERED ?? 0, tongDiem),
    diemMissing: pt(diem.MISSING ?? 0, tongDiem),
    tongDiemJudge: tongDiem,
    claimSupported: pt(cj.SUPPORTED ?? 0, tongCj),
    claimUnsupported: pt(cj.UNSUPPORTED ?? 0, tongCj),
  };
}

function docChay(dir: string, judgeTep?: string) {
  const ds = readdirSync(join(dir, 'ca'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, 'ca', f), 'utf-8')) as BanGhiCa);
  const judge: KetJudge[] = judgeTep ? JSON.parse(readFileSync(judgeTep, 'utf-8')).ket : [];
  return ds.map((b) => doPhuCa(b, judge));
}

function bang(ten: string, a: ReturnType<typeof tongHop>[], nhan: string[]) {
  const dong = Object.keys(a[0]).map((k) => `| ${k} | ${a.map((x) => String(x[k as keyof typeof x])).join(' | ')} |`);
  return [`### ${ten}`, '', `| Chỉ số | ${nhan.join(' | ')} |`, `|---|${nhan.map(() => '---').join('|')}|`, ...dong, ''].join('\n');
}

if (/[\\/]p0[\\/]do-phu-viet\.ts$/.test(process.argv[1] ?? '')) {
  const arg = (k: string) => {
    const i = process.argv.indexOf(k);
    return i > 0 ? process.argv[i + 1] : undefined;
  };
  const dirA = arg('--chay');
  if (!dirA || !existsSync(join(dirA, 'ca'))) {
    console.error('Thiếu --chay <thư mục có ca/>');
    process.exit(1);
  }
  const A = docChay(dirA, arg('--judge'));
  const dirB = arg('--so');
  const B = dirB ? docChay(dirB, arg('--judge-so')) : null;
  const nhan = B ? ['A', 'B'] : ['Giá trị'];
  const md = [
    `# Độ phủ tầng viết — ${dirA}${dirB ? ` ↔ ${dirB}` : ''}`,
    '',
    `Judge: ${arg('--judge') ? 'có' : 'không'}${B ? ` / ${arg('--judge-so') ? 'có' : 'không'}` : ''}. Điểm bắt buộc đang PROPOSED, nhãn là của judge.`,
    '',
    ...(['PILOT', 'HOLDOUT'] as const).map((t) =>
      bang(t, [tongHop(A.filter((d) => d.tap === t)), ...(B ? [tongHop(B.filter((d) => d.tap === t))] : [])], nhan)
    ),
  ];
  if (B) {
    md.push('### Ca đổi MISSING (judge C)', '', '| Ca | A | B |', '|---|---|---|');
    for (const a of A) {
      const b = B.find((x) => x.id === a.id);
      if (b && (a.diem.MISSING ?? 0) !== (b.diem.MISSING ?? 0)) md.push(`| ${a.id} | ${a.diem.MISSING ?? 0} | ${b.diem.MISSING ?? 0} |`);
    }
  }
  const ra = join(dirA, 'do-phu-viet');
  mkdirSync(ra, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(join(ra, `${ts}.md`), md.join('\n'));
  writeFileSync(join(ra, `${ts}.json`), JSON.stringify({ A, B }, null, 1));
  console.log(md.join('\n'));
  console.log(`\n→ ${join(ra, `${ts}.md`)}`);
}
