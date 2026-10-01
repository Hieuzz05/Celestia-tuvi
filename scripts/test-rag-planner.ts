/**
 * Kiểm chứng planner, từ điển thực thể và validator — chạy: npx tsx scripts/test-rag-planner.ts
 *
 * Không gọi mạng, không cần Supabase: ba lớp này đều là luật thuần, nên phải
 * kiểm được offline. Lớp nào cần mạng mới kiểm được thì lớp đó đã sai chỗ.
 */

import { dungGoiBangChung, dungKhoiChoPrompt, LUAT_NGUON_NGAM } from '../lib/rag/bang-chung';
import { chonBoiCanh } from '../lib/rag/boi-canh-la-so';
import { docObjectJson } from '../lib/rag/doc-json';
import { demTenSao, laCauKeSao } from '../lib/rag/sua-chua';
import { chonBoiCanhHoiThoai, gomDieuTuKe, laCauNoiTiep } from '../lib/rag/tiep-noi';
import { kiemDuyet, locYHong } from '../lib/rag/kiem-duyet';
import { lapKeHoach } from '../lib/rag/planner';
import { cumVietHoa, tachTuKhoa } from '../lib/rag/cum-tu-khoa';
import { chonDaDang, doTrung, mucChacChan, NGUONG_TRUNG } from '../lib/rag/uu-tien-nguon';
import type { DoanUngVien } from '../lib/rag/truy-hoi';
import { conDuocDan } from '../lib/rag/thu-vien/cho-prompt';
import { dongBoTrongBoNho, type DoanTaiLieu } from '../lib/rag/thu-vien/dong-bo';
import type { MucThuVien } from '../lib/rag/thu-vien/kieu';
import { nhanDangThucThe, TEN_SAO_TRONG_TU_DIEN, TU_DIEN_THUC_THE, traThucThe } from '../lib/rag/thuc-the';
import { lapLaSo } from '../lib/tuvi/ansao';

let sai = 0;
function kiem(ten: string, dieuKien: boolean, thucTe?: unknown) {
  if (dieuKien) {
    console.log(`  OK   ${ten}`);
  } else {
    sai += 1;
    console.log(`  SAI  ${ten}${thucTe !== undefined ? ` — thực tế: ${JSON.stringify(thucTe)}` : ''}`);
  }
}

console.log(`\n== TỪ ĐIỂN THỰC THỂ (${TU_DIEN_THUC_THE.length} mục) ==`);
kiem('Hoá Kỵ viết không dấu tra được', traThucThe('hoa ky')?.id === 'TRANSFORMATION.HOA_KY');
kiem('Hoá Kỵ viết có dấu tra được', traThucThe('Hóa Kỵ')?.id === 'TRANSFORMATION.HOA_KY');
kiem('"công danh" ra cung Quan Lộc', traThucThe('công danh')?.id === 'PALACE.QUAN_LOC');
kiem('"lưu niên" ra PERIOD.LUU_NIEN', traThucThe('lưu niên')?.id === 'PERIOD.LUU_NIEN');
kiem('Tử Vi là chính tinh', traThucThe('Tử Vi')?.loai === 'STAR');

{
  const ds = nhanDangThucThe('Năm nay Hóa Kỵ ở cung quan lộc thì sao?');
  const ids = ds.map((t) => t.id);
  kiem('Nhận ra Hoá Kỵ trong câu', ids.includes('TRANSFORMATION.HOA_KY'), ids);
  kiem('Nhận ra Quan Lộc trong câu', ids.includes('PALACE.QUAN_LOC'), ids);
  kiem('Nhận ra mốc năm nay là lưu niên', ids.includes('PERIOD.LUU_NIEN'), ids);
}

// Từ điển phải phủ đúng những gì engine an được. Chạy engine trên nhiều can chi
// khác nhau để chạm tới cả Tứ Hóa lẫn các sao chỉ xuất hiện ở một số tuổi.
{
  const saoEngine = new Set<string>();
  for (let nam = 1984; nam <= 1995; nam++)
    for (const gio of [0, 5, 11, 17, 23])
      for (const gioiTinh of ['nam', 'nu'] as const)
        for (const thang of [1, 6, 12])
          for (const ngay of [1, 15, 28]) {
            const ls = lapLaSo({ ngay, thang, nam, gio, gioiTinh });
            for (const c of ls.cungs) {
              for (const sao of c.sao) saoEngine.add(sao.ten);
              if (c.trangSinh) saoEngine.add(c.trangSinh);
            }
          }
  const thieu = [...saoEngine].filter((x) => !TEN_SAO_TRONG_TU_DIEN.has(x));
  kiem(`Từ điển phủ hết ${saoEngine.size} sao engine an được`, thieu.length === 0, thieu);
}

