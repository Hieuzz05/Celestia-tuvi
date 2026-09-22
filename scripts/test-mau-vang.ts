/**
 * Nghiệm thu kho mẫu vàng — npx tsx scripts/test-mau-vang.ts
 *
 * Chạy offline, không gọi model.
 *
 * Bộ này đo ba thứ, và cả ba đều là chỗ đã có người vấp:
 *
 *   1. KHO RỖNG PHẢI CHẠY ĐÚNG. Kho hiện đang rỗng và sẽ rỗng cho tới khi chủ
 *      dự án đổ mẫu vào (A2). Trong lúc đó mọi bề mặt vẫn phải sinh bài bình
 *      thường — một `undefined` lọt vào prompt là hỏng cả bài.
 *   2. CHỌN PHẢI ỔN ĐỊNH. Hai lần mở cùng một lá số phải ra cùng một bài; bốc
 *      mẫu ngẫu nhiên là phá đúng cam kết ấy.
 *   3. KHỐI MẪU PHẢI NÓI RÕ NÓ KHÔNG PHẢI DỮ KIỆN. Không có câu ấy thì model
 *      mượn luôn tên sao trong mẫu cho lá số đang viết — bịa dữ kiện mà nghe
 *      rất trôi chảy, kiểu sai đắt nhất ở đây.
 */

import { chonMauVang, khoiMauVang, KHO_VANG, SO_MAU_MOI_LUOT, type MauVang } from '../lib/rag/mau-vang';

let sai = 0;
function kiem(ten: string, dat: boolean, chiTiet?: unknown) {
  if (!dat) sai += 1;
  console.log(`  ${dat ? 'OK  ' : 'SAI '} ${ten}${!dat && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`);
}

console.log('\n== KHO RỖNG ==\n');
const khiRong = chonMauVang({ beMat: 'ban-doc-sau' });
kiem('Kho rỗng thì không chọn được mẫu nào', khiRong.length === 0, khiRong.length);
kiem('Khối mẫu rỗng là chuỗi rỗng, không phải undefined', khoiMauVang(khiRong) === '');
kiem(
  'Kho đang rỗng đúng như tài liệu nói (A2 chưa làm)',
  KHO_VANG.length === 0,
  `${KHO_VANG.length} mẫu — nếu đã đổ mẫu vào thì sửa lại dòng kiểm này`
);

console.log('\n== CHỌN MẪU (kho giả) ==\n');
const gia: MauVang[] = [
  { id: 'G1', beMat: 'ban-doc-sau', loai: 'day-du-kien', nhan: 'dữ kiện dày mà vẫn gọn', van: 'Bạn hay nhận phần quyết...' },
  { id: 'G2', beMat: 'ban-doc-sau', loai: 'thua-du-kien', nhan: 'lá số nói ít, viết ngắn và thành thật', van: 'Chỗ này lá số nói ít...' },
  { id: 'G3', beMat: 'ban-doc-sau', loai: 'khoi-guong', muc: 'menh', nhan: 'góc nhìn đảo', van: 'Nhìn từ phía ngược lại...' },
  { id: 'G4', beMat: 'chat', loai: 'day-du-kien', nhan: 'bề mặt khác', van: 'Không được chọn cho bản đọc sâu.' },
];
KHO_VANG.push(...gia);

const chonTheoLoai = chonMauVang({ beMat: 'ban-doc-sau', loai: ['thua-du-kien'], soLuong: 1 });
kiem('Chọn đúng loại được ưu tiên', chonTheoLoai[0]?.id === 'G2', chonTheoLoai.map((m) => m.id));

const chonTheoMuc = chonMauVang({ beMat: 'ban-doc-sau', loai: ['khoi-guong'], muc: ['menh'], soLuong: 1 });
kiem('Đúng loại và đúng phần đời thì đứng trước', chonTheoMuc[0]?.id === 'G3', chonTheoMuc.map((m) => m.id));

const khongLanBeMat = chonMauVang({ beMat: 'ban-doc-sau', soLuong: 9 });
kiem(
  'Không lấy mẫu của bề mặt khác',
  khongLanBeMat.every((m) => m.beMat === 'ban-doc-sau'),
  khongLanBeMat.map((m) => `${m.id}:${m.beMat}`)
);

const lan1 = chonMauVang({ beMat: 'ban-doc-sau', loai: ['day-du-kien'] }).map((m) => m.id);
const lan2 = chonMauVang({ beMat: 'ban-doc-sau', loai: ['day-du-kien'] }).map((m) => m.id);
kiem('Chọn ổn định giữa hai lần gọi', JSON.stringify(lan1) === JSON.stringify(lan2), [lan1, lan2]);

kiem(
  `Không trả quá ${SO_MAU_MOI_LUOT} mẫu khi không nói số lượng`,
  chonMauVang({ beMat: 'ban-doc-sau' }).length <= SO_MAU_MOI_LUOT
);
kiem('Xin 0 mẫu thì trả về rỗng', chonMauVang({ beMat: 'ban-doc-sau', soLuong: 0 }).length === 0);

console.log('\n== KHỐI DỰNG RA ==\n');
const khoi = khoiMauVang(chonMauVang({ beMat: 'ban-doc-sau', soLuong: 2 }));
kiem('Có cảnh báo mẫu KHÔNG phải dữ kiện', /KHÔNG phải dữ kiện/u.test(khoi));
kiem('Cấm mượn tên sao trong mẫu', /không mượn tên sao/iu.test(khoi));
kiem('Mỗi mẫu đi kèm lý do đáng học', khoi.includes('dữ kiện dày mà vẫn gọn'));
kiem('Có mốc đóng khối', khoi.includes('--- HẾT MẪU'));

KHO_VANG.length = 0;
console.log(sai === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG\n' : `\n${sai} MỤC SAI\n`);
process.exit(sai === 0 ? 0 : 1);
