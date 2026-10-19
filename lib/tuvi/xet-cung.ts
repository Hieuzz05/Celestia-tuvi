/**
 * Xét cung — chạy bảng luật quan hệ (`luat-quan-he.ts`) trên hồ sơ cung (`ho-so-cung.ts`) theo
 * thứ tự sách, ra bốn danh sách đóng cho các bước sau đọc.
 *
 * Phương án `D:\Celestia\PHUONG-AN-3a-ban7-ma.md` (bản 2, bước C-C; chủ dự án duyệt 18/10/2026).
 * Thứ tự (GIAI-PHAP-viec-A-ban7 mục 3, Tử Vi hàm số 446–456):
 *   1. Cả lá (`hoSoLa`).
 *   2. Phúc Đức → Mệnh → Thân, mỗi cung (a)→(e):
 *      (a) địa lợi theo hành Bản Mệnh; (b) độ sáng + Tuần Triệt (khối Tuần Triệt chạy TRƯỚC mọi
 *      luật); (c) cách cục; (d) cát tinh bị PHÁ; (e) DỤNG / CHẾ / GIẢI.
 *   3. Cung đang hỏi, (b)→(e) — địa lợi chỉ có nghĩa ở Phúc, Mệnh, Thân (Hàm số :451).
 *
 * Đầu ra KHÔNG có nhãn chiều tốt / xấu: chiều lớp hạn vẫn do engine tính ở chỗ cũ (C1 bản 4, Q3).
 * Số sao chỉ đếm sao tọa thủ (Hàm số :456) và là con số phụ, không chốt gì.
 *
 * Cách đọc bảng luật (chỗ bảng chưa nói, tệp này chọn — đổi thì đổi ở đây và ở test):
 *  - `dong-cung`: cả hai bên tọa thủ ở cung đang xét.
 *  - `tam-phuong`: cả hai bên nằm trong tam phương tứ chính (tọa thủ, xung chiếu, tam hợp) của
 *    cung đang xét. Giáp và nhị hợp KHÔNG tính (Kình Đà giáp Lộc Tồn không phải "gặp sát").
 *  - `cung-han`: sao chủ động trong tam phương cung hạn; bên bị tác động là cách ở tam phương Mệnh.
 *  - Độ sáng so theo độ sáng HIỆU DỤNG sau Tuần Triệt tại cung gốc của sao (`doSangHieuDung`),
 *    trừ khi luật ghi Tuần Triệt `khong-doi` cho sao chủ động.
 *  - Điều kiện gắn với Mệnh (`menh-vo-chinh-dieu`, `sat-hop-hanh-menh`) chỉ áp khi đang xét Mệnh;
 *    `menh-than` chỉ khi đang xét Mệnh hoặc Thân.
 *  - "Sát hợp hành Mệnh" (NLTT 460): sát cùng hành Bản Mệnh. Kình Đà hành Kim; Hỏa Linh, Không
 *    Kiếp hành Hỏa (NLTT 455).
 *  - Triệt còn mạnh khi tuổi âm dưới `TUAN_TRIET.cuongDo.trietManhDenTuoi`; không có năm xem thì
 *    coi là còn mạnh (đọc lá gốc).
 *
 * Hàm thuần, không đọc biến môi trường, không import `lib/rag`: web và app cùng đọc qua `@tuvi/*`.
 */

import type { LaSo } from './ansao';
import { cungDaiVan, cungTieuHan } from './ansao';
import { nhanDangCachCuc } from './cach-cuc';
import type { NguHanh } from './constants';
import { doSangCuaSao, type DoSang } from './dosang';
import { tuoiAmTaiNam } from './hanh-trinh';
import { hoSoCung, hoSoLa, type DiaLoi, type HoSoCung, type HoSoLa, type KhongApDung, type ViTri } from './ho-so-cung';
import {
  LUAT_QUAN_HE,
  TUAN_TRIET,
  cungKhopNguocChieu,
  doSangHieuDung,
  soNhom,
  type BienDoi,
  type DieuKienDoSang,
  type LuatQuanHe,
  type MucQuanHe,
  type TapSao,
} from './luat-quan-he';

const KAD = 'khong-ap-dung' as const;
const TAM_PHUONG: ViTri[] = ['toa-thu', 'xung-chieu', 'tam-hop'];
const HANH_SAT: Record<string, NguHanh> = {
  'Kình Dương': 'Kim',
  'Đà La': 'Kim',
  'Hỏa Tinh': 'Hỏa',
  'Linh Tinh': 'Hỏa',
  'Địa Không': 'Hỏa',
  'Địa Kiếp': 'Hỏa',
};

