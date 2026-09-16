/**
 * Engine an sao Tử Vi - hệ Nam phái.
 * Toàn bộ tính toán thuần TypeScript, không phụ thuộc AI hay I/O.
 */

import {
  CAN,
  CAN_CUNG_DAN,
  CHI,
  CUC_THEO_HANH,
  KHOI_HOA_TINH,
  KHOI_LINH_TINH,
  KHOI_TIEU_HAN,
  KHOI_TRUONG_SINH,
  NAP_AM,
  type NguHanh,
  type Sao,
  TEN_CUNG,
  TU_HOA,
  VI_TRI_DAO_HOA,
  VI_TRI_KIEP_SAT,
  VI_TRI_LOC_TON,
  VI_TRI_THIEN_KHOI,
  VI_TRI_THIEN_MA,
  VI_TRI_THIEN_VIET,
  VI_TRI_DUONG_PHU,
  VI_TRI_HOA_CAI,
  VI_TRI_LUU_HA,
  VI_TRI_PHA_TOAI,
  VI_TRI_QUOC_AN,
  VI_TRI_THIEN_PHUC,
  VI_TRI_THIEN_QUAN,
  VI_TRI_THIEN_TRU,
  VI_TRI_TRIET,
  VONG_LOC_TON,
  VONG_THAI_TUE,
  VONG_TRANG_SINH,
  nhomTamHop,
  quanHeNguHanh,
  viTriCoThanQuaTu,
} from './constants';
import { doSangCuaSao } from './dosang';
import { hourToChi, isLateZiHour, jdFromDate, jdToDate, solarToLunar } from './lunar';

export type GioiTinh = 'nam' | 'nu';

export interface ThongTinSinh {
  /** Ngày sinh dương lịch */
  ngay: number;
  thang: number;
  nam: number;
  /** Giờ sinh 0-23 */
  gio: number;
  phut?: number;
  gioiTinh: GioiTinh;
  hoTen?: string;
}

export interface Cung {
  /** 0 = Tý ... 11 = Hợi */
  chiIndex: number;
  chi: string;
  can: string;
  /** Tên cung: Mệnh, Phụ Mẫu... */
  tenCung: string;
  laCungMenh: boolean;
  laCungThan: boolean;
  sao: Sao[];
  /** Đại vận: khoảng tuổi cai quản bởi cung này */
  daiVan?: { tuTuoi: number; denTuoi: number };
  /** Sao vòng Tràng Sinh đóng tại cung (hiển thị ở footer ô cung) */
  trangSinh: string;
  coTuan: boolean;
  coTriet: boolean;
}

export interface LaSo {
  thongTin: ThongTinSinh & {
    /** Ngày sinh âm lịch */
    amLich: { ngay: number; thang: number; nam: number; nhuan: boolean };
    canChiNam: string;
    canChiThang: string;
    canChiNgay: string;
    canChiGio: string;
    chiGio: string;
  };
  canNamIndex: number;
  chiNamIndex: number;
  menhIndex: number;
  thanIndex: number;
  /** Cung an Thân nằm ở cung chức năng nào (VD: "Thiên Di") */
  thanCuCung: string;
  cuc: { so: number; ten: string; hanh: NguHanh };
  menhChu: string;
  thanChu: string;
  /** Bản Mệnh = nạp âm của can chi năm sinh (VD: Dương Liễu Mộc) */
  banMenh: { ten: string; hanh: NguHanh };
  /** Nạp âm của can chi cung Mệnh — cơ sở xác định Cục */
  napAmCungMenh: string;
  amDuong: string;
  /** "Âm Dương thuận lý" (Dương Nam / Âm Nữ) hoặc "Âm Dương nghịch lý" */
  amDuongThuanLy: string;
  /** Quan hệ sinh khắc giữa bản Mệnh (nạp âm) và Cục */
  menhCucQuanHe: string;
  cungs: Cung[];
}

const mod12 = (n: number) => ((n % 12) + 12) % 12;
const mod10 = (n: number) => ((n % 10) + 10) % 10;

/** Vị trí trong vòng lục thập hoa giáp (0-59) từ can & chi */
function viTriHoaGiap(can: number, chi: number): number {
  for (let i = 0; i < 60; i++) {
    if (i % 10 === can && i % 12 === chi) return i;
  }
  return 0;
}

