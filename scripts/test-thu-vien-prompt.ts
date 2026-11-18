/**
 * Kiểm tất định khối thư viện đưa vào prompt V3 — npx tsx scripts/test-thu-vien-prompt.ts
 *
 * Phương án tối thiểu của kho tri thức (quyết định 10.15, K1 — 22/10/2026):
 * - mục nặng (`manh`) chưa duyệt không vào prompt; cờ CELES_THU_VIEN_MANH_CHUA_DUYET=1 cho vào lại;
 * - mục bị một mục ĐÃ DUYỆT lật (cùng cung) thì bỏ, xét trước trần; nhãn lật máy tự gán thì giữ cả hai
 *   và không dặn theo bên nào;
 * - không còn lời dặn "cân cả hai";
 * - câu V3 lưu căn cứ là toàn bộ tập đã cấp, và căn cứ không ra trình duyệt.
 * Không gọi model, không chạm DB.
 */
import { lapLaSo, type Cung } from '../lib/tuvi/ansao';
import { dungKhoiThuVien, TRAN_MUC } from '../lib/rag/thu-vien/cho-prompt';
import type { MucThuVien } from '../lib/rag/thu-vien/kieu';
import type { DuKienV3 } from '../lib/rag/v3/du-kien';
import { anNoiBo, canCuCua, type CauTraRaV3 } from '../lib/rag/v3/xu-ly';
import type { DoanV3 } from '../lib/rag/v3/truy-hoi-v3';

let sai = 0;
const kiem = (ten: string, dung: boolean) => {
  if (!dung) sai++;
  console.log(`${dung ? 'ĐÚNG' : 'SAI '}  ${ten}`);
};

const laSo = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' });
const chinh = (c: Cung) => c.sao.find((s) => s.loai === 'chinh-tinh');
const [goc, khac] = laSo.cungs.filter((c) => chinh(c));
const saoGoc = chinh(goc)!.ten;
const saoKhac = chinh(khac)!.ten;

const muc = (id: string, o: Partial<MucThuVien> & { sao?: string; muc?: 'manh' | 'vua' | 'nhe' } = {}): MucThuVien => ({
  id, schemaVersion: 1, chuDe: ['su-nghiep'],
  dieuKien: { cung: [], sao: [{ ten: o.sao ?? saoGoc, quanHe: 'o-cung' }] },
  y: `câu nghĩa của ${id}`,
  nhan: { chieu: 'cat', muc: o.muc ?? 'vua', linhVuc: [] },
  cheDo: 'add', canCu: [], truongPhai: 'chung', duyet: 'chua', dotTrich: 'dot-thu',
  ...o,
});
// Cung khác vào tập cung đọc qua dữ kiện "Cung …"
const duKien: DuKienV3[] = [{ id: 'F001', vaiTro: 'cung liên quan', noiDung: `Cung ${khac.tenCung}`, sao: [], cung: khac.tenCung }];
const dung = (thuVien: MucThuVien[]) => dungKhoiThuVien({ laSo, duKien, thuVien, cungChinh: goc.tenCung, meta: new Map() });
const ids = (kq: ReturnType<typeof dung>) => kq.daChon.map((d) => d.khop.muc.id);
const dongCua = (kq: ReturnType<typeof dung>, id: string) => {
  const ma = kq.daChon.find((d) => d.khop.muc.id === id)?.ma;
  return kq.khoi.split('\n').find((l) => ma && l.startsWith(ma)) ?? '';
};

// 1. Mục nặng chưa duyệt
delete process.env.CELES_THU_VIEN_MANH_CHUA_DUYET;
const kho1 = [muc('NANG-CHUA', { muc: 'manh' }), muc('NANG-DUYET', { muc: 'manh', duyet: 'da-duyet' }), muc('VUA')];
const kq1 = dung(kho1);
kiem('nặng chưa duyệt: không vào prompt', !ids(kq1).includes('NANG-CHUA'));
kiem('nặng chưa duyệt: ghi vào boChuaDuyet', kq1.boChuaDuyet.includes('NANG-CHUA'));
kiem('nặng chưa duyệt: khopHet vẫn đủ (đo ghép không báo thiếu giả)', kq1.khopHet.some((k) => k.muc.id === 'NANG-CHUA'));
kiem('nặng đã duyệt: vẫn vào', ids(kq1).includes('NANG-DUYET'));
kiem('mục vừa chưa duyệt: vẫn vào', ids(kq1).includes('VUA'));
process.env.CELES_THU_VIEN_MANH_CHUA_DUYET = '1';
const kq1b = dung(kho1);
kiem('cờ bật: nặng chưa duyệt vào lại', ids(kq1b).includes('NANG-CHUA') && !kq1b.boChuaDuyet.length);
delete process.env.CELES_THU_VIEN_MANH_CHUA_DUYET;