console.log('\n== PLANNER ==');
{
  const k = lapKeHoach({ cauHoi: 'Năm nay tôi có nên đổi việc không?' });
  kiem('Chủ đề sự nghiệp', k.chuDe === 'su-nghiep', k.chuDe);
  kiem('Có Quan Lộc trong cung liên quan', k.cungLienQuan.includes('Quan Lộc'), k.cungLienQuan);
  kiem('Có Thiên Di trong cung liên quan', k.cungLienQuan.includes('Thiên Di'), k.cungLienQuan);
  kiem('Lớp hạn gồm lưu niên', k.lopHan.includes('luu-nien'), k.lopHan);
  kiem('Lớp hạn luôn có bản mệnh', k.lopHan.includes('ban-menh'), k.lopHan);
  kiem('Truy vấn nhắc tên cung', k.truyVan.includes('Quan Lộc'), k.truyVan);
}
{
  const k = lapKeHoach({ cauHoi: 'Chuyện tình cảm của tôi năm sau thế nào?' });
  kiem('Chủ đề tình cảm', k.chuDe === 'tinh-cam', k.chuDe);
  kiem('Cung đầu là Phu Thê', k.cungLienQuan[0] === 'Phu Thê', k.cungLienQuan);
}
{
  const k = lapKeHoach({ cauHoi: 'Sức khỏe tôi có gì đáng lo trong tháng này?' });
  kiem('Chủ đề sức khoẻ', k.chuDe === 'suc-khoe', k.chuDe);
  kiem('Lớp hạn gồm nguyệt hạn', k.lopHan.includes('nguyet-han'), k.lopHan);
}
{
  const k = lapKeHoach({ cauHoi: 'Cung Phu Thê của tôi ra sao?' });
  kiem('Gọi tên cung thì cung đó đứng đầu', k.cungLienQuan[0] === 'Phu Thê', k.cungLienQuan);
  kiem('Được đánh dấu là chắc chắn', k.chacChan);
}
{
  const k = lapKeHoach({ cauHoi: 'Cho tôi biết vài điều về tôi.' });
  kiem('Không tín hiệu thì về tổng quan', k.chuDe === 'tong-quan', k.chuDe);
  kiem('Và đánh dấu là không chắc chắn', !k.chacChan);
}

console.log('\n== BỐI CẢNH LÁ SỐ ==');
const laSo = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam', hoTen: 'Thử' });
const keHoach = lapKeHoach({ cauHoi: 'Năm nay tôi có nên đổi việc không?' });
const { duKien } = chonBoiCanh({ laSo, keHoach, namXem: 2026, thangXem: 9 });
kiem('Có dữ kiện', duKien.length > 0, duKien.length);
kiem('Mã chạy từ F001', duKien[0]?.id === 'F001', duKien[0]?.id);
kiem('Mã không trùng nhau', new Set(duKien.map((d) => d.id)).size === duKien.length);
kiem(
  'Có dữ kiện cho cung Quan Lộc',
  duKien.some((d) => d.cung === 'Quan Lộc'),
  duKien.map((d) => d.cung)
);
kiem(
  'Có lớp lưu niên',
  duKien.some((d) => d.loai === 'luu-nien'),
  duKien.map((d) => d.loai)
);
console.log(`  (${duKien.length} dữ kiện) ${duKien.map((d) => d.id).join(' ')}`);

console.log('\n== VALIDATOR ==');
const goi = dungGoiBangChung('Năm nay tôi có nên đổi việc không?', keHoach, duKien, []);
const maDauTien = duKien[0].id;
const saoThatSuCo = duKien.find((d) => d.cung === 'Quan Lộc')?.sao?.[0];