function napAmCua(can: number, chi: number) {
  return NAP_AM[Math.floor(viTriHoaGiap(can, chi) / 2)];
}

/** Can chi ngày từ số Julian: JD 2415021 (1/1/1900) là ngày Giáp Tuất */
function canChiNgay(jd: number): { can: number; chi: number } {
  return { can: mod10(jd + 9), chi: mod12(jd + 1) };
}

/** Mệnh chủ theo chi cung Mệnh */
const MENH_CHU = [
  'Tham Lang',
  'Cự Môn',
  'Lộc Tồn',
  'Văn Khúc',
  'Liêm Trinh',
  'Vũ Khúc',
  'Phá Quân',
  'Vũ Khúc',
  'Liêm Trinh',
  'Văn Khúc',
  'Lộc Tồn',
  'Cự Môn',
];

/** Thân chủ theo chi năm sinh */
const THAN_CHU = [
  'Linh Tinh',
  'Thiên Tướng',
  'Thiên Lương',
  'Thiên Đồng',
  'Văn Xương',
  'Thiên Cơ',
  'Hỏa Tinh',
  'Thiên Tướng',
  'Thiên Lương',
  'Thiên Đồng',
  'Văn Xương',
  'Thiên Cơ',
];

/** Vị trí sao Tử Vi theo cục số và ngày sinh âm lịch */
export function viTriTuVi(cuc: number, ngayAm: number): number {
  const du = ngayAm % cuc;
  let soCung: number;
  if (du === 0) {
    soCung = ngayAm / cuc;
  } else {
    const muon = cuc - du;
    const thuong = (ngayAm + muon) / cuc;
    soCung = muon % 2 === 0 ? thuong + muon : thuong - muon;
  }
  // Đếm từ cung Dần (index 2), cung thứ nhất chính là Dần
  return mod12(2 + soCung - 1);
}

