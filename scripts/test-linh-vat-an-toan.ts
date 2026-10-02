/**
 * Linh vật đứng nghiêm theo lượt mới nhất — npx tsx scripts/test-linh-vat-an-toan.ts
 *
 * OFFLINE. Giữ bất biến chủ dự án chốt 02/10/2026:
 *   safety(lượt người dùng mới nhất)  ≠  safety(mức nặng nhất cả hội thoại)
 * Ca 4 là ca bắt người "tối ưu" lại thành `some(...)`.
 */
import { linhVatNghiem } from '../lib/linh-vat';

type T = { vaiTro: 'nguoi-dung' | 'tro-ly'; noiDung: string };
const hoi = (noiDung: string): T => ({ vaiTro: 'nguoi-dung', noiDung });
const dap = (noiDung: string): T => ({ vaiTro: 'tro-ly', noiDung });

const BINH_THUONG = 'Năm nay sự nghiệp của mình thế nào?';
const NHAY_CAM = 'Dạo này mình thấy tuyệt vọng về mọi thứ, lá số nói gì';
const KHAN_CAP = 'Tôi không muốn sống nữa, lá số tôi có gì không';

const CA: { ten: string; tinNhan: T[]; cho: boolean }[] = [
  { ten: '1. NORMAL → linh vật bình thường', tinNhan: [hoi(BINH_THUONG), dap('...')], cho: false },
  { ten: '2a. SENSITIVE vừa gửi, đang chờ → SERIOUS', tinNhan: [hoi(NHAY_CAM)], cho: true },
  { ten: '2b. SENSITIVE sau khi đã có trả lời → vẫn SERIOUS', tinNhan: [hoi(NHAY_CAM), dap('...')], cho: true },
  { ten: '2c. CRITICAL → SERIOUS', tinNhan: [hoi(KHAN_CAP), dap('Gọi 115')], cho: true },
  {
    ten: '3. Tải lại sau SENSITIVE (hội thoại nạp từ DB) → vẫn SERIOUS',
    tinNhan: [hoi(BINH_THUONG), dap('...'), hoi(NHAY_CAM), dap('...')],
    cho: true,
  },
  {
    ten: '4. SENSITIVE rồi hỏi NORMAL → trở lại bình thường (KHÔNG dính)',
    tinNhan: [hoi(NHAY_CAM), dap('...'), hoi(BINH_THUONG)],
    cho: false,
  },
  { ten: '5. Xoá hội thoại → bình thường', tinNhan: [], cho: false },
];

let hong = 0;
for (const c of CA) {
  const ra = linhVatNghiem(c.tinNhan);
  const dung = ra === c.cho;
  if (!dung) hong++;
  console.log(`${dung ? '✓' : '✗'} ${c.ten}${dung ? '' : ` — ra ${ra}, chờ ${c.cho}`}`);
}
console.log(hong ? `\n${hong} ca hỏng` : `\n${CA.length}/${CA.length} ca qua`);
process.exit(hong ? 1 : 0);
