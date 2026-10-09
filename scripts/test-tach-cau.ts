/**
 * Test offline cho `lib/tach-cau.ts` — npx tsx scripts/test-tach-cau.ts
 *
 * Canh đúng MỘT thứ, nhưng là thứ quan trọng nhất: hàm này CẮT chứ không VIẾT
 * LẠI. Ghép `cauDau + conLai` phải ra lại đúng chữ gốc. Nếu một hôm ai đó
 * "rút gọn cho đẹp" bằng cách bỏ bớt chữ, bài này đỏ — vì bỏ chữ của bản luận
 * là bịa luận giải, thứ luật dự án cấm.
 *
 * Chạy thêm trên nội dung THẬT do engine sinh (`docNhanh`) chứ không chỉ trên
 * câu bịa: khuôn câu thật mới là thứ hàm này gặp khi chạy.
 */
import { tachCauDau } from '../lib/tach-cau';
import { lapLaSo } from '../lib/tuvi/ansao';
import { docNhanh } from '../lib/tuvi/quick-read';

let hong = 0;
const kiem = (ten: string, dung: boolean) => {
  console.log(`${dung ? '✓' : '✗'} ${ten}`);
  if (!dung) hong++;
};

const chuan = (s: string) => s.replace(/\s+/g, ' ').trim();
const ghepLai = (v: string) => {
  const r = tachCauDau(v);
  return chuan(`${r.cauDau} ${r.conLai}`);
};

// ---------- 1. Không mất chữ ----------

const CA = [
  { ten: 'hai câu', vao: 'Bạn có nguyên tắc riêng và giữ được nó khá chắc. Điều đó đôi khi gây bất lợi cho mình.' },
  { ten: 'ba câu', vao: 'Câu đầu tiên đủ dài để vượt ngưỡng hai mươi ký tự. Câu hai ở đây. Câu ba nữa.' },
  { ten: 'một câu duy nhất', vao: 'Chỉ có đúng một câu và không có gì theo sau nó cả.' },
  { ten: 'mở đầu bằng chữ hoa có dấu', vao: 'Điều này cần nói trước tiên cho thật rõ ràng. Đây là phần còn lại.' },
  { ten: 'có dấu hỏi', vao: 'Vậy bạn nên dựa vào đâu trong giai đoạn này? Câu trả lời nằm ở cung Quan Lộc.' },
];

for (const c of CA) {
  kiem(`giữ nguyên chữ — ${c.ten}`, ghepLai(c.vao) === chuan(c.vao));
  kiem(`có câu đầu — ${c.ten}`, tachCauDau(c.vao).cauDau.length > 0);
}

// ---------- 2. Không nổ, không cắt bậy ----------

kiem('chuỗi rỗng', tachCauDau('').cauDau === '');
kiem('chuỗi toàn khoảng trắng', tachCauDau('   ').cauDau === '');
kiem(
  'không cắt ở dấu chấm của số thập phân',
  tachCauDau('Mức đo được là 3.5 điểm trên thang mười điểm tròn.').conLai === ''
);
kiem(
  'câu đầu quá dài thì giữ nguyên khối',
  tachCauDau(`${'a'.repeat(200)}. Câu sau.`).conLai === ''
);

// ---------- 3. Chạy trên nội dung THẬT của engine ----------

const LA_SO = [
  { ten: 'nam 24/8/2000 giờ Tuất', nhap: { hoTen: 'A', ngay: 24, thang: 8, nam: 2000, gio: 20, phut: 0, gioiTinh: 'nam' as const } },
  { ten: 'nữ 1/1/1990 giờ Tý', nhap: { hoTen: 'B', ngay: 1, thang: 1, nam: 1990, gio: 0, phut: 0, gioiTinh: 'nu' as const } },
  { ten: 'nam 15/6/1985 giờ Ngọ', nhap: { hoTen: 'C', ngay: 15, thang: 6, nam: 1985, gio: 12, phut: 0, gioiTinh: 'nam' as const } },
];

for (const l of LA_SO) {
  const gn = docNhanh(lapLaSo(l.nhap), 2026);
  const motMat = gn.find((g) => ghepLai(g.noiDung) !== chuan(g.noiDung));
  kiem(`${l.ten} — không góc nhìn nào mất chữ`, !motMat);

  const dai = gn.map((g) => tachCauDau(g.noiDung).cauDau.length);
  kiem(`${l.ten} — câu đầu không quá 180 ký tự (dài nhất ${Math.max(...dai)})`, Math.max(...dai) <= 180);
  kiem(`${l.ten} — câu đầu nào cũng có chữ`, dai.every((n) => n > 0));
}

if (hong) {
  console.log(`\n${hong} ca hỏng`);
  process.exit(1);
}
console.log('\nĐẠT');
