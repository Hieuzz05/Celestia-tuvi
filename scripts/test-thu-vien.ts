/**
 * Kiểm tất định cho thư viện tri thức — npx tsx scripts/test-thu-vien.ts
 *
 * Bộ khớp (lib/rag/thu-vien/khop.ts) và bộ kiểm mục (kiem.ts) không gọi model,
 * nên kiểm được bằng lá số dựng từ engine: lấy chính vị trí sao engine an ra,
 * dựng mục có điều kiện đúng / sai, xem bộ khớp trả lời đúng không.
 */
import { lapLaSo, type Cung } from '../lib/tuvi/ansao';
import { khopTaiCung, khopThuVien } from '../lib/rag/thu-vien/khop';
import { chuanDoSang, kiemMuc, khoaGop, khoaDieuKien } from '../lib/rag/thu-vien/kiem';
import type { MucThuVien } from '../lib/rag/thu-vien/kieu';

let sai = 0;
const kiem = (ten: string, dung: boolean) => {
  if (!dung) sai++;
  console.log(`${dung ? 'ĐÚNG' : 'SAI '}  ${ten}`);
};

const muc = (dk: Partial<MucThuVien['dieuKien']>, chieu: 'cat' | 'hung' = 'cat'): MucThuVien => ({
  id: 'X', schemaVersion: 1, chuDe: ['su-nghiep'], dieuKien: { cung: [], sao: [], ...dk }, y: 'câu nghĩa trung tính để kiểm',
  nhan: { chieu, muc: 'vua', linhVuc: [] }, cheDo: 'add', canCu: [], truongPhai: 'chung', duyet: 'chua', dotTrich: 'test',
});

const laSo = lapLaSo({ ngay: 12, thang: 3, nam: 1988, gio: 9, gioiTinh: 'nam' });
const theoChi = (i: number) => laSo.cungs.find((c) => c.chiIndex === ((i % 12) + 12) % 12)!;
const quan = laSo.cungs.find((c) => c.tenCung === 'Quan Lộc')!;
const chinh = (c: Cung) => c.sao.find((s) => s.loai === 'chinh-tinh');
const phu = (c: Cung) => c.sao.find((s) => s.loai === 'phu-tinh');

// Tìm một cung có chính tinh để làm gốc
const goc = laSo.cungs.find((c) => chinh(c))!;
const saoGoc = chinh(goc)!;
kiem('o-cung: sao đúng tại cung gốc thì khớp', khopTaiCung(laSo, muc({ sao: [{ ten: saoGoc.ten, quanHe: 'o-cung' }] }), goc));
kiem('o-cung: cùng sao nhưng gốc là cung xung thì không khớp', !khopTaiCung(laSo, muc({ sao: [{ ten: saoGoc.ten, quanHe: 'o-cung' }] }), theoChi(goc.chiIndex + 6)) || theoChi(goc.chiIndex + 6).sao.some((s) => s.ten === saoGoc.ten));
kiem('xung: sao của cung gốc nhìn từ cung xung thì khớp', khopTaiCung(laSo, muc({ sao: [{ ten: saoGoc.ten, quanHe: 'xung' }] }), theoChi(goc.chiIndex + 6)));
kiem('tam-hop: nhìn từ cung tam hợp thì khớp', khopTaiCung(laSo, muc({ sao: [{ ten: saoGoc.ten, quanHe: 'tam-hop' }] }), theoChi(goc.chiIndex + 4)));
kiem('tam-phuong: gồm cả chính cung gốc', khopTaiCung(laSo, muc({ sao: [{ ten: saoGoc.ten, quanHe: 'tam-phuong' }] }), goc));
kiem('độ sáng đúng thì khớp', khopTaiCung(laSo, muc({ sao: [{ ten: saoGoc.ten, quanHe: 'o-cung', doSang: [saoGoc.doSang!] }] }), goc));
kiem('độ sáng sai thì không khớp', !khopTaiCung(laSo, muc({ sao: [{ ten: saoGoc.ten, quanHe: 'o-cung', doSang: ['M', 'V', 'D', 'B', 'H'].filter((m) => m !== saoGoc.doSang) }] }), goc));
kiem('khong: sao phải vắng mà có mặt thì không khớp', !khopTaiCung(laSo, muc({ sao: [{ ten: saoGoc.ten, quanHe: 'o-cung' }], khong: [{ ten: saoGoc.ten, quanHe: 'o-cung' }] }), goc));
kiem('cung gốc bị giới hạn: khác cung thì không khớp', !khopTaiCung(laSo, muc({ cung: [goc.tenCung === 'Mệnh' ? 'Phụ Mẫu' : 'Mệnh'], sao: [{ ten: saoGoc.ten, quanHe: 'o-cung' }] }), goc));
kiem('chi của cung gốc đúng thì khớp', khopTaiCung(laSo, muc({ chi: [goc.chi], sao: [{ ten: saoGoc.ten, quanHe: 'o-cung' }] }), goc));

// Giáp: hai sao ở hai cung kề cung gốc
const cungGiap = laSo.cungs.find((c) => phu(theoChi(c.chiIndex - 1)) && phu(theoChi(c.chiIndex + 1)))!;
const trai = phu(theoChi(cungGiap.chiIndex - 1))!.ten, phai = phu(theoChi(cungGiap.chiIndex + 1))!.ten;
kiem('giáp: đủ hai bên thì khớp (đổi thứ tự vẫn khớp)', khopTaiCung(laSo, muc({ sao: [{ ten: phai, quanHe: 'giap' }, { ten: trai, quanHe: 'giap' }] }), cungGiap));
kiem('giáp: hai sao cùng một bên thì không khớp', trai === phai || !khopTaiCung(laSo, muc({ sao: [{ ten: trai, quanHe: 'giap' }, { ten: trai, quanHe: 'giap' }] }), cungGiap) || theoChi(cungGiap.chiIndex + 1).sao.some((s) => s.ten === trai));

