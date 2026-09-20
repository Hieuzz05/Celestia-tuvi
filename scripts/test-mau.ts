/**
 * Đối chiếu tương phản màu với WCAG — npx tsx scripts/test-mau.ts
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO PHẢI ĐO CHỨ KHÔNG NHÌN
 *
 * Tương phản là thứ mắt người đánh giá rất tệ. Nút chính của sản phẩm — chữ
 * trắng trên hồng #df37a7 — nhìn hoàn toàn bình thường, đọc được, đẹp; đo ra
 * 4.01 trong khi chữ thường cần 4.5. Nó đã ở đó suốt và không ai thấy gì sai,
 * vì không có gì để thấy.
 *
 * Cũng vì vậy mà lỗi này quay lại rất dễ: người sau chỉnh màu thương hiệu sáng
 * lên một nấc cho "tươi hơn" là trượt chuẩn lại, và vẫn không ai thấy gì.
 *
 * ---------------------------------------------------------------------------
 * ĐỌC MÀU TỪ CHÍNH globals.css
 *
 * Không chép giá trị màu vào đây. Một bảng chép tay chỉ đúng tới lần sửa CSS
 * kế tiếp, và lúc ấy bộ kiểm vẫn xanh trong khi sản phẩm đã trượt — đúng kiểu
 * hỏng im lặng mà bộ kiểm sinh ra để chặn.
 */
import { readFileSync } from 'node:fs';

const css = readFileSync('app/globals.css', 'utf-8');

/** Lấy giá trị của một biến CSS trong khối :root gốc (khối đầu tiên định nghĩa nó) */
function bien(ten: string): string {
  const m = new RegExp(`${ten}\\s*:\\s*([^;]+);`).exec(css);
  if (!m) throw new Error(`Không tìm thấy biến ${ten} trong globals.css`);
  const v = m[1].trim();
  const t = /var\(([^)]+)\)/.exec(v);
  return t ? bien(t[1].trim()) : v;
}

function sang(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function tyLe(a: string, b: string): number {
  const [x, y] = [sang(a), sang(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

let sai = 0;
function kiem(ten: string, a: string, b: string, can: number) {
  const r = tyLe(a, b);
  const dat = r >= can;
  if (!dat) sai += 1;
  console.log(
    `  ${dat ? 'OK  ' : 'SAI '} ${ten.padEnd(44)} ${r.toFixed(2)} / cần ${can.toFixed(1)}`
  );
}

console.log('\n== TƯƠNG PHẢN MÀU (WCAG 2.1) ==\n');

const TRANG = bien('--color-canvas');
const NEN_TOI = bien('--color-aubergine');

/*
 * 4.5 cho chữ thường, 3.0 cho chữ lớn (>=18.66px đậm hoặc >=24px thường).
 * Nút chính là 16px/600 — KHÔNG tính là chữ lớn, nên nó phải đạt 4.5.
 */
kiem('Chữ nút chính trên nền nút', bien('--action-fg'), bien('--action-bg'), 4.5);
kiem('Chữ chính trên nền sáng', bien('--fg'), TRANG, 4.5);
kiem('Chữ phụ trên nền sáng', bien('--fg-muted'), TRANG, 4.5);
kiem('Chữ nhạt nhất trên nền sáng', bien('--fg-subtle'), TRANG, 4.5);
kiem('Màu nhấn trên nền sáng (chữ lớn)', bien('--accent'), TRANG, 3);

console.log('');
kiem('Chữ thân bài trên nền tối', '#f2e9f2', NEN_TOI, 4.5);
kiem('Chữ nhạt nhất trên nền tối', bien('--color-smoke'), NEN_TOI, 4.5);

/*
 * Bậc "nhạt nhất" phải THỰC SỰ nhạt hơn bậc trên nó.
 *
 * Cách sửa dễ nhất khi một màu trượt chuẩn là đẩy nó về màu đậm hơn, và cứ thế
 * thì ba bậc chữ dồn lại thành một. Lúc ấy bộ kiểm xanh mà thứ bậc thị giác
 * biến mất — vẫn là hỏng, chỉ là hỏng theo hướng ngược lại.
 */
console.log('');
const nhat = tyLe(bien('--fg-subtle'), TRANG);
const phu = tyLe(bien('--fg-muted'), TRANG);
const conThuBac = nhat < phu - 0.5;
if (!conThuBac) sai += 1;
console.log(
  `  ${conThuBac ? 'OK  ' : 'SAI '} ${'Bậc nhạt nhất vẫn nhạt hơn bậc phụ'.padEnd(44)} ${nhat.toFixed(2)} < ${phu.toFixed(2)}`
);

console.log(sai === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG\n' : `\n${sai} MỤC SAI\n`);
process.exit(sai === 0 ? 0 : 1);