/** Một sao đưa vào xét: sao gốc của hồ sơ, hoặc sao lưu / tứ hoá theo hạn (`lop: 'han'`) */
export interface SaoXet {
  ten: string;
  cungGoc: number;
  viTri: ViTri;
  tinhChat?: 'cat' | 'hung' | 'trung';
  doSangGoc: DoSang | null;
  /** Sau Tuần Triệt tại cung gốc. Sao hung KHÔNG lên bậc (chỉ giảm hung — TH 4095 nói về chính tinh cứu giải) */
  doSang: DoSang | null;
  tuan: boolean;
  triet: boolean;
  /** Sao chiếu vào (xung / tam hợp) bị Tuần Triệt ở CUNG ĐANG XÉT chắn: 'bot' chắn bớt, 'ca' chắn hẳn */
  chan: 'bot' | 'ca' | null;
  lop: 'goc' | 'han';
}

export type TrangThaiKhop =
  | 'ap'
  /** Tuần / Triệt ở cung sao chủ động làm luật mất hiệu lực */
  | 'mat-do-tuan-triet'
  /** Tuần / Triệt ở cung sao chủ động làm quan hệ đổi thành hại */
  | 'dao-thanh-hai'
  /** Luật ngược chiều cùng khớp có uuTien cao hơn */
  | 'thua-uu-tien'
  /** Luật ngoại lệ của nó khớp (thu hẹp / tắt) */
  | 'bi-ngoai-le'
  /** Luật chế / giải đủ sao nhưng thiếu điều kiện cả lá để vững (TH 4077: "bằng không… sóng gió") */
  | 'khong-vung';

export interface KhopQuanHe {
  ma: string;
  loai: LuatQuanHe['loai'];
  /** Mức sau bậc ngưỡng (nếu có) */
  muc: MucQuanHe;
  chiIndex: number;
  chuDong: string[];
  biTacDong: string[];
  trangThai: TrangThaiKhop;
  /** Mã luật làm đổi trạng thái (thắng ưu tiên / ngoại lệ) */
  boi?: string;
  /** Tuần Triệt ở cung sao chủ động, theo cột `bienDoi` của luật (bỏ `theo-chung` / `khong-doi`) */
  bienDoi: BienDoi[];
  /** Một luật `giam-luat` (ngoại lệ) khớp → luật này yếu đi */
  biGiamBoi?: string;
  /** Thắng ưu tiên trước luật PHÁ này: chế được nhưng là cuộc đọ sức, có biến động (TH 4077) */
  thangPha?: string;
  tuoiTang: boolean;
  hanhMenh: 'du' | 'giam' | KhongApDung;
  linhVuc?: LuatQuanHe['linhVuc'];
  doBen: LuatQuanHe['doBen'];
  chacChan: LuatQuanHe['chacChan'];
  soNhom: number;
  nghia: string;
}

export interface TuanTrietKhop {
  ma: string;
  sao: string[];
  tuan: BienDoi | null;
  triet: BienDoi | null;
}

export interface KetQuaCung {
  chiIndex: number;
  tenCung: string;
  vai: ('phuc' | 'menh' | 'than' | 'cung-hoi')[];
  /** (a) — chỉ Phúc, Mệnh, Thân */
  diaLoi: DiaLoi | KhongApDung;
  /** (b) chính tinh tọa thủ, độ sáng gốc → hiệu dụng */
  chinhTinh: { ten: string; doSangGoc: DoSang | null; doSang: DoSang | null }[];
  tuanTriet: HoSoCung['tuanTriet'];
  /** (b) dòng Tuần Triệt theo sao khớp ở cung này */
  tuanTrietTheoSao: TuanTrietKhop[];
  /** (c) mã cách cục engine nhận ra ở cung này */
  cachCuc: { ma: string; ten: string; sao: string[] }[];
  /** (d) PHÁ, rồi (e) DỤNG / CHẾ / GIẢI */
  khop: KhopQuanHe[];
  soSaoToaThu: { cat: number; hung: number };
}

export interface MucCach {
  chiIndex: number;
  ten: string;
  ma: string;
  lyDo: string;
}

export interface TranMuc {
  chiIndex: number;
  ma: string;
  ly:
    | 'khong-ben'
    | 'mot-nhom'
    | 'tuan-triet-giam'
    | 'hanh-menh-giam'
    | 'giam-luat'
    | 'chac-chan-thap'
    | 'tran-do-sang'
    | 'thang-chat-vat'
    | 'che-khong-vung';
  ghiChu: string;
}

export interface CungHan {
  chiIndex: number;
  vai: ('dai-van' | 'luu-nien' | 'tieu-han')[];
  /** Luật khớp trên sao gốc của cung hạn */
  khopGoc: KhopQuanHe[];
  /** Luật CHỈ khớp khi có sao lưu / tứ hoá theo hạn, cùng luật `cung-han` */
  khopHan: KhopQuanHe[];
}

