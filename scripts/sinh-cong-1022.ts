/**
 * CỔNG 10.22 "KHÔNG THUA SÁCH THÔ" (tích hợp đợt 1, 22/10/2026) — GỌI MODEL THẬT, CÓ TRẦN TIỀN CỨNG.
 *
 *   npx tsx scripts/sinh-cong-1022.ts --dem                       # chỉ ước chi phí, không gọi gì
 *   npx tsx scripts/sinh-cong-1022.ts [--tran-usd 0.5] [--tiep] [--env <đường .env.local>]
 *
 * Quyết định 10.22 (docs/chien-luoc/kho-tri-thuc-to-be-2026-10.md): bài CÓ thư viện phải không thua bài
 * chỉ dùng đoạn sách thô; chủ đề nào thua thì tắt thư viện chủ đề đó. Script này sinh nhánh "sách thô"
 * (thư viện tắt, truy hồi đoạn sách giữ nguyên) cho ĐÚNG 24 câu × lá số của bộ so mù A/B
 * D:\Celestia\so-mu-ab-2026-10-22\, rồi ghép với bài A (có thư viện) đã sinh ở đó thành cặp đã xáo.
 * Không sinh lại bài A: cặp so chỉ khác nhau ở chỗ có thư viện hay không.
 *
 * Đầu ra D:\Celestia\cong-1022-2026-10-22\:
 *   cap.jsonl       — bài 1 / bài 2 đã xáo, KHÔNG nhãn, KHÔNG tên model (đưa người chấm)
 *   khoa-giai.json  — bài nào "thu-vien" / "sach-tho" + lỗi còn lại (KHÔNG đưa người chấm)
 *   so-luot.json    — token, tiền, tỉ lệ qua kiểm
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { batDauLuotThu } from './thu-chung';

const co = (ten: string) => process.argv.includes(ten);
const thamSo = (ten: string) => process.argv.flatMap((a, i) => (a === ten ? [process.argv[i + 1]] : []));

const NGUON_AB = 'D:\\Celestia\\so-mu-ab-2026-10-22';
const THU_MUC = 'D:\\Celestia\\cong-1022-2026-10-22';
const GIA = { vao: 0.2, ra: 1.2, dem: 0.02 }; // USD / 1 triệu token, gpt-5.6-luna (như sinh-cap-ab-v3)
const tranUsd = Number(thamSo('--tran-usd')[0] ?? 0.5);

type Bai = { luanGiai: string; viSao: unknown; goiY: unknown };
type DongCap = { stt: string; laSo: string; cauHoi: string; bai1: Bai; bai2: Bai };

/** Bài A (có thư viện) của từng cặp so mù A/B — lấy theo khoá giải */
function docBaiA(): Map<string, { laSo: string; cauHoi: string; bai: Bai }> {
  const khoa = JSON.parse(readFileSync(join(NGUON_AB, 'khoa-giai.json'), 'utf8')) as Record<string, { bai1: string }>;
  const ra = new Map<string, { laSo: string; cauHoi: string; bai: Bai }>();
  for (const dong of readFileSync(join(NGUON_AB, 'cap.jsonl'), 'utf8').split('\n').filter(Boolean)) {
    const d = JSON.parse(dong) as DongCap;
    const k = khoa[d.stt];
    if (!k) throw new Error(`Thiếu khoá giải cho ${d.stt}`);
    ra.set(d.stt, { laSo: d.laSo, cauHoi: d.cauHoi, bai: k.bai1 === 'A' ? d.bai1 : d.bai2 });
  }
  return ra;
}

const baiA = docBaiA();

if (co('--dem')) {
  // Đo 22/10 (so-mu-ab): 24 bài đường A ≈ 0,107 USD gồm cả vòng sửa
  const uoc = (0.107 / 24) * baiA.size;
  console.log(`${baiA.size} bài sách thô · ước ~$${uoc.toFixed(3)} (theo số đo đường A 22/10) · trần $${tranUsd}`);
  process.exit(0);
}

