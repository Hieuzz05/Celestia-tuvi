/**
 * P0 — chẩn đoán OFFLINE một lần chạy của `chay-ca.ts`. Không gọi model, không chạm DB.
 *
 *   npx tsx scripts/p0/chan-doan.ts --chay <thư mục chạy> [--judge <judge/*.json>] [--nhan-nguoi <tệp.json>]
 *
 * Ghi `<chạy>/chan-doan/<ISO>/bao-cao.json` + `bao-cao.md`: primaryCause theo PILOT/HOLDOUT, cắt ngang,
 * cờ, tỉ lệ 502 / viết lại, p50/p95 độ trễ, token, chi phí, ánh xạ mục tiêu cải thiện. Bản chạy thô
 * KHÔNG bị sửa (chỉ thêm thư mục con).
 *
 * `--nhan-nguoi`: { "<id ca>": NhanNgoai } — nhãn chủ dự án chấm (nguồn NGUOI), thắng nhãn judge cùng loại.
 *
 * Giới hạn đã biết: baseline không lưu object `meta` (chỉ `coMeta`), nên kỳ vọng `metaChoHoiLai` của
 * hợp đồng được xấp xỉ bằng `coMeta && hieu.coChoHoiLai`. Báo cáo ghi rõ ca nào dùng xấp xỉ này.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chamHieu } from '../hop-dong-focused';
import type { KetQuaFocused } from '../../lib/rag/focused/tra-loi-focused';
import { TANG, MUC_TIEU, chanDoanLuot, type ChanDoan, type LuotVet, type NhanNgoai, type NguonPhatHien } from './chan-doan-loi';

const arg = (k: string) => {
  const i = process.argv.indexOf(k);
  return i !== -1 ? process.argv[i + 1] : null;
};

interface CaTho {
  ca: { id: string; tap: 'PILOT' | 'HOLDOUT'; nguon: string; nn: string | null; kyVongHieu: { nguon: string; luotCuoi: Record<string, unknown> | null } };
  luot: (LuotVet & { ms: number; usd: number; ra: (LuotVet['ra'] & { khongTinhLuot?: boolean; coMeta?: boolean }) | null; vet: LuotVet['vet'] & { focused?: { lanGoi: number; thuLai: unknown; lan: { tokVao: number; tokRa: number }[] } } })[];
}

/** Dựng lại đủ trường `chamHieu` đọc từ bản ghi thô. */
function kqXapXi(l: CaTho['luot'][number]): { kq: KetQuaFocused; xapXiMeta: boolean } {
  const p = l.vet.preview as (LuotVet['vet']['preview'] & { cuaSo?: unknown }) | undefined;
  const coMeta = !!l.ra?.coMeta;
  const kq = {
    provider: l.ra?.provider ?? 'loi',
    model: l.ra?.model ?? '',
    khongTinhLuot: l.ra?.khongTinhLuot,
    vetPreview: p,
    ...(coMeta ? { meta: { choHoiLai: !!p?.hieu.coChoHoiLai } } : {}),
  } as unknown as KetQuaFocused;
  return { kq, xapXiMeta: coMeta };
}

export function nhanTuJudge(tep: string): Map<string, NhanNgoai> {
  const ra = new Map<string, NhanNgoai>();
  const j = JSON.parse(readFileSync(tep, 'utf-8')) as { ket: { loai: 'A' | 'C'; ca: string; ket: Record<string, unknown> | null }[] };
  for (const r of j.ket) {
    if (!r.ket) continue;
    const n = ra.get(r.ca) ?? {};
    if (r.loai === 'A') {
      n.claim = ((r.ket.claims as { stt: number; nhan: string }[]) ?? []).map((c) => ({ stt: c.stt, nhan: c.nhan as never, nguon: 'JUDGE_A' as NguonPhatHien }));
    } else {
      n.diemBatBuoc = ((r.ket.diem as { id: string; nhan: string }[]) ?? []).map((d) => ({ id: d.id, nhan: d.nhan as never, nguon: 'JUDGE_C' as NguonPhatHien }));
      const lech = r.ket.lech as { nhan: string } | undefined;
      if (lech?.nhan) n.lech = { nhan: lech.nhan as never, nguon: 'JUDGE_LECH' };
    }
    ra.set(r.ca, n);
  }
  return ra;
}

const phanVi = (xs: number[], p: number) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
};

