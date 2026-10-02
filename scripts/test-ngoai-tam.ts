/**
 * Câu hỏi ngoài tầm lá số (CEL-186a §9–11) — OFFLINE, không chạm DB, không gọi model.
 *
 *   npx tsx scripts/test-ngoai-tam.ts
 *
 * Khoá:
 *  1. Bắt đúng câu hỏi danh tính bạn đời / người yêu, cả có dấu lẫn không dấu.
 *  2. KHÔNG bắt nhầm: tên sao ("có phải Thất Sát không"), quý nhân, đặt tên
 *     con, "có phải người tốt không" — bắt nhầm là câu bình thường mất hướng.
 *  3. Câu kết luận do mã chọn, ổn định theo câu hỏi; câu 2 ("người bạn sẽ
 *     cưới") không bao giờ dùng cho người đã cưới.
 *  4. Chip hỏi lại tên ("Anh ấy tên gì?") bị nhận là ngoài tầm.
 */
import { CAU_NGOAI_TAM, cauKetLuanNgoaiTam, laChipNgoaiTam, nhanDangNgoaiTam } from '../lib/rag/ngoai-tam';

let hong = 0;
function kiem(ten: string, dung: boolean, chiTiet?: unknown) {
  if (dung) console.log(`  ✓ ${ten}`);
  else {
    hong++;
    console.log(`  ✗ ${ten}${chiTiet === undefined ? '' : ` → ${JSON.stringify(chiTiet)}`}`);
  }
}

console.log('\n== BẮT ĐÚNG ==');
const BAT: Array<[string, 'da-cuoi' | 'chua-cuoi' | 'khong-ro']> = [
  ['chồng tôi có phải Nguyễn Duy Hiếu ko?', 'da-cuoi'],
  ['chong toi co phai nguyen duy hieu khong', 'da-cuoi'],
  ['Vợ tôi có phải là Trần Thị Mai không?', 'da-cuoi'],
  ['Chồng tôi tên là gì?', 'da-cuoi'],
  ['Người yêu tôi có phải Lê Minh không?', 'chua-cuoi'],
  ['bạn trai tương lai của em tên gì', 'chua-cuoi'],
  ['Chồng tương lai của tôi họ gì?', 'chua-cuoi'],
  ['Crush của em có phải Phạm Anh Tuấn không?', 'chua-cuoi'],
];
for (const [cau, loai] of BAT) {
  const nt = nhanDangNgoaiTam(cau);
  kiem(`"${cau}" → ${loai}`, nt?.loai === loai, nt);
}

console.log('\n== KHÔNG BẮT NHẦM ==');
const KHONG_BAT = [
  'Cung phu thê của tôi có phải Thất Sát không?',
  'Chồng tôi có phải Thất Sát không?',
  'Quý nhân của tôi là ai?',
  'Đặt tên con là gì cho hợp?',
  'Chồng tôi có phải người tốt không?',
  'Vợ tôi có phải duyên phận của tôi không?',
  'Năm nay tôi có người yêu không?',
  'Chồng tôi năm nay có thăng chức không?',
  'Tôi có nên cưới không?',
  'Có phải tôi khắc chồng không?',
  'Chồng tôi lạnh nhạt có phải do mình không?',
  'Vợ tôi buồn có phải do anh ấy không?',
  'chong toi co phai le minh khong',
  'Chồng tôi có phải ngoại tình không?',
  'Người yêu tôi có phải chung thủy không?',
  'Vợ tôi có phải đang buồn không?',
  'chồng tôi có phải hiếu không',
];
for (const cau of KHONG_BAT) kiem(`"${cau}" → null`, nhanDangNgoaiTam(cau) === null, nhanDangNgoaiTam(cau));

console.log('\n== CÂU KẾT LUẬN ==');
kiem('đúng ba câu đã duyệt', CAU_NGOAI_TAM.length === 3);
const CAU_2 = CAU_NGOAI_TAM[1];
let dungCau2ChoDaCuoi = 0;
const daGapChuaCuoi = new Set<string>();
for (let i = 0; i < 60; i++) {
  const daCuoi = cauKetLuanNgoaiTam(`chồng tôi có phải Nguyễn Văn ${i} không`, { loai: 'da-cuoi' });
  if (daCuoi === CAU_2) dungCau2ChoDaCuoi++;
  daGapChuaCuoi.add(cauKetLuanNgoaiTam(`người yêu tôi có phải Trần Văn ${i} không`, { loai: 'chua-cuoi' }));
}
kiem('câu 2 không bao giờ dùng cho người đã cưới', dungCau2ChoDaCuoi === 0, dungCau2ChoDaCuoi);
kiem('người chưa cưới gặp đủ ba câu', daGapChuaCuoi.size === 3, [...daGapChuaCuoi]);
const q = 'chồng tôi có phải Nguyễn Duy Hiếu ko?';
kiem(
  'ổn định: cùng câu hỏi → cùng câu kết luận',
  cauKetLuanNgoaiTam(q, { loai: 'da-cuoi' }) === cauKetLuanNgoaiTam(q, { loai: 'da-cuoi' })
);
kiem('kết luận luôn thuộc ba câu đã duyệt', (CAU_NGOAI_TAM as readonly string[]).includes(cauKetLuanNgoaiTam(q, { loai: 'da-cuoi' })));

console.log('\n== CHIP ==');
for (const c of ['Anh ấy tên gì?', 'Có phải Hiếu không?', 'Chồng tôi có phải Nguyễn Duy Hiếu?', 'Tên thật của anh ấy?'])
  kiem(`chip ngoài tầm: "${c}"`, laChipNgoaiTam(c));
for (const c of ['Tôi hợp mẫu người thế nào?', 'Năm nay tình cảm ra sao?', 'Khi nào tôi cưới?'])
  kiem(`chip hợp lệ: "${c}"`, !laChipNgoaiTam(c));

console.log(hong ? `\n✗ ${hong} ca hỏng` : '\n✓ Ngoài tầm: tất cả ca đạt');
if (hong) process.exit(1);
