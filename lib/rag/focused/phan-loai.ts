/**
 * PHÂN KHUÔN — đường Focused (CEL-186 vé B, mục 2 + quyết định #5).
 *
 * Hàm thuần: đọc câu hỏi, kế hoạch (từ `lapKeHoach` dùng chung, không sửa) và
 * người được hỏi, trả ra khuôn trả lời. Khuôn quyết ai viết câu đầu: mã (D, E,
 * F2) hay model qua guard (A, B, C, F1, G).
 *
 * Khuôn D′ ("tháng nào đáng chú ý hơn") ĐÃ BỎ theo quyết định #5: engine không
 * so từng tháng, nên câu "tháng nào…" đi khuôn D như "khi nào".
 */

import type { KeHoachTruyVan } from '../planner';
import { boDau } from '../thuc-the';
import type { ThoiDiemAm } from '@/lib/tuvi/bay-gio';
import type { DoiTuongCauHoi } from './doi-tuong';
import { laCauChieuXau } from './chot-huong';
import { khopCum } from './khop';
import {
  coThangNhuan,
  cuaSoAmCuaThangDuong,
  cuaSoCuaThangAm,
  laCuoiNamAm,
  ngayDuongCua,
  soVoiBayGio,
  trangThaiThangDuong,
  type CuaSoAm,
} from './thang-am';

export type Khuon = 'A' | 'B' | 'C' | 'D' | 'E' | 'F1' | 'F2' | 'G';

/** Chuyện người hỏi mong, chuyện không mong, hay chỉ hỏi bối cảnh (domain A2) */
export type LoaiSuKien = 'mong-muon' | 'xau' | 'trung-tinh';

export interface PhanLoai {
  khuon: Khuon;
  loaiSuKien: LoaiSuKien;
  /** DEEP: chỉ nới trần độ dài, mọi guard giữ nguyên (cờ #6) */
  sau: boolean;
  /** Khuôn E: hai phương án người dùng gõ, đã cắt gọn, dùng làm chip */
  haiVe?: [string, string];
}

/* ------------------------------------------------------------- tiện ích */

const coDau = (s: string) => boDau(s) !== s.toLowerCase();
const khop = khopCum;

/* ---------------------------------------------------------------- DEEP */

/*
 * Chỉ CỤM nhiều âm tiết (mục 0.6, xinSau viết lại): "kỹ" đứng riêng bắt cả
 * "kỹ sư", "kỹ thuật"; "phân tích" đứng riêng bắt "phân tích dữ liệu".
 */
const SAU_CO_DAU = [
  'chi tiết', 'cặn kẽ', 'kỹ hơn', 'kĩ hơn', 'kỹ càng', 'kĩ càng', 'thật kỹ', 'thật kĩ',
  'nói kỹ', 'nói kĩ', 'xem kỹ', 'xem kĩ', 'đọc kỹ', 'đọc kĩ', 'giải thích kỹ', 'phân tích kỹ',
  'phân tích giúp', 'phân tích cho', 'phân tích sâu', 'sâu hơn', 'đi sâu', 'cụ thể hơn',
  'nói rõ hơn', 'giải thích thêm', 'cả đời', 'các đại vận', 'toàn bộ', 'đầy đủ',
].join('|');
const SAU_KHONG_DAU = [
  'chi tiet', 'can ke', 'ky hon', 'ki hon', 'ky cang', 'that ky', 'noi ky', 'xem ky', 'doc ky',
  'phan tich ky', 'phan tich giup', 'phan tich cho', 'phan tich sau', 'di sau', 'cu the hon',
  'noi ro hon', 'giai thich them', 'ca doi', 'cac dai van', 'toan bo', 'day du',
].join('|');

export function laXinSau(cauHoi: string): boolean {
  return khop(cauHoi, SAU_CO_DAU, SAU_KHONG_DAU);
}

/* ------------------------------------------------------------ khi nào */

/*
 * Chỉ câu XIN CHỌN MỐC mới là khuôn D. Planner xếp cả "lúc này", "hiện giờ"
 * vào `thoi-diem` — những câu đó hỏi về hiện tại, đọc được, không phải từ chối.
 */
const KHI_NAO_CO_DAU =
  'khi nào|bao giờ|lúc nào|thời điểm nào|thời gian nào|năm nào|tháng nào|đến bao giờ|mấy tuổi|năm bao nhiêu tuổi';
const KHI_NAO_KHONG_DAU =
  'khi nao|bao gio|luc nao|thoi diem nao|thoi gian nao|nam nao|thang nao|den bao gio|may tuoi|nam bao nhieu tuoi';