export interface KetQuaXet {
  caLa: HoSoLa;
  /** Thứ tự đã xét (chiIndex), không trùng */
  thuTu: number[];
  cung: KetQuaCung[];
  /** (i) */
  cachThanh: MucCach[];
  cachPha: MucCach[];
  /**
   * (ii) sao hung hãm (và Hóa Kỵ) trong tam phương không có luật chế / giải / dụng nào đang áp.
   * `giam`: Tuần Triệt ở cung gốc của sao, hoặc chắn bớt khi chiếu vào — vẫn xấu nhưng nhẹ đi.
   * Sao chiếu vào bị chắn hẳn (Triệt ở cung vô chính diệu) không nằm ở đây.
   */
  hungKhongCuu: { chiIndex: number; sao: string; cungGoc: number; doSang: DoSang | null; giam: boolean }[];
  /** (ii) cát tinh bị luật PHÁ đang áp */
  catBiPha: { chiIndex: number; sao: string[]; boi: string }[];
  /** (iii) */
  tranMuc: TranMuc[];
  /** (iv) chỉ khi có năm xem */
  han: null | { namXem: number; tuoiAm: number; cung: CungHan[] };
}

// ---------------------------------------------------------------------------------------------

interface BoiCanh {
  laSo: LaSo;
  la: HoSoLa;
  hoSo: HoSoCung;
  sao: SaoXet[];
  /** Cung đang xét là cung hạn (để luật `cung-han` khớp) */
  laCungHan: boolean;
  namXem?: number;
}

function trietConManh(laSo: LaSo, namXem?: number): boolean {
  return namXem === undefined || tuoiAmTaiNam(laSo, namXem) < TUAN_TRIET.cuongDo.trietManhDenTuoi;
}

/**
 * Tuần Triệt ở cung đang xét với sao chiếu vào (TUAN_TRIET.phamVi `chieuVao: 'chan-bot'`, X5):
 * cung vô chính diệu có Triệt chắn hẳn cả cát lẫn hung, có Tuần chắn bớt sao hung (bình phong che
 * sao xấu, Chìa khóa 1238); cung có chính tinh thì Tuần hay Triệt đều chắn bớt.
 */
function mucChan(hoSo: HoSoCung, viTri: ViTri, tinhChat: SaoXet['tinhChat']): SaoXet['chan'] {
  if (viTri !== 'xung-chieu' && viTri !== 'tam-hop') return null;
  const { coTuan, coTriet } = hoSo.tuanTriet;
  if (!coTuan && !coTriet) return null;
  if (hoSo.voChinhDieu) {
    if (coTriet) return 'ca';
    return tinhChat === 'hung' ? 'bot' : null;
  }
  return 'bot';
}

function saoGoc(hoSo: HoSoCung, manh: boolean): SaoXet[] {
  return hoSo.sao.map((s) => {
    const doSangGoc = s.doSang ?? null;
    return {
      ten: s.ten,
      cungGoc: s.cungGoc,
      viTri: s.viTri,
      tinhChat: s.tinhChat,
      doSangGoc,
      doSang: s.tinhChat === 'hung' ? doSangGoc : doSangHieuDung(s.doSang, s.cungGocCoTuan, s.cungGocCoTriet, manh),
      tuan: s.cungGocCoTuan,
      triet: s.cungGocCoTriet,
      chan: mucChan(hoSo, s.viTri, s.tinhChat),
      lop: 'goc' as const,
    };
  });
}

/** Sao lưu (bỏ tiền tố "Lưu ") và tứ hoá theo hạn, gắn lớp `han`. Sao lưu sáng theo cung nó đóng */
function saoHan(laSo: LaSo, hoSo: HoSoCung): SaoXet[] {
  if (!hoSo.lopHan) return [];
  const tt = (c: number) => ({ tuan: laSo.cungs[c].coTuan, triet: laSo.cungs[c].coTriet });
  return [
    ...hoSo.lopHan.saoLuu.map((s) => {
      const ten = s.ten.replace(/^Lưu /, '');
      const d = doSangCuaSao(ten, s.chiIndex) ?? null;
      return {
        ten,
        cungGoc: s.chiIndex,
        viTri: s.viTri,
        tinhChat: s.tinhChat,
        doSangGoc: d,
        doSang: d,
        ...tt(s.chiIndex),
        chan: mucChan(hoSo, s.viTri, s.tinhChat),
        lop: 'han' as const,
      };
    }),
    ...hoSo.lopHan.tuHoa.map((h) => {
      const tinhChat = (h.hoa === 'Hóa Kỵ' ? 'hung' : 'cat') as SaoXet['tinhChat'];
      return {
        ten: h.hoa as string,
        cungGoc: h.chiIndex,
        viTri: h.viTri,
        tinhChat,
        doSangGoc: null,
        doSang: null,
        ...tt(h.chiIndex),
        chan: mucChan(hoSo, h.viTri, tinhChat),
        lop: 'han' as const,
      };
    }),
  ];
}

