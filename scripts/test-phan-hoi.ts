/**
 * CEL-195 — phản hồi 👍👎 và màn "Cần duyệt". Offline, không DB.
 *
 *   npx tsx scripts/test-phan-hoi.ts
 *
 * Kiểm: body chỉ nhận UUID + nhãn đóng; 👎 bắt buộc lý do trong danh sách; không nhận chữ tự do;
 * dòng cho admin chỉ có trường trong danh sách trắng (không cau_hoi / user_id / chart_hash / văn trả lời);
 * route ghi lọc theo user_id; route hỏi đáp trả requestId và truyền userId vào vết; khoá i18n đủ hai bên.
 */
import { readFileSync } from 'node:fs';
import { COT_PHAN_HOI_AN_TOAN, LY_DO_PHAN_HOI, chuanHoaPhanHoi, dongPhanHoiAnToan } from '../lib/rag/phan-hoi';
import { vi } from '../lib/i18n/vi';
import { en } from '../lib/i18n/en';

let hong = 0;
function kiem(dk: boolean, ten: string) {
  if (!dk) {
    hong++;
    console.log(`  ✗ ${ten}`);
  }
}
console.log('CEL-195 phản hồi 👍👎 + Cần duyệt');

const ID = '3f2b8c1e-9a4d-4e7f-8b21-0c5d6e7f8a9b';
kiem(chuanHoaPhanHoi({ requestId: ID, phanHoi: 'huu_ich' }).ok, '👍 không cần lý do');
const up = chuanHoaPhanHoi({ requestId: ID, phanHoi: 'huu_ich', lyDo: 'khac' });
kiem(up.ok && up.lyDo === null, '👍 bỏ lý do nếu có gửi kèm');
for (const l of LY_DO_PHAN_HOI) kiem(chuanHoaPhanHoi({ requestId: ID, phanHoi: 'khong_dung', lyDo: l }).ok, `👎 nhận lý do ${l}`);
kiem(LY_DO_PHAN_HOI.length === 5, 'đúng 5 lý do');
for (const [ten, b] of [
  ['👎 thiếu lý do', { requestId: ID, phanHoi: 'khong_dung' }],
  ['👎 lý do chữ tự do', { requestId: ID, phanHoi: 'khong_dung', lyDo: 'tôi sinh 15/6/1990 lúc 8h' }],
  ['nhãn lạ', { requestId: ID, phanHoi: 'tot' }],
  ['requestId không phải UUID', { requestId: '123', phanHoi: 'huu_ich' }],
  ['requestId kiểu số', { requestId: 42, phanHoi: 'huu_ich' }],
  ['body null', null],
] as const)
  kiem(!chuanHoaPhanHoi(b).ok, `từ chối: ${ten}`);

// Dòng admin: danh sách trắng
const tho = {
  request_id: ID,
  tao_luc: '2026-10-05T10:00:00Z',
  phan_hoi: 'khong_dung',
  ly_do_phan_hoi: 'sai-thoi-diem',
  phien_ban: { duong: 'focused', planner: 'x', loLong: { a: 1 } },
  model: 'openai/m',
  ket_qua_kiem_duyet: { dat: false, loi: [{ ma: 'KHONG_CAN_CU', moTa: 'văn trả lời bí mật' }] },
  cau_hoi: 'CÂU HỎI RIÊNG',
  user_id: 'u-bi-mat',
  chart_hash: 'bam-bi-mat',
  tra_loi: 'VĂN TRẢ LỜI',
};
const d = dongPhanHoiAnToan(tho);
const json = JSON.stringify(d);
for (const x of ['CÂU HỎI RIÊNG', 'u-bi-mat', 'bam-bi-mat', 'VĂN TRẢ LỜI', 'văn trả lời bí mật', ID]) kiem(!json.includes(x), `dòng admin không lộ: ${x}`);
kiem(d.ma === ID.slice(0, 8) && d.lyDo === 'sai-thoi-diem' && d.maLoi.join() === 'KHONG_CAN_CU', `dòng admin đúng trường: ${json}`);
kiem(!('loLong' in d.phienBan), 'phiên bản chỉ giữ chuỗi');
kiem(dongPhanHoiAnToan({ ...tho, ly_do_phan_hoi: 'chữ tự do cũ' }).lyDo === null, 'lý do ngoài danh sách thành null');
for (const c of ['cau_hoi', 'user_id', 'chart_hash']) kiem(!COT_PHAN_HOI_AN_TOAN.includes(c), `SELECT admin không có ${c}`);

// Route: ghi lọc user_id; hỏi đáp trả requestId + truyền userId
const r = readFileSync('app/api/hoi-dap/phan-hoi/route.ts', 'utf-8');
kiem(/\.eq\('request_id', kq\.requestId\)\s*\.eq\('user_id', cong\.userId\)/.test(r), 'API phản hồi lọc cả request_id lẫn user_id');
const h = readFileSync('app/api/hoi-dap/route.ts', 'utf-8');
kiem(/traLoi: kq\.van,[\s\S]{0,200}requestId,/.test(h), 'hỏi đáp trả requestId');
kiem(/ghiVetTraLoi\(\{[\s\S]{0,200}userId: cong\.userId/.test(h), 'vết trả lời có userId');
const a = readFileSync('app/api/admin/can-duyet/route.ts', 'utf-8');
kiem(a.includes('select(COT_PHAN_HOI_AN_TOAN)') && a.includes('canQuanTri'), 'Cần duyệt: chỉ quản trị, chỉ cột an toàn');

// i18n: đủ khoá cả hai bên
for (const [ten, t] of [['vi', vi], ['en', en]] as const) {
  const p = t.hoiCeles.phanHoi;
  kiem(!!p.huuIch && !!p.khongDung && !!p.hoiLyDo && !!p.camOn && !!p.loi, `${ten}: đủ khoá phản hồi`);
  for (const l of LY_DO_PHAN_HOI) kiem(!!p.lyDo[l], `${ten}: có nhãn lý do ${l}`);
}

console.log(hong ? `\n${hong} mục hỏng` : 'Tất cả đạt.');
process.exit(hong ? 1 : 0);