function main() {
  const CHAY = arg('--chay');
  if (!CHAY || !existsSync(join(CHAY, 'ca'))) {
    console.error('Cần --chay <thư mục chạy của chay-ca.ts>.');
    process.exit(2);
  }
  const manifest = JSON.parse(readFileSync(join(CHAY, 'manifest.json'), 'utf-8'));
  const [nam, thang] = String(manifest.homNay ?? '2026-10-04').split('-').map(Number);
  const homNay = { nam, thangDuong: thang };
  const judge = arg('--judge') ? nhanTuJudge(arg('--judge')!) : new Map<string, NhanNgoai>();
  const nguoi: Record<string, NhanNgoai> = arg('--nhan-nguoi') ? JSON.parse(readFileSync(arg('--nhan-nguoi')!, 'utf-8')) : {};

  const ds = readdirSync(join(CHAY, 'ca'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(CHAY, 'ca', f), 'utf-8')) as CaTho);

  const cd: (ChanDoan & { tap: string; xapXiMeta: boolean })[] = [];
  const ms: number[] = [];
  let tokVao = 0, tokRa = 0, usd = 0, soLuotModel = 0, soVietLai = 0, so502 = 0, soLoi = 0;

  for (const b of ds) {
    b.luot.forEach((l, i) => {
      const cuoi = i === b.luot.length - 1;
      ms.push(l.ms);
      usd += l.usd ?? 0;
      for (const x of l.vet.focused?.lan ?? []) {
        tokVao += x.tokVao ?? 0;
        tokRa += x.tokRa ?? 0;
      }
      if (l.vet.focused?.lanGoi) soLuotModel++;
      if ((l.vet.focused?.lanGoi ?? 0) > 1) soVietLai++;
      if (l.loi) soLoi++;
      else if (l.ra && !l.ra.van && l.ra.provider !== 'ma') so502++;
      if (!cuoi) return; // chẩn đoán lượt cuối — kỳ vọng chỉ khai cho lượt cuối
      const { kq, xapXiMeta } = kqXapXi(l);
      const laHopDong = b.ca.kyVongHieu.nguon.startsWith('hop-dong');
      const lechHopDong = laHopDong ? chamHieu(b.ca.kyVongHieu.luotCuoi as never, kq) : undefined;
      const nJ = judge.get(b.ca.id) ?? {};
      const nN = nguoi[b.ca.id] ?? {};
      const nhan: NhanNgoai = {
        claim: nN.claim ?? nJ.claim,
        diemBatBuoc: nN.diemBatBuoc ?? nJ.diemBatBuoc,
        lech: nN.lech ?? nJ.lech,
        nguyenNhan: nN.nguyenNhan,
      };
      const r = chanDoanLuot({ id: b.ca.id, luot: l, laLuotCuoi: true, kyVong: b.ca.kyVongHieu, lechHopDong, ngonNguCa: b.ca.nn ?? 'vi', homNay, nhan });
      cd.push({ ...r, tap: b.ca.tap, xapXiMeta: xapXiMeta && 'metaChoHoiLai' in (b.ca.kyVongHieu.luotCuoi ?? {}) });
    });
  }

  const dem = (tap: string) => {
    const x = cd.filter((c) => tap === 'TAT_CA' || c.tap === tap);
    const theoTang = Object.fromEntries([...TANG, 'NO_ERROR_FOUND'].map((t) => [t, 0])) as Record<string, number>;
    for (const c of x) theoTang[c.primaryCause ?? 'NO_ERROR_FOUND']++;
    const cat: Record<string, number> = {};
    const co: Record<string, number> = {};
    for (const c of x) {
      for (const k of c.catNgang) cat[k] = (cat[k] ?? 0) + 1;
      for (const k of c.co) co[k] = (co[k] ?? 0) + 1;
    }
    return { soCa: x.length, primaryCause: theoTang, catNgang: cat, co };
  };
  const mucTieu: Record<string, { soCa: number; ca: string[]; mucTieu: string }> = {};
  for (const c of cd)
    for (const k of [c.primaryCause, ...c.secondaryCauses, ...c.catNgang].filter(Boolean) as (keyof typeof MUC_TIEU)[]) {
      const m = (mucTieu[k] ??= { soCa: 0, ca: [], mucTieu: MUC_TIEU[k] });
      if (!m.ca.includes(c.id)) {
        m.ca.push(c.id);
        m.soCa++;
      }
    }
  const tongLuot = ms.length;
  const baoCao = {
    chay: manifest.nhan ?? CHAY,
    git: manifest.git,
    boCa: manifest.bo,
    nguonNhan: { judge: arg('--judge'), nguoi: arg('--nhan-nguoi') },
    PILOT: dem('PILOT'),
    HOLDOUT: dem('HOLDOUT'),
    TAT_CA: dem('TAT_CA'),
    vanHanh: {
      soLuot: tongLuot,
      soLuotModel,
      tiLe502: tongLuot ? so502 / tongLuot : 0,
      tiLeVietLai: soLuotModel ? soVietLai / soLuotModel : 0,
      soNgoaiLe: soLoi,
      msP50: phanVi(ms, 50),
      msP95: phanVi(ms, 95),
      tokVaoTB: soLuotModel ? Math.round(tokVao / soLuotModel) : 0,
      tokRaTB: soLuotModel ? Math.round(tokRa / soLuotModel) : 0,
      usd: Number(usd.toFixed(4)),
    },
    mucTieu,
    ca: cd,
  };

  const ra = join(CHAY, 'chan-doan', new Date().toISOString().replace(/[:.]/g, '-'));
  mkdirSync(ra, { recursive: true });
  writeFileSync(join(ra, 'bao-cao.json'), JSON.stringify(baoCao, null, 1));
  const v = baoCao.vanHanh;
  const md = `# Chẩn đoán P0 — ${baoCao.chay}

Git \`${manifest.git?.sha?.slice(0, 7) ?? '?'}\` · bộ ca \`${manifest.bo?.phienBan ?? '?'}\` · nhãn ngoài: judge ${baoCao.nguonNhan.judge ? 'có' : 'không'}, người ${baoCao.nguonNhan.nguoi ? 'có' : 'không'}.
Không có nhãn ngoài thì WRITING_MISS do thiếu điểm bắt buộc, UNSUPPORTED do judge, OFF_TARGET do judge đều KHÔNG được đếm — con số dưới là sàn, không phải trần.

## primaryCause (lượt cuối mỗi ca)

| Tầng | PILOT | HOLDOUT |
|---|---|---|
${Object.keys(baoCao.PILOT.primaryCause)
  .map((k) => `| ${k} | ${baoCao.PILOT.primaryCause[k]} | ${baoCao.HOLDOUT.primaryCause[k]} |`)
  .join('\n')}

Cắt ngang (tất cả): ${JSON.stringify(baoCao.TAT_CA.catNgang)} · Cờ: ${JSON.stringify(baoCao.TAT_CA.co)}

## Vận hành

| Chỉ số | Giá trị |
|---|---|
| Lượt / lượt tới model | ${v.soLuot} / ${v.soLuotModel} |
| Tỉ lệ 502 | ${(v.tiLe502 * 100).toFixed(1)}% |
| Tỉ lệ viết lại | ${(v.tiLeVietLai * 100).toFixed(1)}% |
| Ngoại lệ | ${v.soNgoaiLe} |
| Độ trễ p50 / p95 | ${(v.msP50 / 1000).toFixed(1)} s / ${(v.msP95 / 1000).toFixed(1)} s |
| Token vào / ra TB mỗi lượt model | ${v.tokVaoTB} / ${v.tokRaTB} |
| Chi phí | $${v.usd} |

## Mục tiêu cải thiện

${Object.entries(mucTieu)
  .sort((a, b) => b[1].soCa - a[1].soCa)
  .map(([k, m]) => `- **${k}** (${m.soCa} ca: ${m.ca.join(', ')}) → ${m.mucTieu}`)
  .join('\n') || '- (không có)'}

## Từng ca

| Ca | Tập | primary | phụ | cắt ngang | cờ |
|---|---|---|---|---|---|
${cd.map((c) => `| ${c.id} | ${c.tap} | ${c.primaryCause ?? '—'} | ${c.secondaryCauses.join(', ')} | ${c.catNgang.join(', ')} | ${c.co.join(', ')}${c.xapXiMeta ? ' (meta xấp xỉ)' : ''} |`).join('\n')}
`;
  writeFileSync(join(ra, 'bao-cao.md'), md);
  console.log(md.split('## Từng ca')[0]);
  console.log(`→ ${ra}`);
}

main();