// 2. Lật
const kq2 = dung([
  muc('DICH-1'),
  muc('LAT-DUYET', { cheDo: 'override', dich: ['DICH-1'], duyet: 'da-duyet' }),
  muc('DICH-2'),
  muc('LAT-MAY', { cheDo: 'override', dich: ['DICH-2'] }),
]);
// Ca riêng: một bộ sao chỉ được 3 mục, gộp chung thì mục bị hạn mức bộ cắt chứ không phải bị bỏ
const kq2b = dung([muc('DICH-3'), muc('HOA-GIAI', { cheDo: 'neutralize', dich: ['DICH-3'], duyet: 'da-duyet' })]);
kiem('lật đã duyệt cùng cung: bỏ mục đích', !ids(kq2).includes('DICH-1') && kq2.boBiLat.includes('DICH-1'));
kiem('lật đã duyệt: mục lật vẫn vào', ids(kq2).includes('LAT-DUYET'));
kiem('lật máy tự gán: giữ cả hai', ids(kq2).includes('DICH-2') && ids(kq2).includes('LAT-MAY'));
kiem('lật máy tự gán: chú thích "chưa xác minh", không "bị lật"', /chưa xác minh/.test(dongCua(kq2, 'DICH-2')) && !/bị lật/.test(kq2.khoi));
kiem('hoá giải: không bỏ mục đích', ids(kq2b).includes('DICH-3') && /được hoá giải bởi/.test(dongCua(kq2b, 'DICH-3')));

// Lật khác cung không bác được mục ở cung gốc
const kq3 = dung([muc('DICH-GOC'), muc('LAT-KHAC', { sao: saoKhac, cheDo: 'override', dich: ['DICH-GOC'], duyet: 'da-duyet' })]);
kiem('lật đã duyệt khác cung: không bỏ mục ở cung kia', ids(kq3).includes('DICH-GOC') && !kq3.boBiLat.length);

// Mục lật luôn có chỗ: ba mục cùng bộ sao đã chiếm hạn mức bộ, mục lật vẫn vào và đứng đầu
const kq4 = dung([muc('A1', { muc: 'vua', duyet: 'da-duyet' }), muc('A2'), muc('A3'), muc('A4'), muc('LAT-4', { cheDo: 'override', dich: ['A4'], duyet: 'da-duyet' })]);
kiem('mục lật đã duyệt: không bị hạn mức bộ sao cắt, đứng đầu', ids(kq4)[0] === 'LAT-4' && !ids(kq4).includes('A4'));

// Mục bị bỏ không chiếm chỗ trần
const nhieu = Array.from({ length: TRAN_MUC + 5 }, (_, i) => muc(`NANG-${i}`, { muc: 'manh', sao: i % 2 ? saoGoc : saoKhac }));
const kq5 = dung([...nhieu, muc('VUA-GOC'), muc('VUA-KHAC', { sao: saoKhac })]);
kiem('mục nặng bị bỏ không chiếm chỗ trần 18', ids(kq5).includes('VUA-GOC') && ids(kq5).includes('VUA-KHAC'));
kiem('chỉ toàn mục bị bỏ: khối rỗng', dung(nhieu).khoi === '');

// 3. Không còn lời dặn "cân cả hai"
kiem('khối không còn "cân cả hai"', [kq1, kq2, kq3, kq4, kq5].every((k) => !/cân cả hai/i.test(k.khoi)));

// 4. Căn cứ
const nguon = [{ id: 'E001', documentId: 'doc-1', versionId: 'ver-1', chunkId: 'chunk-1' }] as DoanV3[];
const thuVien = { daChon: [{ ma: 'T001', id: 'TV-1', dot: 'dot-thu', dau: 'abcd1234', cung: goc.tenCung, sao: [saoGoc] }], khopHet: [], nguocChieu: [] as [string, string][], boChuaDuyet: [], boBiLat: [] };
const cc = canCuCua({ thuVien, nguon });
kiem('căn cứ: đủ mục thư viện (id + đợt + dấu)', cc.thuVien.length === 1 && cc.thuVien[0].dot === 'dot-thu' && cc.thuVien[0].dau === 'abcd1234');
kiem('căn cứ: đủ nguồn (documentId + versionId + chunkId)', cc.nguon[0].documentId === 'doc-1' && cc.nguon[0].versionId === 'ver-1' && cc.nguon[0].chunkId === 'chunk-1');
const cau: CauTraRaV3 = { id: 'q', cauHoi: '?', luanGiai: 'x', viSao: 'y', doRo: 'Rõ', chuaViet: false, pb: 'p', model: 'm', canCu: cc };
const ra = anNoiBo([cau])[0] as Record<string, unknown>;
kiem('trả trình duyệt: gỡ canCu, pb, model', !('canCu' in ra) && !('pb' in ra) && !('model' in ra) && ra.luanGiai === 'x');

console.log(sai ? `\n${sai} ca SAI` : '\nTất cả đúng.');
process.exit(sai ? 1 : 0);