{
  const kq = kiemDuyet(
    {
      tomTat: 'Tóm tắt',
      yChinh: [{ tieuDe: 'A', noiDung: 'Một nhận định bình thường.', maDuKien: [maDauTien], maNguon: [] }],
    },
    goi
  );
  kiem('Ý có mã dữ kiện thật thì qua', kq.dat, kq.loi);
}
{
  const kq = kiemDuyet(
    { tomTat: 'x', yChinh: [{ tieuDe: 'B', noiDung: 'Nhận định.', maDuKien: ['F999'], maNguon: [] }] },
    goi
  );
  kiem('Mã dữ kiện bịa bị chặn', !kq.dat && kq.loi.some((l) => l.ma === 'du-kien-khong-ton-tai'), kq.loi);
}
{
  const kq = kiemDuyet(
    { tomTat: 'x', yChinh: [{ tieuDe: 'C', noiDung: 'Nhận định.', maDuKien: [], maNguon: ['E001'] }] },
    goi
  );
  kiem('Mã nguồn bịa bị chặn (gói không có nguồn nào)', !kq.dat && kq.loi.some((l) => l.ma === 'nguon-khong-ton-tai'), kq.loi);
}
{
  const kq = kiemDuyet(
    { tomTat: 'x', yChinh: [{ tieuDe: 'D', noiDung: 'Hãy giữ nhịp sinh hoạt đều đặn.', maDuKien: [], maNguon: [] }] },
    goi
  );
  kiem(
    'Lời khuyên đời thường không mã: chỉ cảnh báo, không chặn',
    kq.dat && kq.loi.some((l) => l.ma === 'khong-can-cu' && l.mucDo === 'canh-bao'),
    kq.loi
  );
}
{
  const kq = kiemDuyet(
    {
      tomTat: 'x',
      yChinh: [{ tieuDe: 'D2', noiDung: 'Tử Vi thủ mệnh nên bạn có uy.', maDuKien: [], maNguon: [] }],
    },
    goi
  );
  kiem(
    'Khẳng định chuyên môn không mã thì bị chặn',
    !kq.dat && kq.loi.some((l) => l.ma === 'khang-dinh-chuyen-mon-khong-can-cu'),
    kq.loi
  );
}
{
  // Bỏ hết ý thì giữ nguyên bài — xem ghi chú trong locYHong
  const traLoi = {
    tomTat: 'x',
    yChinh: [{ tieuDe: 'E0', noiDung: 'Tử Vi thủ mệnh nên bạn có uy.', maDuKien: [], maNguon: [] }],
  };
  const kq = kiemDuyet(traLoi, goi);
  const { traLoi: sau, soYBiBo } = locYHong(traLoi, kq);
  kiem('Khi mọi ý đều hỏng thì không trả về bài rỗng', sau.yChinh.length === 1 && soYBiBo === 0, {
    conLai: sau.yChinh.length,
    soYBiBo,
  });
}
{
  // Chọn một sao chắc chắn KHÔNG có trong dữ kiện để thử phát hiện bịa sao
  const tatCaSao = new Set(duKien.flatMap((d) => d.sao ?? []));
  const saoBia = ['Thiên Riêu', 'Đào Hoa', 'Hồng Loan', 'Thiên Hình'].find((s) => !tatCaSao.has(s));
  if (saoBia) {
    const kq = kiemDuyet(
      {
        tomTat: 'x',
        yChinh: [
          { tieuDe: 'E', noiDung: `${saoBia} đóng ở đây nên phải cẩn thận.`, maDuKien: [maDauTien], maNguon: [] },
        ],
      },
      goi
    );
    kiem(
      `Sao bịa (${saoBia}) bị chặn`,
      !kq.dat && kq.loi.some((l) => l.ma === 'sao-khong-co-trong-du-lieu'),
      kq.loi
    );
  }
}
if (saoThatSuCo) {
  const kq = kiemDuyet(
    {
      tomTat: 'x',
      yChinh: [
        { tieuDe: 'F', noiDung: `${saoThatSuCo} tại Quan Lộc cho thấy điều này.`, maDuKien: [maDauTien], maNguon: [] },
      ],
    },
    goi
  );
  kiem(`Sao có thật (${saoThatSuCo}) không bị chặn`, kq.dat, kq.loi);
  kiem(
    'Nhưng bị cảnh báo vì diễn giải không nguồn',
    kq.loi.some((l) => l.ma === 'dien-giai-khong-nguon'),
    kq.loi
  );
}

// ---- Bộ đọc JSON dùng chung ----
console.log('\n== ĐỌC JSON CỦA MODEL ==\n');
{
  kiem('Object thường đọc được', docObjectJson('{"a":1}')?.a === 1);
  kiem('Có rào code vẫn đọc được', docObjectJson('```json\n{"a":1}\n```')?.a === 1);
  kiem('Có lời dẫn trước sau vẫn đọc được', docObjectJson('Đây:\n{"a":1}\nHết.')?.a === 1);

  // Kiểu hỏng đã gặp thật trên gpt-5.4-mini: đóng object sớm rồi mở object mới
  const dongSom = docObjectJson('{"baDieu":["x"],"cauTruc":{"noiDung":"y"}},{"ghepLai":"z"}');
  kiem('Đóng ngoặc sớm rồi viết tiếp: gộp lại được', dongSom !== null && dongSom.ghepLai === 'z', dongSom);
  kiem('Gộp xong không mất phần đầu', Array.isArray(dongSom?.baDieu), dongSom?.baDieu);

  kiem('Không có object nào thì trả null', docObjectJson('chỉ là chữ') === null);
  kiem('Cắt giữa chừng thì trả null, không đoán bừa', docObjectJson('{"a":1,"b":') === null);
  kiem('Mảng ở ngoài cùng không bị nhận nhầm là object', docObjectJson('[1,2,3]') === null);
}

// ---- Đếm tên sao trong một câu ----
console.log('\n== ĐẾM TÊN SAO ĐỂ BẮT CÂU KÊ SAO ==\n');
{
  const keSao = 'Thể hiện qua Vũ Khúc và Thiên Phủ trong cung Mệnh.';
  const motSao = 'Vũ Khúc ở Mệnh cho cách nhìn thực tế.';
  kiem('Câu không có sao thì đếm 0', demTenSao('Bạn quyết nhanh và ít khi đổi ý.') === 0);
  kiem('Một tên sao đếm 1', demTenSao(motSao) === 1);
  kiem('Hai tên sao đếm 2 và bị coi là kê sao', demTenSao(keSao) === 2 && laCauKeSao(keSao));
  kiem(
    'Nhắc lại cùng một sao không tính thành hai',
    demTenSao('Vũ Khúc ở đây, và cũng chính Vũ Khúc làm nên nét ấy.') === 1
  );
  kiem('Một tên sao KHÔNG bị coi là kê sao', !laCauKeSao(motSao));
}

