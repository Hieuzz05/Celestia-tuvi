/**
 * CEL-194 — Nghiệm lý của tôi: bộ lọc "đã duyệt" + chuẩn hoá đầu vào admin. Offline.
 *
 * Bộ lọc là chỗ DUY NHẤT quyết định nghiệm lý nào được vào chat Focused. Mỗi điều kiện
 * (trường phái, trạng thái, phiên bản đang dùng, duyệt, người duyệt, thời điểm duyệt, hình nội dung)
 * thiếu một là phải rơi.
 */
import { QUAN_HE } from '../lib/rag/thu-vien/kieu';
import {
  batNghiemLyFocused,
  chuanHoaNoiDung,
  locNghiemLyDungDuoc,
  type DongMuc,
  type DongPhienBan,
} from '../lib/rag/thu-vien/nghiem-ly';
import { TEN_CUNG } from '../lib/tuvi/constants';

let hong = 0;
const kiem = (ok: boolean, ten: string) => {
  if (!ok) {
    hong++;
    console.log(`  ✗ ${ten}`);
  }
};

console.log('CEL-194 nghiệm lý: bộ lọc + chuẩn hoá');

const ND = {
  y: 'Tử Vi ở Mệnh gặp Thiên Phủ: nền vững, giữ được việc.',
  chuDe: ['su-nghiep'],
  cheDo: 'add' as const,
  nhan: { chieu: 'cat' as const, muc: 'vua' as const, linhVuc: ['su-nghiep'] },
  dieuKien: { cung: ['Mệnh'], sao: [{ ten: 'Tử Vi', quanHe: 'o-cung' as const }] },
};
const muc = (id: string, x: Partial<DongMuc> = {}): DongMuc => ({ id, truong_phai: 'celes', trang_thai: 'dang-dung', phien_ban_dang_dung: 1, ...x });
const pb = (muc_id: string, x: Partial<DongPhienBan> = {}): DongPhienBan => ({
  muc_id,
  phien_ban: 1,
  noi_dung: ND,
  schema_version: 1,
  duyet: 'da-duyet',
  approved_by: 'chu@du.an',
  approved_at: '2026-10-05T00:00:00Z',
  ...x,
});

// Dòng chuẩn lọt, đủ danh tính.
{
  const ra = locNghiemLyDungDuoc([muc('NL-B'), muc('NL-A')], [pb('NL-A'), pb('NL-B')]);
  kiem(ra.length === 2, `2 mục chuẩn phải lọt: ${ra.length}`);
  kiem(ra[0].muc.id === 'NL-A' && ra[1].muc.id === 'NL-B', 'thứ tự theo id (tất định)');
  kiem(ra[0].muc.truongPhai === 'celes' && ra[0].muc.duyet === 'da-duyet' && ra[0].phienBan === 1, 'danh tính / phiên bản');
}

// Mỗi điều kiện thiếu một → rơi.
const rot: [string, DongMuc[], DongPhienBan[]][] = [
  ['trường phái nam-phai', [muc('NL-A', { truong_phai: 'nam-phai' })], [pb('NL-A')]],
  ['trạng thái nhap', [muc('NL-A', { trang_thai: 'nhap' })], [pb('NL-A')]],
  ['trạng thái luu-tru (archived)', [muc('NL-A', { trang_thai: 'luu-tru' })], [pb('NL-A')]],
  ['chưa chọn phiên bản', [muc('NL-A', { phien_ban_dang_dung: null })], [pb('NL-A')]],
  ['phiên bản đang dùng không tồn tại', [muc('NL-A', { phien_ban_dang_dung: 2 })], [pb('NL-A')]],
  ['phiên bản chưa duyệt', [muc('NL-A')], [pb('NL-A', { duyet: 'chua' })]],
  ['phiên bản bị bác', [muc('NL-A')], [pb('NL-A', { duyet: 'bi-bac' })]],
  ['tranh chấp', [muc('NL-A')], [pb('NL-A', { duyet: 'tranh-chap' })]],
  ['thiếu approved_by', [muc('NL-A')], [pb('NL-A', { approved_by: null })]],
  ['thiếu approved_at', [muc('NL-A')], [pb('NL-A', { approved_at: null })]],
  ['nội dung null', [muc('NL-A')], [pb('NL-A', { noi_dung: null })]],
  ['nội dung thiếu sao', [muc('NL-A')], [pb('NL-A', { noi_dung: { ...ND, dieuKien: { cung: [] } as never } })]],
];
for (const [ten, m, p] of rot) kiem(locNghiemLyDungDuoc(m, p).length === 0, `phải rơi: ${ten}`);

