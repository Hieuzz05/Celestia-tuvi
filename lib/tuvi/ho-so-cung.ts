/**
 * Hồ sơ cung — gom dữ kiện quan hệ quanh MỘT cung để các bước sau (bảng luật quan hệ, xét cung)
 * đọc, thay vì mỗi nơi tự dò lá số.
 *
 * Phương án `D:\Celestia\PHUONG-AN-3a-ban7-ma.md` (bản 2, bước C-A; chủ dự án duyệt 18/10/2026).
 * Tệp này CHỈ thu dữ kiện: không chấm điểm, không gắn nhãn tốt / xấu, không đổi hành vi nào đang
 * chạy. Chiều của lớp hạn vẫn do engine tính ở chỗ cũ (C1 bản 4).
 *
 * Căn cứ sách cho từng phần:
 *  - Địa lợi (sinh / vượng / bại / tuyệt) của cung an Mệnh theo hành Bản Mệnh: Tử Vi hàm số
 *    424–445; chỉ xét cho Phúc, Mệnh, Thân (:451), cung khác "giá trị bình thường" (:445).
 *  - Tuần Triệt chặn đầu / theo gót: Tử vi nghiệm lý 1974 :383 (d) "người Dương đóng cung Dương,
 *    người Âm đóng cung Âm bị Triệt hay Tuần đương đầu"; Tử vi tổng hợp 1052–1054. KHÔNG phân
 *    nam nữ (chủ dự án chốt 18/10/2026, Q4).
 *  - Mệnh có một trong Tuần / Triệt, đại vận gặp cái còn lại thì được tháo gỡ: nghiệm lý 1974
 *    :381 (a). Câu sách nói về Mệnh nên chỉ tính cho cung Mệnh.
 *
 * Hàm thuần, không đọc biến môi trường, không import `lib/rag`: web và app cùng đọc qua `@tuvi/*`.
 */

import { cungDaiVan, cungTieuHan, luuTinhTheoNam, tamPhuongTuChinh, type Cung, type LaSo } from './ansao';
import type { NguHanh, Sao } from './constants';
import { tuoiAmTaiNam } from './hanh-trinh';
import { luuTuHoaTheoNam, tuHoaDaiVan, type HoaHan } from './tu-hoa-han';

const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** Vị trí của một cung so với cung đang xét */
export type ViTri = 'toa-thu' | 'xung-chieu' | 'tam-hop' | 'nhi-hop' | 'giap';

export interface SaoTrongHoSo {
  ten: string;
  loai: Sao['loai'];
  tinhChat?: Sao['tinhChat'];
  doSang?: Sao['doSang'];
  /** Cung sao đóng (0 = Tý) */
  cungGoc: number;
  viTri: ViTri;
  /** Tuần / Triệt ở CUNG GỐC của sao — sao bị chặn ngay tại chỗ nó đóng */
  cungGocCoTuan: boolean;
  cungGocCoTriet: boolean;
  /** Hóa Kỵ gốc đóng cùng cung gốc của sao */
  kyDongCung: boolean;
}

export type DiaLoi = 'sinh' | 'vuong' | 'bai' | 'tuyet' | 'binh-thuong';
export type KieuTuanTriet = 'chan-dau' | 'theo-got';
export type KhongApDung = 'khong-ap-dung';

export interface HoSoCung {
  chiIndex: number;
  tenCung: string;
  /**
   * Mọi sao ở cung, cung xung chiếu, hai cung tam hợp, cung nhị hợp, hai cung giáp. Ở Tý và Sửu
   * cung nhị hợp cũng là cung giáp nên sao cung kia có mặt hai lần (một nhãn mỗi lần).
   */
  sao: SaoTrongHoSo[];
  giap: { truoc: { chiIndex: number; sao: string[] }; sau: { chiIndex: number; sao: string[] } };
  nhiHop: number;
  /** null khi cung có chính tinh */
  voChinhDieu: null | {
    /** Chính tinh cung xung chiếu, giữ độ sáng tại cung gốc của chúng */
    muon: SaoTrongHoSo[];
    /**
     * Thái Dương / Thái Âm ở Miếu / Vượng / Đắc chiếu về từ tam phương, tách hai cờ: cách "Âm
     * Dương hội chiếu" cần CẢ HAI (Tử Vi hàm số :762, Tử vi tổng hợp :1263). "Không bị ngăn
     * chận" (:762) thì bước sau xét qua `cungGocCoTuan` / `cungGocCoTriet` của từng sao.
     */
    nhatSangChieu: boolean;
    nguyetSangChieu: boolean;
  };
  tuanTriet: {
    coTuan: boolean;
    coTriet: boolean;
    caHai: boolean;
    /**
     * Chỉ có khi cung có Tuần hoặc Triệt. Sách nói chặn đầu / theo gót cho Mệnh (và đại vận);
     * ở cung khác đây chỉ là dữ kiện thô, bảng luật không được tự diễn giải.
     */
    kieu: KieuTuanTriet | null;
    /**
     * Chỉ tính cho cung Mệnh và khi có năm xem: Mệnh bị một cái, đại vận gặp cái còn lại
     * (nghiệm lý 1974 :381 a, :383 e). Thân có câu riêng (:382 b, gặp sớm không tháo nổi) nên
     * không gộp vào đây. Câu (d) :383 gắn (a) với kiểu chặn đầu; theo gót thì (e) "vận tốt mở
     * làm hai lần chậm chậm" — người đọc cờ này phải đọc kèm `kieu`.
     */
    thaoGoTaiDaiVan: boolean | KhongApDung;
  };
  /** Chỉ cho Phúc Đức, Mệnh, Thân */
  diaLoi: DiaLoi | KhongApDung;
  /** Chỉ có khi truyền năm xem */
  lopHan: null | {
    namXem: number;
    tuoiAm: number;
    laCungDaiVan: boolean;
    laCungTieuHan: boolean;
    saoLuu: { ten: string; chiIndex: number; tinhChat: Sao['tinhChat']; viTri: ViTri }[];
    tuHoa: (HoaHan & { viTri: ViTri })[];
  };
}