// ---- Trí nhớ hội thoại (§12.5) ----
console.log('\n== TRÍ NHỚ HỘI THOẠI ==\n');
{
  const ls: { vaiTro: 'nguoi-dung' | 'tro-ly'; noiDung: string }[] = [
    { vaiTro: 'nguoi-dung', noiDung: 'Tôi đang làm kế toán ở một công ty xây dựng.' },
    { vaiTro: 'tro-ly', noiDung: 'Celes đoán rằng bạn đang cân nhắc đổi nghề sang thiết kế.' },
    { vaiTro: 'nguoi-dung', noiDung: 'Nếu tôi nghỉ việc thì sao? Tôi muốn ổn định hơn.' },
  ];

  const tuKe = gomDieuTuKe(ls);
  kiem('Nhặt được điều người dùng tự kể', tuKe.some((d) => d.includes('kế toán')), tuKe);
  kiem(
    'KHÔNG nhặt suy đoán của Celes thành điều người dùng nói',
    !tuKe.some((d) => d.includes('thiết kế')),
    tuKe
  );
  kiem('Bỏ câu giả định, không cất thành sự thật', !tuKe.some((d) => d.includes('nghỉ việc')), tuKe);
  kiem('Vẫn nhặt được mong muốn nói thẳng', tuKe.some((d) => d.includes('ổn định')), tuKe);

  kiem('Câu ngắn sau một câu trả lời là câu nối', laCauNoiTiep('Vì sao vậy?', ls));
  kiem('Đại từ trỏ ngược là câu nối', laCauNoiTiep('Điều đó ảnh hưởng gì tới công việc?', ls));
  kiem(
    'Câu mở chủ đề mới KHÔNG phải câu nối',
    !laCauNoiTiep('Tình duyên của tôi năm nay có gì đáng chú ý không?', ls)
  );
  kiem('Chưa có lượt nào của Celes thì không thể là câu nối', !laCauNoiTiep('Vì sao vậy?', []));

  // Cửa sổ nâng 1 → 3 cặp ngày 27/09/2026 (xem tiep-noi.ts SO_CAP_GIU_KHI_NOI_TIEP) — bài kiểm
  // "quên ngữ cảnh từ lượt thứ ba" cho thấy giữ đúng 1 cặp là không đủ. `ls` chỉ có 3 tin nhắn
  // nên cửa sổ 3 cặp (6 tin nhắn) lấy trọn cả ba, không cắt bớt.
  const bcNoi = chonBoiCanhHoiThoai('Vì sao vậy?', ls);
  kiem('Câu nối thì giữ mạch đang nói', bcNoi.machDangNoi.length === ls.length);
  const bcMoi = chonBoiCanhHoiThoai('Tình duyên của tôi năm nay thế nào?', ls);
  kiem('Câu mở chủ đề mới thì KHÔNG kéo mạch cũ sang', bcMoi.machDangNoi.length === 0);
  kiem('Nhưng vẫn giữ điều người dùng tự kể', bcMoi.dieuTuKe.length > 0);

  /*
   * BUG THẬT (27/09/2026): chủ dự án báo — hỏi câu 1, bấm chip gợi ý của Celes (lượt 2) thì Celes
   * còn nhớ ngữ cảnh; bấm tiếp chip gợi ý thứ hai (lượt 3) thì QUÊN, dù câu trả lời vẫn đúng nghĩa
   * đen. Gốc: (a) nhiều chip hợp lệ là câu hỏi trọn vẹn trên 5 từ, không đại từ trỏ ngược — bị
   * `laCauNoiTiep` xếp nhầm là "chủ đề mới" ngay từ lượt nó được hỏi; (b) cửa sổ cũ chỉ giữ 1 cặp,
   * nên dù được nhận đúng là câu nối, tới lượt 3 thì câu hỏi GỐC ở lượt 1 đã rơi khỏi cửa sổ.
   * Sửa bằng cờ `laTiepTuChip` (client biết chắc — không cần đoán) + cửa sổ rộng hơn (SO_CAP_GIU_KHI_NOI_TIEP).
   */
  const hoi1 = { vaiTro: 'nguoi-dung' as const, noiDung: 'Sự nghiệp của tôi năm nay thế nào?' };
  const dap1 = { vaiTro: 'tro-ly' as const, noiDung: 'Năm nay nghiêng về giữ vị trí hơn là chuyển...' };
  // Chip hợp lệ theo đúng luật goiYTiep (viết như lời người dùng gõ) — KHÔNG khớp dấu hiệu nào của
  // laCauNoiTiep, đây chính là chip đã gây lỗi.
  const chip1 = 'Vậy tôi có nên chuyển việc trong năm nay không?';
  kiem('BUG GỐC (đối chứng): chip hợp lệ vẫn bị đoán nhầm là "chủ đề mới" nếu chỉ xét chữ', !laCauNoiTiep(chip1, [hoi1, dap1]));
  const bcChip1KhongCo = chonBoiCanhHoiThoai(chip1, [hoi1, dap1]);
  kiem('BUG GỐC (đối chứng): không có cờ, chip mất trắng ngữ cảnh dù mới ở lượt 2', bcChip1KhongCo.machDangNoi.length === 0);

  const bcChip1 = chonBoiCanhHoiThoai(chip1, [hoi1, dap1], true);
  kiem('Cờ laTiepTuChip: chip được nhận là câu nối bất kể chữ', bcChip1.noiTiep);
  kiem('Cờ laTiepTuChip: thấy đúng cặp hỏi1/đáp1 ngay trước nó', bcChip1.machDangNoi.length === 2 && bcChip1.machDangNoi[0] === hoi1);

  const dap2 = { vaiTro: 'tro-ly' as const, noiDung: 'Nghiêng về giữ lại hơn, vì tiểu hạn năm nay có Hóa Kỵ...' };
  const chip2 = 'Nếu công ty mới trả lương cao hơn thì có đáng để chuyển không?';
  const lichSuLuot3 = [hoi1, dap1, { vaiTro: 'nguoi-dung' as const, noiDung: chip1 }, dap2];
  const bcChip2 = chonBoiCanhHoiThoai(chip2, lichSuLuot3, true);
  kiem(
    'Lượt 3 (chip2): cửa sổ rộng hơn vẫn thấy CÂU HỎI GỐC ở lượt 1 — không còn "quên ngữ cảnh"',
    bcChip2.machDangNoi.includes(hoi1) && bcChip2.machDangNoi.includes(dap1)
  );
  kiem('Lượt 3 (chip2): vẫn thấy cặp ngay trước nó', bcChip2.machDangNoi.includes(dap2));

  // Kéo dài ghi nhớ (27/09/2026): điều tự kể ở lượt xa vẫn được nhớ, không chỉ vài ba lượt —
  // và trần đồng thời đã nâng 5 → 8.
  const phienDai = [{ vaiTro: 'nguoi-dung' as const, noiDung: 'Tôi đang làm việc ở một công ty phần mềm.' }];
  for (let i = 1; i <= 25; i++) {
    phienDai.push(
      { vaiTro: 'tro-ly' as const, noiDung: `Đáp ${i}...` } as never,
      { vaiTro: 'nguoi-dung' as const, noiDung: `Câu hỏi phụ số ${i}, không có gì đáng nhớ.` }
    );
  }
  kiem('Kéo dài ghi nhớ: nhớ được sự việc kể cách đây 25 lượt (51 tin nhắn)', gomDieuTuKe(phienDai).some((d) => d.includes('phần mềm')));
  const muoiSuViec = Array.from({ length: 10 }, (_, i) => ({
    vaiTro: 'nguoi-dung' as const,
    noiDung: `Lương của tôi hồi thứ ${i} là ${10 + i} triệu một tháng.`,
  }));
  const tamChuyenGanNhat = gomDieuTuKe(muoiSuViec, 8);
  kiem('Kéo dài ghi nhớ: trần đồng thời đã nâng 5 → 8', tamChuyenGanNhat.length === 8);
  kiem('Kéo dài ghi nhớ: vượt trần thì giữ chuyện MỚI NHẤT, không giữ chuyện đầu tiên', !tamChuyenGanNhat.some((d) => d.includes('thứ 0')));
}

