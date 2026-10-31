/**
 * Sách tứ hoá chỉ làm nguồn cho câu vận hạn (chủ dự án quyết 31/10/2026) — lib/rag/nguon-tu-hoa.ts.
 * Hàm thuần: nhận sách theo tiêu đề, nhận câu nhắc tứ hoá, quyết quyền theo kế hoạch truy vấn thật
 * của planner. Không mạng, không DB.
 */
import { choNguonTuHoaTheoKeHoach, laSachTuHoa, nhacTuHoa } from '../lib/rag/nguon-tu-hoa';
import { lapKeHoach } from '../lib/rag/planner';
import { saoChinhTheoCung } from '../lib/rag/boi-canh-la-so';
import { lapLaSo } from '../lib/tuvi/ansao';
import { NHOM_NGUON } from '../lib/tuvi/luat-to-hop';

let loi = 0;
function kiem(dung: boolean, ten: string) {
  if (!dung) loi++;
  console.log(`${dung ? '  ✓' : '  ✗'} ${ten}`);
}

// Tiêu đề đúng như trong kho (knowledge_documents.tieu_de, nạp 26/10/2026)
const SACH_TU_HOA = [
  'Trung Châu Tử Vi Đẩu Số - Tứ Hóa Phái - Tập 1',
  'Trung Châu Tử Vi Đẩu Số - Tứ Hóa Phái - Tập 2',
  'Tử Vi Đẩu Số Tinh Thành - Tập 2',
  'Giáo Trình Phi Tinh Lương Phái',
];
const SACH_KHAC = [
  'Tử Vi đẩu số toàn thư - Vũ Tài Lục',
  'Chìa khóa tử vi',
  'Tử Vi ứng dụng - Chính Tinh',
  'Tử Vi ứng dụng - Phụ Tinh',
  'Tử Vi hàm số - Nguyễn Phát Lộc',
  'Tử Vi nghiệm lý toàn thư - Thiên Lương',
];
for (const t of SACH_TU_HOA) kiem(laSachTuHoa(t), `sách tứ hoá: ${t}`);
for (const t of SACH_KHAC) kiem(!laSachTuHoa(t), `không phải sách tứ hoá: ${t}`);

for (const c of ['Hóa Kỵ ở Mệnh nghĩa là gì?', 'tứ hoá năm sinh của tôi', 'phi hoá từ cung Quan', 'hoa loc o tai bach', 'Hoá Quyền nhập Phu Thê'])
  kiem(nhacTuHoa(c), `nhắc tứ hoá: ${c}`);
for (const c of ['Tôi có hay tự hoà giải mâu thuẫn không?', 'Tính tôi thế nào?', 'Phí hoá đơn tháng này', 'Tôi có hợp nghề hoạ sĩ không?', 'Hoa đào nở'])
  kiem(!nhacTuHoa(c), `không nhắc tứ hoá: ${c}`);

// Theo kế hoạch truy vấn thật: câu lá gốc thì không, câu có mốc thời gian thì có
const laSo = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 9, gioiTinh: 'nam' });
const saoTheoCung = saoChinhTheoCung(laSo);
const quyen = (cauHoi: string) => choNguonTuHoaTheoKeHoach(lapKeHoach({ cauHoi, saoTheoCung, namXem: 2026, thangXem: 8 }), cauHoi);
for (const c of ['Tính cách của tôi thế nào?', 'Tôi hợp với nghề gì?', 'Tôi yêu kiểu người nào?'])
  kiem(!quyen(c), `lá gốc, KHÔNG dùng sách tứ hoá: ${c}`);
for (const c of ['Năm 2026 công việc của tôi thế nào?', 'Năm nay tài chính ra sao?', 'Đại vận này tình cảm thế nào?', 'Tháng 3 âm năm nay sức khoẻ có gì cần lưu ý?', 'Khi nào tôi lập gia đình?', 'Sắp tới công việc có gì đổi không?'])
  kiem(quyen(c), `vận hạn, dùng sách tứ hoá: ${c}`);
kiem(quyen('Hóa Kỵ ở Mệnh nghĩa là gì?'), 'lá gốc nhưng nhắc tứ hoá: được dùng');

// Luật tổ hợp: hai tập Tứ Hóa Phái là MỘT nhóm nguồn, không tự đứng làm "hai nguồn"
const nhom = (t: string) => NHOM_NGUON[`${t}.md`];
kiem(nhom(SACH_TU_HOA[0]) !== undefined && nhom(SACH_TU_HOA[0]) === nhom(SACH_TU_HOA[1]), 'hai tập Tứ Hóa Phái cùng một nhóm nguồn');
kiem(new Set(SACH_TU_HOA.map(nhom)).size === 3, 'bốn sách tứ hoá = ba nhóm nguồn');

console.log(loi ? `\nTRƯỢT: ${loi} lỗi` : '\nĐẠT');
if (loi) process.exitCode = 1;