// Duyệt theo PHIÊN BẢN: v1 đã duyệt nhưng đang dùng v2 chưa duyệt → rơi; dùng v1 → lấy đúng v1.
{
  const p2 = pb('NL-A', { phien_ban: 2, duyet: 'chua', approved_by: null, approved_at: null, noi_dung: { ...ND, y: 'bản hai' } });
  kiem(locNghiemLyDungDuoc([muc('NL-A', { phien_ban_dang_dung: 2 })], [pb('NL-A'), p2]).length === 0, 'v2 chưa duyệt không được ké duyệt của v1');
  const v1 = locNghiemLyDungDuoc([muc('NL-A', { phien_ban_dang_dung: 1 })], [pb('NL-A'), p2]);
  kiem(v1.length === 1 && v1[0].muc.y === ND.y && v1[0].phienBan === 1, 'đang dùng v1 → nội dung v1');
}

// Nội dung jsonb không được đè danh tính.
{
  const ra = locNghiemLyDungDuoc([muc('NL-A')], [pb('NL-A', { noi_dung: { ...ND, id: 'NL-GIA', truongPhai: 'nam-phai', duyet: 'chua' } })]);
  kiem(ra[0]?.muc.id === 'NL-A' && ra[0].muc.truongPhai === 'celes' && ra[0].muc.duyet === 'da-duyet', 'jsonb đè danh tính');
}

// Cờ.
kiem(!batNghiemLyFocused({}), 'cờ mặc định tắt');
kiem(!batNghiemLyFocused({ CELES_OWNER_KNOWLEDGE_FOCUSED: 'true' }), 'chỉ "1" mới bật');
kiem(batNghiemLyFocused({ CELES_OWNER_KNOWLEDGE_FOCUSED: '1' }), 'cờ = 1 bật');

// Chuẩn hoá đầu vào admin — danh sách đóng.
{
  const c = (x: unknown) => chuanHoaNoiDung(x, TEN_CUNG, QUAN_HE);
  const ok = c(ND);
  kiem(ok.ok && ok.noiDung.dieuKien.sao[0].ten === 'Tử Vi', 'nội dung chuẩn phải qua');
  kiem(!c({ ...ND, y: '' }).ok, 'thiếu y');
  kiem(!c({ ...ND, y: Array(46).fill('chữ').join(' ') }).ok, 'y quá 45 chữ');
  kiem(!c({ ...ND, dieuKien: { cung: ['Cung Lạ'], sao: ND.dieuKien.sao } }).ok, 'cung ngoài danh sách');
  kiem(!c({ ...ND, dieuKien: { cung: [], sao: [{ ten: 'Tử Vi', quanHe: 'hoa-den' }] } }).ok, 'quan hệ ngoài danh sách');
  kiem(!c({ ...ND, dieuKien: { cung: [], sao: [] } }).ok, 'không có sao');
  kiem(!c({ ...ND, nhan: { chieu: 'tot', muc: 'vua' } }).ok, 'chiều lạ');
  kiem(!c({ ...ND, cheDo: 'xoa' }).ok, 'chế độ lạ');
  kiem(!c({ ...ND, cheDo: 'override' }).ok, 'override thiếu dich');
  const ov = c({ ...ND, cheDo: 'override', dich: ['NL-B'] });
  kiem(ov.ok && ov.noiDung.dich?.[0] === 'NL-B', 'override có dich phải qua');
}

console.log(hong ? `\n${hong} mục hỏng` : 'Tất cả đạt.');
process.exit(hong ? 1 : 0);
