import { chayFocused } from '../lib/rag/focused/chay';
/** CEL-200 máy 2: fixtures cờ tắt + quan hệ, cửa sổ, chữ và meta. Không mạng/model/DB. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { lapLaSo } from '../lib/tuvi/ansao';
import { lapKeHoach } from '../lib/rag/planner';
import { bangHoaChoLoi, loiChuLopHan, loiHoaLopHan, chuNguonLopHan } from '../lib/rag/kiem-lop-han';
import { chonBoiCanh, saoChinhTheoCung } from '../lib/rag/boi-canh-la-so';
import { tinhNghiengVe } from '../lib/rag/nghieng-ve';
import { khoiNghiengFocused, dungPromptFocused, tenDuocGoiTrongLuot } from '../lib/rag/focused/prompt';
import { kyMeta, kiemLuotTruoc, bamTraLoi, dungLaiBoiCanh, type MetaChuaKy } from '../lib/rag/focused/hieu-cau';
import { kiemCung, type NguCanhKiem } from '../lib/rag/focused/kiem';
import { phanKhuon, boiCanhThoiGian } from '../lib/rag/focused/phan-loai';
import { dungGoiBangChung } from '../lib/rag/bang-chung';
import { cuaSoAmCuaThangDuong } from '../lib/rag/focused/thang-am';
import { bayGioAm } from '../lib/tuvi/bay-gio';
import { tenModelThay } from './oracle-ten-prompt';

for (const k of Object.keys(process.env)) if (/SUPABASE|_API_KEY$|^CELES_/.test(k)) delete process.env[k];
globalThis.fetch = async () => { throw new Error('Test CEL-200 cấm mạng'); };
const hash = (s: unknown) => createHash('sha256').update(JSON.stringify(s)).digest('hex');
const homNay = new Date('2026-10-17T05:00:00Z');
const bayGio = bayGioAm(homNay);
const laSo = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 9, gioiTinh: 'nam' });
const cauHoi = 'Năm 2026 công việc của tôi thế nào?';
const kh = lapKeHoach({ cauHoi, saoTheoCung: saoChinhTheoCung(laSo), namXem: 2026, thangXem: 8 });
const vao = { laSo, keHoach: kh, namXem: 2026, thangXem: 8, focused: true };
const pl = phanKhuon({ cauHoi, keHoach: kh, doiTuong: null });
const tg = boiCanhThoiGian({ cauHoi, keHoach: kh, namXem: 2026, bayGio });

async function snapshot(root: string) {
  const mod = async (f: string) => import(pathToFileURL(resolve(root, 'lib/rag', f)).href);
  const bc = await mod('boi-canh-la-so.ts') as typeof import('../lib/rag/boi-canh-la-so');
  const nv = await mod('nghieng-ve.ts') as typeof import('../lib/rag/nghieng-ve');
  const fp = await mod('focused/prompt.ts') as typeof import('../lib/rag/focused/prompt');
  const sp = await mod('prompt-co-can-cu.ts') as typeof import('../lib/rag/prompt-co-can-cu');
  const tl = await mod('tra-loi.ts') as typeof import('../lib/rag/tra-loi');
  const meta = await mod('focused/hieu-cau.ts') as typeof import('../lib/rag/focused/hieu-cau');
  const ra: string[] = [];
  const fixtures = JSON.parse(readFileSync(resolve('scripts/mau-ansao.json'), 'utf8')).mau;
  for (const key of Object.keys(fixtures).slice(0, 6)) {
    const m = key.match(/^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu)$/)!;
    const l = lapLaSo({ ngay: +m[1], thang: +m[2], nam: +m[3], gio: +m[4], gioiTinh: m[5] as 'nam' | 'nu' });
    for (const cau of [cauHoi, 'Tháng 2 năm 2027 tiền bạc thế nào?']) {
      const keHoach = lapKeHoach({ cauHoi: cau, saoTheoCung: bc.saoChinhTheoCung(l), namXem: 2026, thangXem: 8 });
      for (const focused of [false, true]) {
        const c = bc.chonBoiCanh({ laSo: l, keHoach, namXem: 2026, thangXem: 8, focused });
        const n = nv.tinhNghiengVe({ laSo: l, chuDe: keHoach.chuDe, lopHan: keHoach.lopHan, namXem: 2026, thangXem: 8, focused });
        const goi = dungGoiBangChung(cau, keHoach, c.duKien, []);
        const phanLoai = phanKhuon({ cauHoi: cau, keHoach, doiTuong: null });
        const thoiGian = boiCanhThoiGian({ cauHoi: cau, keHoach, namXem: 2026, bayGio });
        const prompt = fp.dungPromptFocused({ goi, cauHoiGoc: cau, lichSu: [], daNoiTruoc: [], nghieng: n, phanLoai, mucAnToan: 'NORMAL', moc: { bayGio, thoiGian }, laTiepTuChip: false, cauMa: [] });
        ra.push(hash([c, n, nv.khoiNghiengVe(n), prompt, sp.dungPromptCoCanCu(goi, []), tl.phienBanHienTai(false)]));
      }
    }
  }
  const off = bc.chonBoiCanh(vao);
  ra.push(hash(meta.dungLaiBoiCanh(laSo, { keHoach: kh, namHieuLuc: 2026, cuaSo: null }, 8)));
  assert.equal(hash(off), hash(chonBoiCanh({ ...vao, lopHanMoi: false })));
  return ra;
}
async function main() {
  const baseArg = process.argv.indexOf('--base-root');
  const root = baseArg >= 0 ? process.argv[baseArg + 1] : process.cwd();
  const fixture = resolve('scripts/mau-lop-han-3b-off.json');
  const snap = await snapshot(root);
  if (process.argv.includes('--ghi-mau')) { writeFileSync(fixture, JSON.stringify({ base: '25ad334', sha256: snap }, null, 2) + '\n'); return; }
  assert.deepEqual(snap, JSON.parse(readFileSync(fixture, 'utf8')).sha256, 'Đường tắt lệch byte so base25ad334');
  const bc = chonBoiCanh({ ...vao, lopHanMoi: true });
  const bang = bangHoaChoLoi(laSo, bc.duKien, [2026]);
  assert.equal(bang.hoa.length, 12);
  const h = bang.hoa.find((x) => x.nguon === 'nam')!;
  const cau = `Lưu ${h.hoa} vào ${h.sao} (cung ${h.tenCung})`;
  assert.equal(loiHoaLopHan(cau, bang), null);
  assert.equal(loiHoaLopHan(cau.replace(h.tenCung, h.tenCung === 'Mệnh' ? 'Quan Lộc' : 'Mệnh'), bang) !== null, true);
  assert.ok(loiHoaLopHan(cau.replace(h.sao, 'Tử Vi'), { ...bang, hoa: bang.hoa.filter((x) => x.sao !== 'Tử Vi') }));
  assert.ok(loiHoaLopHan(cau, { ...bang, hoa: bang.hoa.filter((x) => x.nguon !== 'nam') }));
  assert.ok(loiHoaLopHan(cau, bang, ['F999']));
  assert.ok(loiHoaLopHan(cau, { ...bang, hoa: [] }), 'Đột biến bỏ bảng đúng phải đỏ');
  const luuLoc = bang.hoa.find((x) => x.nguon === 'nam' && x.hoa === 'Hóa Lộc')!;
  const gocLoc = bang.hoa.find((x) => x.nguon === 'goc' && x.hoa === 'Hóa Lộc')!;
  assert.ok(loiHoaLopHan(`Lưu Hóa Lộc vào ${luuLoc.sao} và Tử Vi tại cung ${luuLoc.tenCung} năm 2026.`, bang));
  assert.ok(loiHoaLopHan(`Lưu Hóa Lộc vào ${luuLoc.sao}, còn Tử Vi cũng nhận cùng hóa này.`, bang));
  assert.ok(loiHoaLopHan(`Lưu Hóa Lộc vào ${luuLoc.sao} và Hóa Lộc vào ${gocLoc.sao}.`, bang));
  assert.ok(loiHoaLopHan(`Hóa Lộc vào ${gocLoc.sao} của tiểu hạn năm 2026.`, bang));
  assert.ok(loiHoaLopHan(`Hóa Lộc vào ${gocLoc.sao} của năm 2026.`, bang));
  assert.ok(loiHoaLopHan(`Hóa Lộc vào ${gocLoc.sao} theo can tháng 2 năm 2026.`, bang));
  assert.ok(loiHoaLopHan(`Lưu Hóa Lộc vào ${luuLoc.sao} nhưng nằm ở cung Mệnh.`, bang));
  assert.ok(loiHoaLopHan(`Hóa Lộc vào ${gocLoc.sao} thuộc tứ hóa nguyệt hạn năm 2026.`, bang));
  assert.ok(loiHoaLopHan(`Lưu Hóa Lộc vào ${luuLoc.sao}, tại cung ${luuLoc.tenCung === 'Mệnh' ? 'Quan Lộc' : 'Mệnh'}.`, bang));
  const giaMeta = bc.duKien.map((d) => ({ ...d, noiDung: 'Không có quan hệ được in', sao: [h.sao] }));
  assert.equal(bangHoaChoLoi(laSo, giaMeta, [2026]).hoa.length, 0, 'Metadata không cấp quyền cặp');
  for (const cum of ['tín hiệu', 'chồng lớp', 'lực cản', 'chiếc xe', 'con đường', 'đường xấu', 'xe yếu', 'nền', 'nhịp', 'yếu tố đỡ']) assert.ok(loiChuLopHan(`Có ${cum} ở đây.`), cum);
  assert.equal(loiChuLopHan('Tai nạn xe cộ là chuyện ngoài phạm vi câu hỏi.'), null);
  assert.equal(loiChuLopHan('Thu nhập ổn định.'), null);
  const nguon = 'LƯU Ý: không có nguồn tham chiếu nào. Chỉ nói dữ kiện.';
  assert.equal(chuNguonLopHan(nguon), nguon);
  assert.ok(!chuNguonLopHan(nguon, true).includes('không có nguồn'));
  assert.ok(!chuNguonLopHan('(Không có nguồn nào trong kho tri thức khớp với câu hỏi này.)', true).includes('kho tri thức'));
  const n = tinhNghiengVe({ laSo, chuDe: kh.chuDe, lopHan: kh.lopHan, namXem: 2026, thangXem: 8, focused: true, lopHanMoi: true });
  assert.ok(n?.lopHan);
  const goi = dungGoiBangChung(cauHoi, kh, bc.duKien, []);
  const prompt = { goi, cauHoiGoc: cauHoi, lichSu: [], daNoiTruoc: [], nghieng: n, phanLoai: pl, mucAnToan: 'NORMAL' as const, moc: { bayGio, thoiGian: tg }, laTiepTuChip: false, cauMa: [], lopHanMoi: true };
  const chu = dungPromptFocused(prompt);
  assert.ok(khoiNghiengFocused(n, goi, pl.khuon).includes('CUNG GỐC ĐẶT TRONG VẬN'));
  assert.ok(!chu.user.includes('LƯU Ý: không có nguồn'));
  const nhieuW = dungPromptFocused({ ...prompt, nghieng: null, nghiengTheoCuaSo: [{ cuaSo: 'W1', n: n! }, { cuaSo: 'W2', n: n! }] });
  assert.ok(!nhieuW.user.includes('\"direction\" của claims[0] là'));
  assert.ok(nhieuW.user.includes('Claim của cửa sổ W1') && nhieuW.user.includes('Claim của cửa sổ W2'));
  const tap = tenDuocGoiTrongLuot({ goi, nghieng: n, khuon: pl.khuon }).tapTen;
  const oracle = tenModelThay(prompt, false);
  for (const ten of tap) assert.ok(oracle.has(ten), `Tên không có trong prompt thật: ${ten}`);
  // Qua Tết: W1/W2 phải mang đúng tứ hoá của năm tương ứng.
  const cuaSo = cuaSoAmCuaThangDuong(2027, 2, homNay);
  assert.equal(new Set(cuaSo.map((w) => w.namAm)).size, 2);
  const ws = chonBoiCanh({ ...vao, cuaSo, lopHanMoi: true });
  const wb = bangHoaChoLoi(laSo, ws.duKien, cuaSo.map((w) => w.namAm), ws.maTheoCuaSo);
  for (const w of cuaSo) {
    const row = wb.hoa.find((x) => x.nguon === 'nam' && x.nam === w.namAm)!;
    const van = `Năm ${w.namAm} lưu ${row.hoa} vào ${row.sao} (cung ${row.tenCung})`;
    assert.equal(loiHoaLopHan(van, wb, [row.ma], [w.ma]), null);
    const khac = cuaSo.find((x) => x.namAm !== w.namAm)!;
    assert.ok(loiHoaLopHan(van, wb, [row.ma], [khac.ma]), 'Không gán đúng cặp sang sai cửa sổ');
  }
  const ctx: NguCanhKiem = { cauHoi, phanLoai: pl, mucAnToan: 'NORMAL', chuDe: kh.chuDe, doiTuong: null, tapTen: tap, phucDucLaSao: false, maHopLe: new Set(bc.duKien.map((d) => d.id)), maNguonHopLe: new Set(), nghieng: null, thoiGian: tg, tuoiHopLe: [], mocHopLeAnswer: { nam: new Set([2026]), thang: new Set() }, mocHopLeChip: { nam: new Set([2026]), thang: new Set() }, cauMa: [], chipTruoc: [], bangHoa: bang };
  const draft = { answer: cau + '.', claims: [{ claim: cau, evidenceIds: [h.ma] }], suggestedQuestions: [] };
  assert.ok(!kiemCung(draft, ctx).some((x) => ['LUU_HOA','HOA_SAI_QUAN_HE'].includes(x.ma)));
  assert.ok(kiemCung({ ...draft, answer: cau + '. Có tín hiệu tốt.' }, ctx).some((x) => x.ma === 'CHU_LOP_HAN'));
  assert.ok(kiemCung({ ...draft, suggestedQuestions: ['Tín hiệu tình cảm ra sao?'] }, ctx).some((x) => x.ma === 'CHU_LOP_HAN'));
  const { bangHoa: _, ...offCtx } = ctx;
  assert.ok(kiemCung(draft, offCtx).some((x) => x.ma === 'LUU_HOA'));
  // Vòng viết lại thật, model tiêm hàm giả: lỗi lần đầu được sửa, lỗi lặp trả rỗng.
  for (const hetLoi of [true, false]) {
    let soGoi = 0;
    const kq = await chayFocused({ prompt, ctx, goi: async () => {
      soGoi++;
      const d = soGoi === 2 && hetLoi ? draft : { ...draft, answer: cau + '. Có tín hiệu tốt.' };
      return { text: JSON.stringify(d), provider: 'groq', model: 'gia', tokensIn: 1, tokensOut: 1, daThuHong: [] };
    }});
    assert.equal(soGoi, 2);
    assert.equal(!!kq.van, hetLoi);
    if (kq.van) assert.equal(loiChuLopHan(kq.van), null);
    else assert.equal(kq.banNhap, null);
  }
  process.env.CELES_META_KHOA = 'khoa-gia-cel200';
  const van = 'Câu trả lời trước.';
  const meta: MetaChuaKy = { v: 1, phienBan: 'test', chuDe: kh.chuDe, yDinh: kh.yDinh, khuon: pl.khuon, keHoach: kh, namHieuLuc: 2026, cuaSo: null, doiTuong: null, laSoCuaAi: 'nguoi-hoi', thoiGian: { loai: 'nam', nam: 2026 }, ketLuanChinh: null, canCuF: [], canCuE: [], hoanCanh: [], choHoiLai: null, laSo: 'la', nguoiDung: 'nguoi', bamTraLoi: bamTraLoi(van) };
  const rb = { laSo: 'la', nguoiDung: 'nguoi' };
  const lichSu = [{ vaiTro: 'tro-ly' as const, noiDung: van }];
  for (const mode of [false, true]) {
    const ky = kyMeta({ ...meta, ...(mode ? { lopHanMoi: true } : {}) }, process.env.CELES_META_KHOA);
    assert.ok(kiemLuotTruoc(ky, rb, lichSu, 'test', mode).meta);
    assert.equal(kiemLuotTruoc(ky, rb, lichSu, 'test', !mode).meta, null);
    if (mode) assert.equal(hash(dungLaiBoiCanh(laSo, ky, 8)), hash(bc));
  }
  console.log(`PASS CEL-200 3b: ${snap.length} snapshot base + quan hệ/cửa sổ/ngôn ngữ/oracle/meta.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
