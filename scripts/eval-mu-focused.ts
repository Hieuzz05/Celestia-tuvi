/**
 * Eval MÙ đường Focused — CEL-186 Answer Contract v2, spec 7.3 / commit C.
 *
 *   AI_GHIM_MODEL='openai|gpt-5.6-luna' AI_TRAN_USD=1 AI_GIA_VAO_USD=0.2 AI_GIA_RA_USD=1.2 \
 *     npx tsx scripts/eval-mu-focused.ts [--xuat <tệp.json>]
 *
 * 12 câu đời thường MỚI, không có trong Behavior Contract, không có trong `lib/`, chạy trên 3 lá số
 * KHÁC ba lá của 7.1 — mỗi câu trên 2 lá. Mục đích: bắt việc "học thuộc bộ test" (prompt hay khuôn
 * vô tình được chỉnh theo đúng câu của 7.1). Guard ở `test-focused.ts`: không tệp `lib/` nào import
 * tệp này, không câu hỏi nào của nó xuất hiện trong `lib/`.
 *
 * Chấm (máy, không regex văn phong):
 *   - 502 / viết lại / độ trễ;
 *   - Barnum ghép mù: tên sao/hoá trong văn câu trả lời của lá A, chấm điểm theo độ hiếm trên tập
 *     tên của từng lá trong cặp → đỉnh đúng lá A là "ghép đúng". Cổng ≥ 70% trên ca phân định được;
 *   - trùng lời (5-gram, đã bỏ tên) giữa hai lá cùng câu — báo, không chặn.
 * Văn từng câu ghi vào `--xuat` để người chấm điểm T.
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
const xuat = arg('--xuat');

const thieu = ['AI_GHIM_MODEL', 'AI_TRAN_USD', 'AI_GIA_VAO_USD', 'AI_GIA_RA_USD'].filter((k) => !process.env[k]?.trim());
if (thieu.length) {
  console.error(`Thiếu ${thieu.join(', ')} — eval mù phải ghim model Production và đặt trần tiền.`);
  process.exit(2);
}
if (Number(process.env.AI_TRAN_USD) > 2) {
  console.error(`AI_TRAN_USD=${process.env.AI_TRAN_USD} vượt $2 (spec mục 12).`);
  process.exit(2);
}
process.env.CELES_FOCUSED_CHAT = '1';
process.env.AI_NHAN = 'test';

import { lapLaSo, type LaSo } from '../lib/tuvi/ansao';

/** Ba lá KHÁC lá của 7.1 (chinh 14/3/1992 nam, be 22/5/2026 nữ, nu 2/9/1995 nữ). */
const LA_MU: Record<string, () => LaSo> = {
  'mu-a': () => lapLaSo({ ngay: 7, thang: 11, nam: 1987, gio: 18, gioiTinh: 'nu' }),
  'mu-b': () => lapLaSo({ ngay: 30, thang: 1, nam: 1999, gio: 2, gioiTinh: 'nam' }),
  'mu-c': () => lapLaSo({ ngay: 19, thang: 6, nam: 1979, gio: 11, gioiTinh: 'nam' }),
};

/** 12 câu mới, mỗi câu gán một cặp lá (xoay vòng ab / bc / ca). */
const CAU_MU = [
  'Dạo này tôi hay mất ngủ, năm nay có nên đi khám kỹ không?',
  'Tôi định mở quán cà phê nhỏ, năm nay có hợp không?',
  'Sếp mới vào, tôi lo bị cho nghỉ, năm nay công việc thế nào?',
  'Bạn trai tôi ít nói chuyện hơn trước, năm nay tình cảm ra sao?',
  'Năm nay tôi có nên cho bạn thân vay tiền không?',
  'Tôi muốn học lại tiếng Nhật, năm nay đầu óc có tập trung được không?',
  'Nhà tôi đang tính sửa lại bếp, năm nay có ổn không?',
  'Tôi làm tự do, thu nhập lúc có lúc không, năm nay tiền bạc thế nào?',
  'Tôi sắp chuyển vào Sài Gòn làm việc, năm nay đi xa có thuận không?',
  'Tôi hay nóng nảy với đồng nghiệp, tính tôi thế nào?',
  'Năm nay tôi có nên tập thể thao đều hơn không?',
  'Mấy năm nay tôi cứ thấy trì trệ, năm nay có gì khởi sắc không?',
];
const CAP: [string, string][] = [
  ['mu-a', 'mu-b'],
  ['mu-b', 'mu-c'],
  ['mu-c', 'mu-a'],
];

interface Bai {
  cau: number;
  la: string;
  van: string;
  ms: number;
  loi502: boolean;
  vietLai: boolean;
  tenDaNeu: string[];
  tapTen: string[];
}