for (const d of readFileSync(thamSo('--env')[0] ?? '.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
}
batDauLuotThu('sinh-cong-1022', 1_000_000);
// Ngoại lệ có phí (lib/ai/ngan-sach-thu.ts luotThuCoPhi): đủ ba biến + ghim thì mới được gọi model trả phí
process.env.AI_GHIM_MODEL = 'openai|gpt-5.6-luna';
process.env.AI_TRAN_USD = String(tranUsd);
process.env.AI_GIA_VAO_USD = String(GIA.vao);
process.env.AI_GIA_RA_USD = String(GIA.ra);
console.log(`[sinh-cong-1022] ghim ${process.env.AI_GHIM_MODEL} · trần $${tranUsd}`);

async function main() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { CAU_HOI_V3, luanMotCau } = await import('../lib/rag/v3');
  const { tienDaTinh } = await import('../lib/ai/fallback');

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
  const tong = { cap: 0, vao: 0, ra: 0, dem: 0, dat: 0, soLanGoi: 0 };
  let dung = '';

  for (const [stt, a] of baiA) {
    if (daCo.has(stt)) continue;
    const [chuoi, id] = stt.split('|');
    const m = chuoi.match(/^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu)$/);
    if (!m) throw new Error(`Lá số sai dạng: ${chuoi}`);
    const laSo = lapLaSo({ ngay: +m[1], thang: +m[2], nam: +m[3], gio: +m[4], gioiTinh: m[5] as 'nam' | 'nu' });
    const q = CAU_HOI_V3.find((x) => x.id === id)!;
    try {
      // Sách thô: KHÔNG truyền thuVien → khối thư viện tắt, truy hồi đoạn sách như đường sản phẩm
      const s = await luanMotCau({ laSo, q, namXem: 2026, nho: new Map() });
      if (!s.luanGiai) throw new Error(`bài rỗng: ${s.loiConLai.map((l) => l.ma).join(',')}`);
      const sachTho: Bai = { luanGiai: s.luanGiai, viSao: s.viSao, goiY: s.goiY };
      const dao = Math.random() < 0.5;
      const [bai1, bai2] = dao ? [sachTho, a.bai] : [a.bai, sachTho];
      appendFileSync(tepCap, `${JSON.stringify({ stt, laSo: chuoi, chuDe: q.chuDe, cauHoi: q.cauHoi, bai1, bai2 })}\n`);
      khoa[stt] = {
        bai1: dao ? 'sach-tho' : 'thu-vien',
        bai2: dao ? 'thu-vien' : 'sach-tho',
        chuDe: q.chuDe,
        sachTho: { dat: s.dat, loiConLai: s.loiConLai.map((l) => l.ma), soLanGoi: s.soLanGoi, token: s.token },
      };
      writeFileSync(tepKhoa, JSON.stringify(khoa, null, 2));
      tong.cap += 1;
      tong.vao += s.token.vao;
      tong.ra += s.token.ra;
      tong.dem += s.token.dem;
      tong.dat += s.dat ? 1 : 0;
      tong.soLanGoi += s.soLanGoi;
      console.log(`✓ ${stt} · sách thô ${s.dat ? 'đạt' : 'trượt'} · $${tienDaTinh().toFixed(3)}`);
    } catch (e) {
      dung = `${stt}: ${(e as Error).message.slice(0, 200)}`;
      console.log(`✗ ${dung}`);
      if (/trần tiền|ngân sách|VuotNganSach/i.test(dung)) break;
    }
  }

  const usd = ((tong.vao - tong.dem) * GIA.vao + tong.dem * GIA.dem + tong.ra * GIA.ra) / 1e6;
  const soLuot = { ...tong, usd: +usd.toFixed(4), tienGiuChoDaTinh: +tienDaTinh().toFixed(4), tranUsd, dungLuc: dung || null };
  writeFileSync(join(THU_MUC, 'so-luot.json'), JSON.stringify(soLuot, null, 2));
  console.log(`\n${tong.cap} cặp · sách thô đạt ${tong.dat} · ~$${usd.toFixed(3)} (giữ chỗ tính $${tienDaTinh().toFixed(3)})`);
  console.log(`Đầu ra: ${THU_MUC}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
