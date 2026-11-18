/**
 * SINH CẶP SO MÙ A/B cho luận giải V3 (CELES-38, 22/10/2026) — GỌI MODEL THẬT, CÓ TRẦN TIỀN CỨNG.
 *
 *   npx tsx scripts/sinh-cap-ab-v3.ts --dem                 # chỉ ước chi phí, không gọi gì
 *   npx tsx scripts/sinh-cap-ab-v3.ts [--tran-usd 1] [--tiep] [--env <đường .env.local>] [--la-so "12/5/1990 10h nam"]...
 *
 *   A — đường sản phẩm (một lượt: dàn ý + bài)
 *   B — đường B (lib/rag/v3/duong-b.ts): lập ý có mức chắc → máy lọc → chỉ diễn đạt ý đã giữ
 *
 * Mỗi cặp dùng CHUNG một bản chuẩn bị (dữ kiện, thư viện, nguồn), nên A và B chỉ khác cách viết.
 * Mặc định ghim model Production (openai|gpt-5.6-luna) và đặt AI_TRAN_USD: vượt trần là lời gọi kế
 * tiếp bị chặn TRƯỚC khi gửi (lib/ai/fallback.ts). Đầu ra ở D:\Celestia\so-mu-ab-2026-10-22\:
 *   cap.jsonl       — bài 1 / bài 2 đã xáo, KHÔNG nhãn A/B, KHÔNG tên model (đưa người chấm)
 *   khoa-giai.json  — bài nào là A/B + lỗi còn lại + ý B giữ / bỏ (KHÔNG đưa người chấm)
 *   so-luot.json    — token, tiền, tỉ lệ qua kiểm
 * `--tiep` bỏ qua cặp đã có trong cap.jsonl.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { batDauLuotThu } from './thu-chung';

const co = (ten: string) => process.argv.includes(ten);
const thamSo = (ten: string) => process.argv.flatMap((a, i) => (a === ten ? [process.argv[i + 1]] : []));

// Một câu chuyên sâu mỗi chủ đề có thư viện (THU_VIEN_THEO_CHU_DE) — câu không hỏi thời điểm
const CAU = ['SN01', 'TD01', 'CC02', 'TB01', 'GD01', 'SK01', 'RN02', 'TC02'];
// Ba lá số khác kiểu (mẫu engine đã đối chiếu, scripts/mau-ansao.json); --la-so thay được
const LA_SO_MAC_DINH = ['12/5/1990 10h nam', '29/2/2000 0h nu', '25/5/1936 16h nu'];
const GIA = { vao: 0.2, ra: 1.2, dem: 0.02 }; // USD / 1 triệu token, gpt-5.6-luna
const THU_MUC = 'D:\\Celestia\\so-mu-ab-2026-10-22';

const laSoDs = thamSo('--la-so').length ? thamSo('--la-so') : LA_SO_MAC_DINH;
const tranUsd = Number(thamSo('--tran-usd')[0] ?? 1);

if (co('--dem')) {
  // Số đo 22/10: một câu đường A ≈ 11.678 token vào, 1.429 ra (kể cả vòng sửa trung bình)
  const a = { vao: 11_678, ra: 1_429 };
  const b = { vao: a.vao * 2 + 400, ra: a.ra + 700 }; // thêm lượt lập ý (~cùng prompt, ra ngắn) + khối dàn ý
  const usd = (t: { vao: number; ra: number }) => (t.vao * GIA.vao + t.ra * GIA.ra) / 1e6;
  const soCap = laSoDs.length * CAU.length;
  console.log(`${soCap} cặp (${laSoDs.length} lá số × ${CAU.length} câu)`);
  console.log(`Ước (chưa trừ đệm): A $${(usd(a) * soCap).toFixed(3)} + B $${(usd(b) * soCap).toFixed(3)} = $${((usd(a) + usd(b)) * soCap).toFixed(3)} · trần $${tranUsd}`);
  process.exit(0);
}

// Worktree không có .env.local riêng: --env trỏ tới tệp của thư mục chính
for (const d of readFileSync(thamSo('--env')[0] ?? '.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
}
batDauLuotThu('sinh-cap-ab-v3', 1_500_000);
process.env.AI_GHIM_MODEL = 'openai|gpt-5.6-luna';
process.env.AI_TRAN_USD = String(tranUsd);
process.env.AI_GIA_VAO_USD = String(GIA.vao);
process.env.AI_GIA_RA_USD = String(GIA.ra);
console.log(`[sinh-cap-ab-v3] ghim ${process.env.AI_GHIM_MODEL} · giá ${GIA.vao}/${GIA.ra} USD/1M · trần $${tranUsd}`);

async function main() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { CAU_HOI_V3, chuanBiCau, luanMotCau } = await import('../lib/rag/v3');
  const { THU_VIEN_THEO_CHU_DE } = await import('../lib/rag/v3/xu-ly');
  const { docThuVien } = await import('../lib/rag/thu-vien/kho');

  mkdirSync(THU_MUC, { recursive: true });
  const tepCap = join(THU_MUC, 'cap.jsonl');
  const tepKhoa = join(THU_MUC, 'khoa-giai.json');
  const daCo = new Set(
    co('--tiep') && existsSync(tepCap)
      ? readFileSync(tepCap, 'utf8').split('\n').filter(Boolean).map((l) => (JSON.parse(l) as { stt: string }).stt)
      : []
  );
  if (!co('--tiep')) writeFileSync(tepCap, '');
  const khoa: Record<string, unknown> = co('--tiep') && existsSync(tepKhoa) ? JSON.parse(readFileSync(tepKhoa, 'utf8')) : {};
  const tong = { cap: 0, A: { vao: 0, ra: 0, dem: 0, dat: 0 }, B: { vao: 0, ra: 0, dem: 0, dat: 0, lui: 0, yGiu: 0, yBo: 0 } };
  let dung = '';

  outer: for (const chuoi of laSoDs) {
    const m = chuoi.match(/^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu)$/);
    if (!m) throw new Error(`Lá số sai dạng: ${chuoi}`);
    const laSo = lapLaSo({ ngay: +m[1], thang: +m[2], nam: +m[3], gio: +m[4], gioiTinh: m[5] as 'nam' | 'nu' });
    for (const id of CAU) {
      const stt = `${chuoi}|${id}`;
      if (daCo.has(stt)) continue;
      const q = CAU_HOI_V3.find((x) => x.id === id)!;
      const tv = q.loai === 'chuyen-sau' ? THU_VIEN_THEO_CHU_DE[q.chuDe] : undefined;
      const thuVien = tv ? await docThuVien(q.chuDe, tv.dot) : undefined;
      const nho = new Map();
      try {
        const cb = await chuanBiCau({ laSo, q, namXem: 2026, nho, thuVien });
        const chung = { laSo, q, namXem: 2026, nho, thuVien, chuanBi: cb };
        const [a, b] = await Promise.all([luanMotCau(chung), luanMotCau({ ...chung, thuNghiem: { duongB: true } })]);
        if (!a.luanGiai || !b.luanGiai) throw new Error(`bài rỗng: ${[...a.loiConLai, ...b.loiConLai].map((l) => l.ma).join(',')}`);
        const dao = Math.random() < 0.5;
        const [bai1, bai2] = dao ? [b, a] : [a, b];
        const hien = (k: typeof a) => ({ luanGiai: k.luanGiai, viSao: k.viSao, goiY: k.goiY });
        appendFileSync(tepCap, `${JSON.stringify({ stt, laSo: chuoi, cauHoi: q.cauHoi, bai1: hien(bai1), bai2: hien(bai2) })}\n`);
        const tom = (k: typeof a) => ({ dat: k.dat, loiConLai: k.loiConLai.map((l) => l.ma), soLanGoi: k.soLanGoi, token: k.token, danY: k.danY });
        khoa[stt] = { bai1: dao ? 'B' : 'A', bai2: dao ? 'A' : 'B', A: tom(a), B: { ...tom(b), duongB: b.duongB } };
        writeFileSync(tepKhoa, JSON.stringify(khoa, null, 2));
        tong.cap += 1;
        for (const [ten, k] of [['A', a], ['B', b]] as const) {
          tong[ten].vao += k.token.vao;
          tong[ten].ra += k.token.ra;
          tong[ten].dem += k.token.dem;
          tong[ten].dat += k.dat ? 1 : 0;
        }
        tong.B.lui += b.duongB?.lui ? 1 : 0;
        tong.B.yGiu += b.duongB?.yGiu.length ?? 0;
        tong.B.yBo += b.duongB?.yBo.length ?? 0;
        console.log(`✓ ${stt} · A ${a.dat ? 'đạt' : 'trượt'} · B ${b.dat ? 'đạt' : 'trượt'}${b.duongB?.lui ? ` (lùi ${b.duongB.lui})` : ` (giữ ${b.duongB?.yGiu.length}, bỏ ${b.duongB?.yBo.length})`}`);
      } catch (e) {
        dung = `${stt}: ${(e as Error).message.slice(0, 200)}`;
        console.log(`✗ ${dung}`);
        if (/trần tiền|ngân sách|VuotNganSach/i.test(dung)) break outer;
      }
    }
  }

  const usd = (t: { vao: number; ra: number; dem: number }) => ((t.vao - t.dem) * GIA.vao + t.dem * GIA.dem + t.ra * GIA.ra) / 1e6;
  const soLuot = { ...tong, usdA: +usd(tong.A).toFixed(4), usdB: +usd(tong.B).toFixed(4), tranUsd, dungLuc: dung || null };
  writeFileSync(join(THU_MUC, 'so-luot.json'), JSON.stringify(soLuot, null, 2));
  console.log(`\n${tong.cap} cặp · A đạt ${tong.A.dat} · B đạt ${tong.B.dat} · B lùi ${tong.B.lui} · ~$${(soLuot.usdA + soLuot.usdB).toFixed(3)}`);
  console.log(`Đầu ra: ${THU_MUC}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
