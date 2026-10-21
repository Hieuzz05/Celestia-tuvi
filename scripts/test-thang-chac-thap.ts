/**
 * Tháng nói theo độ tin — npx tsx scripts/test-thang-chac-thap.ts
 *
 * K3 (22/10/2026): vận một tháng là lớp mỏng nhất của lá số. Hỏi MỘT tháng thì (1) prompt đổi chính
 * mô tả hai hướng "rõ" sang lời nói theo độ tin, không thêm luật đứng trên nó; (2) khối thời gian dặn
 * độ tin, kèm câu "độ tin không phải độ nặng"; (3) validator chặn `THANG_CHAC_CAO` trên cả answer,
 * trừ khi có phủ định. Không hỏi tháng thì prompt và validator y như trước. Offline, không gọi model.
 */
import { chacThang, kiemBaTang, tinhMocHopLe, type NguCanhKiem } from '../lib/rag/focused/kiem';
import { khoiMoc, khoiNghiengFocused } from '../lib/rag/focused/prompt';
import { boiCanhThoiGian } from '../lib/rag/focused/phan-loai';
import { tapTenTuGoi } from '../lib/rag/focused/quet-ten';
import type { NghiengVe } from '../lib/rag/nghieng-ve';
import type { DuKienLaSo } from '../lib/rag/boi-canh-la-so';

let sai = 0;
const kiem = (ten: string, dung: boolean, chiTiet?: unknown) => {
  if (!dung) sai++;
  console.log(`${dung ? 'ĐÚNG' : 'SAI '}  ${ten}${!dung && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`);
};

const bayGio = { nam: 2026, thang: 8, ngay: 12 };
const cauThang = 'Tháng 11 công việc của tôi thế nào?';
const tgThang = boiCanhThoiGian({ cauHoi: cauThang, keHoach: { phamViThoiGian: 'thang', thangMucTieu: 11 }, namXem: 2026, bayGio });
const tgNam = boiCanhThoiGian({ cauHoi: 'Năm nay công việc tôi thế nào?', keHoach: { phamViThoiGian: 'nam' }, namXem: 2026, bayGio });

const duKien: DuKienLaSo[] = [
  { id: 'F001', loai: 'cung', noiDung: 'Quan Lộc có Thiên Phủ, Hóa Khoa.', cung: 'Quan Lộc', sao: ['Thiên Phủ', 'Hóa Khoa'] },
  { id: 'F002', loai: 'nguyet-han', noiDung: 'Nguyệt hạn tháng đang xét vào Quan Lộc, có Đà La.', cung: 'Quan Lộc', sao: ['Đà La'] },
];
const nghieng = (huong: NghiengVe['huong']): NghiengVe => ({
  huong, cap: 'thang', cung: 'Quan Lộc', phanDoi: 'công việc', cham: { daiVan: false, nam: true, thang: true },
  namXem: 2026,
  dauMoc: [
    { ten: 'Thiên Phủ', lop: 'nen', huong: 'do', trong: 3, y: 'giữ được nền' },
    { ten: 'Đà La', lop: 'thang', huong: 'can', trong: 2, y: 'chậm, vướng' },
  ],
  cachCuc: [], canNang: { do: 3, can: 2 },
});

// 1. Prompt: mô tả hướng "rõ" đổi khi hỏi tháng, không đổi khi không hỏi tháng
kiem('có tháng để kiểm', !!tgThang.thang && !tgNam.thang, { thang: !!tgThang.thang, nam: !!tgNam.thang });
for (const h of ['thuan-ro', 'can-ro'] as const) {
  const thang = khoiNghiengFocused(nghieng(h), { duKien }, 'A', true);
  const nam = khoiNghiengFocused(nghieng(h), { duKien }, 'A', false);
  kiem(`${h}, hỏi tháng: nói theo độ tin`, /HƯỚNG ĐÃ CHỐT:[^\n]*nghiêng về/u.test(thang) && !/không rào đón/u.test(thang), thang.split('\n').find((d) => d.startsWith('HƯỚNG')));
  kiem(`${h}, không hỏi tháng: giữ mô tả cũ`, /không rào đón/u.test(nam));
}
kiem('can-ro, hỏi tháng: giữ mức nặng', /đúng mức nặng/u.test(khoiNghiengFocused(nghieng('can-ro'), { duKien }, 'A', true)));
for (const h of ['thuan-nhe', 'can-bang', 'can-nhe'] as const) {
  kiem(`${h}: mô tả không đổi theo tháng`, khoiNghiengFocused(nghieng(h), { duKien }, 'A', true) === khoiNghiengFocused(nghieng(h), { duKien }, 'A', false));
}

