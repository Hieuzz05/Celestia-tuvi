/**
 * Bảng sự thật của LỚP HẠN — tứ hoá theo hạn và các cung hạn của một năm xem.
 *
 * Quyết định 16/10/2026 (`D:\Celestia\QUYET-DINH-van-han-dung-sao-luu.md`): câu hỏi vận
 * hạn kết luận bằng lớp hạn — sao lưu, lưu tứ hoá theo can năm, tứ hoá theo can cung
 * đại vận, cung tiểu hạn / đại vận / nguyệt hạn. Sao gốc chỉ làm dẫn chứng.
 *
 * Tệp này CHỈ tìm vị trí: sao nào nhận hoá gì, đóng cung nào, lớp nào trùng lớp nào.
 * Không gắn nghĩa, không chấm thuận / cản trở — việc đó của lớp gọi. Hàm thuần, không đọc
 * biến môi trường: web và app cùng đọc qua `@tuvi/*`.
 *
 * Không đổi kết quả an sao (lá số gốc giữ nguyên bất kể năm xem), nên không đụng
 * `PHUONG_PHAP.phienBan`.
 *
 * Nguồn (16/10/2026): lưu tứ hoá chỉ có bộ *Tử Vi ứng dụng* dùng ("lưu Kỵ"); tứ hoá theo
 * can cung đại vận chưa có sách Việt nào trong kho ghi. Chủ dự án chốt vẫn làm cả hai, chờ
 * bổ sung nguồn. Dị bản bảng tứ hoá (Canh, Nhâm Khoa) giữ theo `TU_HOA` — sổ chưa rõ ở
 * `D:\Celestia\ra-soat-cach-cuc.md`.
 */

import { cungDaiVan, cungNguyetHan, cungTieuHan, luuTinhTheoNam, type LaSo } from './ansao';
import { CAN, TU_HOA } from './constants';

export type TenHoa = 'Hóa Lộc' | 'Hóa Quyền' | 'Hóa Khoa' | 'Hóa Kỵ';

/** Thứ tự trong một hàng của `TU_HOA` */
export const THU_TU_HOA: readonly TenHoa[] = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'];

/** Hoá đến từ đâu: can năm sinh (gốc), can năm xem (lưu), can cung đại vận */
export type NguonHoa = 'goc' | 'nam' | 'dai-van';

export interface HoaHan {
  hoa: TenHoa;
  /** Tên sao nhận hoá, đúng như trên lá số ('Tả Phù', 'Văn Xương'…) */
  sao: string;
  /** Cung sao đó đóng; -1 khi lá số không có sao này (không xảy ra với lá số engine an) */
  chiIndex: number;
  /** Tên cung chức năng; '?' khi không tìm thấy */
  tenCung: string;
  nguon: NguonHoa;
}

export type TrungLop =
  /** Tiểu hạn rơi đúng cung đại vận: hai lớp cùng nhấn một chỗ */
  | { loai: 'tieu-han-trung-dai-van'; chiIndex: number }
  /** Một sao nhận hoá từ hai lớp trở lên (vd lưu Quyền và đại vận Kỵ cùng vào Thiên Cơ) */
  | { loai: 'hoa-chong'; sao: string; chiIndex: number; hoa: { hoa: TenHoa; nguon: NguonHoa }[] };