export function lapLaSo(input: ThongTinSinh): LaSo {
  const { ngay, thang, nam, gio, gioiTinh } = input;

  // Giờ Tý sớm (23h): theo quy ước tử vi tính sang ngày hôm sau
  const jdSinh = jdFromDate(ngay, thang, nam) + (isLateZiHour(gio) ? 1 : 0);
  const solarHieuChinh = jdToDate(jdSinh);
  const am = solarToLunar(solarHieuChinh.day, solarHieuChinh.month, solarHieuChinh.year);

  const canNam = mod10(am.year + 6);
  const chiNam = mod12(am.year + 8);
  const chiGio = hourToChi(gio);
  const thangAm = am.month;
  const ngayAm = am.day;

  // Can chi tháng: ngũ hổ độn, tháng Giêng là tháng Dần
  const canCungDan = CAN_CUNG_DAN[canNam % 5];
  const canThang = mod10(canCungDan + (thangAm - 1));
  const chiThang = mod12(1 + thangAm);

  const ngayCanChi = canChiNgay(jdSinh);
  // Can giờ: ngũ thử độn - giờ Tý của ngày Giáp/Kỷ là Giáp Tý
  const canGio = mod10(ngayCanChi.can * 2 + chiGio);

  // Cung Mệnh: khởi Dần đếm thuận tới tháng sinh, rồi đếm nghịch tới giờ sinh
  const cungThang = mod12(2 + thangAm - 1);
  const menhIndex = mod12(cungThang - chiGio);
  const thanIndex = mod12(cungThang + chiGio);

  // Cục: nạp âm của can chi cung Mệnh
  const canCungMenh = mod10(canCungDan + mod12(menhIndex - 2));
  const napAmCungMenh = napAmCua(canCungMenh, menhIndex);
  const cucInfo = CUC_THEO_HANH[napAmCungMenh.hanh];
  const cucSo = cucInfo.so;
  // Bản mệnh: nạp âm của can chi năm sinh
  const banMenh = napAmCua(canNam, chiNam);

  const duongNamAmNu = (canNam % 2 === 0) === (gioiTinh === 'nam');
  const chieu = duongNamAmNu ? 1 : -1;

  // Khởi tạo 12 cung
  const cungs: Cung[] = Array.from({ length: 12 }, (_, i) => ({
    chiIndex: i,
    chi: CHI[i],
    can: CAN[mod10(canCungDan + mod12(i - 2))],
    tenCung: TEN_CUNG[mod12(i - menhIndex)],
    laCungMenh: i === menhIndex,
    laCungThan: i === thanIndex,
    sao: [] as Sao[],
    trangSinh: '',
    coTuan: false,
    coTriet: false,
  }));

  const them = (
    cungIndex: number,
    ten: string,
    loai: Sao['loai'],
    tinhChat: Sao['tinhChat'] = 'trung'
  ) => {
    const idx = mod12(cungIndex);
    cungs[idx].sao.push({ ten, loai, tinhChat, doSang: doSangCuaSao(ten, idx) });
  };

  // ----- Chính tinh -----
  const tuVi = viTriTuVi(cucSo, ngayAm);
  them(tuVi, 'Tử Vi', 'chinh-tinh', 'cat');
  them(tuVi - 1, 'Thiên Cơ', 'chinh-tinh', 'cat');
  them(tuVi - 3, 'Thái Dương', 'chinh-tinh', 'cat');
  them(tuVi - 4, 'Vũ Khúc', 'chinh-tinh', 'cat');
  them(tuVi - 5, 'Thiên Đồng', 'chinh-tinh', 'cat');
  them(tuVi - 8, 'Liêm Trinh', 'chinh-tinh', 'hung');

  const thienPhu = mod12(4 - tuVi);
  them(thienPhu, 'Thiên Phủ', 'chinh-tinh', 'cat');
  them(thienPhu + 1, 'Thái Âm', 'chinh-tinh', 'cat');
  them(thienPhu + 2, 'Tham Lang', 'chinh-tinh', 'hung');
  them(thienPhu + 3, 'Cự Môn', 'chinh-tinh', 'hung');
  them(thienPhu + 4, 'Thiên Tướng', 'chinh-tinh', 'cat');
  them(thienPhu + 5, 'Thiên Lương', 'chinh-tinh', 'cat');
  them(thienPhu + 6, 'Thất Sát', 'chinh-tinh', 'hung');
  them(thienPhu + 10, 'Phá Quân', 'chinh-tinh', 'hung');

  // ----- Phụ tinh theo can năm -----
  const locTon = VI_TRI_LOC_TON[canNam];
  them(locTon, 'Lộc Tồn', 'phu-tinh', 'cat');
  them(locTon + 1, 'Kình Dương', 'phu-tinh', 'hung');
  them(locTon - 1, 'Đà La', 'phu-tinh', 'hung');
  them(VI_TRI_THIEN_KHOI[canNam], 'Thiên Khôi', 'phu-tinh', 'cat');
  them(VI_TRI_THIEN_VIET[canNam], 'Thiên Việt', 'phu-tinh', 'cat');

  // ----- Phụ tinh theo tháng sinh -----
  const taPhu = mod12(3 + thangAm); // khởi Thìn, thuận theo tháng
  const huuBat = mod12(11 - thangAm); // khởi Tuất, nghịch theo tháng
  them(taPhu, 'Tả Phù', 'phu-tinh', 'cat');
  them(huuBat, 'Hữu Bật', 'phu-tinh', 'cat');
  them(9 + thangAm - 1, 'Thiên Hình', 'phu-tinh', 'hung'); // khởi Dậu, thuận
  them(1 + thangAm - 1, 'Thiên Riêu', 'phu-tinh', 'hung'); // khởi Sửu, thuận
  them(1 + thangAm - 1, 'Thiên Y', 'phu-tinh', 'cat');

  // ----- Phụ tinh theo giờ sinh -----
  const vanXuong = mod12(10 - chiGio); // khởi Tuất, nghịch theo giờ
  const vanKhuc = mod12(4 + chiGio); // khởi Thìn, thuận theo giờ
  them(vanXuong, 'Văn Xương', 'phu-tinh', 'cat');
  them(vanKhuc, 'Văn Khúc', 'phu-tinh', 'cat');
  them(11 + chiGio, 'Địa Kiếp', 'phu-tinh', 'hung'); // khởi Hợi, thuận
  them(11 - chiGio, 'Địa Không', 'phu-tinh', 'hung'); // khởi Hợi, nghịch
  them(6 + chiGio, 'Thai Phụ', 'phu-tinh', 'cat'); // khởi Ngọ, thuận theo giờ
  them(2 + chiGio, 'Phong Cáo', 'phu-tinh', 'cat'); // khởi Dần, thuận theo giờ

  // ----- Hỏa Tinh / Linh Tinh: khởi theo tam hợp tuổi, đếm thuận tới giờ sinh -----
  const tamHop = nhomTamHop(chiNam);
  them(KHOI_HOA_TINH[tamHop] + chiGio, 'Hỏa Tinh', 'phu-tinh', 'hung');
  them(KHOI_LINH_TINH[tamHop] + chiGio, 'Linh Tinh', 'phu-tinh', 'hung');

  // ----- Phụ tinh theo chi năm -----
  them(VI_TRI_THIEN_MA[tamHop], 'Thiên Mã', 'phu-tinh', 'cat');
  them(VI_TRI_DAO_HOA[tamHop], 'Đào Hoa', 'phu-tinh', 'trung');
  them(VI_TRI_KIEP_SAT[tamHop], 'Kiếp Sát', 'phu-tinh', 'hung');
  them(4 + chiNam, 'Long Trì', 'phu-tinh', 'cat'); // khởi Thìn, thuận
  them(10 - chiNam, 'Phượng Các', 'phu-tinh', 'cat'); // khởi Tuất, nghịch
  them(3 - chiNam, 'Hồng Loan', 'phu-tinh', 'cat'); // khởi Mão, nghịch
  them(3 - chiNam + 6, 'Thiên Hỷ', 'phu-tinh', 'cat');
  them(6 - chiNam, 'Thiên Khốc', 'phu-tinh', 'hung'); // khởi Ngọ, nghịch
  them(6 + chiNam, 'Thiên Hư', 'phu-tinh', 'hung'); // khởi Ngọ, thuận
  them(9 + chiNam, 'Thiên Đức', 'phu-tinh', 'cat');
  them(5 + chiNam, 'Nguyệt Đức', 'phu-tinh', 'cat');
  them(chiNam + 1, 'Thiên Không', 'phu-tinh', 'hung');
  const { coThan, quaTu } = viTriCoThanQuaTu(chiNam);
  them(coThan, 'Cô Thần', 'phu-tinh', 'hung');
  them(quaTu, 'Quả Tú', 'phu-tinh', 'hung');

  // ----- Sao theo ngày sinh -----
  them(taPhu + (ngayAm - 1), 'Tam Thai', 'phu-tinh', 'cat');
  them(huuBat - (ngayAm - 1), 'Bát Tọa', 'phu-tinh', 'cat');
  them(vanXuong + ngayAm - 2, 'Ân Quang', 'phu-tinh', 'cat');
  them(vanKhuc - ngayAm + 2, 'Thiên Quý', 'phu-tinh', 'cat');

  // ----- Sao theo can năm -----
  them(VI_TRI_QUOC_AN[canNam], 'Quốc Ấn', 'phu-tinh', 'cat');
  them(VI_TRI_DUONG_PHU[canNam], 'Đường Phù', 'phu-tinh', 'trung');
  them(VI_TRI_LUU_HA[canNam], 'Lưu Hà', 'phu-tinh', 'hung');
  them(VI_TRI_THIEN_TRU[canNam], 'Thiên Trù', 'phu-tinh', 'cat');
  them(VI_TRI_THIEN_QUAN[canNam], 'Thiên Quan', 'phu-tinh', 'cat');
  them(VI_TRI_THIEN_PHUC[canNam], 'Thiên Phúc', 'phu-tinh', 'cat');

  // ----- Sao theo chi năm -----
  them(VI_TRI_HOA_CAI[chiNam], 'Hoa Cái', 'phu-tinh', 'trung');
  them(VI_TRI_PHA_TOAI[chiNam], 'Phá Toái', 'phu-tinh', 'hung');
  them(10 - chiNam, 'Giải Thần', 'phu-tinh', 'cat'); // khởi Tuất, nghịch theo chi năm
  them(thanIndex + chiNam, 'Thiên Thọ', 'phu-tinh', 'cat');
  them(menhIndex + chiNam, 'Thiên Tài', 'phu-tinh', 'trung');

  // ----- Sao theo tháng sinh -----
  them(7 + thangAm - 1, 'Địa Giải', 'phu-tinh', 'cat'); // khởi Mùi, thuận
  them(8 + thangAm - 1, 'Thiên Giải', 'phu-tinh', 'cat'); // khởi Thân, thuận

  // ----- Sao đóng cố định theo cung -----
  // Gán theo TÊN cung chứ không theo độ lệch số: chiều đánh số cung khác nhau
  // giữa các tài liệu, dùng độ lệch là nguồn gốc của việc đặt nhầm chỗ.
  const cungTen = (ten: string) => cungs.findIndex((c) => c.tenCung === ten);
  them(cungTen('Nô Bộc'), 'Thiên Thương', 'phu-tinh', 'hung');
  them(cungTen('Tật Ách'), 'Thiên Sứ', 'phu-tinh', 'hung');
  them(4, 'Thiên La', 'phu-tinh', 'hung'); // luôn tại Thìn
  them(10, 'Địa Võng', 'phu-tinh', 'hung'); // luôn tại Tuất

  // Đẩu Quân: lấy Thái Tuế làm tháng Giêng, đếm nghịch tới tháng sinh, rồi đếm
  // thuận tới giờ sinh
  them(chiNam - (thangAm - 1) + chiGio, 'Đẩu Quân', 'phu-tinh', 'trung');

  // ----- Vòng Tràng Sinh: lưu riêng để hiển thị ở footer từng cung -----
  const khoiTruongSinh = KHOI_TRUONG_SINH[cucSo];
  VONG_TRANG_SINH.forEach((ten, i) => {
    cungs[mod12(khoiTruongSinh + i * chieu)].trangSinh = ten;
  });

  // ----- Vòng Thái Tuế: khởi tại chi năm sinh, luôn đếm thuận -----
  VONG_THAI_TUE.forEach((ten, i) => {
    them(chiNam + i, ten, 'vong-sao', 'trung');
  });

  // ----- Vòng Lộc Tồn (Bác Sĩ) -----
  VONG_LOC_TON.forEach((ten, i) => {
    them(locTon + i * chieu, ten, 'vong-sao', 'trung');
  });

  // ----- Tứ Hóa -----
  const [hoaLoc, hoaQuyen, hoaKhoa, hoaKy] = TU_HOA[canNam];
  const gan = (tenSaoGoc: string, tenHoa: string, tinhChat: Sao['tinhChat']) => {
    for (const cung of cungs) {
      if (cung.sao.some((s) => s.ten === tenSaoGoc)) {
        cung.sao.push({
          ten: tenHoa,
          loai: 'tu-hoa',
          tinhChat,
          doSang: doSangCuaSao(tenHoa, cung.chiIndex),
        });
        return;
      }
    }
  };
  gan(hoaLoc, 'Hóa Lộc', 'cat');
  gan(hoaQuyen, 'Hóa Quyền', 'cat');
  gan(hoaKhoa, 'Hóa Khoa', 'cat');
  gan(hoaKy, 'Hóa Kỵ', 'hung');

  // ----- Tuần / Triệt -----
  const tuanStart = mod12(mod12(chiNam - canNam) - 2);
  cungs[tuanStart].coTuan = true;
  cungs[mod12(tuanStart + 1)].coTuan = true;
  const [trietA, trietB] = VI_TRI_TRIET[canNam % 5];
  cungs[trietA].coTriet = true;
  cungs[trietB].coTriet = true;

  // ----- Đại vận: khởi từ cung Mệnh với số tuổi bằng cục số -----
  for (let i = 0; i < 12; i++) {
    const idx = mod12(menhIndex + i * chieu);
    cungs[idx].daiVan = { tuTuoi: cucSo + i * 10, denTuoi: cucSo + i * 10 + 9 };
  }

  return {
    thongTin: {
      ...input,
      amLich: { ngay: ngayAm, thang: thangAm, nam: am.year, nhuan: am.isLeapMonth },
      canChiNam: `${CAN[canNam]} ${CHI[chiNam]}`,
      canChiThang: `${CAN[canThang]} ${CHI[chiThang]}`,
      canChiNgay: `${CAN[ngayCanChi.can]} ${CHI[ngayCanChi.chi]}`,
      canChiGio: `${CAN[canGio]} ${CHI[chiGio]}`,
      chiGio: CHI[chiGio],
    },
    canNamIndex: canNam,
    chiNamIndex: chiNam,
    menhIndex,
    thanIndex,
    thanCuCung: TEN_CUNG[mod12(thanIndex - menhIndex)],
    cuc: { so: cucSo, ten: cucInfo.ten, hanh: napAmCungMenh.hanh },
    menhChu: MENH_CHU[menhIndex],
    thanChu: THAN_CHU[chiNam],
    banMenh: { ten: banMenh.ten, hanh: banMenh.hanh },
    napAmCungMenh: napAmCungMenh.ten,
    amDuong: `${canNam % 2 === 0 ? 'Dương' : 'Âm'} ${gioiTinh === 'nam' ? 'Nam' : 'Nữ'}`,
    amDuongThuanLy: duongNamAmNu ? 'Âm Dương thuận lý' : 'Âm Dương nghịch lý',
    menhCucQuanHe: quanHeNguHanh(banMenh.hanh, napAmCungMenh.hanh),
    cungs,
  };
}

