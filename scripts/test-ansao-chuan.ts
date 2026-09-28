/**
 * Kiểm engine an sao TỰ ĐỘNG — chạy: npx tsx scripts/test-ansao-chuan.ts
 *
 * Khác scripts/test-ansao.ts (in lá số ra để so bằng mắt), tệp này chỉ in
 * ĐÚNG/SAI và thoát mã 1 khi sai, để CI chặn được. Ba lớp:
 *
 *  1. Công thức sách: với ~2.000 ngày sinh quét đều 1930–2035, tính lại vị trí
 *     các sao bằng công thức an sao gốc VIẾT ĐỘC LẬP ở đây (không gọi hằng số
 *     của engine), rồi so với lá số engine lập ra. Chỉ kiểm các sao mà sách Nam
 *     phái thống nhất; sao có dị bản (Khôi Việt, Hỏa Linh, Hóa Khoa năm
 *     Mậu/Canh/Nhâm...) để lớp 3 giữ.
 *  2. Lịch: mốc Tết và tháng nhuận đã biết, ngày không tồn tại.
 *  3. Mẫu đóng băng: 60 lá số lưu ở scripts/mau-ansao.json. Engine đổi kết quả
 *     mà PHUONG_PHAP.phienBan không đổi là SAI (luật ở docs/bay/engine.md).
 *     Cố ý đổi quy tắc: tăng phienBan rồi chạy lại với --cap-nhat.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { lapLaSo, type LaSo, type ThongTinSinh } from '../lib/tuvi/ansao';
import { solarToLunar, lunarToSolar } from '../lib/tuvi/lunar';
import { laNgayDuongCoThat } from '../lib/tuvi/kiem-ngay';
import { PHUONG_PHAP } from '../lib/tuvi/phuong-phap';

const m12 = (n: number) => ((n % 12) + 12) % 12;
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

let soLoi = 0;
const loiDaIn = new Set<string>();
function sai(nhom: string, chiTiet: string) {
  soLoi++;
  // Một quy tắc sai thường sai hàng trăm lá — in mỗi nhóm tối đa 3 dòng
  const dem = [...loiDaIn].filter((k) => k.startsWith(nhom + '#')).length;
  if (dem < 3) console.log(`  SAI [${nhom}] ${chiTiet}`);
  loiDaIn.add(`${nhom}#${soLoi}`);
}

// ---------------------------------------------------------------------------
// Lớp 1 — công thức sách, viết lại độc lập
// ---------------------------------------------------------------------------

/** Hành nạp âm theo mẹo cộng số: can (Giáp Ất 1 … Nhâm Quý 5) + chi (Tý Sửu Ngọ Mùi 0,
 * Dần Mão Thân Dậu 1, Thìn Tỵ Tuất Hợi 2), trừ 5 nếu quá 5: 1 Kim 2 Thủy 3 Hỏa 4 Thổ 5 Mộc */
function hanhNapAm(can: number, chi: number): string {
  const soCan = Math.floor(can / 2) + 1;
  const soChi = [0, 0, 1, 1, 2, 2, 0, 0, 1, 1, 2, 2][chi];
  const tong = ((soCan + soChi - 1) % 5) + 1;
  return ['', 'Kim', 'Thủy', 'Hỏa', 'Thổ', 'Mộc'][tong];
}
const CUC_CUA_HANH: Record<string, number> = { Thủy: 2, Mộc: 3, Kim: 4, Thổ: 5, Hỏa: 6 };

/** Tử Vi: tìm bội số của cục ≥ ngày, bù lẻ thì lùi, bù chẵn thì tiến, đếm từ Dần */
function tuViTheoSach(cuc: number, ngay: number): number {
  const bu = (cuc - (ngay % cuc)) % cuc;
  const thuong = (ngay + bu) / cuc;
  return m12(2 + thuong - 1 + (bu % 2 === 0 ? bu : -bu));
}