console.log('\n== CỤM TỪ KHOÁ ==');
{
  kiem(
    'Cụm viết hoa: tên cách cục',
    cumVietHoa('Linh Xương Đà Vũ là cách gì?').includes('Linh Xương Đà Vũ'),
    cumVietHoa('Linh Xương Đà Vũ là cách gì?')
  );
  kiem(
    'Cụm viết hoa: bỏ chữ "Sao" đầu câu',
    cumVietHoa('Sao Thiên Cơ ở Mệnh nói gì?').includes('Thiên Cơ'),
    cumVietHoa('Sao Thiên Cơ ở Mệnh nói gì?')
  );
  kiem(
    'Dấu câu cắt cụm',
    !cumVietHoa('Thiên Cơ, Thái Âm').some((c) => c.includes(',') || c === 'Thiên Cơ Thái Âm'),
    cumVietHoa('Thiên Cơ, Thái Âm')
  );
  kiem('Gõ toàn chữ thường thì không bịa ra cụm', cumVietHoa('thiên cơ ở mệnh').length === 0);

  const t = tachTuKhoa('Thiên Cơ dị bào Mệnh', ['Thiên Cơ']);
  kiem('Âm tiết đã vào cụm không đứng lẻ nữa', !/thiên|cơ/i.test(t.tuLe), t);
  kiem('Từ lẻ còn lại được giữ', t.tuLe.includes('dị') && t.tuLe.includes('Mệnh'), t);
  kiem('Cụm một âm tiết không tính là cụm', tachTuKhoa('Mệnh', ['Mệnh']).cum.length === 0);
  const tg = tachTuKhoa('Linh Xương Đà Vũ Thiên Cơ', ['Linh Xương Đà Vũ', 'Thiên Cơ'], ['Thiên Cơ']);
  kiem(
    'Cụm người dùng gõ vẫn giữ âm tiết lẻ làm lưới đỡ, tên trong từ điển thì bỏ',
    tg.cum.length === 2 && /Xương/.test(tg.tuLe) && !/Thiên|Cơ/.test(tg.tuLe),
    tg
  );

  const kh = lapKeHoach({ cauHoi: 'Thiên La Địa Võng nằm ở cung nào?' });
  kiem(
    'Planner đưa cụm viết hoa vào cumTuKhoa',
    kh.cumTuKhoa?.includes('Thiên La Địa Võng') ?? false,
    kh.cumTuKhoa
  );
  const khCc = lapKeHoach({ cauHoi: 'công việc của tôi thế nào', tenCachCuc: ['Cơ Nguyệt Đồng Lương'] });
  kiem('Planner đưa tên cách cục vào cumTuKhoa', khCc.cumTuKhoa?.includes('Cơ Nguyệt Đồng Lương') ?? false, khCc.cumTuKhoa);
}

