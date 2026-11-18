/**
 * Bóc mã máy E###/F###/W1–3 khỏi chữ người dùng thấy ở đường chat thường (CELES-81).
 *   npx tsx scripts/test-bo-ma-may.ts      — offline, không gọi model, không chạm DB
 *
 * Hai ca đầu là câu THẬT lộ mã khi chạy 6 câu chat ngày 15/11/2026.
 */
import { boMaTrongChu, boMaMay } from '../lib/rag/bo-ma-may';
import { soatNgonNgu } from '../lib/rag/ngon-ngu';
import type { TraLoiCoCauTruc } from '../lib/rag/bang-chung';

let hong = 0;
function kiem(ten: string, dung: boolean, chiTiet = '') {
  console.log(`${dung ? 'ĐẠT ' : 'HỎNG'}  ${ten}${dung ? '' : `\n      ${chiTiet}`}`);
  if (!dung) hong++;
}
function bang(ten: string, vao: string, mong: string) {
  const ra = boMaTrongChu(vao);
  kiem(ten, ra === mong, `vào:  ${JSON.stringify(vao)}\n      ra:   ${JSON.stringify(ra)}\n      mong: ${JSON.stringify(mong)}`);
}

// 1. Câu thật: mã làm chủ ngữ, ý còn câu khác → bỏ cả câu chứa mã
bang(
  'câu thật DC2: bỏ câu "E004 cũng gắn…" khi ý còn câu khác',
  'Thái Dương ở Tài Bạch cho thấy bạn kiếm tiền bằng sự hiện diện. E004 cũng gắn tổ hợp này với việc dùng lời nói và khả năng biện luận để kiếm tiền, nhưng dễ lúng túng khi đề cập giá cả.',
  'Thái Dương ở Tài Bạch cho thấy bạn kiếm tiền bằng sự hiện diện.'
);
// Câu DC4 NGUYÊN VĂN (ANSWER-TEST-sau-xuat-ban.json): câu có mã mang luôn câu giới hạn
// "chưa đủ để chốt" — bỏ cả câu thì câu mở "Nghiêng về có" thành mạnh hơn dữ kiện.
bang(
  'câu thật DC4: câu có mã mang giới hạn → giữ câu, xoá cụm "E001 cũng ghi nhận"',
  'Nghiêng về có: Tham Lang ở Mệnh dễ rõ hơn sau 30 tuổi. E001 cũng ghi nhận Tham Lang khó phát sớm và thành công trước 35 tuổi dễ chỉ thoáng qua, nên mốc sau 30 có cơ sở để nói là sáng dần, nhưng chưa đủ để chốt rằng cứ qua 30 là chắc chắn phát.',
  'Nghiêng về có: Tham Lang ở Mệnh dễ rõ hơn sau 30 tuổi. Tham Lang khó phát sớm và thành công trước 35 tuổi dễ chỉ thoáng qua, nên mốc sau 30 có cơ sở để nói là sáng dần, nhưng chưa đủ để chốt rằng cứ qua 30 là chắc chắn phát.'
);
bang('câu có mã không mang giới hạn, ý còn câu khác → bỏ', 'Tiền vào đều. E002 nói thêm về tiền giữ.', 'Tiền vào đều.');
bang('bỏ câu cuối đoạn: giữ xuống dòng giữa hai đoạn', 'Đoạn một. E001 nói thêm.\n\nĐoạn hai.', 'Đoạn một.\n\nĐoạn hai.');
// Ca biên QA 18/11
bang('mã sau dấu hai chấm, câu duy nhất', 'Tiền: E001, nhưng giữ khó.', 'Tiền: nhưng giữ khó.');
bang('ngoặc có mã đứng đầu chuỗi', '(E001) Mở đầu câu. Tiếp.', 'Mở đầu câu. Tiếp.');
// 2. Câu duy nhất có mã → chỉ xoá mã, dọn dấu câu, viết hoa lại chữ đầu
bang(
  'câu duy nhất: chỉ xoá mã, viết hoa lại',
  'E004 cũng gắn tổ hợp này với việc kiếm tiền bằng lời nói.',
  'Cũng gắn tổ hợp này với việc kiếm tiền bằng lời nói.'
);
bang('câu duy nhất, mã giữa câu kèm dấu phẩy', 'Theo E001, F002 và E004, tiền vào đều.', 'Tiền vào đều.');
// 3. Mã trong ngoặc → xoá cả ngoặc, giữ nguyên câu
bang('ngoặc tròn nhiều mã', 'Tiền vào đều nhưng giữ khó (E001, F002).', 'Tiền vào đều nhưng giữ khó.');
bang('ngoặc vuông', 'Vũ Khúc ở Tài hợp nghề tính toán [E004] và quản lý.', 'Vũ Khúc ở Tài hợp nghề tính toán và quản lý.');
bang('ngoặc có chữ đi kèm', 'Tiền đến muộn (theo E003) nhưng bền.', 'Tiền đến muộn nhưng bền.');
// 4. Nhãn cửa sổ W1–W3
bang('W2 trong câu phụ, ý còn câu khác', 'Năm nay nhịp tiền chậm. Ở W2 việc thu về rõ hơn.', 'Năm nay nhịp tiền chậm.');
// 5. Không có mã → giữ nguyên TỪNG CHỮ (cả chuỗi giống hệt)
for (const s of [
  'Tham Lang ở Mệnh hợp người tự lập. Bạn nên thử việc nhỏ trước.',
  'Năm 2026 là quãng bạn đổi chỗ làm, tháng 3 rõ nhất.',
  'Kế hoạch E-commerce và W3C không phải mã.',
  'Mã số 1E001 hay EF12 không phải mã căn cứ.',
  '  Có khoảng trắng đầu và cuối.  ',
  '',
]) {
  kiem(`giữ nguyên: ${JSON.stringify(s).slice(0, 50)}`, boMaTrongChu(s) === s, JSON.stringify(boMaTrongChu(s)));
}

