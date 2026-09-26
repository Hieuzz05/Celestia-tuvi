/**
 * Kiểm tất định cho thư viện tri thức — npx tsx scripts/test-thu-vien.ts
 *
 * Bộ khớp (lib/rag/thu-vien/khop.ts) và bộ kiểm mục (kiem.ts) không gọi model,
 * nên kiểm được bằng lá số dựng từ engine: lấy chính vị trí sao engine an ra,
 * dựng mục có điều kiện đúng / sai, xem bộ khớp trả lời đúng không.
 */
import { lapLaSo, type Cung } from '../lib/tuvi/ansao';
import { khopTaiCung, khopThuVien } from '../lib/rag/thu-vien/khop';
import { chuanDoSang, cungTuDeMuc, dienDoSang, dienDoSangNguCanh, kiemMuc, khoaGop, khoaDieuKien, toHopDongCung } from '../lib/rag/thu-vien/kiem';
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

// ---- Kiểm lượt 2 (KIEN-TRUC 11.8) ----
const dc = toHopDongCung();
kiem('toHopDongCung: Liêm Trinh + Thiên Phủ đồng cung được', dc.has('Liêm Trinh+Thiên Phủ'));
kiem('toHopDongCung: Tử Vi + Liêm Trinh không bao giờ đồng cung', !dc.has('Liêm Trinh+Tử Vi'));
kiem('toHopDongCung: các cặp phủ ≥ 12 chính tinh', new Set([...dc].flatMap((x) => x.split('+'))).size >= 12);
const doanLP = { noiDung: 'Liêm Trinh, Thiên Phủ đồng cung gặp Tả Phù thì công danh bền. Tử Vi, Liêm Trinh đồng cung thì uy quyền.', duongDeMuc: 'QUAN LỘC' };
kiem('kiemMuc: cặp chính tinh không đồng cung được thì trượt', !kiemMuc({ dieuKien: { cung: ['Quan Lộc'], sao: [{ ten: 'Tử Vi', quanHe: 'o-cung' }, { ten: 'Liêm Trinh', quanHe: 'o-cung' }] }, y: 'Có uy quyền trong công việc và dễ được giao việc lớn.', cheDo: 'add', trich: 'Tử Vi, Liêm Trinh đồng cung thì uy quyền' }, doanLP).dat);
kiem('kiemMuc: cặp đồng cung hợp lệ thì đạt', kiemMuc({ dieuKien: { cung: ['Quan Lộc'], sao: [{ ten: 'Liêm Trinh', quanHe: 'o-cung' }, { ten: 'Thiên Phủ', quanHe: 'o-cung' }, { ten: 'Tả Phù', quanHe: 'tam-phuong' }] }, y: 'Công danh bền vững, có người trợ lực trong công việc.', cheDo: 'add', trich: 'Liêm Trinh, Thiên Phủ đồng cung gặp Tả Phù thì công danh bền' }, doanLP).dat);
const doanHam = { noiDung: 'QUAN LỘC. Thái Dương hãm địa ở Quan Lộc thì công danh trắc trở.', duongDeMuc: 'QUAN LỘC' };
const mHam = { dieuKien: { cung: ['Quan Lộc'], sao: [{ ten: 'Thái Dương', quanHe: 'o-cung' as const }] }, y: 'Công danh dễ trắc trở, phải bền bỉ mới giữ được vị trí.', cheDo: 'add' as const, trich: 'Thái Dương hãm địa ở Quan Lộc thì công danh trắc trở' };
kiem('kiemMuc: câu trích nói hãm mà mục không mang độ sáng thì trượt', !kiemMuc(mHam, doanHam).dat);
kiem('kiemMuc: mang độ sáng H thì đạt', kiemMuc({ ...mHam, dieuKien: { ...mHam.dieuKien, sao: [{ ten: 'Thái Dương', quanHe: 'o-cung' as const, doSang: ['H'] }] } }, doanHam).dat);
kiem('kiemMuc: "Tử vi hàm số" không bị nhận là độ sáng', kiemMuc(mTot, { ...doan, noiDung: `Tử vi hàm số. ${doan.noiDung}` }).dat);
kiem('cungTuDeMuc: đề mục nêu một cung thì lấy', cungTuDeMuc('TỨ QUAN LỘC CUNG') === 'Quan Lộc');
kiem('cungTuDeMuc: đề mục nêu hai cung thì không đoán', cungTuDeMuc('MỆNH VÀ QUAN LỘC') === null);
const dkS = { cung: ['Quan Lộc'], sao: [{ ten: 'Tả Phù', quanHe: 'tam-phuong' as const }, { ten: 'Thái Dương', quanHe: 'o-cung' as const }] } as MucThuVien['dieuKien'];
dienDoSang(dkS, 'Gặp Tả Phù mà Thái-Dương hãm địa thì công danh trắc trở');
kiem('dienDoSang: gán H cho sao đứng ngay trước chữ "hãm"', JSON.stringify(dkS.sao[1].doSang) === '["H"]' && !dkS.sao[0].doSang);
const dkK = { cung: [], sao: [{ ten: 'Văn Xương', quanHe: 'o-cung' as const }] } as MucThuVien['dieuKien'];
dienDoSang(dkK, 'Văn Xương miếu vượng thì văn tài xuất chúng');
kiem('dienDoSang: phụ tinh "miếu vượng" thành D', JSON.stringify(dkK.sao[0].doSang) === '["D"]');
const dkN = () => ({ cung: ['Quan Lộc'], sao: [{ ten: 'Thái Dương', quanHe: 'o-cung' as const }] }) as MucThuVien['dieuKien'];
const n1 = dkN(); dienDoSangNguCanh(n1, 'THÁI DƯƠNG — Hãm địa', 'Ở Quan Lộc thì công danh chậm, phải bôn ba.', 'Ở Quan Lộc thì công danh chậm');
kiem('dienDoSangNguCanh: đề mục "Hãm địa" → H', JSON.stringify(n1.sao[0].doSang) === '["H"]');
const n2 = dkN(); dienDoSangNguCanh(n2, 'THÁI DƯƠNG', 'Miếu địa thì sáng sủa. Hãm địa: ở Quan Lộc thì công danh chậm.', 'ở Quan Lộc thì công danh chậm');
kiem('dienDoSangNguCanh: lấy chữ độ sáng GẦN NHẤT trước câu trích', JSON.stringify(n2.sao[0].doSang) === '["H"]');
const n3 = dkN(); dienDoSangNguCanh(n3, 'Tử vi hàm số', 'Sách miêu tả người có ham muốn lớn. Ở Quan Lộc thì công danh chậm.', 'Ở Quan Lộc thì công danh chậm');
kiem('dienDoSangNguCanh: "hàm", "miêu tả", "ham muốn" không bị nhận là độ sáng', !n3.sao[0].doSang);
kiem('kiemMuc: chép sót một chữ vẫn khớp gần nguyên văn', kiemMuc({ ...mTot, trich: 'Tử Vi ở Quan Lộc gặp Tả Phù, Hữu Bật thì công danh rất hiển đạt' }, doan).dat);
kiem('kiemMuc: "gặp sát tinh" nhắc được nhóm lục sát', kiemMuc({ dieuKien: { cung: ['Quan Lộc'], sao: [{ ten: 'Tử Vi', quanHe: 'o-cung' }], nhom: [{ ten: ['Kình Dương', 'Đà La', 'Địa Không'], quanHe: 'tam-phuong', toiThieu: 1 }] }, y: 'Công danh có lúc bị cản trở, phải chịu áp lực lớn.', cheDo: 'add', trich: 'Tử Vi ở Quan Lộc mà gặp sát tinh thì công danh trắc trở' }, { noiDung: 'Tử Vi ở Quan Lộc mà gặp sát tinh thì công danh trắc trở.', duongDeMuc: 'QUAN LỘC' }).dat);
kiem('kiemMuc: gạch nối trong sách ("Tử-Vi") vẫn khớp nguyên văn', kiemMuc(mTot, { ...doan, noiDung: doan.noiDung.replace('Tử Vi', 'Tử-Vi') }).dat);

console.log(sai ? `\n${sai} CHỖ SAI` : '\nTẤT CẢ ĐỀU ĐÚNG');
process.exit(sai ? 1 : 0);
