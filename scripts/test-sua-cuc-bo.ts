/**
 * Kiểm tất định cho SỬA CỤC BỘ (lib/rag/v3/sua-cuc-bo.ts) — npx tsx scripts/test-sua-cuc-bo.ts
 * Không gọi model: chỉ kiểm phần chọn câu dính lỗi và ghép câu đã sửa về đúng chỗ.
 */
import { apCauSua, chonCauLoi, nhacSuaCucBo, suaCucBoDuoc } from '../lib/rag/v3/sua-cuc-bo';
import type { BaiV3, LoiV3 } from '../lib/rag/v3/kiem-v3';

let sai = 0;
const kiem = (ten: string, dung: boolean) => {
  if (!dung) sai++;
  console.log(`${dung ? 'ĐÚNG' : 'SAI '}  ${ten}`);
};

const bai: BaiV3 = {
  danY: [{ y: 'ý một', canCu: ['F001'] }],
  luanGiai: 'Bạn làm việc bền bỉ. Năng lượng của bạn dồn vào những việc dài hơi.\n\nKhi được giao quyền, bạn quyết nhanh. Đại vận này mở đường cho bạn.',
  viSao: 'Cung Quan Lộc có Thiên Phủ. Thiên Phủ chỉ sự giữ gìn.',
  goiY: 'Bạn có thể nhận một việc dài hạn.',
};
const loiCum: LoiV3[] = [
  { ma: 'tu-cam', moTa: 'Dùng từ cấm: "năng lượng".', chan: true, cum: ['năng lượng'] },
  { ma: 'thuat-ngu', moTa: 'Bài luận dùng thuật ngữ: đại vận.', chan: true, cum: ['đại vận'] },
  { ma: 'khuyen-chung', moTa: 'nhẹ', chan: false },
];

kiem('suaCucBoDuoc: mọi lỗi chặn có cụm → sửa cục bộ được', suaCucBoDuoc(loiCum));
kiem('suaCucBoDuoc: có lỗi chặn không khoanh được (độ dài) → không', !suaCucBoDuoc([...loiCum, { ma: 'do-dai', moTa: 'dài', chan: true }]));
kiem('suaCucBoDuoc: không có lỗi chặn → không', !suaCucBoDuoc([{ ma: 'x', moTa: 'nhẹ', chan: false }]));

const cau = chonCauLoi(bai, loiCum)!;
kiem('chonCauLoi: chọn đúng 2 câu dính lỗi', cau?.length === 2);
kiem('chonCauLoi: câu 1 là câu có "Năng lượng" (không phân biệt hoa thường)', cau[0].cau.startsWith('Năng lượng') && cau[0].id === 'luanGiai:0:1');
kiem('chonCauLoi: kèm câu trước làm ngữ cảnh', cau[0].truoc === 'Bạn làm việc bền bỉ.');
kiem('chonCauLoi: câu ở đoạn 2 mang đúng mã đoạn', cau[1].id === 'luanGiai:1:1');
kiem('chonCauLoi: cụm không nằm trong câu nào → null', chonCauLoi(bai, [{ ma: 'tu-cam', moTa: '', chan: true, cum: ['không có đâu'] }]) === null);

const moi = apCauSua(bai, new Map([['luanGiai:0:1', 'Sức lực của bạn dồn vào những việc dài hơi.'], ['luanGiai:1:1', 'Chặng mười năm này mở đường cho bạn.']]));
kiem('apCauSua: thay đúng câu, giữ nguyên câu khác và chỗ ngắt đoạn', moi.luanGiai === 'Bạn làm việc bền bỉ. Sức lực của bạn dồn vào những việc dài hơi.\n\nKhi được giao quyền, bạn quyết nhanh. Chặng mười năm này mở đường cho bạn.');
kiem('apCauSua: trường không có câu sửa giữ nguyên từng chữ', moi.viSao === bai.viSao && moi.goiY === bai.goiY && moi.danY === bai.danY);
kiem('apCauSua: id lạ bị bỏ qua', apCauSua(bai, new Map([['luanGiai:9:9', 'x']])).luanGiai === bai.luanGiai);

const vs = chonCauLoi(bai, [{ ma: 'sao-ngoai', moTa: '', chan: true, cum: ['Thiên Phủ'] }])!;
kiem('chonCauLoi: lỗi ở phần vì sao chọn câu trong viSao', vs.length === 2 && vs.every((c) => c.truong === 'viSao'));
kiem('nhacSuaCucBo: có mã câu và lời dặn giữ luật', /\[luanGiai:0:1\]/.test(nhacSuaCucBo(cau, loiCum)) && /không nêu tên sao/.test(nhacSuaCucBo(cau, loiCum)));

console.log(sai ? `\n${sai} CHỖ SAI` : '\nTẤT CẢ ĐỀU ĐÚNG');
process.exit(sai ? 1 : 0);