/*
 * Cụm thói quen không hỏi mốc: "lúc nào cũng mệt", "năm nào cũng vất vả",
 * "chưa bao giờ có người yêu". Gỡ chúng ra trước khi dò (lỗi eval 04/10, ca 05).
 */
const THOI_QUEN =
  /(?<![\p{L}\p{M}])(?:(?:lúc|khi|năm|tháng|ngày|luc|nam|thang|ngay) (?:nào|nao)(?: mà| ma)? (?:cũng|cung)|(?:bao giờ|bao gio) (?:cũng|cung)|(?:chưa|chẳng|không|ko|chua|chang|khong) (?:bao giờ|bao gio))(?![\p{L}\p{M}])/giu;

export function laHoiKhiNao(cauHoi: string): boolean {
  return khop(cauHoi.normalize('NFC').replace(THOI_QUEN, ' '), KHI_NAO_CO_DAU, KHI_NAO_KHONG_DAU);
}

/* ----------------------------------------------------------- A hay B */

/** Động từ hành động — dài trước ngắn để "học tiếp" thắng "học". */
const DONG_TU = [
  'ở lại', 'học tiếp', 'đi làm', 'kinh doanh', 'khởi nghiệp', 'chia tay', 'quay lại', 'đầu tư',
  'du học', 'ra riêng', 'tiếp tục', 'từ chối', 'nghỉ việc', 'chuyển việc', 'đổi việc', 'mua nhà',
  'thuê nhà', 'bán nhà', 'cưới', 'lấy', 'chuyển', 'nghỉ', 'đổi', 'mua', 'thuê', 'bán', 'giữ',
  'chờ', 'đợi', 'học', 'làm', 'nhận', 'mở', 'vay', 'gửi', 'xây', 'thi', 'dừng', 'bỏ', 'về', 'đi',
];
const DONG_TU_KHONG_DAU = DONG_TU.map(boDau);

const NOI = /\s+(?:hay là|hay|hoặc là|hoặc)\s+/u;
const NOI_KHONG_DAU = /\s+(?:hay la|hay|hoac la|hoac)\s+/;
/** "… hay không", "hay chưa", "hay là không": câu có/không, không phải hai phương án */
const VE_SAU_LOAI = /^(?:không|chưa|ko|k|thôi|sao|gì)(?![\p{L}\p{M}])/u;
const VE_SAU_LOAI_KD = /^(?:khong|chua|ko|k|thoi|sao|gi)(?![a-z])/;

const catDuoi = (s: string) =>
  s.replace(/\s*(?:thì |thi )?(?:tốt hơn|tot hon|hơn|hon|ạ|a|nhỉ|nhi|đây|day)?\s*[?.!…]*\s*$/u, '').trim();

/**
 * Hai phương án hành động nối bằng "hay / hoặc". Trả hai vế đã cắt gọn, hoặc null.
 *
 * Vế trước tính từ động từ hành động CUỐI CÙNG trước chữ nối; vế sau phải có
 * động từ trong ba chữ đầu. Nhờ vậy "vợ tôi hay cãi" (hay = thường) và "có
 * chuyển việc hay không" đều không thành hai phương án.
 */
export function tachHaiVe(cauHoi: string): [string, string] | null {
  const goc = cauHoi.normalize('NFC').toLowerCase().replace(/[?!.…]+\s*$/u, '').trim();
  const daDau = coDau(goc);
  const s = daDau ? goc : boDau(goc).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ');
  const dt = daDau ? DONG_TU : DONG_TU_KHONG_DAU;
  const m = s.match(daDau ? NOI : NOI_KHONG_DAU);
  if (!m || m.index === undefined) return null;
  const truoc = s.slice(0, m.index);
  const sau = s.slice(m.index + m[0].length);
  if ((daDau ? VE_SAU_LOAI : VE_SAU_LOAI_KD).test(sau)) return null;

  const tim = (chuoi: string, cuoi: boolean): number => {
    let vt = -1;
    for (const d of dt) {
      const re = new RegExp(`(?<![\\p{L}\\p{M}])${d}(?![\\p{L}\\p{M}])`, 'gu');
      for (const k of chuoi.matchAll(re)) {
        if (k.index === undefined) continue;
        if (cuoi ? k.index > vt : vt === -1 || k.index < vt) vt = k.index;
      }
    }
    return vt;
  };
  const a = tim(truoc, true);
  if (a < 0) return null;
  const b = tim(sau, false);
  if (b < 0 || sau.slice(0, b).trim().split(/\s+/).filter(Boolean).length > 2) return null;

  const veA = catDuoi(truoc.slice(a).replace(/^(?:nên|nen)\s+/u, ''));
  const veB = catDuoi(sau.slice(b));
  if (!veA || !veB || veA === veB) return null;
  return [veA, veB];
}

