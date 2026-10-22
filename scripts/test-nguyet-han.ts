/**
 * X2 — offline. A–F là đáp án ĐẾM TAY ĐỘC LẬP đã được chuyên gia kiểm,
 * theo Hàm số:325 và Hà Thúc Hồng:981; KHÔNG phải ví dụ có sẵn trong sách.
 * Không sinh lại đáp án bằng hàm đang kiểm. Không đọc env/DB hoặc gọi model.
 */
import assert from 'node:assert/strict';
import { cungNguyetHan, cungTieuHan, lapLaSo, type LaSo } from '../lib/tuvi/ansao';
import { hourToChi } from '../lib/tuvi/lunar';

const CA = [
  { ten: 'A', tieu: 10, thangSinh: 1, gio: 0, tuoi: 1, gioiTinh: 'nam', thangXem: 1, gieng: 10, ketQua: 10 },
  { ten: 'B', tieu: 10, thangSinh: 5, gio: 6, tuoi: 1, gioiTinh: 'nam', thangXem: 1, gieng: 9, ketQua: 9 },
  { ten: 'C', tieu: 1, thangSinh: 12, gio: 22, tuoi: 4, gioiTinh: 'nam', thangXem: 12, gieng: 1, ketQua: 0 },
  { ten: 'D', tieu: 7, thangSinh: 2, gio: 21, tuoi: 4, gioiTinh: 'nu', thangXem: 12, gieng: 5, ketQua: 4 },
  { ten: 'E', tieu: 0, thangSinh: 12, gio: 0, tuoi: 3, gioiTinh: 'nam', thangXem: 1, gieng: 1, ketQua: 1 },
  { ten: 'F', tieu: 11, thangSinh: 1, gio: 2, tuoi: 2, gioiTinh: 'nam', thangXem: 2, gieng: 0, ketQua: 1 },
] as const;
// Fixture kỹ thuật chỉ thay đầu vào hàm đang kiểm, không giả là lá số sách.
const goc = lapLaSo({ ngay: 3, thang: 3, nam: 1985, gio: 10, gioiTinh: 'nu' });
function fixture(c: typeof CA[number]): LaSo {
  return { ...goc, chiNamIndex: 0, thongTin: { ...goc.thongTin, gio: c.gio, gioiTinh: c.gioiTinh,
    amLich: { ...goc.thongTin.amLich, thang: c.thangSinh } } };
}
let soKiem = 0;
function kiem(ten: string, fn: () => void) { fn(); soKiem++; console.log('ĐẠT: ' + ten); }
for (const c of CA) {
  kiem('Đếm tay ' + c.ten, () => {
    const ls = fixture(c);
    assert.equal(cungTieuHan(ls, c.tuoi), c.tieu, 'mốc tiểu hạn fixture không được âm thầm đổi');
    assert.equal(cungNguyetHan(ls, c.tuoi, 1), c.gieng, 'sai điểm khởi tháng Giêng');
    assert.equal(cungNguyetHan(ls, c.tuoi, c.thangXem), c.ketQua, 'sai tháng xem');
    const thang = Array.from({ length: 12 }, (_, i) => cungNguyetHan(ls, c.tuoi, i + 1));
    assert.equal(new Set(thang).size, 12);
    for (let i = 1; i < 12; i++) assert.equal(thang[i], (thang[i - 1] + 1) % 12, 'tháng tiếp phải thuận một cung');
  });
}
kiem('Dùng tháng sinh âm đã lưu, không lấy tháng dương đầu vào', () => {
  const ls = fixture(CA[1]);
  assert.equal(cungNguyetHan({ ...ls, thongTin: { ...ls.thongTin, thang: 11 } }, 1, 1), 9);
});
kiem('Hai giờ trong cùng chi giờ cho cùng cung tháng', () => {
  for (const gio of [5, 6]) {
    const ls = fixture(CA[1]); ls.thongTin.gio = gio;
    assert.equal(hourToChi(gio), 3);
    assert.equal(cungNguyetHan(ls, 1, 1), 9);
  }
});
kiem('Tý muộn qua tháng/năm âm: dùng tháng đã hiệu chỉnh, không đổi lịch hai lần', () => {
  const muon = lapLaSo({ ngay: 9, thang: 2, nam: 2024, gio: 23, gioiTinh: 'nu' });
  const som = lapLaSo({ ngay: 10, thang: 2, nam: 2024, gio: 0, gioiTinh: 'nu' });
  assert.deepEqual(muon.thongTin.amLich, { ngay: 1, thang: 1, nam: 2024, nhuan: false });
  assert.deepEqual(muon.thongTin.amLich, som.thongTin.amLich);
  assert.equal(cungNguyetHan(muon, 1, 1), cungTieuHan(muon, 1), 'Giêng + Tý không dịch mốc');
  for (let m = 1; m <= 12; m++) assert.equal(cungNguyetHan(muon, 1, m), cungNguyetHan(som, 1, m));
});
console.log('TẤT CẢ ĐẠT: ' + soKiem + ' nhóm nguyệt hạn, offline.');