export interface LopHan {
  namXem: number;
  tuoiAm: number;
  /** Chỉ số cung (0 = Tý) */
  tieuHan: number;
  /** null khi tuổi nằm ngoài mọi khoảng đại vận (trước đại vận đầu) */
  daiVan: number | null;
  /** Chỉ có khi truyền tháng âm */
  nguyetHan: number | null;
  luuTinh: ReturnType<typeof luuTinhTheoNam>;
  tuHoaGoc: HoaHan[];
  luuTuHoa: HoaHan[];
  tuHoaDaiVan: HoaHan[];
  trung: TrungLop[];
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Can của một năm dương lịch: 0 = Giáp … 9 = Quý */
export function canCuaNam(nam: number): number {
  return mod(nam + 6, 10);
}

/** Tuổi âm (tuổi mụ) tại một năm — cùng cách tính với `tuoiAmTaiNam` trong hanh-trinh.ts */
function tuoiAm(laSo: LaSo, nam: number): number {
  return nam - laSo.thongTin.amLich.nam + 1;
}

/** Bộ bốn hoá của một can, theo `TU_HOA` */
export function tuHoaTheoCan(canIndex: number): { hoa: TenHoa; sao: string }[] {
  return TU_HOA[mod(canIndex, 10)].map((sao, i) => ({ hoa: THU_TU_HOA[i], sao }));
}

function datLenLaSo(laSo: LaSo, canIndex: number, nguon: NguonHoa): HoaHan[] {
  return tuHoaTheoCan(canIndex).map(({ hoa, sao }) => {
    const cung = laSo.cungs.find((c) => c.sao.some((s) => s.ten === sao));
    return { hoa, sao, chiIndex: cung?.chiIndex ?? -1, tenCung: cung?.tenCung ?? '?', nguon };
  });
}

/** Tứ hoá gốc (can năm sinh), dạng cùng kiểu với hoá theo hạn để so chồng */
export function tuHoaGoc(laSo: LaSo): HoaHan[] {
  return datLenLaSo(laSo, laSo.canNamIndex, 'goc');
}

/** Lưu tứ hoá: bộ bốn hoá theo can NĂM XEM, đặt lên sao của lá số gốc */
export function luuTuHoaTheoNam(laSo: LaSo, namXem: number): HoaHan[] {
  return datLenLaSo(laSo, canCuaNam(namXem), 'nam');
}

/**
 * Tứ hoá đại vận: bộ bốn hoá theo CAN CỦA CUNG đại vận đang chạy ở tuổi âm này.
 * Tuổi chưa vào đại vận đầu thì không có đại vận → rỗng.
 */
export function tuHoaDaiVan(laSo: LaSo, tuoiAmXem: number): HoaHan[] {
  const cung = cungDaiVan(laSo, tuoiAmXem);
  if (!cung) return [];
  const can = (CAN as readonly string[]).indexOf(cung.can);
  if (can < 0) return [];
  return datLenLaSo(laSo, can, 'dai-van');
}

/** Gom mọi lớp hạn của một năm (và tháng âm, nếu có) thành một bảng */
export function lopHan(laSo: LaSo, namXem: number, thangAm?: number): LopHan {
  const ta = tuoiAm(laSo, namXem);
  const tieuHan = cungTieuHan(laSo, ta);
  const daiVan = cungDaiVan(laSo, ta)?.chiIndex ?? null;
  const goc = tuHoaGoc(laSo);
  const luu = luuTuHoaTheoNam(laSo, namXem);
  const dv = tuHoaDaiVan(laSo, ta);

  const trung: TrungLop[] = [];
  if (daiVan !== null && daiVan === tieuHan) trung.push({ loai: 'tieu-han-trung-dai-van', chiIndex: tieuHan });

  // Hoá chồng: chỉ tính khi có ít nhất một hoá theo HẠN — gốc chồng gốc không phải chuyện của năm.
  const theoSao = new Map<string, HoaHan[]>();
  for (const h of [...goc, ...luu, ...dv]) theoSao.set(h.sao, [...(theoSao.get(h.sao) ?? []), h]);
  for (const [sao, ds] of theoSao) {
    if (ds.length < 2 || !ds.some((h) => h.nguon !== 'goc')) continue;
    trung.push({ loai: 'hoa-chong', sao, chiIndex: ds[0].chiIndex, hoa: ds.map((h) => ({ hoa: h.hoa, nguon: h.nguon })) });
  }

  return {
    namXem,
    tuoiAm: ta,
    tieuHan,
    daiVan,
    nguyetHan: thangAm ? cungNguyetHan(laSo, ta, thangAm) : null,
    luuTinh: luuTinhTheoNam(namXem),
    tuHoaGoc: goc,
    luuTuHoa: luu,
    tuHoaDaiVan: dv,
    trung,
  };
}