const LOC_TON = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0]; // Dần Mão Tỵ Ngọ Tỵ Ngọ Thân Dậu Hợi Tý
const CAN_DAN = [2, 4, 6, 8, 0]; // ngũ hổ độn
const TRIET: [number, number][] = [[8, 9], [6, 7], [4, 5], [2, 3], [0, 1]];
const THIEN_MA_THEO_TAM_HOP = [2, 11, 8, 5]; // Thân Tý Thìn→Dần, Tỵ Dậu Sửu→Hợi, Dần Ngọ Tuất→Thân, Hợi Mão Mùi→Tỵ
const TRUONG_SINH_THEO_CUC: Record<number, number> = { 2: 8, 3: 11, 4: 5, 5: 8, 6: 2 };

/** Tứ Hóa mà các sách Nam phái KHÔNG tranh cãi. null = có dị bản, bỏ qua */
const TU_HOA_SACH: (string | null)[][] = [
  ['Liêm Trinh', 'Phá Quân', 'Vũ Khúc', 'Thái Dương'],
  ['Thiên Cơ', 'Thiên Lương', 'Tử Vi', 'Thái Âm'],
  ['Thiên Đồng', 'Thiên Cơ', 'Văn Xương', 'Liêm Trinh'],
  ['Thái Âm', 'Thiên Đồng', 'Thiên Cơ', 'Cự Môn'],
  ['Tham Lang', 'Thái Âm', null, 'Thiên Cơ'],
  ['Vũ Khúc', 'Tham Lang', 'Thiên Lương', 'Văn Khúc'],
  ['Thái Dương', 'Vũ Khúc', null, null],
  ['Cự Môn', 'Thái Dương', 'Văn Khúc', 'Văn Xương'],
  ['Thiên Lương', 'Tử Vi', null, 'Vũ Khúc'],
  ['Phá Quân', 'Cự Môn', 'Thái Âm', 'Tham Lang'],
];

const TEN_CUNG_THUAN = [
  'Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc',
  'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ',
];

function cungCua(ls: LaSo, ten: string): number[] {
  return ls.cungs.filter((c) => c.sao.some((s) => s.ten === ten)).map((c) => c.chiIndex);
}

