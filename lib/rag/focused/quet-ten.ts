/**
 * BỘ QUÉT TÊN — đường Focused (CEL-186 vé B, mục 6.1).
 *
 * Guard Focused có một luật cứng: câu model viết chỉ được gọi những cái tên có
 * trong gói dữ kiện của lượt. Muốn kiểm luật ấy thì phải nhận ra tên trước, và
 * `nhanDangThucThe` dùng chung không làm được việc này, vì ba lẽ:
 *   - nó so trên chuỗi bỏ dấu, nên "thiên phú" (năng khiếu) thành sao Thiên Phủ;
 *   - nó đọc "Lưu Thiên Mã" thành Thiên Mã, tức là một sao có thật trên lá số
 *     gốc cho phép một lưu tinh không có trong gói đi qua;
 *   - nó không biết "Lưu Hóa Kỵ" là thứ engine không an (R0.2).
 *
 * Nên bộ quét này so CÓ DẤU (chỉ gộp hai lối bỏ dấu thanh "Hoá" / "Hóa"), ăn
 * cụm dài trước, và trả về loại của từng tên để guard xử cho đúng.
 *
 * Hàm thuần, không phụ thuộc lá số. Giới hạn đã biết (mục 6.1): kiểm TÊN, không
 * kiểm THUỘC TÍNH (sao ở cung nào).
 */

import { CHINH_TINH } from '@/lib/tuvi/constants';
import type { DuKienLaSo } from '../boi-canh-la-so';
import { boDau, KHONG_QUET_TU_DO, TU_DIEN_THUC_THE } from '../thuc-the';

export type LoaiTen =
  /** Sao, Tứ Hóa, mốc vòng sao */
  | 'sao'
  /** Lưu tinh năm: "Lưu" + một trong chín sao engine an */
  | 'luu'
  /** "Lưu Hóa …" — engine không an lưu Tứ Hóa, luôn trượt */
  | 'luu-hoa'
  /** Tên ghép hai sao ("Tả Hữu") hoặc tên cách cục */
  | 'ghep'
  /** Tuần, Triệt đứng riêng */
  | 'tuan-triet'
  /** Tên cung lọt ra mặt trước ("Quan Lộc", "cung Mệnh") */
  | 'cung';

export interface TenTrongCau {
  /** Tên chuẩn, có dấu (lấy từ từ điển, không phải mặt chữ model viết) */
  ten: string;
  loai: LoaiTen;
}

/* ------------------------------------------------------------ chuẩn hoá */

/**
 * So có dấu, nhưng gộp hai lối đặt dấu thanh của vần "oa", "oe", "uy": model
 * viết "Hoá Kỵ" lẫn "Hóa Kỵ", "Thuỷ" lẫn "Thủy". Thiếu bước này là một cái tên
 * đúng bị coi như ngoài danh sách.
 */
const DOI_DAU_THANH: Record<string, string> = {
  oá: 'óa', oà: 'òa', oả: 'ỏa', oã: 'õa', oạ: 'ọa',
  uý: 'úy', uỳ: 'ùy', uỷ: 'ủy', uỹ: 'ũy', uỵ: 'ụy',
};
/** "hoá" → "hóa", "thuỷ" → "thủy". Áp cho cả hai phía so sánh nên không làm sai chữ nào. */
function chuan(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/o[áàảãạ]|u[ýỳỷỹỵ]/gu, (m) => DOI_DAU_THANH[m] ?? m);
}

const TACH_TU = /[\p{L}\p{M}\d]+/gu;

interface Tu {
  goc: string;
  chuan: string;
}

function tachTu(cau: string): Tu[] {
  return [...cau.normalize('NFC').matchAll(TACH_TU)].map((m) => ({ goc: m[0], chuan: chuan(m[0]) }));
}

const vietHoa = (s: string) => /^\p{Lu}/u.test(s);

/* --------------------------------------------------------------- bảng tên */

/** Chín lưu tinh engine an (`luuTinhTheoNam`), không kèm chữ "Lưu". */
const LUU_TINH = ['Thái Tuế', 'Lộc Tồn', 'Kình Dương', 'Đà La', 'Thiên Mã', 'Thiên Khốc', 'Thiên Hư', 'Tang Môn', 'Bạch Hổ'];

/**
 * Tên ghép → hai sao tạo nên nó. Gói có ĐỦ cả hai sao thì tên ghép được phép
 * dù gói không viết nguyên tên ghép ra.
 */