/* -------------------------------------------------------- loại sự kiện */

/*
 * Mong muốn có tiếng lóng (domain A2). Thứ tự quan trọng: "hết nợ", "khỏi
 * bệnh" chứa chữ của nhóm xấu, nên dò nhóm "thoát khỏi chuyện xấu" trước.
 *
 * Danh sách không dấu chỉ giữ cụm không mơ hồ: "do" (đỗ / do), "on" (ổn / ôn),
 * "tot" đứng riêng thì bỏ — gõ không dấu mà rơi về `trung-tinh` vẫn an toàn.
 */
const THOAT_XAU = 'hết nợ|trả nợ|trả hết nợ|khỏi bệnh|qua khỏi|thoát nợ|hết xui|hết hạn|vượt qua';
const THOAT_XAU_KD = 'het no|tra no|tra het no|khoi benh|qua khoi|thoat no|het xui|vuot qua';
const XAU = 'tai nạn|bệnh|ốm|xui|hạn';
const XAU_KD = [
  'ly hon', 'ly di', 'chia tay', 'mat viec', 'that nghiep', 'pha san', 'bi lua', 'bi duoi', 'ngoai tinh',
  'cam sung', 'vo no', 'thua lo', 'lo von', 'mat tien', 'no nan', 'co bi', 'se bi', 'nghi viec',
  'bo viec', 'tai nan', 'benh', 'om', 'xui',
].join('|');
const MONG_MUON = [
  'có người yêu', 'có bồ', 'có ny', 'thoát ế', 'lên lương', 'tăng lương', 'thăng chức', 'lên chức',
  'thăng tiến', 'trúng', 'có bầu', 'có con', 'cưới', 'lấy chồng', 'lấy vợ', 'giàu', 'đỗ', 'đậu',
  'gặp được', 'có việc', 'tìm được việc', 'kiếm được', 'mua được', 'thành công', 'phát tài', 'có lộc',
  'có tiền', 'may mắn', 'suôn sẻ', 'thuận lợi', 'hợp', 'ổn', 'tốt', 'khá', 'khỏe', 'khoẻ', 'yên',
].join('|');
const MONG_MUON_KD = [
  'co nguoi yeu', 'co bo', 'co ny', 'thoat e', 'len luong', 'tang luong', 'thang chuc', 'len chuc',
  'thang tien', 'trung so', 'co bau', 'co con', 'lay chong', 'lay vo', 'giau', 'thi do', 'gap duoc',
  'co viec', 'tim duoc viec', 'kiem duoc', 'mua duoc', 'thanh cong', 'phat tai', 'co loc', 'co tien',
  'may man', 'suon se', 'thuan loi', 'on khong', 'tot khong', 'hop khong',
].join('|');

export function loaiSuKienCua(cauHoi: string): LoaiSuKien {
  const s = cauHoi.normalize('NFC').toLowerCase();
  if (khop(s, THOAT_XAU, THOAT_XAU_KD)) return 'mong-muon';
  if (laCauChieuXau(s) || khop(s, XAU, XAU_KD)) return 'xau';
  if (khop(s, MONG_MUON, MONG_MUON_KD)) return 'mong-muon';
  return 'trung-tinh';
}

/* ---------------------------------------------------------------- khuôn */

export function phanKhuon(vao: {
  cauHoi: string;
  keHoach: Pick<KeHoachTruyVan, 'yDinh' | 'phamViThoiGian'>;
  doiTuong: DoiTuongCauHoi | null;
}): PhanLoai {
  const { cauHoi, keHoach, doiTuong } = vao;
  const sau = laXinSau(cauHoi);
  const loaiSuKien = loaiSuKienCua(cauHoi);
  const ra = (khuon: Khuon, them: Partial<PhanLoai> = {}): PhanLoai => ({ khuon, loaiSuKien, sau, ...them });

  if (doiTuong?.loai === 'van-rieng') return ra('F2');
  if (doiTuong) return ra('F1');

  const haiVe = tachHaiVe(cauHoi);
  if (haiVe) return ra('E', { haiVe });
  if (laHoiKhiNao(cauHoi)) return ra('D');

  switch (keHoach.yDinh) {
    case 'quyet-dinh':
      return ra('C');
    case 'co-khong':
      return ra('A');
    case 'thoi-diem':
      // "Lúc này / hiện giờ" — hỏi về hiện tại, đọc như câu có mốc gần.
      return ra('B');
    case 'mo-ta': {
      const pv = keHoach.phamViThoiGian;
      return ra(pv === 'gan' || pv === 'nam' || pv === 'thang' ? 'B' : 'G');
    }
    default:
      return ra('G');
  }
}