/** Can chi của một năm âm lịch, VD 2026 -> "Bính Ngọ" */
export function canChiCuaNam(namAm: number): string {
  return `${CAN[mod10(namAm + 6)]} ${CHI[mod12(namAm + 8)]}`;
}

/**
 * Tam phương tứ chính của một cung: 2 cung tam hợp + cung xung chiếu (đối cung).
 */
export function tamPhuongTuChinh(cungIndex: number): {
  tamHop: [number, number];
  xungChieu: number;
} {
  return {
    tamHop: [mod12(cungIndex + 4), mod12(cungIndex + 8)],
    xungChieu: mod12(cungIndex + 6),
  };
}

/**
 * Cung nguyệt hạn: lấy cung tiểu hạn của năm làm tháng Giêng, đếm thuận tới tháng cần xem.
 */
export function cungNguyetHan(laSo: LaSo, tuoiAm: number, thangAm: number): number {
  return mod12(cungTieuHan(laSo, tuoiAm) + (thangAm - 1));
}

/** Cung tiểu hạn của một tuổi âm (tuổi mụ) nhất định */
export function cungTieuHan(laSo: LaSo, tuoiAm: number): number {
  const tamHop = nhomTamHop(laSo.chiNamIndex);
  const khoi = KHOI_TIEU_HAN[tamHop];
  const chieu = laSo.thongTin.gioiTinh === 'nam' ? 1 : -1;
  return mod12(khoi + (tuoiAm - 1) * chieu);
}