const hopDoSang = (dk: DieuKienDoSang, d: DoSang | null) => dk === 'bat-ky' || (d !== null && dk.includes(d));

function phamViCua(l: LuatQuanHe): ViTri[] {
  return l.viTri === 'dong-cung' ? ['toa-thu'] : TAM_PHUONG;
}

function hopLop(l: LuatQuanHe, s: SaoXet): boolean {
  return l.lop === 'bat-ky' || l.lop === s.lop;
}

/** Sao của một bên thoả vị trí, lớp, cung, độ sáng. `tat-ca` cần đủ mặt mọi tên */
function chonBen(
  tap: TapSao,
  tru: string[],
  sao: SaoXet[],
  pv: ViTri[],
  cung: number[] | Record<string, number[]> | KhongApDung,
  sang: DieuKienDoSang,
  l: LuatQuanHe,
  dungSangGoc: boolean
): SaoXet[] | null {
  const hop = sao.filter((s) => {
    if (!tap.sao.includes(s.ten) || tru.includes(s.ten) || !pv.includes(s.viTri) || !hopLop(l, s)) return false;
    const dsCung = cung === KAD ? null : Array.isArray(cung) ? cung : (cung[s.ten] ?? null);
    if (dsCung && !dsCung.includes(s.cungGoc)) return false;
    return hopDoSang(sang, dungSangGoc ? s.doSangGoc : s.doSang);
  });
  if (!hop.length) return null;
  if (tap.kieu === 'tat-ca' && !tap.sao.every((t) => hop.some((s) => s.ten === t))) return null;
  return hop;
}

/**
 * 'sai-pham-vi': điều kiện nói luật thuộc cung nào (Mệnh, Mệnh Thân…) không đúng cung đang xét → không khớp.
 * 'khong-vung': điều kiện cả lá để luật VỮNG (Mệnh Cục tương sinh, Âm Dương thuận lý) không đạt.
 */
function dieuKienLaDat(l: LuatQuanHe, bc: BoiCanh, chuDong: SaoXet[]): 'dat' | 'sai-pham-vi' | 'khong-vung' {
  if (l.dieuKienLa === KAD) return 'dat';
  const c = bc.laSo.cungs[bc.hoSo.chiIndex];
  const vung: string[] = ['menh-cuc-tuong-sinh', 'am-duong-thuan-ly'];
  const truot = l.dieuKienLa.filter((d) => {
    switch (d) {
      case 'menh-cuc-tuong-sinh':
        return !(bc.la.menhCucQuanHe === 'Cục sinh Mệnh' || bc.la.menhCucQuanHe === 'Mệnh sinh Cục');
      case 'am-duong-thuan-ly':
        return bc.la.amDuongThuanLy !== 'Âm Dương thuận lý';
      default:
        return !dieuKienPhamVi(d, bc, c, chuDong);
    }
  });
  if (!truot.length) return 'dat';
  return truot.every((d) => vung.includes(d)) ? 'khong-vung' : 'sai-pham-vi';
}

function dieuKienPhamVi(
  d: Exclude<Exclude<LuatQuanHe['dieuKienLa'], KhongApDung>[number], 'menh-cuc-tuong-sinh' | 'am-duong-thuan-ly'>,
  bc: BoiCanh,
  c: LaSo['cungs'][number],
  chuDong: SaoXet[]
): boolean {
  {
    switch (d) {
      case 'menh-vo-chinh-dieu':
        return c.laCungMenh && bc.hoSo.voChinhDieu !== null;
      case 'sat-hop-hanh-menh':
        return c.laCungMenh && chuDong.some((s) => HANH_SAT[s.ten] === bc.laSo.banMenh.hanh);
      case 'menh-than':
        return c.laCungMenh || c.laCungThan;
      // Luật hạn: bên bị tác động lấy ở tam phương Mệnh — đã xét trong khopLuat
      case 'cach-menh-tai-quan':
        return true;
      // Chỉ là lời dặn mức (tuỳ Mệnh Thân Phúc), không phải điều kiện cửa
      case 'tuy-menh-than-phuc':
        return true;
    }
  }
}

