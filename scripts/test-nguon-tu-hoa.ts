/**
 * Sách tứ hoá chỉ làm nguồn cho câu vận hạn (chủ dự án quyết 31/10/2026) — lib/rag/nguon-tu-hoa.ts.
 * Hàm thuần: nhận sách theo tiêu đề, nhận câu nhắc tứ hoá, quyết quyền theo kế hoạch truy vấn thật
 * của planner. Không mạng, không DB.
 */
import { choNguonTuHoaTheoKeHoach, laSachTuHoa, nhacTuHoa } from '../lib/rag/nguon-tu-hoa';
import { lapKeHoach } from '../lib/rag/planner';
import { keThuaVanHan, laCauNoiRo } from '../lib/rag/van-han-qua-luot';
import type { TinNhan } from '../lib/ai/prompt';
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

// Câu hỏi về LÚC NÀY dù không nói mốc: "có nên…", có/không về một chuyện đời
for (const c of ['Có nên đổi việc không?', 'Tôi có nên mua nhà không?', 'Tôi có nhảy việc không?', 'Tôi có lấy được vợ không?'])
  kiem(quyen(c), `hỏi lúc này, dùng sách tứ hoá: ${c}`);
// Có/không về một sao, cung, cách cục: câu lá gốc
for (const c of ['Tử Vi ở Mệnh có tốt không?', 'Mệnh có Tuần có sao không?', 'Cung Tài Bạch của tôi có tốt không?'])
  kiem(!quyen(c), `có/không về lá số, KHÔNG dùng sách tứ hoá: ${c}`);

// Vận hạn qua lượt: câu nối không mốc nhận trục thời gian của câu gốc
kiem(laCauNoiRo('Vậy còn tình cảm?') && laCauNoiRo('Còn sức khoẻ?') && laCauNoiRo('Tình cảm thì sao?') && laCauNoiRo('thế còn tiền bạc'), 'nhận câu nối rõ ràng');
kiem(!laCauNoiRo('Tính tôi thế nào?') && !laCauNoiRo('Con tôi học thế nào?') && !laCauNoiRo('Con cái của tôi ra sao?'), 'câu ngắn / câu về con cái không phải câu nối');
const kh = (cauHoi: string) => lapKeHoach({ cauHoi, saoTheoCung, namXem: 2026, thangXem: 8 });
const ls = (...cau: string[]): TinNhan[] => cau.flatMap((c) => [{ vaiTro: 'nguoi-dung' as const, noiDung: c }, { vaiTro: 'tro-ly' as const, noiDung: '…' }]);
const luot = (cauHoi: string, lichSu: TinNhan[]) => keThuaVanHan(kh(cauHoi), cauHoi, lichSu, kh);
{
  const k = luot('Vậy còn tình cảm?', ls('Năm 2027 công việc của tôi thế nào?'));
  kiem(k.namMucTieu === 2027 && k.chuDe === 'tinh-cam' && choNguonTuHoaTheoKeHoach(k, 'Vậy còn tình cảm?'), '"Vậy còn tình cảm?" sau câu năm 2027: giữ năm 2027, chủ đề tình cảm, dùng sách tứ hoá');
  const k3 = luot('Còn sức khoẻ?', ls('Năm 2027 công việc của tôi thế nào?', 'Vậy còn tình cảm?'));
  kiem(k3.namMucTieu === 2027, 'chuỗi ba lượt vẫn giữ năm 2027');
  const kt = luot('Tính tôi thế nào?', ls('Năm 2027 công việc của tôi thế nào?'));
  kiem(kt.namMucTieu === undefined && !choNguonTuHoaTheoKeHoach(kt, 'Tính tôi thế nào?'), 'câu mới về tính cách KHÔNG nhận năm 2027');
  const kr = luot('Vậy còn năm 2028?', ls('Năm 2027 công việc của tôi thế nào?'));
  kiem(kr.namMucTieu === 2028, 'câu nối có mốc riêng thì giữ mốc riêng');
  const kg = luot('Vậy còn tình cảm?', ls('Tính cách của tôi thế nào?'));
  kiem(kg.namMucTieu === undefined && !choNguonTuHoaTheoKeHoach(kg, 'Vậy còn tình cảm?'), 'câu nối sau câu lá gốc: không thành vận hạn');
  const kb = luot('Vậy còn tính cách tôi thì sao?', ls('Năm 2027 công việc của tôi thế nào?'));
  kiem(kb.namMucTieu === undefined, 'câu nối hỏi bản tính KHÔNG nhận năm 2027');
  const cu = process.env.CELES_LOP_HAN;
  process.env.CELES_LOP_HAN = '0';
  kiem(luot('Vậy còn tình cảm?', ls('Năm 2027 công việc của tôi thế nào?')).namMucTieu === undefined, 'cờ tắt: không kế thừa, đúng đường cũ');
  if (cu === undefined) delete process.env.CELES_LOP_HAN; else process.env.CELES_LOP_HAN = cu;
}
// Có/không về bản tính, độ hợp: câu lá gốc dù không có thực thể
for (const c of ['Tôi có hợp làm kinh doanh không?', 'Tôi có duyên với nghề giáo không?'])
  kiem(!quyen(c), `có/không về bản tính, KHÔNG dùng sách tứ hoá: ${c}`);

// Luật tổ hợp: hai tập Tứ Hóa Phái là MỘT nhóm nguồn, không tự đứng làm "hai nguồn"
const nhom = (t: string) => NHOM_NGUON[`${t}.md`];
kiem(nhom(SACH_TU_HOA[0]) !== undefined && nhom(SACH_TU_HOA[0]) === nhom(SACH_TU_HOA[1]), 'hai tập Tứ Hóa Phái cùng một nhóm nguồn');
kiem(new Set(SACH_TU_HOA.map(nhom)).size === 3, 'bốn sách tứ hoá = ba nhóm nguồn');

console.log(loi ? `\nTRƯỢT: ${loi} lỗi` : '\nĐẠT');
if (loi) process.exitCode = 1;