export interface HoSoLa {
  tuoiDuong: boolean;
  amDuongThuanLy: string;
  menhCucQuanHe: string;
  chieuDaiVan: 'thuan' | 'nghich';
  thanCuCung: string;
  /**
   * Tuần / Triệt ở Mệnh và Thân, để thô. Câu nghiệm lý 1974 :382 (c) "Mệnh, Thân bị cả Tuần lẫn
   * Triệt" đọc được hai cách (mỗi cung đủ hai, hay hai cung gộp lại đủ hai), nên không gộp sẵn
   * thành một cờ; bảng luật quan hệ chọn cách đọc và ghi nguồn.
   */
  menhThan: { menhTuan: boolean; menhTriet: boolean; thanTuan: boolean; thanTriet: boolean };
}

/** Bảng Tử Vi hàm số 424–441: hành Bản Mệnh → chi của từng giai tầng địa lợi */
const BANG_DIA_LOI: Record<NguHanh, { sinh: number[]; vuong: number[]; bai: number[]; tuyet: number[] }> = {
  Mộc: { sinh: [11], vuong: [3], bai: [0], tuyet: [8] },
  Hỏa: { sinh: [2], vuong: [6], bai: [3], tuyet: [11] },
  Kim: { sinh: [5], vuong: [9], bai: [6], tuyet: [2] },
  Thủy: { sinh: [8], vuong: [0], bai: [9], tuyet: [5] },
  Thổ: { sinh: [6], vuong: [4, 10, 1, 7], bai: [5], tuyet: [3] },
};

export function diaLoi(hanhBanMenh: NguHanh, chiIndex: number): DiaLoi {
  const b = BANG_DIA_LOI[hanhBanMenh];
  if (b.sinh.includes(chiIndex)) return 'sinh';
  if (b.vuong.includes(chiIndex)) return 'vuong';
  if (b.bai.includes(chiIndex)) return 'bai';
  if (b.tuyet.includes(chiIndex)) return 'tuyet';
  return 'binh-thuong';
}

/** Tuổi dương (can chẵn) gặp Tuần / Triệt ở cung dương (chi chẵn), hoặc âm gặp âm: chặn đầu */
export function kieuTuanTriet(canNamIndex: number, chiIndex: number): KieuTuanTriet {
  return canNamIndex % 2 === chiIndex % 2 ? 'chan-dau' : 'theo-got';
}

/** Lục hợp chi: Tý–Sửu, Dần–Hợi, Mão–Tuất, Thìn–Dậu, Tỵ–Thân, Ngọ–Mùi */
export function cungNhiHop(chiIndex: number): number {
  return mod12(1 - chiIndex);
}

export function cungGiap(chiIndex: number): [number, number] {
  return [mod12(chiIndex - 1), mod12(chiIndex + 1)];
}

export function laVoChinhDieu(cung: Cung): boolean {
  return !cung.sao.some((s) => s.loai === 'chinh-tinh');
}

const SANG = new Set(['M', 'V', 'D']);

function sangChieu(sao: SaoTrongHoSo[], ten: string): boolean {
  return sao.some(
    (s) => (s.viTri === 'xung-chieu' || s.viTri === 'tam-hop') && s.ten === ten && s.doSang != null && SANG.has(s.doSang)
  );
}

function viTriQuanh(chiIndex: number): [number, ViTri][] {
  const tp = tamPhuongTuChinh(chiIndex);
  const [truoc, sau] = cungGiap(chiIndex);
  return [
    [chiIndex, 'toa-thu'],
    [tp.xungChieu, 'xung-chieu'],
    [tp.tamHop[0], 'tam-hop'],
    [tp.tamHop[1], 'tam-hop'],
    [cungNhiHop(chiIndex), 'nhi-hop'],
    [truoc, 'giap'],
    [sau, 'giap'],
  ];
}