/** Khớp MỘT luật tại cung của bối cảnh. null = không khớp */
export function khopLuat(l: LuatQuanHe, bc: BoiCanh): KhopQuanHe | null {
  if (l.viTri === 'cung-han' && !bc.laCungHan) return null;
  const pv = phamViCua(l);
  // Luật DỤNG mở cửa theo độ sáng GỐC: Tuần Triệt làm sao hãm bớt xấu, không biến nó thành sao dùng được
  const sangGoc = l.loai === 'DUNG';
  const sangGocChu = sangGoc || (l.bienDoi.tuan === 'khong-doi' && l.bienDoi.triet === 'khong-doi');
  const chuDong = chonBen(l.chuDong, [], bc.sao, pv, l.dieuKienCung.chuDong, l.doSang.chuDong, l, sangGocChu);
  if (!chuDong) return null;

  let biTacDong: SaoXet[] = [];
  if (l.biTacDong !== KAD) {
    if (l.viTri === 'cung-han') {
      // Cách của Mệnh Tài Quan: sao GỐC trong tam phương Mệnh
      const menh = saoGoc(hoSoCung(bc.laSo, bc.laSo.menhIndex), trietConManh(bc.laSo, bc.namXem));
      const b = chonBen(l.biTacDong, l.biTacDong.tru, menh, TAM_PHUONG, l.dieuKienCung.biTacDong, l.doSang.biTacDong, { ...l, lop: 'goc' }, sangGoc);
      if (!b) return null;
      biTacDong = b;
    } else {
      const b = chonBen(l.biTacDong, l.biTacDong.tru, bc.sao, pv, l.dieuKienCung.biTacDong, l.doSang.biTacDong, l, sangGoc);
      if (!b) return null;
      biTacDong = b;
    }
  }

  if (l.canKem !== KAD && !l.canKem.every((nhom) => bc.sao.some((s) => nhom.includes(s.ten) && pv.includes(s.viTri) && hopLop(l, s))))
    return null;

  let muc = l.muc;
  if (l.nguong !== KAD) {
    const ng = l.nguong;
    const pvNg: ViTri[] = ng.phamVi === 'dong-cung' ? ['toa-thu'] : TAM_PHUONG;
    const dem = new Set(bc.sao.filter((s) => ng.tapSao.includes(s.ten) && pvNg.includes(s.viTri) && hopLop(l, s)).map((s) => s.ten)).size;
    const bac = [...ng.bac].sort((a, b) => b.tu - a.tu).find((b) => dem >= b.tu);
    if (!bac) return null;
    muc = bac.muc;
  }

  let tuoiTang = false;
  if (l.tuoi !== KAD) {
    const co = l.tuoi.chiNamSinh.includes(bc.laSo.chiNamIndex);
    if (l.tuoi.vaiTro === 'bat-buoc' && !co) return null;
    tuoiTang = co;
  }

  let hanhMenh: KhopQuanHe['hanhMenh'] = KAD;
  if (l.hanhMenh !== KAD) {
    const hm = l.hanhMenh;
    const h = bc.laSo.banMenh.hanh;
    const cung = (biTacDong[0] ?? chuDong[0]).cungGoc;
    if (hm.khongAp[cung]?.includes(h)) return null;
    hanhMenh = hm.du[cung]?.includes(h) ? 'du' : 'giam';
  }

  const la = dieuKienLaDat(l, bc, chuDong);
  if (la === 'sai-pham-vi') return null;
  // Chế / giải thiếu điều kiện vững vẫn ghi lại (để biết là "chế không vững"); dụng / phá thì không khớp
  if (la === 'khong-vung' && l.loai !== 'CHE' && l.loai !== 'GIAI') return null;

  // Tuần Triệt ở cung gốc sao chủ động. `theo-chung` = luật chung TUAN_TRIET.chung: giảm cả tốt lẫn xấu
  const bienDoi: BienDoi[] = [];
  const coTuan = chuDong.some((s) => s.tuan);
  const coTriet = chuDong.some((s) => s.triet);
  for (const [co, v] of [
    [coTuan, l.bienDoi.tuan],
    [coTriet, l.bienDoi.triet],
  ] as const)
    if (co && v !== 'khong-doi') bienDoi.push(v === 'theo-chung' ? 'giam' : v);
  // Sao chủ động đều chiếu vào và bị Tuần Triệt ở cung đang xét chắn
  if (chuDong.every((s) => s.chan === 'ca')) return null;
  if (chuDong.every((s) => s.chan !== null)) bienDoi.push('giam');
  const trangThai: TrangThaiKhop =
    la === 'khong-vung'
      ? 'khong-vung'
      : bienDoi.includes('mat')
        ? 'mat-do-tuan-triet'
        : bienDoi.includes('dao-thanh-hai')
          ? 'dao-thanh-hai'
          : 'ap';

  return {
    ma: l.ma,
    loai: l.loai,
    muc,
    chiIndex: bc.hoSo.chiIndex,
    chuDong: [...new Set(chuDong.map((s) => s.ten))],
    biTacDong: [...new Set(biTacDong.map((s) => s.ten))],
    trangThai,
    bienDoi: [...new Set(bienDoi)],
    tuoiTang,
    hanhMenh,
    linhVuc: l.linhVuc,
    doBen: l.doBen,
    chacChan: l.chacChan,
    soNhom: soNhom(l.nguon),
    nghia: l.nghia,
  };
}

