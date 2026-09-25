/**
 * Tạm — soát MAU-VANG-LUAN-GIAI.md bằng chính các luật đếm của Celes.
 *   npx tsx scripts/tam-soat-mau.ts
 * Chỉ soát phần văn luận giải: bỏ qua phần "Cách viết" ở đầu tệp và mọi dòng
 * "Ghi chú biên tập", vì hai chỗ đó cố ý trích lại chữ cấm để giải thích.
 */
import { readFileSync } from 'node:fs';
import { demChuTruuTuong } from '@/lib/rag/chu-truu-tuong';
import { CAU_RA_LENH, CAU_PHAN_QUYET } from '@/lib/rag/chuan-ngon-ngu';
import { demTenSao } from '@/lib/rag/sua-chua';
import { TEN_CUNG } from '@/lib/tuvi/constants';

const tho = readFileSync(process.argv[2] ?? 'MAU-VANG-LUAN-GIAI.md', 'utf-8');
const van = tho
  .slice(tho.indexOf('# NHÓM A'))
  .split('\n')
  .filter((d) => !d.startsWith('> **Ghi chú') && !d.startsWith('`') && !d.startsWith('#'))
  .join('\n');

const cau = van
  .replace(/\|/g, '\n')
  .split(/(?<=[.!?])\s+|\n+/)
  .map((c) => c.replace(/^[-*>\s]+|\*\*/g, '').trim())
  .filter((c) => c.length > 8);

let loi = 0;
const bao = (nhan: string, ds: string[]) => {
  console.log(`\n${ds.length ? '✗' : '✓'} ${nhan}: ${ds.length}`);
  ds.slice(0, 12).forEach((d) => console.log('    ' + d));
  loi += ds.length;
};

bao('Chữ trừu tượng', demChuTruuTuong(van).map(([c, n]) => `"${c}" × ${n}`));

bao('Câu ra lệnh', cau.filter((c) => CAU_RA_LENH.test(c) && !/Tự kiểm/.test(c)));
bao('Câu phán quyết', cau.filter((c) => CAU_PHAN_QUYET.test(c)));

const MENH = /(?:cung|tại|ở)\s+Mệnh(?![\p{L}])/u;
bao('Tên cung lọt ra', cau.filter((c) =>
  TEN_CUNG.filter((t) => t !== 'Mệnh').some((t) => new RegExp(`${t}(?![\\p{L}])`, 'u').test(c)) || MENH.test(c)
));

const CANH_MAU = /chín giờ|mười giờ tối|sếp nhắn|mở ứng dụng|ứng dụng ngân hàng|Điều đáng cân nhắc|Không chỉ .* mà còn/iu;
bao('Cảnh mẫu / cụm cấm', cau.filter((c) => CANH_MAU.test(c)));

const CACH_CUC = ['Tử Phủ Vũ Tướng Liêm', 'Sát Phá Tham', 'Cự Nhật', 'Nhật Nguyệt tịnh minh', 'Khôi Việt', 'Tả Hữu', 'Song Lộc', 'Kình Đà', 'Khốc Hư', 'Xương Khúc', 'Đào Hồng'];
bao('Câu có từ 3 tên sao trở lên', cau.filter((c) => demTenSao(c, CACH_CUC) >= 3));

const tu = van.split(/\s+/).filter(Boolean).length;
console.log(`\nTổng: ${tu} từ văn luận giải, ${cau.length} câu.`);
console.log(loi ? `\n${loi} VI PHẠM` : '\nSẠCH');