function kiemMotLaSo(input: ThongTinSinh) {
  const ls = lapLaSo(input);
  const nhan = `${input.ngay}/${input.thang}/${input.nam} ${input.gio}h ${input.gioiTinh}`;
  const { amLich } = ls.thongTin;
  const can = ls.canNamIndex;
  const chi = ls.chiNamIndex;
  const gio = CHI.indexOf(ls.thongTin.chiGio);
  const thang = amLich.thang;
  const ngay = amLich.ngay;

  const dung = (nhom: string, ten: string, viTri: number) => {
    const o = cungCua(ls, ten);
    if (o.length !== 1 || o[0] !== m12(viTri))
      sai(nhom, `${nhan}: ${ten} ở ${o.map((i) => CHI[i]).join('+') || '(không có)'}, sách: ${CHI[m12(viTri)]}`);
  };

  // Năm âm lịch → can chi năm
  if (can !== ((amLich.nam + 6) % 10) || chi !== ((amLich.nam + 8) % 12))
    sai('can-chi-nam', `${nhan}: năm âm ${amLich.nam} ra can ${can} chi ${chi}`);

  // Mệnh, Thân: khởi Dần thuận tới tháng, nghịch (Mệnh) / thuận (Thân) tới giờ
  const menh = m12(2 + thang - 1 - gio);
  const than = m12(2 + thang - 1 + gio);
  if (ls.menhIndex !== menh) sai('menh', `${nhan}: Mệnh ${CHI[ls.menhIndex]}, sách ${CHI[menh]}`);
  if (ls.thanIndex !== than) sai('than', `${nhan}: Thân ${CHI[ls.thanIndex]}, sách ${CHI[than]}`);

  // 12 cung: can theo ngũ hổ độn, tên đi thuận từ Mệnh
  for (const c of ls.cungs) {
    const canCung = (CAN_DAN[can % 5] + m12(c.chiIndex - 2)) % 10;
    if (c.can !== ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'][canCung])
      sai('can-cung', `${nhan}: cung ${c.chi} can ${c.can}`);
    if (c.tenCung !== TEN_CUNG_THUAN[m12(c.chiIndex - menh)])
      sai('ten-cung', `${nhan}: ${c.chi} là ${c.tenCung}, sách ${TEN_CUNG_THUAN[m12(c.chiIndex - menh)]}`);
  }

  // Cục: hành nạp âm của can chi cung Mệnh
  const canMenh = (CAN_DAN[can % 5] + m12(menh - 2)) % 10;
  const cuc = CUC_CUA_HANH[hanhNapAm(canMenh, menh)];
  if (ls.cuc.so !== cuc) sai('cuc', `${nhan}: cục ${ls.cuc.so}, sách ${cuc}`);
  if (ls.banMenh.hanh !== hanhNapAm(can, chi))
    sai('ban-menh', `${nhan}: bản mệnh ${ls.banMenh.hanh}, sách ${hanhNapAm(can, chi)}`);

  // 14 chính tinh: mỗi sao đúng một lần, đúng chỗ
  const tv = tuViTheoSach(cuc, ngay);
  const tp = m12(4 - tv); // Tử Vi – Thiên Phủ đối xứng qua trục Dần–Thân
  const chinh: [string, number][] = [
    ['Tử Vi', tv], ['Thiên Cơ', tv - 1], ['Thái Dương', tv - 3], ['Vũ Khúc', tv - 4],
    ['Thiên Đồng', tv - 5], ['Liêm Trinh', tv - 8], ['Thiên Phủ', tp], ['Thái Âm', tp + 1],
    ['Tham Lang', tp + 2], ['Cự Môn', tp + 3], ['Thiên Tướng', tp + 4],
    ['Thiên Lương', tp + 5], ['Thất Sát', tp + 6], ['Phá Quân', tp + 10],
  ];
  for (const [ten, vt] of chinh) dung('chinh-tinh', ten, vt);
  const soChinh = ls.cungs.reduce((s, c) => s + c.sao.filter((x) => x.loai === 'chinh-tinh').length, 0);
  if (soChinh !== 14) sai('chinh-tinh', `${nhan}: có ${soChinh} chính tinh`);

  // Theo can năm
  dung('loc-ton', 'Lộc Tồn', LOC_TON[can]);
  dung('kinh-da', 'Kình Dương', LOC_TON[can] + 1);
  dung('kinh-da', 'Đà La', LOC_TON[can] - 1);
  dung('vong-loc-ton', 'Bác Sĩ', LOC_TON[can]);

  // Theo tháng, theo giờ
  dung('ta-huu', 'Tả Phù', 4 + thang - 1);
  dung('ta-huu', 'Hữu Bật', 10 - (thang - 1));
  dung('xuong-khuc', 'Văn Xương', 10 - gio);
  dung('xuong-khuc', 'Văn Khúc', 4 + gio);
  dung('khong-kiep', 'Địa Kiếp', 11 + gio);
  dung('khong-kiep', 'Địa Không', 11 - gio);

  // Theo chi năm
  dung('thai-tue', 'Thái Tuế', chi);
  dung('thien-ma', 'Thiên Mã', THIEN_MA_THEO_TAM_HOP[chi % 4]);
  dung('co-dinh', 'Thiên La', 4);
  dung('co-dinh', 'Địa Võng', 10);
  const noBoc = ls.cungs.find((c) => c.tenCung === 'Nô Bộc')!.chiIndex;
  const tatAch = ls.cungs.find((c) => c.tenCung === 'Tật Ách')!.chiIndex;
  dung('co-dinh', 'Thiên Thương', noBoc);
  dung('co-dinh', 'Thiên Sứ', tatAch);

  // Tứ Hóa bám theo sao gốc
  const hoa = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'];
  TU_HOA_SACH[can].forEach((saoGoc, i) => {
    if (!saoGoc) return;
    const goc = cungCua(ls, saoGoc)[0];
    dung('tu-hoa', hoa[i], goc);
  });

  // Tuần: hai chi "rỗng" của tuần giáp chứa năm sinh. Triệt: theo can năm
  const tuan = ls.cungs.filter((c) => c.coTuan).map((c) => c.chiIndex).sort((a, b) => a - b);
  const tuanSach = [m12(chi - can + 10), m12(chi - can + 11)].sort((a, b) => a - b);
  if (tuan.join() !== tuanSach.join()) sai('tuan', `${nhan}: Tuần ${tuan.map((i) => CHI[i])}, sách ${tuanSach.map((i) => CHI[i])}`);
  const triet = ls.cungs.filter((c) => c.coTriet).map((c) => c.chiIndex).sort((a, b) => a - b);
  if (triet.join() !== TRIET[can % 5].join()) sai('triet', `${nhan}: Triệt ${triet.map((i) => CHI[i])}`);

  // Dương Nam / Âm Nữ đi thuận, còn lại đi nghịch — đại vận và Tràng Sinh cùng chiều
  const thuan = (can % 2 === 0) === (input.gioiTinh === 'nam');
  const chieu = thuan ? 1 : -1;
  for (let i = 0; i < 12; i++) {
    const c = ls.cungs[m12(menh + i * chieu)];
    if (c.daiVan?.tuTuoi !== cuc + i * 10) {
      sai('dai-van', `${nhan}: cung ${c.chi} đại vận từ ${c.daiVan?.tuTuoi}, sách ${cuc + i * 10}`);
      break;
    }
  }
  const tsSach = m12(TRUONG_SINH_THEO_CUC[cuc]);
  if (ls.cungs[tsSach].trangSinh !== 'Trường Sinh') sai('trang-sinh', `${nhan}: Trường Sinh không ở ${CHI[tsSach]}`);
  if (ls.cungs[m12(tsSach + 4 * chieu)].trangSinh !== 'Đế Vượng') sai('trang-sinh', `${nhan}: Đế Vượng sai chiều`);
}

/** Bộ sinh số giả ngẫu nhiên cố định hạt giống — mỗi lần chạy quét đúng cùng một tập ngày */
function* ngaySinhQuet(so: number): Generator<ThongTinSinh> {
  let s = 20260928;
  const r = (n: number) => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s % n;
  };
  for (let i = 0; i < so; i++) {
    const nam = 1930 + r(106);
    const thang = 1 + r(12);
    const ngay = 1 + r(28); // 1–28: ngày nào cũng có thật
    yield { ngay, thang, nam, gio: r(24), gioiTinh: r(2) ? 'nam' : 'nu' };
  }
}