console.log('\n== ĐOẠN TRÙNG GIỮA CÁC TÀI LIỆU ==');
{
  const PHU =
    'Cự Cơ đồng cung tại Mão Dậu, người có tài ăn nói, lý luận sắc bén, anh chị em dị bào, thường cùng mẹ khác cha.';
  const doan = (id: string, doc: string, noiDung: string, muc = 'tham-khao', diem = 0.03): DoanUngVien => ({
    chunkId: id,
    documentId: doc,
    versionId: `v-${doc}`,
    noiDung,
    duongDeMuc: null,
    tieuDe: doc,
    hePhai: 'chung',
    mucTinCay: muc,
    phienBanTaiLieu: '1',
    diemRRF: diem,
    duocChon: false,
    an: false,
  });

  kiem('Cùng câu phú, khác chỗ cắt đoạn → trùng', doTrung(PHU, `Cung Huynh Đệ. ${PHU} Xét thêm Hoá Kỵ.`) >= NGUONG_TRUNG);
  kiem(
    'Chồng lấn 150 ký tự giữa hai đoạn liền nhau → KHÔNG trùng',
    doTrung(
      'Tử Vi là đế tinh, chủ về quyền uy và khả năng lãnh đạo. Gặp Tả Hữu thì được người phò tá, làm việc lớn dễ thành. ' +
        'Gặp Kình Đà thì quyền bị cản, người dưới khó theo. ' +
        PHU.slice(0, 60),
      PHU.slice(0, 60) +
        ' Thái Dương miếu vượng ở Ngọ thì sáng sủa rộng rãi, làm việc công khai, được tiếng tốt. Hãm ở Tý thì vất vả, hay lo cho người khác.'
    ) < NGUONG_TRUNG
  );
  kiem('Đoạn quá ngắn không so được thì không coi là trùng', doTrung('Tử Vi', 'Tử Vi') === 0);

  const ds = [
    doan('a1', 'sach-A', PHU, 'tham-khao', 0.033),
    doan('b1', 'sach-B', `Phú rằng: ${PHU}`, 'tham-khao', 0.032),
    doan('c1', 'sach-C', `${PHU} Nên xét thêm cung Phụ Mẫu.`, 'tham-khao', 0.031),
    doan('d1', 'sach-D', 'Thiên Đồng ở Huynh Đệ thì anh em hoà thuận, ít tranh chấp, hay giúp đỡ nhau.', 'tham-khao', 0.03),
  ];
  const chon = chonDaDang(ds, 6);
  kiem('Ba bản chép chỉ giữ một', chon.filter((u) => u.noiDung.includes('dị bào')).length === 1, chon.map((u) => u.chunkId));
  kiem('Bản giữ lại là bản đứng trước', chon[0].chunkId === 'a1');
  kiem('Bản bị bỏ ghi rõ trùng với ai', ds[1].trungVoi === 'a1' && ds[2].trungVoi === 'a1');
  kiem('Đoạn khác nội dung vẫn vào gói', chon.some((u) => u.chunkId === 'd1'));
  kiem('Kho ít đoạn cũng không lấp bản chép vào', chon.length === 2, chon.length);
  kiem(
    'Đồng thuận giả không còn: ba cuốn chép một câu là MỘT tiếng nói',
    mucChacChan(chon.filter((u) => u.noiDung.includes('dị bào'))) === 'yeu'
  );
}