function nGram(s: string, n = 5): Set<string> {
  const tu = s.toLowerCase().split(/[^\p{L}\p{M}\d]+/u).filter(Boolean);
  const ra = new Set<string>();
  for (let i = 0; i + n <= tu.length; i++) ra.add(tu.slice(i, i + n).join(' '));
  return ra;
}
const jaccard = (a: Set<string>, b: Set<string>) => {
  const giao = [...a].filter((x) => b.has(x)).length;
  return a.size + b.size - giao ? giao / (a.size + b.size - giao) : 0;
};
const boTen = (b: Bai) => b.tapTen.reduce((s, t) => s.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu'), ' '), b.van);

async function main() {
  const { traLoiFocused } = await import('../lib/rag/focused/tra-loi-focused');
  const { phienBanHienTai } = await import('../lib/rag/tra-loi');
  const { tienDaTinh, VuotNganSachError } = await import('../lib/ai/fallback');
  const { quetTen, khoaTen, tapTenTuGoi, goiCoPhucDuc } = await import('../lib/rag/focused/quet-ten');
  const { bayGioAm } = await import('../lib/tuvi/bay-gio');
  const HOM_NAY = bayGioAm(new Date(2026, 9, 4));

  const bai: Bai[] = [];
  let dungTai: string | null = null;
  console.log(`Model ghim ${process.env.AI_GHIM_MODEL} · trần $${process.env.AI_TRAN_USD} · ${CAU_MU.length} câu × 2 lá`);
  try {
    for (let i = 0; i < CAU_MU.length; i++) {
      for (const la of CAP[i % 3]) {
        dungTai = `câu ${i + 1} · ${la}`;
        const t = Date.now();
        const kq = await traLoiFocused(
          { laSo: LA_MU[la](), cauHoi: CAU_MU[i], namXem: 2026, thangXem: HOM_NAY.thang, ghiNhatKy: false, lichSu: [] },
          phienBanHienTai,
          async () => [],
          HOM_NAY
        );
        const pd = goiCoPhucDuc(kq.goi.duKien);
        const tenDaNeu = kq.van ? [...new Set(quetTen(kq.van, pd).map((x) => khoaTen(x.ten)))] : [];
        bai.push({
          cau: i + 1,
          la,
          van: kq.van,
          ms: Date.now() - t,
          loi502: kq.provider !== 'ma' && !kq.van,
          vietLai: (kq.vetPreview?.lan.length ?? 0) > 1,
          tenDaNeu,
          tapTen: [...tapTenTuGoi(kq.goi.duKien)],
        });
        console.log(`  câu ${String(i + 1).padStart(2)} ${la}: ${kq.van ? `${kq.van.length} ký tự, ${tenDaNeu.length} tên` : 'RỖNG'}  $${tienDaTinh().toFixed(3)}`);
      }
    }
    dungTai = null;
  } catch (e) {
    if (!(e instanceof VuotNganSachError)) throw e;
    console.error(`\nVƯỢT TRẦN tại ${dungTai} — dừng, ghi phần đã có.`);
  }

  // Ghép mù trong từng cặp: tên nặng theo độ hiếm (log(2 / số lá có tên)).
  let dung = 0, sai = 0, chuaPhanDinh = 0;
  const trung: number[] = [];
  for (let i = 1; i <= CAU_MU.length; i++) {
    const cap = bai.filter((b) => b.cau === i && b.van);
    if (cap.length === 2) trung.push(jaccard(nGram(boTen(cap[0])), nGram(boTen(cap[1]))));
    for (const a of cap) {
      if (!a.tenDaNeu.length || cap.length < 2) continue;
      const nang = (t: string) => Math.log(cap.length / Math.max(1, cap.filter((b) => b.tapTen.includes(t)).length));
      const diem = cap.map((b) => a.tenDaNeu.filter((t) => b.tapTen.includes(t)).reduce((x, t) => x + nang(t), 0));
      const dinh = Math.max(...diem);
      const oDinh = cap.filter((_, j) => diem[j] >= dinh - 1e-9);
      if (dinh <= 1e-9 || oDinh.length > 1) chuaPhanDinh++;
      else if (oDinh[0].la === a.la) dung++;
      else sai++;
    }
  }
  const ms = bai.map((b) => b.ms).sort((a, b) => a - b);
  const p = (q: number) => (ms.length ? ms[Math.min(ms.length - 1, Math.floor(ms.length * q))] : 0);
  const n502 = bai.filter((b) => b.loi502).length;
  const ghep = dung + sai ? dung / (dung + sai) : 0;
  const dong: [string, string, boolean][] = [
    ['502', `${n502}/${bai.length}`, n502 / Math.max(1, bai.length) <= 0.03],
    ['Viết lại', `${bai.filter((b) => b.vietLai).length}/${bai.length}`, bai.filter((b) => b.vietLai).length / Math.max(1, bai.length) <= 0.2],
    ['Độ trễ p50 / p95', `${p(0.5)} / ${p(0.95)} ms`, p(0.95) <= 30000],
    ['Barnum ghép mù (ca phân định được)', `${dung}/${dung + sai} = ${(ghep * 100).toFixed(1)}% · chưa phân định ${chuaPhanDinh}`, ghep >= 0.7],
    ['Trùng lời đã bỏ tên (báo)', `${((trung.reduce((x, y) => x + y, 0) / Math.max(1, trung.length)) * 100).toFixed(1)}%`, true],
  ];
  console.log('\n=== TỔNG (mù) ===');
  for (const [ten, so, d] of dong) console.log(`${d ? 'ĐẠT  ' : 'TRƯỢT'} ${ten.padEnd(40)} ${so}`);
  console.log(`Tiền đã tính: $${tienDaTinh().toFixed(4)} / $${process.env.AI_TRAN_USD}`);
  if (xuat) {
    writeFileSync(xuat, JSON.stringify({ luc: new Date().toISOString(), model: process.env.AI_GHIM_MODEL, tien: tienDaTinh(), dungTai, bai, tong: dong }, null, 2));
    console.log(`Đã ghi ${xuat}`);
  }
  process.exit(dungTai ? 3 : dong.every(([, , d]) => d) ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