/** Cung đại vận đang cai quản tại một tuổi âm nhất định */
export function cungDaiVan(laSo: LaSo, tuoiAm: number): Cung | undefined {
  return laSo.cungs.find(
    (c) => c.daiVan && tuoiAm >= c.daiVan.tuTuoi && tuoiAm <= c.daiVan.denTuoi
  );
}

/**
 * Lưu tinh: các sao chạy theo NĂM ĐANG XEM (không phải năm sinh), dùng khi luận
 * vận hạn từng năm. Trả về danh sách để giao diện phủ thêm lên mệnh bàn thay vì
 * trộn vào lá số gốc — lá số gốc phải giữ nguyên bất kể xem năm nào.
 */
export function luuTinhTheoNam(namXem: number): { ten: string; chiIndex: number; tinhChat: Sao['tinhChat'] }[] {
  const canNamXem = mod10(namXem + 6);
  const chiNamXem = mod12(namXem + 8);
  const luuLocTon = VI_TRI_LOC_TON[canNamXem];

  return [
    { ten: 'Lưu Thái Tuế', chiIndex: chiNamXem, tinhChat: 'trung' },
    { ten: 'Lưu Lộc Tồn', chiIndex: luuLocTon, tinhChat: 'cat' },
    { ten: 'Lưu Kình Dương', chiIndex: mod12(luuLocTon + 1), tinhChat: 'hung' },
    { ten: 'Lưu Đà La', chiIndex: mod12(luuLocTon - 1), tinhChat: 'hung' },
    { ten: 'Lưu Thiên Mã', chiIndex: VI_TRI_THIEN_MA[nhomTamHop(chiNamXem)], tinhChat: 'cat' },
    { ten: 'Lưu Thiên Khốc', chiIndex: mod12(6 - chiNamXem), tinhChat: 'hung' },
    { ten: 'Lưu Thiên Hư', chiIndex: mod12(6 + chiNamXem), tinhChat: 'hung' },
  ];
}