/** Ưu tiên và ngoại lệ giữa các luật cùng khớp ở một cung */
function phanXu(khop: KhopQuanHe[], bang: readonly LuatQuanHe[]): KhopQuanHe[] {
  const luat = new Map(bang.map((l) => [l.ma, l]));
  const ra = khop.map((k) => ({ ...k }));
  const dangAp = (k: KhopQuanHe) => k.trangThai === 'ap';
  // Ngoại lệ trước: luật ngoại lệ khớp thì luật mẹ bị tắt (thu hẹp / lật) hay yếu đi (giam-luat)
  for (const k of ra) {
    if (!dangAp(k)) continue;
    const me = luat.get(k.ma)?.ngoaiLeCua;
    if (!me || me === KAD) continue;
    const kMe = ra.find((x) => x.ma === me && dangAp(x));
    if (!kMe) continue;
    if (k.muc === 'giam-luat') kMe.biGiamBoi = k.ma;
    else {
      kMe.trangThai = 'bi-ngoai-le';
      kMe.boi = k.ma;
    }
  }
  for (const a of ra)
    for (const b of ra) {
      if (a === b || !dangAp(a) || !dangAp(b)) continue;
      const la = luat.get(a.ma)!;
      const lb = luat.get(b.ma)!;
      if (!cungKhopNguocChieu(la, lb) || la.ngoaiLeCua === lb.ma || lb.ngoaiLeCua === la.ma) continue;
      // Hai luật thực sự cùng chạm một sao mới đụng nhau
      const chamNhau = a.chuDong.some((s) => b.biTacDong.includes(s)) && b.chuDong.some((s) => a.biTacDong.includes(s));
      if (!chamNhau || la.uuTien === lb.uuTien) continue;
      const thua = la.uuTien < lb.uuTien ? a : b;
      const thang = thua === a ? b : a;
      thua.trangThai = 'thua-uu-tien';
      thua.boi = thang.ma;
      // Thắng một luật PHÁ là cuộc đọ sức, không phải yên (TH 4077) → trần mức
      if (thua.loai === 'PHA') thang.thangPha = thua.ma;
    }
  return ra;
}

function xetMotCung(
  laSo: LaSo,
  la: HoSoLa,
  chiIndex: number,
  vai: KetQuaCung['vai'],
  namXem: number | undefined,
  bang: readonly LuatQuanHe[]
): KetQuaCung {
  const hoSo = hoSoCung(laSo, chiIndex);
  const sao = saoGoc(hoSo, trietConManh(laSo, namXem));
  const bc: BoiCanh = { laSo, la, hoSo, sao, laCungHan: false, namXem };
  const toaThu = sao.filter((s) => s.viTri === 'toa-thu');
  const cung = laSo.cungs[chiIndex];

  const tuanTrietTheoSao: TuanTrietKhop[] = [];
  if (hoSo.tuanTriet.coTuan || hoSo.tuanTriet.coTriet)
    for (const d of TUAN_TRIET.theoSao) {
      if (d.cung !== KAD && !d.cung.includes(chiIndex)) continue;
      if (d.tenCung !== KAD && !d.tenCung.includes(hoSo.tenCung)) continue;
      const co = toaThu.filter((s) => d.sao.sao.includes(s.ten) && hopDoSang(d.doSang, s.doSangGoc));
      if (!co.length || (d.sao.kieu === 'tat-ca' && !d.sao.sao.every((t) => co.some((s) => s.ten === t)))) continue;
      tuanTrietTheoSao.push({
        ma: d.ma,
        sao: co.map((s) => s.ten),
        tuan: hoSo.tuanTriet.coTuan ? d.tuan : null,
        triet: hoSo.tuanTriet.coTriet ? d.triet : null,
      });
    }

  const khopThuan = bang.map((l) => khopLuat(l, bc)).filter((k): k is KhopQuanHe => k !== null);
  // (d) PHÁ trước, (e) DỤNG / CHẾ / GIẢI sau
  const khop = phanXu(khopThuan, bang).sort((a, b) => Number(a.loai !== 'PHA') - Number(b.loai !== 'PHA'));

  return {
    chiIndex,
    tenCung: hoSo.tenCung,
    vai,
    diaLoi: hoSo.diaLoi,
    chinhTinh: cung.sao
      .filter((s) => s.loai === 'chinh-tinh')
      .map((s) => {
        const x = toaThu.find((t) => t.ten === s.ten)!;
        return { ten: s.ten, doSangGoc: x.doSangGoc, doSang: x.doSang };
      }),
    tuanTriet: hoSo.tuanTriet,
    tuanTrietTheoSao,
    cachCuc: nhanDangCachCuc(laSo, hoSo.tenCung)
      .filter((c) => c.cung === hoSo.tenCung)
      .map((c) => ({ ma: c.ma, ten: c.ten, sao: c.sao })),
    khop,
    soSaoToaThu: {
      cat: toaThu.filter((s) => s.tinhChat === 'cat').length,
      hung: toaThu.filter((s) => s.tinhChat === 'hung').length,
    },
  };
}