export const TEN_GHEP: Record<string, readonly string[]> = {
  'Tả Hữu': ['Tả Phù', 'Hữu Bật'],
  'Xương Khúc': ['Văn Xương', 'Văn Khúc'],
  'Không Kiếp': ['Địa Không', 'Địa Kiếp'],
  'Kình Đà': ['Kình Dương', 'Đà La'],
  'Song Lộc': ['Lộc Tồn', 'Hóa Lộc'],
  'Khôi Việt': ['Thiên Khôi', 'Thiên Việt'],
  'Hình Riêu': ['Thiên Hình', 'Thiên Riêu'],
  'Long Phượng': ['Long Trì', 'Phượng Các'],
  'Thai Tọa': ['Tam Thai', 'Bát Tọa'],
  'Khốc Hư': ['Thiên Khốc', 'Thiên Hư'],
  'Hoả Linh': ['Hỏa Tinh', 'Linh Tinh'],
  'Đào Hồng': ['Đào Hoa', 'Hồng Loan'],
};

/** Hai chữ đầu là tên cung viết hoa: "Quan Lộc", "Phúc Đức". */
const TEN_CUNG_HAI_CHU = [
  'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc', 'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức',
  'Phu Thê', 'Huynh Đệ',
];

interface MucBang {
  ten: string;
  loai: LoaiTen;
  /** Tên cung chỉ nhận khi viết hoa (chữ thường "huynh đệ", "phụ mẫu" là lời thường) */
  canHoa?: boolean;
}

const BANG = new Map<string, MucBang>();
const datBang = (ten: string, muc: MucBang) => {
  const k = tachTu(ten).map((t) => t.chuan).join(' ');
  if (!BANG.has(k)) BANG.set(k, muc);
};

// Thứ tự đặt quyết định thắng thua khi một khoá trùng: lưu tinh, ghép, cung, sao.
for (const s of LUU_TINH) datBang(`Lưu ${s}`, { ten: `Lưu ${s}`, loai: 'luu' });
for (const g of Object.keys(TEN_GHEP)) datBang(g, { ten: g, loai: 'ghep' });
for (const t of TU_DIEN_THUC_THE) {
  if (t.loai === 'FORMATION') datBang(t.ten, { ten: t.ten, loai: 'ghep' });
}
for (const c of TEN_CUNG_HAI_CHU) datBang(c, { ten: c, loai: 'cung', canHoa: true });
for (const s of CHINH_TINH) datBang(s, { ten: s, loai: 'sao' });
for (const t of TU_DIEN_THUC_THE) {
  if (t.loai !== 'STAR' && t.loai !== 'TRANSFORMATION' && t.loai !== 'MARKER') continue;
  // Tuần / Triệt xử riêng bên dưới; chuỗi trùng lời thường thì không quét tự do.
  if (t.id === 'MARKER.TUAN' || t.id === 'MARKER.TRIET') continue;
  /*
   * Chuỗi trùng lời thường ("linh tinh", "bệnh", "suy") chỉ nhận khi viết hoa —
   * gói của engine luôn viết hoa tên sao, nên thiếu chúng thì "Hoả Linh" không
   * bao giờ được phép dù gói có đủ Hỏa Tinh lẫn Linh Tinh.
   */
  datBang(t.ten, { ten: t.ten, loai: 'sao', canHoa: KHONG_QUET_TU_DO.has(boDau(t.ten)) });
}

const SO_TU_TOI_DA = Math.max(...[...BANG.keys()].map((k) => k.split(' ').length));

/** "Tuần tới", "Tuần này" là thời gian; "Triệt để" là lời thường. */
const SAU_TUAN_LA_THOI_GIAN = new Set(['tới', 'này', 'sau', 'trước', 'qua', 'đầu', 'cuối', 'rồi', 'nữa', 'lễ', 'trăng']);

/* ------------------------------------------------------------------ quét */

/**
 * Mọi tên trong một câu, theo thứ tự xuất hiện, không trùng.
 *
 * `phucDucLaSao`: "Phúc Đức" vừa là tên cung vừa là một sao vòng Thái Tuế. Gói
 * có sao này thì đọc là sao, không thì là tên cung (mục 6.1).
 */