/* --------------------------------------------------------- mốc thời gian */

/**
 * Người hỏi đang hỏi mốc nào (spec v2 §3.1). "Tháng 10", "10/2026", "tháng này /
 * tới / sau", "October" là tháng DƯƠNG; chỉ "tháng 10 âm / âm lịch" hay "tháng 6
 * nhuận" mới là tháng âm.
 */
export type MucTieuThoiGian =
  | { loai: 'nam'; nam: number }
  | { loai: 'thang-duong'; nam: number; thang: number }
  | { loai: 'thang-am'; namAm: number; thangAm: number; nhuan: boolean };

export interface ThangDangHoi {
  muc: Exclude<MucTieuThoiGian, { loai: 'nam' }>;
  /** Tháng dương: so tháng dương với hôm nay; tháng âm: so tháng âm. */
  trangThai: 'da-qua' | 'dang' | 'toi';
  /** Mọi tháng âm chồng lên tháng đang hỏi (§3.2) — tháng âm nói rõ thì đúng 1. */
  cuaSo: CuaSoAm[];
  /** Hỏi "tháng X nhuận" mà năm ấy không có X nhuận — đọc tháng X thường (§3.5). */
  khongCoNhuan?: true;
}

export interface BoiCanhThoiGian {
  namHieuLuc: number;
  thang: ThangDangHoi | null;
  /** N4: tháng âm 11–12, hỏi gần, chỉ có căn cứ năm hiện tại */
  cuoiNam: boolean;
}

const THANG_SO = /(?<![\p{L}\p{M}])th[aá]ng\s*(1[0-2]|[1-9])(?!\d)/u;
const NHUAN = /(?<![\p{L}\p{M}])nhu[aậ]n(?![\p{L}\p{M}])/u;
/**
 * Người dùng nói rõ lịch âm: "tháng 6 âm", "tháng 6 nhuận âm", "âm lịch", "lịch âm".
 * Chỉ "âm" ĐỨNG SAU số tháng — "âm" đứng riêng còn là "âm thầm", "âm nhạc".
 */
const AM = /th[aá]ng\s*(?:1[0-2]|[1-9])\s*(?:nhu[aậ]n\s*)?(?:âm|am|al)(?![\p{L}\p{M}])(?!\s*(?:thầm|tham|nhạc|nhac|hiểu|hieu|ấm|ỉ)(?![\p{L}\p{M}]))|(?<![\p{L}\p{M}])(?:âm\s*lịch|am\s*lich|lịch\s*âm|lich\s*am)(?![\p{L}\p{M}])/u;

const THANG_NAM_SO = /(?<![\p{L}\p{M}])th[aá]ng\s*(?:1[0-2]|[1-9])\s*(?:\/|-|năm|nam)\s*((?:19|20)\d{2})(?!\d)/u;

/** Tên tháng tiếng Anh (§3.1). "may" viết thường đứng riêng KHÔNG phải tháng. */
const THANG_EN_SO: Record<string, number> = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
  june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9,
  october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
};
const TEN_EN = /\b(january|february|march|april|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)\b/i;
const MAY_EN = /\b(?:in|this|next)\s+may\b|\bmay\s+(?:19|20)\d{2}\b/i;

/** Tháng tiếng Anh trong câu và năm đi kèm (nếu nói). */
export function thangTiengAnh(cauHoi: string, namNay: number): { nam: number; thang: number } | null {
  let thang: number | null = null;
  let viTri = -1;
  let dai = 0;
  const m = TEN_EN.exec(cauHoi);
  if (m) {
    thang = THANG_EN_SO[m[1].toLowerCase()];
    viTri = m.index;
    dai = m[0].length;
  } else {
    const may = MAY_EN.exec(cauHoi);
    if (may) {
      const k = may[0].toLowerCase().indexOf('may');
      thang = 5;
      viTri = may.index + k;
      dai = 3;
    } else {
      // "May" viết hoa giữa câu (không đứng đầu câu): "find a job in early May".
      const re = /\bMay\b/g;
      let x: RegExpExecArray | null;
      while ((x = re.exec(cauHoi))) {
        const truoc = cauHoi.slice(0, x.index).trimEnd();
        if (truoc && !/[.?!]$/.test(truoc)) {
          thang = 5;
          viTri = x.index;
          dai = 3;
          break;
        }
      }
    }
  }
  if (thang === null) return null;
  const sau = /^\s*,?\s*((?:19|20)\d{2})(?!\d)/.exec(cauHoi.slice(viTri + dai));
  if (sau) return { nam: Number(sau[1]), thang };
  const truoc = cauHoi.slice(0, viTri).toLowerCase();
  if (/\bnext\s*$/.test(truoc)) return { nam: namNay + 1, thang };
  return { nam: namNay, thang };
}