// Vô chính diệu + mượn
const vcd = laSo.cungs.find((c) => !chinh(c) && chinh(theoChi(c.chiIndex + 6)));
if (vcd) {
  const muon = chinh(theoChi(vcd.chiIndex + 6))!.ten;
  kiem('muon-tu: cung vô chính diệu mượn chính tinh cung xung thì khớp', khopTaiCung(laSo, muc({ sao: [{ ten: muon, quanHe: 'muon-tu' }], thuocTinh: { voChinhDieu: true } }), vcd));
  kiem('muon-tu: cung có chính tinh thì không khớp', !khopTaiCung(laSo, muc({ sao: [{ ten: muon, quanHe: 'muon-tu' }] }), theoChi(vcd.chiIndex + 6)));
}

// Lọc nhanh theo tên sao + khớp nhiều cung
const ds = [muc({ sao: [{ ten: saoGoc.ten, quanHe: 'o-cung' }] }), muc({ sao: [{ ten: 'Sao Không Có', quanHe: 'o-cung' }] })];
kiem('khopThuVien: sao không có trên lá thì bỏ', khopThuVien(laSo, ds, laSo.cungs.map((c) => c.tenCung)).length === 1);
kiem('khopThuVien: mục bị bác thì bỏ', khopThuVien(laSo, [{ ...ds[0], duyet: 'bi-bac' }], [goc.tenCung]).length === 0);
void quan;

// ---- Bộ kiểm mục ----
const doan = { noiDung: 'TỨ QUAN LỘC CUNG. Tử Vi ở Quan Lộc gặp Tả Phù, Hữu Bật thì công danh hiển đạt, giữ quyền lớn.', duongDeMuc: 'QUAN LỘC' };
const mTot = { dieuKien: { cung: ['Quan Lộc'], sao: [{ ten: 'Tử Vi', quanHe: 'o-cung' as const }, { ten: 'Tả Phù', quanHe: 'tam-phuong' as const }] }, y: 'Công danh thuận, dễ giữ vị trí có quyền quyết định.', cheDo: 'add' as const, trich: 'Tử Vi ở Quan Lộc gặp Tả Phù, Hữu Bật thì công danh hiển đạt' };
kiem('kiemMuc: mục đúng thì đạt', kiemMuc(mTot, doan).dat);
kiem('kiemMuc: câu trích không có trong đoạn thì trượt', !kiemMuc({ ...mTot, trich: 'Tử Vi ở Mệnh gặp Tả Phù thì làm quan to' }, doan).dat);
kiem('kiemMuc: sao không được nhắc trong câu trích thì trượt', !kiemMuc({ ...mTot, dieuKien: { ...mTot.dieuKien, sao: [...mTot.dieuKien.sao, { ten: 'Thiên Mã', quanHe: 'xung' as const }] } }, doan).dat);
kiem('kiemMuc: cung không được nhắc thì trượt', !kiemMuc({ ...mTot, dieuKien: { ...mTot.dieuKien, cung: ['Phu Thê'] } }, doan).dat);
kiem('kiemMuc: câu nghĩa có "bạn" thì trượt', !kiemMuc({ ...mTot, y: 'Bạn có công danh thuận, dễ giữ vị trí có quyền.' }, doan).dat);
kiem('kiemMuc: override không có dấu hiệu trong câu trích thì ép về add', kiemMuc({ ...mTot, cheDo: 'override' as const }, doan).cheDo === 'add');
kiem('kiemMuc: sao không có trong engine thì trượt', !kiemMuc({ ...mTot, dieuKien: { ...mTot.dieuKien, sao: [{ ten: 'Tử Vy', quanHe: 'o-cung' as const }] } }, doan).dat);
kiem('chuanDoSang: phụ tinh "miếu" thành đắc (D)', JSON.stringify(chuanDoSang('Văn Xương', ['M'])) === '["D"]');
kiem('chuanDoSang: chính tinh giữ nguyên thang', JSON.stringify(chuanDoSang('Tử Vi', ['M', 'V'])) === '["M","V"]');
const m1 = muc({ cung: ['Quan Lộc'], sao: [{ ten: 'Tử Vi', quanHe: 'o-cung' }, { ten: 'Tả Phù', quanHe: 'tam-phuong' }] });
const m2 = muc({ cung: ['Quan Lộc'], sao: [{ ten: 'Tả Phù', quanHe: 'tam-phuong' }, { ten: 'Tử Vi', quanHe: 'o-cung' }] });
kiem('khoaGop: thứ tự sao không làm đổi khoá', khoaGop(m1) === khoaGop(m2));
kiem('khoaDieuKien: khác chiều vẫn cùng khoá điều kiện', khoaDieuKien(m1) === khoaDieuKien({ ...m2, nhan: { ...m2.nhan, chieu: 'hung' } }));

console.log(sai ? `\n${sai} CHỖ SAI` : '\nTẤT CẢ ĐỀU ĐÚNG');
process.exit(sai ? 1 : 0);