function xetCungHan(laSo: LaSo, la: HoSoLa, chiIndex: number, vai: CungHan['vai'], namXem: number, bang: readonly LuatQuanHe[]): CungHan {
  const hoSo = hoSoCung(laSo, chiIndex, namXem);
  const goc = saoGoc(hoSo, trietConManh(laSo, namXem));
  const bcGoc: BoiCanh = { laSo, la, hoSo, sao: goc, laCungHan: false, namXem };
  const bcHan: BoiCanh = { laSo, la, hoSo, sao: [...goc, ...saoHan(laSo, hoSo)], laCungHan: true, namXem };
  const khopGoc = phanXu(bang.map((l) => khopLuat(l, bcGoc)).filter((k): k is KhopQuanHe => k !== null), bang);
  const daCo = new Set(khopGoc.map((k) => `${k.ma}|${k.chuDong}|${k.biTacDong}`));
  const khopHan = phanXu(bang.map((l) => khopLuat(l, bcHan)).filter((k): k is KhopQuanHe => k !== null), bang).filter(
    (k) => !daCo.has(`${k.ma}|${k.chuDong}|${k.biTacDong}`)
  );
  return { chiIndex, vai, khopGoc, khopHan };
}

export interface TuyChonXet {
  /** chiIndex của cung đang hỏi */
  cungHoi?: number;
  namXem?: number;
  /** Bảng luật — mặc định `LUAT_QUAN_HE`; test truyền bảng giả */
  bang?: readonly LuatQuanHe[];
}