// 2. Khối thời gian: dặn độ tin khi hỏi tháng, vắng khi không
const mocThang = khoiMoc({ bayGio, thoiGian: tgThang });
const mocNam = khoiMoc({ bayGio, thoiGian: tgNam });
kiem('khối mốc tháng có ĐỘ TIN', /ĐỘ TIN:/u.test(mocThang) && /không phải độ nặng/u.test(mocThang));
kiem('khối mốc năm không có ĐỘ TIN', !/ĐỘ TIN:/u.test(mocNam));

// 3. chacThang: bắt và tha
for (const c of [
  'Tháng 11 chắc chắn công việc chậm lại.',
  'Tháng đó công việc chắc luôn có biến.',
  'Không phải lo, tháng đó chắc chắn có việc.',
  'Đây không phải dấu hiệu xấu mà chắc chắn là lúc đổi nghề.',
  'Tháng đó trăm phần trăm có biến.',
]) kiem(`bắt: "${c}"`, !!chacThang(c));
for (const c of [
  'Celes không chắc chắn chuyện này.',
  'Khó chắc chắn điều gì trong một tháng.',
  'Một tháng thì chưa thể nói chắc chắn.',
  'Điều này không có nghĩa là chắc chắn chậm lại.',
  'Tháng đó nghiêng về chậm, có khả năng vướng giấy tờ.',
  'Ở một mức nhất định, công việc vẫn đi.',
  // qa 22/10: rào đón có phủ định cách vài từ, và lời dặn — không phải lời đoán
  'Tháng 11 khó nói chắc chắn.',
  'Mình không dám chắc chắn, nhưng tháng đó dễ chậm.',
  'Không ai có thể nói chắc chắn.',
  'Chưa có gì chắc chắn cả.',
  'Khó mà chắc chắn.',
  'Nếu bạn chắc chắn muốn đổi việc thì tháng đó nên chuẩn bị giấy tờ.',
  'Hãy chắc chắn rằng bạn nghỉ đủ.',
  'Bạn cần chắc chắn giấy tờ đủ trước khi nộp.',
]) kiem(`tha: "${c}"`, !chacThang(c));

// 4. Validator: chỉ chặn khi hỏi tháng, xét mọi câu của answer
const ctx = (thoiGian: NguCanhKiem['thoiGian'], cauHoi: string): NguCanhKiem => {
  const m = tinhMocHopLe({ cauHoi, thoiGian, namSinh: [1990], vanGoi: duKien.map((d) => d.noiDung) });
  return {
    cauHoi,
    phanLoai: { khuon: 'A', loaiSuKien: 'mong-muon', sau: false } as NguCanhKiem['phanLoai'],
    mucAnToan: 'NORMAL', chuDe: 'su-nghiep', doiTuong: null,
    tapTen: tapTenTuGoi(duKien), phucDucLaSao: false, maHopLe: new Set(duKien.map((d) => d.id)), maNguonHopLe: new Set(),
    nghieng: null, thoiGian, tuoiHopLe: [], cauMa: [], chipTruoc: [],
    mocHopLeAnswer: m.answer, mocHopLeChip: m.chip,
  };
};
const claims = [{ claim: 'Tháng đó công việc chậm', evidenceIds: ['F001', 'F002'], direction: 'vuong' as const }];
const ma = (answer: string, c: NguCanhKiem) => kiemBaTang({ answer, claims, suggestedQuestions: [] }, c).chan.map((l) => l.ma);
const vanChac = 'Thiên Phủ giữ được nền. Nhưng tháng đó chắc chắn công việc chậm lại.';
kiem('hỏi tháng: chặn THANG_CHAC_CAO ở câu thứ hai', ma(vanChac, ctx(tgThang, cauThang)).includes('THANG_CHAC_CAO'), ma(vanChac, ctx(tgThang, cauThang)));
kiem('không hỏi tháng: không chặn THANG_CHAC_CAO', !ma(vanChac.replace('tháng đó', 'năm nay'), ctx(tgNam, 'Năm nay công việc tôi thế nào?')).includes('THANG_CHAC_CAO'));
const vanTin = 'Thiên Phủ giữ được nền. Tháng đó nghiêng về chậm, có khả năng vướng giấy tờ.';
kiem('hỏi tháng, nói theo độ tin: không chặn', !ma(vanTin, ctx(tgThang, cauThang)).includes('THANG_CHAC_CAO'), ma(vanTin, ctx(tgThang, cauThang)));
const vanSe = 'Tháng đó chắc chắn bạn sẽ đổi việc.';
const k = ma(vanSe, ctx(tgThang, cauThang));
kiem('"chắc chắn … sẽ" vẫn là CHAC_CHAN_GIA, không báo trùng', k.includes('CHAC_CHAN_GIA') && !k.includes('THANG_CHAC_CAO'), k);

console.log(sai ? `\n${sai} ca SAI` : '\nTất cả đúng.');
process.exit(sai ? 1 : 0);