/**
 * Mốc tháng / năm của lượt. `namXem` là năm âm đang neo (năm hiện tại), `bayGio`
 * là ngày âm hôm nay — tiêm vào được để test N2 / N4 / cửa sổ.
 */
export function boiCanhThoiGian(vao: {
  cauHoi: string;
  keHoach: Pick<KeHoachTruyVan, 'phamViThoiGian' | 'namMucTieu' | 'thangMucTieu'>;
  namXem: number;
  bayGio: ThoiDiemAm;
}): BoiCanhThoiGian {
  const { cauHoi, keHoach, namXem, bayGio } = vao;
  const homNay = ngayDuongCua(bayGio);
  const namDuongNay = homNay.getUTCFullYear();
  const s = cauHoi.normalize('NFC').toLowerCase();

  let muc: ThangDangHoi['muc'] | null = null;
  let khongCoNhuan = false;
  const t = keHoach.thangMucTieu;
  const goiSo = THANG_SO.exec(s);
  const goiDichDanh = t !== undefined && !!goiSo && Number(goiSo[1]) === t;
  const en = goiDichDanh ? null : thangTiengAnh(cauHoi.normalize('NFC'), keHoach.namMucTieu ?? namDuongNay);

  if (goiDichDanh && (AM.test(s) || NHUAN.test(s))) {
    // Tháng âm nói rõ: một cửa sổ là cả tháng âm. Hỏi nhuận mà năm không có → tháng thường.
    const namAm = keHoach.namMucTieu ?? namXem;
    const hoiNhuan = NHUAN.test(s);
    const coNhuan = hoiNhuan && coThangNhuan(namAm, t);
    khongCoNhuan = hoiNhuan && !coNhuan;
    muc = { loai: 'thang-am', namAm, thangAm: t, nhuan: coNhuan };
  } else if (goiDichDanh) {
    // "Tháng 10", "tháng 10/2026" = tháng DƯƠNG (chủ dự án 04/10/2026).
    const kem = THANG_NAM_SO.exec(s);
    muc = { loai: 'thang-duong', nam: kem ? Number(kem[1]) : keHoach.namMucTieu ?? namDuongNay, thang: t };
  } else if (en) {
    muc = { loai: 'thang-duong', nam: en.nam, thang: en.thang };
  } else if (t !== undefined) {
    // "Tháng này / tới / sau": planner tính theo tháng âm đang chạy — giữ nguyên
    // planner, quy độ lệch sang tháng dương của hôm nay.
    const lech = (t - bayGio.thang + 12) % 12;
    const tong = homNay.getUTCMonth() + lech;
    muc = { loai: 'thang-duong', nam: namDuongNay + Math.floor(tong / 12), thang: (tong % 12) + 1 };
  }

  let thang: ThangDangHoi | null = null;
  if (muc?.loai === 'thang-duong') {
    thang = {
      muc,
      trangThai: trangThaiThangDuong(muc.nam, muc.thang, homNay),
      cuaSo: cuaSoAmCuaThangDuong(muc.nam, muc.thang, homNay),
    };
  } else if (muc?.loai === 'thang-am') {
    thang = {
      muc,
      trangThai: soVoiBayGio(muc.namAm, muc.thangAm, bayGio),
      cuaSo: cuaSoCuaThangAm(muc.namAm, muc.thangAm, muc.nhuan, homNay),
      ...(khongCoNhuan ? { khongCoNhuan: true as const } : {}),
    };
  }

  const namHieuLuc = thang?.cuaSo[0]?.namAm ?? keHoach.namMucTieu ?? namXem;
  const cuoiNam =
    laCuoiNamAm(bayGio) && keHoach.phamViThoiGian === 'gan' && namHieuLuc === bayGio.nam && !thang;

  return { namHieuLuc, thang, cuoiNam };
}