function viTriCua(chiIndex: number, cungXet: number): ViTri | null {
  for (const [i, v] of viTriQuanh(chiIndex)) if (i === cungXet) return v;
  return null;
}

function saoCuaCung(cung: Cung, viTri: ViTri): SaoTrongHoSo[] {
  const ky = cung.sao.some((s) => s.loai === 'tu-hoa' && s.ten === 'Hóa Kỵ');
  return cung.sao.map((s) => ({
    ten: s.ten,
    loai: s.loai,
    tinhChat: s.tinhChat,
    doSang: s.doSang,
    cungGoc: cung.chiIndex,
    viTri,
    cungGocCoTuan: cung.coTuan,
    cungGocCoTriet: cung.coTriet,
    kyDongCung: ky,
  }));
}

export function hoSoCung(laSo: LaSo, chiIndex: number, namXem?: number): HoSoCung {
  const cung = laSo.cungs[chiIndex];
  const quanh = viTriQuanh(chiIndex);
  const sao = quanh.flatMap(([i, v]) => saoCuaCung(laSo.cungs[i], v));
  const [truoc, sau] = cungGiap(chiIndex);
  const tenSao = (i: number) => laSo.cungs[i].sao.map((s) => s.ten);

  let voChinhDieu: HoSoCung['voChinhDieu'] = null;
  if (laVoChinhDieu(cung)) {
    voChinhDieu = {
      muon: sao.filter((s) => s.viTri === 'xung-chieu' && s.loai === 'chinh-tinh'),
      nhatSangChieu: sangChieu(sao, 'Thái Dương'),
      nguyetSangChieu: sangChieu(sao, 'Thái Âm'),
    };
  }

  const coMot = cung.coTuan !== cung.coTriet;
  let thaoGo: boolean | KhongApDung = 'khong-ap-dung';
  const tuoiAm = namXem !== undefined ? tuoiAmTaiNam(laSo, namXem) : null;
  if (cung.laCungMenh && tuoiAm !== null && coMot) {
    const dv = cungDaiVan(laSo, tuoiAm);
    thaoGo = !!dv && (cung.coTuan ? dv.coTriet : dv.coTuan);
  }

  const xetDiaLoi = cung.laCungMenh || cung.laCungThan || cung.tenCung === 'Phúc Đức';

  let lopHan: HoSoCung['lopHan'] = null;
  if (namXem !== undefined && tuoiAm !== null) {
    const dv = cungDaiVan(laSo, tuoiAm);
    const saoLuu = luuTinhTheoNam(namXem).flatMap((s) => {
      const v = viTriCua(chiIndex, s.chiIndex);
      return v ? [{ ...s, viTri: v }] : [];
    });
    const tuHoa = [...luuTuHoaTheoNam(laSo, namXem), ...tuHoaDaiVan(laSo, tuoiAm)].flatMap((h) => {
      const v = h.chiIndex >= 0 ? viTriCua(chiIndex, h.chiIndex) : null;
      return v ? [{ ...h, viTri: v }] : [];
    });
    lopHan = {
      namXem,
      tuoiAm,
      laCungDaiVan: dv?.chiIndex === chiIndex,
      laCungTieuHan: cungTieuHan(laSo, tuoiAm) === chiIndex,
      saoLuu,
      tuHoa,
    };
  }

  return {
    chiIndex,
    tenCung: cung.tenCung,
    sao,
    giap: { truoc: { chiIndex: truoc, sao: tenSao(truoc) }, sau: { chiIndex: sau, sao: tenSao(sau) } },
    nhiHop: cungNhiHop(chiIndex),
    voChinhDieu,
    tuanTriet: {
      coTuan: cung.coTuan,
      coTriet: cung.coTriet,
      caHai: cung.coTuan && cung.coTriet,
      kieu: cung.coTuan || cung.coTriet ? kieuTuanTriet(laSo.canNamIndex, chiIndex) : null,
      thaoGoTaiDaiVan: thaoGo,
    },
    diaLoi: xetDiaLoi ? diaLoi(laSo.banMenh.hanh, chiIndex) : 'khong-ap-dung',
    lopHan,
  };
}

export function hoSoLa(laSo: LaSo): HoSoLa {
  const menh = laSo.cungs[laSo.menhIndex];
  const than = laSo.cungs[laSo.thanIndex];
  const tuoiDuong = laSo.canNamIndex % 2 === 0;
  // Cùng công thức với ansao.ts (duongNamAmNu): dương nam / âm nữ đi thuận
  const thuan = tuoiDuong === (laSo.thongTin.gioiTinh === 'nam');
  return {
    tuoiDuong,
    amDuongThuanLy: laSo.amDuongThuanLy,
    menhCucQuanHe: laSo.menhCucQuanHe,
    chieuDaiVan: thuan ? 'thuan' : 'nghich',
    thanCuCung: laSo.thanCuCung,
    menhThan: { menhTuan: menh.coTuan, menhTriet: menh.coTriet, thanTuan: than.coTuan, thanTriet: than.coTriet },
  };
}