export function quetTen(cau: string, phucDucLaSao = false): TenTrongCau[] {
  const tu = tachTu(cau);
  const ra = new Map<string, TenTrongCau>();
  const them = (ten: string, loai: LoaiTen) => {
    if (!ra.has(`${loai}|${ten}`)) ra.set(`${loai}|${ten}`, { ten, loai });
  };

  for (let i = 0; i < tu.length; i++) {
    const w = tu[i].chuan;

    // "Lưu Hóa Lộc / Quyền / Khoa / Kỵ" — engine không an, luôn trượt.
    if (w === 'lưu' && tu[i + 1]?.chuan === 'hóa') {
      const sau = tu[i + 2] ? `Lưu Hóa ${tu[i + 2].goc}` : 'Lưu Hóa';
      them(sau, 'luu-hoa');
      i += 2;
      continue;
    }

    // "cung Mệnh", "phần Thân" — tên cung một chữ chỉ nhận khi có chữ dẫn.
    if ((w === 'cung' || w === 'phần') && tu[i + 1] && /^(?:Mệnh|Thân)$/u.test(tu[i + 1].goc)) {
      them(tu[i + 1].goc, 'cung');
      i += 1;
      continue;
    }

    if ((tu[i].goc === 'Tuần' || tu[i].goc === 'Triệt') && !(w === 'tuần' && SAU_TUAN_LA_THOI_GIAN.has(tu[i + 1]?.chuan ?? '')) && !(w === 'triệt' && tu[i + 1]?.chuan === 'để')) {
      // Chữ hoa đầu câu ("Tuần này…") đã loại ở trên; còn lại là dấu Tuần / Triệt.
      them(tu[i].goc, 'tuan-triet');
      continue;
    }

    let khop = 0;
    for (let n = Math.min(SO_TU_TOI_DA, tu.length - i); n >= 1; n--) {
      const muc = BANG.get(tu.slice(i, i + n).map((t) => t.chuan).join(' '));
      if (!muc) continue;
      if (muc.canHoa && !tu.slice(i, i + n).every((t) => vietHoa(t.goc))) continue;
      // Một chữ viết hoa ở đầu câu ("Bệnh…", "Suy…") là chữ hoa đầu câu, không phải tên.
      if (muc.canHoa && n === 1 && i === 0) continue;
      if (muc.ten === 'Phúc Đức') them('Phúc Đức', phucDucLaSao ? 'sao' : 'cung');
      else them(muc.ten, muc.loai);
      khop = n;
      break;
    }
    if (khop) i += khop - 1;
  }

  return [...ra.values()];
}

/* -------------------------------------------------------------- danh sách */

/** Khoá so sánh: có dấu, đã gộp lối đặt dấu thanh. */
export const khoaTen = (ten: string) => tachTu(ten).map((t) => t.chuan).join(' ');

/**
 * Tập tên được phép gọi trong lượt: mọi tên có trong gói (câu dữ kiện, danh
 * sách sao, tên cách cục), cộng `them` (tên trong câu hỏi khi người dùng tra
 * cứu đích danh một sao).
 */
export function tapTenTuGoi(duKien: readonly DuKienLaSo[], them: readonly string[] = []): Set<string> {
  const tap = new Set<string>();
  const phucDuc = goiCoPhucDuc(duKien);
  const nap = (chuoi: string) => {
    for (const t of quetTen(chuoi, phucDuc)) if (t.loai !== 'cung' && t.loai !== 'luu-hoa') tap.add(khoaTen(t.ten));
  };
  for (const d of duKien) {
    nap(d.noiDung);
    for (const s of d.sao ?? []) tap.add(khoaTen(s));
    if (d.tenCachCuc) tap.add(khoaTen(d.tenCachCuc));
  }
  for (const c of them) nap(c);
  return tap;
}

/** Gói có sao Phúc Đức (vòng Thái Tuế) không — để quyết "Phúc Đức" là sao hay cung. */
export function goiCoPhucDuc(duKien: readonly DuKienLaSo[]): boolean {
  return duKien.some((d) => (d.sao ?? []).includes('Phúc Đức'));
}

/** Tên ghép được phép khi gói có chính nó, hoặc có đủ hai sao tạo nên nó. */
function ghepDuocPhep(ten: string, tap: ReadonlySet<string>): boolean {
  if (tap.has(khoaTen(ten))) return true;
  const phan = TEN_GHEP[ten];
  return !!phan && phan.every((p) => tap.has(khoaTen(p)));
}

/**
 * Những tên trong câu KHÔNG được phép: ngoài tập, lưu Tứ Hóa, hoặc tên cung.
 * Trả về tên chuẩn để ghi vào vết.
 */
export function tenNgoaiTap(cau: string, tap: ReadonlySet<string>, phucDucLaSao = false): string[] {
  const sai: string[] = [];
  for (const t of quetTen(cau, phucDucLaSao)) {
    if (t.loai === 'cung') continue; // tên cung là luật "mặt trước sạch", không phải luật tên
    if (t.loai === 'luu-hoa') sai.push(t.ten);
    else if (t.loai === 'ghep' ? !ghepDuocPhep(t.ten, tap) : !tap.has(khoaTen(t.ten))) sai.push(t.ten);
  }
  return sai;
}

/** Tên cung còn sót trong câu (sau khi đã chạy `doiTenCung`). */
export function tenCungTrongCau(cau: string, phucDucLaSao = false): string[] {
  return quetTen(cau, phucDucLaSao)
    .filter((t) => t.loai === 'cung')
    .map((t) => t.ten);
}
