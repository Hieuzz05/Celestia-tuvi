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
import { coThangNhuan, laCuoiNamAm, soVoiBayGio } from './thang-am';

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

export function laHoiKhiNao(cauHoi: string): boolean {
  return khop(cauHoi, KHI_NAO_CO_DAU, KHI_NAO_KHONG_DAU);
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

export interface MocThang {
  nam: number;
  thang: number;
  trangThai: 'da-qua' | 'dang' | 'toi';
  /**
   * Năm có cả tháng X thường và X nhuận: `can-hoi` khi người dùng chưa nói rõ
   * (mã hỏi lại bằng hai chip), `nhuan` / `thuong` khi đã nói. `null` khi năm
   * không có nhuận ở tháng đó.
   */
  nhuan: 'can-hoi' | 'nhuan' | 'thuong' | null;
}

export interface BoiCanhThoiGian {
  namHieuLuc: number;
  thang: MocThang | null;
  /** N4: tháng âm 11–12, hỏi gần, chỉ có căn cứ năm hiện tại */
  cuoiNam: boolean;
}

const THANG_SO = /(?<![\p{L}\p{M}])th[aá]ng\s*(1[0-2]|[1-9])(?!\d)/u;
const NHUAN = /(?<![\p{L}\p{M}])nhu[aậ]n(?![\p{L}\p{M}])/u;
/** Chip "Tháng X" (kèm năm khi khác năm nay) do mã đặt sau câu hỏi lại nhuận — là tháng thường. */
const CHIP_THANG_THUONG = /^\s*th[aá]ng\s*\d+(?:\s*n[aă]m\s*\d{4})?\s*[?.!]*\s*$/u;
const THUONG = /(?<![\p{L}\p{M}])(?:th[uư][oờ]ng|ch[ií]nh)(?![\p{L}\p{M}])/u;

/**
 * Mốc tháng / năm của lượt. `namXem` là năm âm đang neo (năm hiện tại), `bayGio`
 * là ngày âm hôm nay — tiêm vào được để test N2 / N4.
 */
export function boiCanhThoiGian(vao: {
  cauHoi: string;
  keHoach: Pick<KeHoachTruyVan, 'phamViThoiGian' | 'namMucTieu' | 'thangMucTieu'>;
  namXem: number;
  bayGio: ThoiDiemAm;
}): BoiCanhThoiGian {
  const { cauHoi, keHoach, namXem, bayGio } = vao;
  const namHieuLuc = keHoach.namMucTieu ?? namXem;

  let thang: MocThang | null = null;
  if (keHoach.thangMucTieu !== undefined) {
    const s = cauHoi.normalize('NFC').toLowerCase();
    const t = keHoach.thangMucTieu;
    // Chỉ hỏi lại nhuận khi người dùng gọi ĐÍCH DANH số tháng; "tháng này",
    // "tháng tới" là tháng đang chạy, không mơ hồ.
    const goiSo = THANG_SO.exec(s);
    let nhuan: MocThang['nhuan'] = null;
    if (goiSo && Number(goiSo[1]) === t && coThangNhuan(namHieuLuc, t)) {
      nhuan = NHUAN.test(s) ? 'nhuan' : THUONG.test(s) || CHIP_THANG_THUONG.test(s) ? 'thuong' : 'can-hoi';
    }
    thang = { nam: namHieuLuc, thang: t, trangThai: soVoiBayGio(namHieuLuc, t, bayGio), nhuan };
  }

  const cuoiNam =
    laCuoiNamAm(bayGio) &&
    keHoach.phamViThoiGian === 'gan' &&
    namHieuLuc === bayGio.nam &&
    keHoach.thangMucTieu === undefined;

  return { namHieuLuc, thang, cuoiNam };
}