console.log('### Lớp 1 — công thức an sao, 2.000 lá số quét 1930–2035');
const truoc1 = soLoi;
for (const input of ngaySinhQuet(2000)) kiemMotLaSo(input);
// Biên giờ: 23h là Tý của NGÀY HÔM SAU, 0h là Tý của chính ngày đó, 1h đã sang Sửu
for (const gio of [0, 1, 11, 12, 22, 23]) kiemMotLaSo({ ngay: 12, thang: 5, nam: 1990, gio, gioiTinh: 'nam' });
{
  const tyMuon = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 23, gioiTinh: 'nam' });
  const homSau = solarToLunar(13, 5, 1990);
  if (tyMuon.thongTin.amLich.ngay !== homSau.day || tyMuon.thongTin.chiGio !== 'Tý')
    sai('ty-muon', '23h ngày 12/5/1990 phải an theo ngày âm của 13/5/1990, giờ Tý');
  if (lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 1, gioiTinh: 'nam' }).thongTin.chiGio !== 'Sửu')
    sai('bien-gio', '1h phải là giờ Sửu');
}
console.log(soLoi === truoc1 ? '✓ Khớp công thức sách' : `✗ ${soLoi - truoc1} chỗ lệch`);

// ---------------------------------------------------------------------------
// Lớp 2 — lịch
// ---------------------------------------------------------------------------

