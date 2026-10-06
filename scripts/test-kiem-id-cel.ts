/**
 * Test offline cho máy canh ID CEL (scripts/kiem-id-cel.ts) — chỉ gọi hàm thuần, không đọc git.
 *   npx tsx scripts/test-kiem-id-cel.ts
 */
import { timXungDot, type BangId } from './kiem-id-cel';

let hong = 0;
const kiem = (ten: string, dung: boolean) => {
  console.log(`${dung ? '✓' : '✗'} ${ten}`);
  if (!dung) hong++;
};
const bang = (o: Record<string, string>): BangId => new Map(Object.entries(o));

// Ca 05/10/2026: nhánh này cấp CEL-194 cho nghiệm lý, main (N1) đã có CEL-194 hạn lưu nhật ký.
const toi = bang({ 'CEL-193': 'PRIV-01', 'CEL-194': 'Nghiệm lý của tôi', 'CEL-195': 'Phản hồi' });
const mainCo194 = bang({ 'CEL-192': 'Discovery', 'CEL-194': 'Hạn lưu nhật ký vận hành' });
let loi = timXungDot(toi, mainCo194, []);
kiem('trùng với main, khác tính năng → đỏ', loi.length === 1 && loi[0].startsWith('CEL-194') && loi[0].includes('Main giữ ID'));

// Hai nhánh cùng chưa gộp: N1 đã push CEL-194, nhánh này push sau.
loi = timXungDot(toi, bang({}), [{ ten: 'viec/priv-01', idMoi: bang({ 'CEL-194': 'Hạn lưu nhật ký vận hành' }) }]);
kiem('trùng với nhánh remote khác → đỏ, nêu tên nhánh', loi.length === 1 && loi[0].includes('viec/priv-01'));

// Cùng ID, cùng tính năng (nhánh tách ra từ nhánh kia, hoặc đã gộp main) → không tính.
loi = timXungDot(bang({ 'CEL-194': 'Nghiệm lý  của tôi' }), bang({ 'CEL-194': 'nghiệm lý của tôi' }), [
  { ten: 'viec/x', idMoi: bang({ 'CEL-194': 'Nghiệm lý của tôi' }) },
]);
kiem('cùng ID cùng tính năng (khác hoa thường / khoảng trắng) → xanh', loi.length === 0);

// Không có ID mới thì không có gì để trùng.
kiem('nhánh không cấp ID mới → xanh', timXungDot(bang({}), mainCo194, [{ ten: 'a', idMoi: toi }]).length === 0);

// ID mới khác hẳn → xanh.
kiem('ID mới không ai dùng → xanh', timXungDot(bang({ 'CEL-197': 'Máy canh ID' }), mainCo194, [{ ten: 'a', idMoi: toi }]).length === 0);

// Một ID hai dòng trong chính nhánh.
loi = timXungDot(bang({ 'CEL-197': 'X' }), bang({}), [], ['CEL-197']);
kiem('ID lặp trong Backlog của nhánh → đỏ', loi.length === 1 && loi[0].includes('hơn một lần'));

// Trùng cả main lẫn một nhánh → hai lỗi, không gộp mất lỗi nào.
loi = timXungDot(toi, mainCo194, [{ ten: 'b', idMoi: bang({ 'CEL-195': 'Việc khác' }) }]);
kiem('trùng main + trùng nhánh khác → báo đủ hai', loi.length === 2);

if (hong) {
  console.log(`\n${hong} ca hỏng`);
  process.exit(1);
}
console.log('\nĐẠT');