console.log('\n== NGUỒN LUẬT NGẦM TRONG PROMPT ==');
{
  const goc: DoanUngVien = {
    chunkId: 'n1',
    documentId: 'ghi-chu-X',
    versionId: 'v-X',
    noiDung: 'Thất Sát gặp Lộc Tồn thì nên giữ tiền, chưa vội mở rộng.',
    duongDeMuc: 'Ghi chú của thầy X — tiền bạc',
    tieuDe: 'Sổ tay thầy X',
    hePhai: 'chung',
    mucTinCay: 'chuyen-gia',
    phienBanTaiLieu: '1',
    diemRRF: 0.03,
    duocChon: true,
    an: true,
  };
  const sach: DoanUngVien = { ...goc, chunkId: 's1', documentId: 'sach-A', duongDeMuc: 'Cung Tài Bạch', tieuDe: 'Sách A', an: false };

  const khoiNgam = dungKhoiChoPrompt(dungGoiBangChung('Tiền bạc năm nay?', keHoach, duKien, [goc, sach]));
  kiem('Nguồn ngầm mang nhãn LUẬT NGẦM', khoiNgam.includes('LUẬT NGẦM N1'));
  kiem('Nguồn ngầm không lộ đề mục / tên tài liệu', !khoiNgam.includes('thầy X'));
  kiem('Nguồn công khai vẫn đánh mã T#', khoiNgam.includes('tài liệu T1 · mục "Cung Tài Bạch"'));
  kiem('Có nguồn ngầm thì chèn luật nguồn ngầm', khoiNgam.includes(LUAT_NGUON_NGAM));

  const khoiSach = dungKhoiChoPrompt(dungGoiBangChung('Tiền bạc năm nay?', keHoach, duKien, [sach]));
  kiem('Không có nguồn ngầm thì không chèn luật đó', !khoiSach.includes(LUAT_NGUON_NGAM));
}