console.log('\n### Lớp 2 — lịch âm dương');
const truoc2 = soLoi;
// [ngày dương] → [ngày âm, tháng âm, năm âm, nhuận]
const MOC: [number, number, number, number, number, number, boolean][] = [
  [27, 1, 1990, 1, 1, 1990, false],
  [31, 1, 1995, 1, 1, 1995, false],
  [5, 2, 2000, 1, 1, 2000, false],
  [14, 2, 2010, 1, 1, 2010, false],
  [28, 1, 2017, 1, 1, 2017, false],
  [25, 1, 2020, 1, 1, 2020, false],
  [12, 2, 2021, 1, 1, 2021, false],
  [1, 2, 2022, 1, 1, 2022, false],
  [22, 1, 2023, 1, 1, 2023, false],
  [10, 2, 2024, 1, 1, 2024, false],
  [29, 1, 2025, 1, 1, 2025, false],
  [17, 2, 2026, 1, 1, 2026, false],
  [23, 5, 2020, 1, 4, 2020, true], // mùng 1 tháng 4 nhuận Canh Tý
  [22, 3, 2023, 1, 2, 2023, true], // mùng 1 tháng 2 nhuận Quý Mão
  [25, 7, 2025, 1, 6, 2025, true], // mùng 1 tháng 6 nhuận Ất Tỵ
];
for (const [d, m, y, ld, lm, ly, nhuan] of MOC) {
  const a = solarToLunar(d, m, y);
  if (a.day !== ld || a.month !== lm || a.year !== ly || Boolean(a.isLeapMonth) !== nhuan)
    sai('lich', `${d}/${m}/${y} → ${a.day}/${a.month}${a.isLeapMonth ? 'N' : ''}/${a.year}, đúng: ${ld}/${lm}${nhuan ? 'N' : ''}/${ly}`);
  const b = lunarToSolar(a.day, a.month, a.year, a.isLeapMonth);
  if (!b || b.day !== d || b.month !== m || b.year !== y) sai('lich', `${d}/${m}/${y} đổi đi đổi lại không về chỗ cũ`);
}
// Ngày không có thật: engine không tự chặn (31/4 lặng lẽ thành 1/5), nên API phải chặn trước
const KHONG_CO_THAT: [number, number, number][] = [[31, 4, 1990], [31, 2, 2000], [30, 2, 2000], [29, 2, 2001], [31, 6, 1985], [0, 1, 2000], [32, 1, 2000]];
for (const [d, m, y] of KHONG_CO_THAT) if (laNgayDuongCoThat(d, m, y)) sai('ngay-co-that', `${d}/${m}/${y} phải bị coi là không có thật`);
for (const [d, m, y] of [[29, 2, 2000], [29, 2, 2024], [31, 12, 1999], [30, 4, 1990]] as const)
  if (!laNgayDuongCoThat(d, m, y)) sai('ngay-co-that', `${d}/${m}/${y} là ngày có thật`);
console.log(soLoi === truoc2 ? '✓ Lịch khớp mốc đã biết' : `✗ ${soLoi - truoc2} chỗ lệch`);

// ---------------------------------------------------------------------------
// Lớp 3 — mẫu đóng băng
// ---------------------------------------------------------------------------

console.log('\n### Lớp 3 — 60 lá số mẫu đóng băng');
const TEP_MAU = join(__dirname, 'mau-ansao.json');

