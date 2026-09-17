/**
 * Chạy bộ vàng qua planner — npx tsx scripts/eval-planner.ts [--chi-tiet]
 *
 * Đây là bài kiểm tra hồi quy cho lớp lập kế hoạch. Sửa bảng từ khoá hay bảng
 * chủ đề → cung thì chạy lại, và con số phải không tụt. Không có con số thì mọi
 * lần chỉnh đều là chỉnh theo cảm giác.
 *
 * Chưa đo recall của truy hồi vì kho tri thức còn trống. Khi đã có nguồn xuất
 * bản, thêm lớp đo đó vào cùng bộ này.
 */

import { BO_VANG_PLANNER } from '../lib/rag/bo-vang';
import { lapKeHoach } from '../lib/rag/planner';

const chiTiet = process.argv.includes('--chi-tiet');

interface Hong {
  cauHoi: string;
  loi: string[];
}

let dungChuDe = 0;
let duCung = 0;
let duThucThe = 0;
let duLopHan = 0;
let soCoThucThe = 0;
let soCoLopHan = 0;
const hong: Hong[] = [];

for (const c of BO_VANG_PLANNER) {
  const k = lapKeHoach({ cauHoi: c.cauHoi });
  const loi: string[] = [];

  if (k.chuDe === c.chuDe) dungChuDe += 1;
  else loi.push(`chủ đề: mong ${c.chuDe}, nhận ${k.chuDe}`);

  const thieuCung = c.cungBatBuoc.filter((x) => !k.cungLienQuan.includes(x));
  if (thieuCung.length === 0) duCung += 1;
  else loi.push(`thiếu cung: ${thieuCung.join(', ')} (nhận ${k.cungLienQuan.join(', ')})`);

  if (c.thucTheBatBuoc?.length) {
    soCoThucThe += 1;
    const co = new Set(k.thucThe.map((t) => t.id));
    const thieu = c.thucTheBatBuoc.filter((x) => !co.has(x));
    if (thieu.length === 0) duThucThe += 1;
    else loi.push(`thiếu thực thể: ${thieu.join(', ')}`);
  }

  if (c.lopHanBatBuoc?.length) {
    soCoLopHan += 1;
    const thieu = c.lopHanBatBuoc.filter((x) => !k.lopHan.includes(x));
    if (thieu.length === 0) duLopHan += 1;
    else loi.push(`thiếu lớp hạn: ${thieu.join(', ')} (nhận ${k.lopHan.join(', ')})`);
  }

  if (loi.length) hong.push({ cauHoi: c.cauHoi, loi });
}

const n = BO_VANG_PLANNER.length;
const pc = (a: number, b: number) => (b === 0 ? '—' : `${((a / b) * 100).toFixed(1)}%`);

console.log(`\nBộ vàng planner — ${n} câu\n`);
console.log(`  Đúng chủ đề          ${pc(dungChuDe, n)}  (${dungChuDe}/${n})`);
console.log(`  Đủ cung bắt buộc     ${pc(duCung, n)}  (${duCung}/${n})`);
console.log(`  Đủ thực thể          ${pc(duThucThe, soCoThucThe)}  (${duThucThe}/${soCoThucThe})`);
console.log(`  Đủ lớp hạn           ${pc(duLopHan, soCoLopHan)}  (${duLopHan}/${soCoLopHan})`);
console.log(`  Câu không lỗi nào    ${pc(n - hong.length, n)}  (${n - hong.length}/${n})`);

if (hong.length) {
  console.log(`\n${hong.length} câu có vấn đề:`);
  for (const h of hong) {
    console.log(`\n  "${h.cauHoi}"`);
    for (const l of h.loi) console.log(`     ${l}`);
    if (chiTiet) {
      const k = lapKeHoach({ cauHoi: h.cauHoi });
      console.log(`     truy vấn: ${k.truyVan}`);
    }
  }
}
console.log('');
