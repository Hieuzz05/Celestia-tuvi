/**
 * Bối cảnh người đọc + cấu hình luận giải — OFFLINE, không chạm DB, không gọi model.
 *
 *   npx tsx scripts/test-boi-canh-doc.ts
 *
 * Giữ ba luật:
 *  1. Bối cảnh chỉ vào khoá đệm của chủ đề dùng nó (Tình duyên, Con cái, Sự nghiệp) — chủ đề khác
 *     giữ nguyên khoá, không sinh lại bài của ai.
 *  2. "Không muốn nói" và "người ấy" không đổi khoá: bỏ qua chip là đọc đúng bài đã đệm.
 *  3. Khối gửi model luôn kèm luật "không đổi kết luận".
 * Cộng: cấu hình độ dài hỏng/vượt khoảng thì bị ép về khoảng hợp lệ.
 */
import { conThieu, khoaBoiCanh, khoiBoiCanh, lamSachBoiCanh } from '../lib/rag/v3/boi-canh-doc';
import { CAU_HINH_MAC_DINH, lamSachCauHinh } from '../lib/rag/v3/cau-hinh';

let loi = 0;
const kiem = (ten: string, dung: boolean) => {
  console.log(`${dung ? '✓' : '✗'} ${ten}`);
  if (!dung) loi++;
};

const cuoi = lamSachBoiCanh({ duyen: 'da-cuoi', xungHo: 'vo', con: 'da-co', viec: 'di-lam', la: 'x' });
kiem('lamSach bỏ trường lạ', !('la' in cuoi));
kiem('lamSach bỏ giá trị lạ', lamSachBoiCanh({ duyen: 'abc' }).duyen === undefined);
kiem('khoá Tình duyên có bối cảnh', khoaBoiCanh(cuoi, 'tinh-duyen') === '|bc:da-cuoi.vo');
kiem('khoá chủ đề không dùng bối cảnh giữ nguyên', khoaBoiCanh(cuoi, 'tien-bac') === '' && khoaBoiCanh(cuoi, 'tong-quan') === '');
kiem('"không muốn nói" không đổi khoá', khoaBoiCanh({ duyen: 'khong-noi' }, 'tinh-duyen') === '');
kiem('"người ấy" không đổi khoá', khoaBoiCanh({ duyen: 'dang-yeu', xungHo: 'nguoi-ay' }, 'tinh-duyen') === '|bc:dang-yeu');
kiem('độc thân thì xưng hô không vào khoá', khoaBoiCanh({ duyen: 'doc-than', xungHo: 'vo' }, 'tinh-duyen') === '|bc:doc-than');
kiem('chưa trả lời thì còn thiếu', conThieu({}, 'tinh-duyen').join() === 'duyen');
kiem('đã kết hôn mà chưa chọn xưng hô thì còn thiếu', conThieu({ duyen: 'da-cuoi' }, 'tinh-duyen').join() === 'xungHo');
kiem('độc thân thì không hỏi xưng hô', conThieu({ duyen: 'doc-than' }, 'tinh-duyen').length === 0);
kiem('chủ đề không dùng bối cảnh không hỏi gì', conThieu({}, 'suc-khoe').length === 0);
const khoi = khoiBoiCanh(cuoi, 'tinh-duyen');
kiem('khối model kèm luật không đổi kết luận', /KHÔNG đổi kết luận/.test(khoi));
kiem('khối model nêu cách gọi', /"vợ"/.test(khoi));
kiem('khối rỗng khi không có gì để nói', khoiBoiCanh({ duyen: 'khong-noi' }, 'tinh-duyen') === '');

const hong = lamSachCauHinh({ doDai: { 'chuyen-sau': { luan: [150, 280], muc: [100, 400], viSao: 'x', doan: [0, 99] } }, tranGoiY: 999 });
const cs = hong.doDai['chuyen-sau'];
kiem('cấu hình: "nên viết" vượt trần bị ép vào trong', cs.muc[0] >= cs.luan[0] && cs.muc[1] <= cs.luan[1]);
kiem('cấu hình: trường hỏng lấy mặc định', cs.viSao === CAU_HINH_MAC_DINH.doDai['chuyen-sau'].viSao && cs.doan === CAU_HINH_MAC_DINH.doDai['chuyen-sau'].doan);
kiem('cấu hình: trần gợi ý ngoài khoảng lấy mặc định', hong.tranGoiY === CAU_HINH_MAC_DINH.tranGoiY);
kiem('cấu hình: rỗng = mặc định', JSON.stringify(lamSachCauHinh(null)) === JSON.stringify(CAU_HINH_MAC_DINH));

console.log(loi ? `\n${loi} lỗi` : '\nĐủ.');
process.exit(loi ? 1 : 0);