function vanTay(ls: LaSo): string {
  const t = ls.thongTin;
  const dau = `${t.canChiNam}|${t.canChiThang}|${t.canChiNgay}|${t.canChiGio}|${ls.cuc.ten}|${ls.banMenh.ten}|${ls.menhChu}|${ls.thanChu}`;
  const cung = ls.cungs.map((c) =>
    [
      c.chi, c.tenCung, c.trangSinh, c.daiVan?.tuTuoi ?? '',
      (c.coTuan ? 'Tuần' : '') + (c.coTriet ? 'Triệt' : ''),
      c.sao.map((s) => `${s.ten}${s.doSang ? '/' + s.doSang : ''}`).sort().join(','),
    ].join(':')
  );
  return [dau, ...cung].join('\n');
}

const MAU: ThongTinSinh[] = [
  { ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' }, // máy A
  { ngay: 24, thang: 8, nam: 2000, gio: 9, gioiTinh: 'nam' }, // máy B
  { ngay: 12, thang: 5, nam: 1990, gio: 23, gioiTinh: 'nu' }, // Tý muộn
  { ngay: 29, thang: 2, nam: 2000, gio: 0, gioiTinh: 'nu' }, // nhuận dương lịch
  { ngay: 23, thang: 5, nam: 2020, gio: 12, gioiTinh: 'nam' }, // tháng nhuận âm
  { ngay: 31, thang: 12, nam: 1999, gio: 22, gioiTinh: 'nu' },
  ...[...ngaySinhQuet(54)].map((x, i) => ({ ...x, ngay: 1 + ((x.ngay + i) % 28) })),
];

type TepMau = { phienBan: string; mau: Record<string, string> };
const hienTai: TepMau = {
  phienBan: PHUONG_PHAP.phienBan,
  mau: Object.fromEntries(MAU.map((x) => [`${x.ngay}/${x.thang}/${x.nam} ${x.gio}h ${x.gioiTinh}`, vanTay(lapLaSo(x))])),
};

if (process.argv.includes('--cap-nhat')) {
  writeFileSync(TEP_MAU, JSON.stringify(hienTai, null, 1) + '\n');
  console.log(`✓ Đã ghi lại ${MAU.length} mẫu với phiên bản ${hienTai.phienBan}`);
} else if (!existsSync(TEP_MAU)) {
  sai('mau', 'Chưa có scripts/mau-ansao.json — chạy với --cap-nhat để tạo');
} else {
  const cu: TepMau = JSON.parse(readFileSync(TEP_MAU, 'utf8'));
  const lech = Object.keys(hienTai.mau).filter((k) => cu.mau[k] !== hienTai.mau[k]);
  if (lech.length === 0 && cu.phienBan === hienTai.phienBan) {
    console.log(`✓ ${MAU.length} lá số khớp mẫu (phiên bản ${cu.phienBan})`);
  } else if (lech.length > 0 && cu.phienBan === hienTai.phienBan) {
    for (const k of lech.slice(0, 3)) {
      const a = (cu.mau[k] ?? '').split('\n');
      const b = hienTai.mau[k].split('\n');
      const dong = b.findIndex((x, i) => x !== a[i]);
      sai('mau', `${k}\n      mẫu : ${a[dong]}\n      giờ : ${b[dong]}`);
    }
    console.log(
      `✗ ${lech.length} lá số đổi kết quả nhưng PHUONG_PHAP.phienBan vẫn là ${cu.phienBan}.\n` +
        '  Nếu là lỗi: sửa lại engine. Nếu cố ý đổi quy tắc: tăng phienBan trong\n' +
        '  lib/tuvi/phuong-phap.ts rồi chạy lại với --cap-nhat.'
    );
  } else {
    sai('mau', `phienBan đã đổi (${cu.phienBan} → ${hienTai.phienBan}) — soát lại rồi chạy với --cap-nhat`);
  }
}

console.log(soLoi === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG' : `\n${soLoi} LỖI`);
process.exit(soLoi === 0 ? 0 : 1);
