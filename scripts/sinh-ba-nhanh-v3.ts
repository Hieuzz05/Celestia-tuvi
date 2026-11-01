/**
 * SO BA NHÁNH A / A+ / B cho luận giải V3 (CELES-34, 31/10/2026) — GỌI MODEL THẬT, CÓ TRẦN TIỀN CỨNG.
 *
 *   npx tsx scripts/sinh-ba-nhanh-v3.ts [--tran-usd 0.6] [--env <đường .env.local>] [--la-so "12/5/1990 10h nam"]...
 *
 *   A  — đường sản phẩm (một lượt: dàn ý + bài)
 *   A+ — một lượt như A, thêm mức chắc từng ý + cách nói theo mức (duong-b.ts DUOI_A_CONG)
 *   B  — lập ý (cùng system + user + khoá đệm với lượt viết) → máy lọc → diễn đạt
 *
 * Khác sinh-cap-ab-v3.ts: ba nhánh chạy TUẦN TỰ (không Promise.all) và XOAY thứ tự mỗi câu, vì nhánh chạy
 * sau hưởng đệm phần đầu của nhánh trước — xoay để mỗi nhánh đứng đầu số lần như nhau. Ghi ms và token suy
 * luận từng bài. Đầu ra ở D:\Celestia\so-mu-3-nhanh-2026-10-31\:
 *   bo-cham.jsonl  — 3 bài đã xáo, KHÔNG nhãn nhánh, KHÔNG tên model (đưa người chấm)
 *   khoa-giai.json — bài nào là nhánh nào + token, ms, lỗi còn lại (KHÔNG đưa người chấm)
 *   so-luot.json   — tổng theo nhánh
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { batDauLuotThu } from './thu-chung';

const thamSo = (ten: string) => process.argv.flatMap((a, i) => (a === ten ? [process.argv[i + 1]] : []));

const CAU = ['SN01', 'TD01', 'CC02', 'TB01', 'GD01', 'SK01', 'RN02', 'TC02'];
const LA_SO_MAC_DINH = ['12/5/1990 10h nam', '29/2/2000 0h nu', '25/5/1936 16h nu'];
const GIA = { vao: 0.2, ra: 1.2, dem: 0.02 }; // USD / 1 triệu token, gpt-5.6-luna
const THU_MUC = 'D:\\Celestia\\so-mu-3-nhanh-2026-10-31';
const NHANH = ['A', 'A+', 'B'] as const;
type Nhanh = (typeof NHANH)[number];
const CO: Record<Nhanh, object> = { A: {}, 'A+': { aCong: true }, B: { duongB: true } };

const laSoDs = thamSo('--la-so').length ? thamSo('--la-so') : LA_SO_MAC_DINH;
const tranUsd = Number(thamSo('--tran-usd')[0] ?? 0.6);

// Worktree không có .env.local riêng: lùi về tệp của thư mục chính bên cạnh
const tepMoiTruong = thamSo('--env')[0] ?? (existsSync('.env.local') ? '.env.local' : '../tuvi-ai/.env.local');
for (const d of readFileSync(tepMoiTruong, 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
}
batDauLuotThu('sinh-ba-nhanh-v3', 2_000_000);
process.env.AI_GHIM_MODEL = 'openai|gpt-5.6-luna';
process.env.AI_TRAN_USD = String(tranUsd);
process.env.AI_GIA_VAO_USD = String(GIA.vao);
process.env.AI_GIA_RA_USD = String(GIA.ra);
console.log(`[sinh-ba-nhanh-v3] ghim ${process.env.AI_GHIM_MODEL} · giá ${GIA.vao}/${GIA.ra} USD/1M · trần $${tranUsd}`);

const usd = (t: { vao: number; ra: number; dem: number }) => ((t.vao - t.dem) * GIA.vao + t.dem * GIA.dem + t.ra * GIA.ra) / 1e6;

async function main() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { CAU_HOI_V3, chuanBiCau, luanMotCau } = await import('../lib/rag/v3');
  const { THU_VIEN_THEO_CHU_DE } = await import('../lib/rag/v3/xu-ly');
  const { docThuVien } = await import('../lib/rag/thu-vien/kho');

  mkdirSync(THU_MUC, { recursive: true });
  const tepCham = join(THU_MUC, 'bo-cham.jsonl');
  writeFileSync(tepCham, '');
  const khoa: Record<string, unknown> = {};
  const moi = () => ({ bai: 0, vao: 0, ra: 0, dem: 0, nghi: 0, ms: 0, dat: 0, dungDau: 0 });
  const tong: Record<Nhanh, ReturnType<typeof moi>> & { lui: number } = { A: moi(), 'A+': moi(), B: moi(), lui: 0 };
  let dung = '';
  let so = 0;

  outer: for (const chuoi of laSoDs) {
    const m = chuoi.match(/^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu)$/);
    if (!m) throw new Error(`Lá số sai dạng: ${chuoi}`);
    const laSo = lapLaSo({ ngay: +m[1], thang: +m[2], nam: +m[3], gio: +m[4], gioiTinh: m[5] as 'nam' | 'nu' });
    for (const id of CAU) {
      const stt = `${chuoi}|${id}`;
      const q = CAU_HOI_V3.find((x) => x.id === id)!;
      const tv = q.loai === 'chuyen-sau' ? THU_VIEN_THEO_CHU_DE[q.chuDe] : undefined;
      const thuVien = tv ? await docThuVien(q.chuDe, tv.dot) : undefined;
      const nho = new Map();
      const thuTu = NHANH.map((_, i) => NHANH[(i + so) % 3]);
      so += 1;
      try {
        const cb = await chuanBiCau({ laSo, q, namXem: 2026, nho, thuVien });
        const kq = {} as Record<Nhanh, Awaited<ReturnType<typeof luanMotCau>>>;
        for (const n of thuTu) kq[n] = await luanMotCau({ laSo, q, namXem: 2026, nho, thuVien, chuanBi: cb, thuNghiem: CO[n] });
        const rong = NHANH.filter((n) => !kq[n].luanGiai);
        if (rong.length) throw new Error(`bài rỗng ở ${rong.join(',')}`);
        const xao = [...NHANH].sort(() => Math.random() - 0.5);
        const hien = (k: (typeof kq)[Nhanh]) => ({ luanGiai: k.luanGiai, viSao: k.viSao, goiY: k.goiY });
        appendFileSync(tepCham, `${JSON.stringify({ stt, laSo: chuoi, cauHoi: q.cauHoi, bai1: hien(kq[xao[0]]), bai2: hien(kq[xao[1]]), bai3: hien(kq[xao[2]]) })}\n`);
        khoa[stt] = {
          nhan: { bai1: xao[0], bai2: xao[1], bai3: xao[2] },
          thuTuChay: thuTu,
          ...Object.fromEntries(NHANH.map((n) => [n, {
            dat: kq[n].dat, loiConLai: kq[n].loiConLai.map((l) => l.ma), soLanGoi: kq[n].soLanGoi, token: kq[n].token, ms: kq[n].ms,
            usd: +usd(kq[n].token).toFixed(5), danY: kq[n].danY, ...(kq[n].duongB ? { duongB: kq[n].duongB } : {}), ...(kq[n].aCong ? { aCong: kq[n].aCong } : {}),
          }])),
        };
        writeFileSync(join(THU_MUC, 'khoa-giai.json'), JSON.stringify(khoa, null, 2));
        for (const n of NHANH) {
          const t = tong[n];
          t.bai += 1;
          t.vao += kq[n].token.vao;
          t.ra += kq[n].token.ra;
          t.dem += kq[n].token.dem;
          t.nghi += kq[n].token.nghi ?? 0;
          t.ms += kq[n].ms;
          t.dat += kq[n].dat ? 1 : 0;
        }
        tong[thuTu[0]].dungDau += 1;
        tong.lui += kq.B.duongB?.lui ? 1 : 0;
        console.log(`✓ ${stt} · ${NHANH.map((n) => `${n} ${kq[n].dat ? 'đạt' : 'trượt'} ${(kq[n].ms / 1000).toFixed(1)}s $${usd(kq[n].token).toFixed(4)}`).join(' · ')}${kq.B.duongB?.lui ? ` · B lùi ${kq.B.duongB.lui}` : ''}`);
      } catch (e) {
        dung = `${stt}: ${(e as Error).message.slice(0, 200)}`;
        console.log(`✗ ${dung}`);
        if (/trần tiền|ngân sách|VuotNganSach/i.test(dung)) break outer;
      }
    }
  }

  const bang = Object.fromEntries(NHANH.map((n) => {
    const t = tong[n];
    return [n, { ...t, usd: +usd(t).toFixed(4), usdMoiBai: t.bai ? +(usd(t) / t.bai).toFixed(5) : 0, giayMoiBai: t.bai ? +(t.ms / t.bai / 1000).toFixed(1) : 0 }];
  }));
  writeFileSync(join(THU_MUC, 'so-luot.json'), JSON.stringify({ ...bang, bLui: tong.lui, tranUsd, dungLuc: dung || null }, null, 2));
  for (const n of NHANH) console.log(`${n}: ${JSON.stringify(bang[n])}`);
  console.log(`B lùi về A: ${tong.lui} · Đầu ra: ${THU_MUC}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
