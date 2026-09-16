import { lapLaSo } from '../lib/tuvi/ansao';
import { demMucDo, soSanhHaiLaSo } from '../lib/tuvi/hoptuoi';
import { CHI } from '../lib/tuvi/constants';

let loi = 0;
const kiemTra = (dk: boolean, moTa: string) => {
  console.log(`${dk ? '✓' : '✗'} ${moTa}`);
  if (!dk) loi++;
};

// Ty (2008) va Ngo (2014) cach nhau 6 -> luc xung
const ty = lapLaSo({ ngay: 10, thang: 3, nam: 2008, gio: 9, gioiTinh: 'nam', hoTen: 'Tuoi Ty' });
const ngo = lapLaSo({ ngay: 10, thang: 3, nam: 2014, gio: 9, gioiTinh: 'nu', hoTen: 'Tuoi Ngo' });
console.log(`Chi nam: ${CHI[ty.chiNamIndex]} vs ${CHI[ngo.chiNamIndex]}`);
const kqXung = soSanhHaiLaSo(ty, ngo);
const chiXung = kqXung.tieuChi.find((t) => t.ten === 'Địa chi năm sinh')!;
console.log(`  -> ${chiXung.ketQua}`);
kiemTra(chiXung.ketQua.includes('Lục xung'), 'Tý vs Ngọ nhận diện đúng lục xung');
kiemTra(chiXung.mucDo === 'nghich', 'Lục xung xếp vào mức nghịch');

// Than (2004) va Ty (2008) cach nhau 4 -> tam hop
const than = lapLaSo({ ngay: 10, thang: 3, nam: 2004, gio: 9, gioiTinh: 'nam', hoTen: 'Tuoi Than' });
const kqHop = soSanhHaiLaSo(than, ty);
const chiHop = kqHop.tieuChi.find((t) => t.ten === 'Địa chi năm sinh')!;
console.log(`Chi nam: ${CHI[than.chiNamIndex]} vs ${CHI[ty.chiNamIndex]} -> ${chiHop.ketQua}`);
kiemTra(chiHop.ketQua.includes('Tam hợp'), 'Thân vs Tý nhận diện đúng tam hợp');

// Ty (2008) va Suu (2009) tong = 1 -> luc hop
const suu = lapLaSo({ ngay: 10, thang: 3, nam: 2009, gio: 9, gioiTinh: 'nu', hoTen: 'Tuoi Suu' });
const chiLucHop = soSanhHaiLaSo(ty, suu).tieuChi.find((t) => t.ten === 'Địa chi năm sinh')!;
console.log(`Chi nam: ${CHI[ty.chiNamIndex]} vs ${CHI[suu.chiNamIndex]} -> ${chiLucHop.ketQua}`);
kiemTra(chiLucHop.ketQua.includes('Lục hợp'), 'Tý vs Sửu nhận diện đúng lục hợp');

// Toan ven
kiemTra(kqXung.tieuChi.length === 6, `Đủ 6 tiêu chí so sánh (có ${kqXung.tieuChi.length})`);
kiemTra(
  kqXung.tieuChi.every((t) => t.giaiThich.length > 20),
  'Mỗi tiêu chí đều có phần giải thích cho người đọc'
);
const dem = demMucDo(kqXung);
kiemTra(dem.thuan + dem.trung + dem.nghich === 6, 'Đếm mức độ khớp tổng số tiêu chí');

console.log(`\n${loi === 0 ? 'TAT CA DEU DAT.' : `${loi} muc SAI.`}`);
process.exit(loi === 0 ? 0 : 1);