console.log('\n== THƯ VIỆN ĐỒNG BỘ VỚI BẢN XUẤT BẢN ==');
{
  const A = 'Tử Vi là đế tinh, chủ về quyền uy và khả năng lãnh đạo, gặp Tả Hữu thì được người phò tá.';
  const B = 'Thái Dương miếu vượng ở Ngọ thì sáng sủa rộng rãi, làm việc công khai, được tiếng tốt.';
  const C = 'Thất Sát gặp Lộc Tồn thì nên giữ tiền, chưa vội mở rộng việc làm ăn.';
  const doanTL: DoanTaiLieu[] = [
    { id: 'c1', versionId: 'v1', thuTu: 1, noiDung: A, hoatDong: true },
    { id: 'c2', versionId: 'v1', thuTu: 2, noiDung: B, hoatDong: true },
    { id: 'c3', versionId: 'v1', thuTu: 3, noiDung: C, hoatDong: true },
    { id: 'n1', versionId: 'v2', thuTu: 1, noiDung: A, hoatDong: true },
    // B được biên tập lại nhưng câu trích vẫn nguyên văn; C bị bỏ khỏi bản mới
    { id: 'n2', versionId: 'v2', thuTu: 2, noiDung: `Bản hiệu đính. ${B} Thêm một ý mới về Thái Âm.`, hoatDong: true },
    { id: 'n3', versionId: 'v2', thuTu: 3, noiDung: 'Phần hoàn toàn mới về Thiên Đồng ở cung Phúc Đức.', hoatDong: true },
  ];
  const muc = (id: string, canCu: MucThuVien['canCu'], them: Partial<MucThuVien> = {}): MucThuVien => ({
    id,
    schemaVersion: 1,
    chuDe: ['su-nghiep'],
    dieuKien: { cung: [], sao: [{ ten: 'Tử Vi', quanHe: 'o-cung' }] },
    y: 'Một câu nghĩa.',
    nhan: { chieu: 'cat', muc: 'vua', linhVuc: ['su-nghiep'] },
    cheDo: 'add',
    canCu,
    truongPhai: 'chung',
    duyet: 'chua',
    dotTrich: 'sn-1',
    ...them,
  });
  const goi = () => [
    {
      dot: 'sn-1',
      ds: [
        muc('m1', [{ chunkId: 'c1', documentId: 'D', trich: 'Tử Vi là đế tinh, chủ về quyền uy' }]),
        muc('m2', [{ chunkId: 'c2', documentId: 'D', trich: 'Thái Dương miếu vượng ở Ngọ thì sáng sủa rộng rãi' }]),
        muc('m3', [{ chunkId: 'c3', documentId: 'D', trich: 'Thất Sát gặp Lộc Tồn thì nên giữ tiền' }]),
        muc('m4', [
          { chunkId: 'c3', documentId: 'D', trich: 'Thất Sát gặp Lộc Tồn thì nên giữ tiền' },
          { chunkId: 'x9', documentId: 'E', trich: 'câu của một sách khác vẫn còn nguyên' },
        ]),
        muc('m5', [{ chunkId: 'x8', documentId: 'E', trich: 'câu lật lại ý của m3 trong sách khác' }], { cheDo: 'override', dich: ['m3'] }),
        muc('m6', [{ chunkId: 'n1', documentId: 'D', versionId: 'v2', trich: 'Tử Vi là đế tinh, chủ về quyền uy' }]),
        muc('m7', [{ chunkId: 'x7', documentId: 'E', trich: 'câu hoá giải cả m3 lẫn m1' }], { cheDo: 'neutralize', dich: ['m3', 'm1'] }),
        muc('m8', [{ chunkId: 'c1', documentId: 'D', versionId: 'v1', trich: 'Tử Vi là đế tinh, chủ về quyền uy' }]),
      ],
    },
  ];

  const g = goi();
  const { ketQua, thayDoi } = dongBoTrongBoNho(g, 'D', doanTL, 'v2');
  const ds = g[0].ds;
  const lay = (id: string) => ds.find((m) => m.id === id);
  kiem('Đoạn còn nguyên văn → dời theo dấu băm', lay('m1')?.canCu[0].chunkId === 'n1' && lay('m1')?.canCu[0].versionId === 'v2');
  kiem('Đoạn bị biên tập mà câu trích còn → tìm thấy trong bản mới', lay('m2')?.canCu[0].chunkId === 'n2');
  kiem('Câu trích không còn trong bản mới → mục hết căn cứ bị bỏ', !lay('m3'));
  kiem('Mục mất MỘT câu trích → bỏ cả mục, không giữ câu nghĩa trên căn cứ thiếu', !lay('m4'));
  kiem('Mục lật mà mọi đích đã bỏ → bỏ luôn, không đứng riêng thành add', !lay('m5'));
  kiem('Mục lật còn đích → chỉ gỡ đích đã bỏ', lay('m7')?.dich?.join() === 'm1' && lay('m7')?.cheDo === 'neutralize');
  kiem('Câu trích đã ở bản mới thì không ghi lại', !thayDoi.get('sn-1')?.doi.some((m) => m.id === 'm6'));
  kiem('Đếm đúng', ketQua.doiCho === 3 && ketQua.go === 2 && ketQua.boMuc === 3 && ketQua.giuNguyen === 1, ketQua);
  kiem('Dòng bỏ khớp với gói', thayDoi.get('sn-1')?.xoa.join() === 'm3,m4,m5');
  {
    // Câu trích ngắn không được tìm nguyên văn trên cả bản: dễ dính sang đoạn khác ngữ cảnh
    const g3 = [{ dot: 'x', ds: [muc('k1', [{ chunkId: 'c9', documentId: 'D', trich: 'giữ tiền' }])] }];
    dongBoTrongBoNho(g3, 'D', [...doanTL, { id: 'c9', versionId: 'v1', thuTu: 40, noiDung: 'Một đoạn cũ: giữ tiền.', hoatDong: true }], 'v2');
    kiem('Câu trích ngắn, đoạn cũ đã mất → không khớp bừa', !g3[0].ds.length);
  }

  const g2 = goi();
  dongBoTrongBoNho(g2, 'D', [], null);
  kiem('Xoá hẳn tài liệu → không còn câu trích nào của nó', !g2[0].ds.some((m) => m.canCu.some((c) => c.documentId === 'D')));
  kiem('Xoá hẳn tài liệu → mục lật trỏ vào mục đã bỏ cũng đi theo', !g2[0].ds.some((m) => m.id === 'm5' || m.id === 'm7'));

  const meta = (banD: string[]) =>
    new Map([
      ['D', { mucTinCay: 'tham-khao', loaiNguon: 'sach', dangXuatBan: banD.length > 0, banXuatBan: banD }],
      ['E', { mucTinCay: 'tham-khao', loaiNguon: 'sach', dangXuatBan: true, banXuatBan: ['e1'] }],
    ]);
  const conLai = conDuocDan(goi()[0].ds, meta([]));
  kiem('Tài liệu bị lưu trữ → mục dẫn nó không vào prompt, kể cả mục dẫn kèm sách khác', !conLai.some((m) => ['m1', 'm4'].includes(m.id)));
  kiem('Tài liệu bị lưu trữ → mục lật mất hết đích cũng không vào', conLai.map((m) => m.id).join() === '');
  const theoBan = conDuocDan(goi()[0].ds, meta(['v2'])).map((m) => m.id);
  kiem('Câu trích trỏ bản đã bị thay (đồng bộ chưa xong) → mục không vào', !theoBan.includes('m8') && theoBan.includes('m6'));
  kiem('Câu trích chưa ghi bản → vẫn vào (thư viện dựng trước 01/10)', theoBan.includes('m1'));
  kiem('Đọc kho hỏng (meta rỗng) → giữ nguyên thư viện', conDuocDan(goi()[0].ds, new Map()).length === 8);
}

console.log(sai === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG\n' : `\n${sai} KIỂM TRA SAI\n`);
process.exit(sai === 0 ? 0 : 1);