export function xetLaSo(laSo: LaSo, tc: TuyChonXet = {}): KetQuaXet {
  const bang = tc.bang ?? LUAT_QUAN_HE;
  const la = hoSoLa(laSo);
  const phuc = laSo.cungs.findIndex((c) => c.tenCung === 'Phúc Đức');
  const vaiTheoCung = new Map<number, KetQuaCung['vai']>();
  const them = (i: number, v: KetQuaCung['vai'][number]) => {
    if (i < 0) return;
    vaiTheoCung.set(i, [...(vaiTheoCung.get(i) ?? []), v]);
  };
  them(phuc, 'phuc');
  them(laSo.menhIndex, 'menh');
  them(laSo.thanIndex, 'than');
  if (tc.cungHoi !== undefined) them(tc.cungHoi, 'cung-hoi');
  const thuTu = [...vaiTheoCung.keys()];

  const cung = thuTu.map((i) => xetMotCung(laSo, la, i, vaiTheoCung.get(i)!, tc.namXem, bang));
  const luat = new Map(bang.map((l) => [l.ma, l]));

  const cachThanh: MucCach[] = [];
  const cachPha: MucCach[] = [];
  const hungKhongCuu: KetQuaXet['hungKhongCuu'] = [];
  const catBiPha: KetQuaXet['catBiPha'] = [];
  const tranMuc: TranMuc[] = [];

  for (const kc of cung) {
    const i = kc.chiIndex;
    for (const c of kc.cachCuc) cachThanh.push({ chiIndex: i, ten: c.ten, ma: c.ma, lyDo: 'cach-cuc' });
    for (const k of kc.khop) {
      if (k.loai === 'DUNG' && k.muc === 'lat') {
        if (k.trangThai === 'ap') cachThanh.push({ chiIndex: i, ten: k.ma, ma: k.ma, lyDo: k.nghia });
        else cachPha.push({ chiIndex: i, ten: k.ma, ma: k.boi ?? k.ma, lyDo: `${k.trangThai}${k.boi ? `: ${luat.get(k.boi)?.nghia ?? k.boi}` : ''}` });
      }
      if (k.loai === 'PHA' && k.trangThai === 'ap') {
        const catBi = k.biTacDong;
        if (catBi.length) catBiPha.push({ chiIndex: i, sao: catBi, boi: k.ma });
        for (const c of kc.cachCuc)
          if (c.sao.some((s) => catBi.includes(s))) cachPha.push({ chiIndex: i, ten: c.ten, ma: k.ma, lyDo: k.nghia });
      }
      if (k.trangThai === 'khong-vung')
        tranMuc.push({ chiIndex: i, ma: k.ma, ly: 'che-khong-vung', ghiChu: 'đủ sao để chế nhưng thiếu điều kiện cả lá: chế không vững' });
      if (k.trangThai !== 'ap') continue;
      if (k.thangPha) tranMuc.push({ chiIndex: i, ma: k.ma, ly: 'thang-chat-vat', ghiChu: `chế được ${k.thangPha} nhưng là cuộc đọ sức, có biến động` });
      if (k.doBen === 'khong-ben') tranMuc.push({ chiIndex: i, ma: k.ma, ly: 'khong-ben', ghiChu: 'phát nhanh, không bền' });
      if (k.soNhom < 2) tranMuc.push({ chiIndex: i, ma: k.ma, ly: 'mot-nhom', ghiChu: 'một nhóm tác giả: chỉ được nói mức giảm' });
      if (k.bienDoi.includes('giam')) tranMuc.push({ chiIndex: i, ma: k.ma, ly: 'tuan-triet-giam', ghiChu: 'Tuần / Triệt ở cung sao chủ động làm yếu đi' });
      if (k.hanhMenh === 'giam') tranMuc.push({ chiIndex: i, ma: k.ma, ly: 'hanh-menh-giam', ghiChu: 'hành Bản Mệnh không đủ điều kiện, áp mức giảm' });
      if (k.biGiamBoi) tranMuc.push({ chiIndex: i, ma: k.ma, ly: 'giam-luat', ghiChu: `yếu đi do ${k.biGiamBoi}` });
      if (k.chacChan === 'thap') tranMuc.push({ chiIndex: i, ma: k.ma, ly: 'chac-chan-thap', ghiChu: 'sách chưa thống nhất: không khẳng định' });
    }
    const hoSo = hoSoCung(laSo, i);
    const saoCung = saoGoc(hoSo, trietConManh(laSo, tc.namXem));
    for (const s of saoCung)
      if (s.viTri === 'toa-thu' && s.doSangGoc === 'H' && s.doSang === 'D')
        tranMuc.push({ chiIndex: i, ma: s.ten, ly: 'tran-do-sang', ghiChu: 'hãm gặp Triệt lên ngang đắc, không cao hơn' });

    // (ii) sao hung hãm trong tam phương, không luật cứu nào đang áp lên nó
    const daCuu = new Set(
      kc.khop
        .filter((k) => k.trangThai === 'ap' && k.loai !== 'PHA')
        .flatMap((k) => (k.biTacDong.length ? k.biTacDong : k.chuDong))
    );
    const daBao = new Set<string>();
    for (const s of saoCung) {
      // Hóa Kỵ không có độ sáng nhưng là sao nặng nhất — vẫn phải lọt vào (ii)
      const nang = s.doSang === 'H' || s.ten === 'Hóa Kỵ';
      if (s.tinhChat !== 'hung' || !nang || !TAM_PHUONG.includes(s.viTri) || daCuu.has(s.ten) || s.chan === 'ca') continue;
      const key = `${s.ten}|${s.cungGoc}`;
      if (daBao.has(key)) continue;
      daBao.add(key);
      hungKhongCuu.push({ chiIndex: i, sao: s.ten, cungGoc: s.cungGoc, doSang: s.doSang, giam: s.tuan || s.triet || s.chan !== null });
    }
  }

  let han: KetQuaXet['han'] = null;
  if (tc.namXem !== undefined) {
    const tuoiAm = tuoiAmTaiNam(laSo, tc.namXem);
    const vaiHan = new Map<number, CungHan['vai']>();
    const themHan = (i: number | undefined | null, v: CungHan['vai'][number]) => {
      if (i === undefined || i === null || i < 0) return;
      vaiHan.set(i, [...(vaiHan.get(i) ?? []), v]);
    };
    themHan(cungDaiVan(laSo, tuoiAm)?.chiIndex, 'dai-van');
    themHan((((tc.namXem + 8) % 12) + 12) % 12, 'luu-nien');
    themHan(cungTieuHan(laSo, tuoiAm), 'tieu-han');
    han = {
      namXem: tc.namXem,
      tuoiAm,
      cung: [...vaiHan.entries()].map(([i, v]) => xetCungHan(laSo, la, i, v, tc.namXem!, bang)),
    };
  }

  return { caLa: la, thuTu, cung, cachThanh, cachPha, hungKhongCuu, catBiPha, tranMuc, han };
}