// 6. Cả câu trả lời: mọi trường chữ, không đụng maNguon, không đẻ khoá mới
const traLoi: TraLoiCoCauTruc = {
  ketLuan: 'Nghiêng về có (E001).',
  tomTat: 'Tiền vào đều. F002 nói thêm về tiền giữ.',
  yChinh: [
    {
      tieuDe: 'Tiền vào [E001]',
      noiDung: 'Vũ Khúc ở Tài. E004 cũng gắn tổ hợp này với tiền bạc.',
      maDuKien: ['F001'],
      maNguon: ['E001', 'E004'],
      luongNguoc: 'Kình Dương đi kèm (F003).',
      neuThi: 'Nếu bạn làm tự do thì W1 dễ thu hơn.',
    },
  ],
  cachNoi: 'Hai dữ kiện nối nhau (E001, E004).',
  canNhac: ['E002', 'Giữ tiền khó (F002).'],
  goiYTiep: ['Năm sau thì sao?'],
};
const sau = boMaMay(traLoi);
const vanSau = JSON.stringify({ ...sau, yChinh: sau.yChinh.map(({ maDuKien: _a, maNguon: _b, ...y }) => y) });
kiem('câu trả lời: không còn mã ở trường chữ', !/\b[EF]\d{3}\b|\bW[1-3]\b/.test(vanSau), vanSau);
kiem('câu trả lời: maNguon / maDuKien giữ nguyên', JSON.stringify(sau.yChinh[0].maNguon) === '["E001","E004"]' && sau.yChinh[0].maDuKien[0] === 'F001');
kiem('câu trả lời: mục canNhac chỉ có mã thì bị bỏ', JSON.stringify(sau.canNhac) === '["Giữ tiền khó."]', JSON.stringify(sau.canNhac));
kiem('câu trả lời: không đẻ khoá hoiLai/tuKiem/buocTiepTheo', !('hoiLai' in sau) && !('tuKiem' in sau) && !('buocTiepTheo' in sau));
kiem('câu trả lời: không có mã thì đối tượng y hệt', JSON.stringify(boMaMay({ tomTat: 'Ổn.', yChinh: [] })) === JSON.stringify({ tomTat: 'Ổn.', yChinh: [] }));

// 7. Lưới thứ hai: soát ngôn ngữ báo mã sót, mức cảnh báo (không đổi `dat`)
const soat = soatNgonNgu('Tiền vào đều. E004 cũng nói vậy.', ['x']);
const loiMa = soat.loi.find((l) => l.ma === 'lo-ma-may');
kiem('soát ngôn ngữ: bắt mã sót, mức cảnh báo', loiMa?.mucDo === 'canh-bao' && loiMa.viDu === 'E004', JSON.stringify(loiMa));
kiem('soát ngôn ngữ: câu sạch không báo', !soatNgonNgu('Tiền vào đều.', ['x']).loi.some((l) => l.ma === 'lo-ma-may'));

console.log(hong ? `\n${hong} ca HỎNG` : '\nTất cả đạt.');
process.exit(hong ? 1 : 0);
