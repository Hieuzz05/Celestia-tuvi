/**
 * Luật tổ hợp của lớp hạn — sao gốc chỉ vào chiều khi ĐI CÙNG sao lưu / hoá theo hạn.
 *
 * Phương án `D:\Celestia\PHUONG-AN-van-han-lop-han.md` (commit 2, sửa theo phản biện L5, S2):
 * sao gốc ở cung hạn không tự cộng cát / hung; nó chỉ có tiếng khi một luật ở đây khớp — vd
 * lưu Kỵ gặp Kình Dương, lưu Lộc Tồn gặp Hóa Lộc. Thứ bậc khi cân: luật tổ hợp > tứ hoá theo
 * hạn > sao lưu đơn lẻ.
 *
 * Tệp chia hai phần:
 *  - Kiểu dữ liệu + hàm khớp + hàm kiểm bảng (commit 2a, không cần duyệt nội dung).
 *  - `LUAT_TO_HOP` — bảng hạt giống. Để RỖNG đến khi chủ dự án duyệt từng dòng (commit 2b).
 *    Mỗi dòng phải có ≥2 sách ghi giống nhau, kèm sách:dòng.
 *
 * Hàm thuần, không đọc biến môi trường: web và app cùng đọc qua `@tuvi/*`.
 */

import { tamPhuongTuChinh, type LaSo } from './ansao';
import type { LopHan, NguonHoa, TenHoa } from './tu-hoa-han';

/**
 * Một thành phần của tổ hợp.
 *  - `sao`: tên sao như trên lá số gốc ('Kình Dương'). `lop` chọn sao gốc, sao lưu (tìm
 *    'Lưu ' + tên trong `LopHan.luuTinh`) hay bên nào cũng được.
 *  - `hoa`: một hoá, lọc theo nguồn; 'han' = lưu (can năm) hoặc đại vận.
 */
export type ThanhPhan =
  | { loai: 'sao'; ten: string; lop: 'goc' | 'luu' | 'bat-ky' }
  | { loai: 'hoa'; hoa: TenHoa; nguon: NguonHoa | 'han' | 'bat-ky' };

/** Các thành phần phải cùng nằm ở đâu so với cung đang xét */
export type PhamViToHop = 'dong-cung' | 'tam-phuong';

/** Cung nào của lớp hạn được đem ra xét luật */
export type CungXet = 'cung-hoi' | 'tieu-han' | 'dai-van' | 'nguyet-han';

export type ChieuToHop = 'thuan' | 'can-tro' | 'hai-mat';

export interface NguonSach {
  /** Tên tệp sách trong kho tài liệu (D:/Tài liệu tử vi/markdown) */
  sach: string;
  dong: number;
}

export interface LuatToHop {
  ma: string;
  thanhPhan: ThanhPhan[];
  phamVi: PhamViToHop;
  apDung: CungXet[];
  chieu: ChieuToHop;
  /** Câu nghĩa đời thường, không chữ nội bộ — lớp gọi đưa thẳng vào dữ kiện */
  nghia: string;
  nguon: NguonSach[];
}

export interface ViTriThanhPhan {
  thanhPhan: ThanhPhan;
  /** Tên hiển thị: tên sao ('Lưu Kình Dương') hoặc 'Hóa Kỵ (Liêm Trinh)' */
  ten: string;
  chiIndex: number;
}

export interface KhopLuat {
  luat: LuatToHop;
  cungXet: CungXet;
  /** Cung đang xét (0 = Tý) */
  chiIndex: number;
  viTri: ViTriThanhPhan[];
}

/** Bảng hạt giống — RỖNG cho đến khi chủ dự án duyệt (commit 2b) */
export const LUAT_TO_HOP: readonly LuatToHop[] = [];

function vungXet(chiIndex: number, phamVi: PhamViToHop): Set<number> {
  if (phamVi === 'dong-cung') return new Set([chiIndex]);
  const { tamHop, xungChieu } = tamPhuongTuChinh(chiIndex);
  return new Set([chiIndex, ...tamHop, xungChieu]);
}

/** Mọi chỗ một thành phần xuất hiện trên lá số + lớp hạn */
function timThanhPhan(laSo: LaSo, lh: LopHan, tp: ThanhPhan): ViTriThanhPhan[] {
  if (tp.loai === 'sao') {
    const ra: ViTriThanhPhan[] = [];
    if (tp.lop !== 'luu') {
      for (const c of laSo.cungs)
        if (c.sao.some((s) => s.ten === tp.ten)) ra.push({ thanhPhan: tp, ten: tp.ten, chiIndex: c.chiIndex });
    }
    if (tp.lop !== 'goc') {
      const tenLuu = `Lưu ${tp.ten}`;
      for (const s of lh.luuTinh) if (s.ten === tenLuu) ra.push({ thanhPhan: tp, ten: tenLuu, chiIndex: s.chiIndex });
    }
    return ra;
  }
  const nguon: NguonHoa[] =
    tp.nguon === 'bat-ky' ? ['goc', 'nam', 'dai-van'] : tp.nguon === 'han' ? ['nam', 'dai-van'] : [tp.nguon];
  return [...lh.tuHoaGoc, ...lh.luuTuHoa, ...lh.tuHoaDaiVan]
    .filter((h) => h.hoa === tp.hoa && nguon.includes(h.nguon) && h.chiIndex >= 0)
    .map((h) => ({ thanhPhan: tp, ten: `${h.hoa} (${h.sao})`, chiIndex: h.chiIndex }));
}

/** Cung của từng loại cung xét; null khi lớp đó không có (ngoài đại vận, không truyền tháng) */
function cungCua(lh: LopHan, cungHoi: number | null, cx: CungXet): number | null {
  if (cx === 'cung-hoi') return cungHoi;
  if (cx === 'tieu-han') return lh.tieuHan;
  if (cx === 'dai-van') return lh.daiVan;
  return lh.nguyetHan;
}

/**
 * Luật nào khớp ở các cung của lớp hạn. Một luật khớp tại một cung khi MỌI thành phần có ít
 * nhất một chỗ nằm trong vùng xét. Cùng một luật trên cùng một cung chỉ trả một lần dù nhiều
 * loại cung xét trùng chỗ (vd tiểu hạn trùng đại vận) — lấy loại đứng trước trong `apDung`.
 */
export function khopLuatToHop(
  laSo: LaSo,
  lh: LopHan,
  cungHoi: number | null,
  bang: readonly LuatToHop[] = LUAT_TO_HOP
): KhopLuat[] {
  const ra: KhopLuat[] = [];
  for (const luat of bang) {
    const daXet = new Set<number>();
    for (const cx of luat.apDung) {
      const chi = cungCua(lh, cungHoi, cx);
      if (chi === null || daXet.has(chi)) continue;
      daXet.add(chi);
      const vung = vungXet(chi, luat.phamVi);
      const viTri: ViTriThanhPhan[] = [];
      let du = true;
      for (const tp of luat.thanhPhan) {
        const trong = timThanhPhan(laSo, lh, tp).filter((v) => vung.has(v.chiIndex));
        if (!trong.length) {
          du = false;
          break;
        }
        viTri.push(...trong);
      }
      if (du) ra.push({ luat, cungXet: cx, chiIndex: chi, viTri });
    }
  }
  return ra;
}

/** Thành phần thuộc lớp hạn: sao lưu hoặc hoá theo hạn */
function laThanhPhanHan(tp: ThanhPhan): boolean {
  return tp.loai === 'sao' ? tp.lop === 'luu' : tp.nguon === 'nam' || tp.nguon === 'dai-van' || tp.nguon === 'han';
}

/** Tập đối tượng một thành phần có thể trỏ tới — hai thành phần giao nhau thì một sao khớp cả hai */
function doiTuong(tp: ThanhPhan): string[] {
  if (tp.loai === 'sao') return (tp.lop === 'bat-ky' ? ['goc', 'luu'] : [tp.lop]).map((l) => `sao:${l}:${tp.ten}`);
  const nguon = tp.nguon === 'bat-ky' ? ['goc', 'nam', 'dai-van'] : tp.nguon === 'han' ? ['nam', 'dai-van'] : [tp.nguon];
  return nguon.map((n) => `hoa:${n}:${tp.hoa}`);
}

/**
 * Lỗi cấu trúc của một bảng luật. Rỗng = hợp lệ. Bài CI gọi trên `LUAT_TO_HOP`; tên sao có
 * thật hay không do bài CI đối chiếu với lá số quét (tệp này không giữ danh sách sao).
 */
export function kiemBangLuat(bang: readonly LuatToHop[]): string[] {
  const loi: string[] = [];
  const ma = new Set<string>();
  for (const l of bang) {
    const n = l.ma || '(không mã)';
    if (!l.ma) loi.push(`${n}: thiếu mã`);
    else if (ma.has(l.ma)) loi.push(`${n}: trùng mã`);
    ma.add(l.ma);
    if (l.thanhPhan.length < 2) loi.push(`${n}: tổ hợp cần ≥2 thành phần`);
    const daCo = new Set<string>();
    for (const tp of l.thanhPhan) {
      const dt = doiTuong(tp);
      if (dt.some((k) => daCo.has(k))) loi.push(`${n}: thành phần lặp (hai thành phần có thể là cùng một sao / một hoá)`);
      dt.forEach((k) => daCo.add(k));
    }
    if (!l.thanhPhan.some(laThanhPhanHan)) loi.push(`${n}: phải có ít nhất một sao lưu hoặc hoá theo hạn`);
    if (!l.apDung.length) loi.push(`${n}: thiếu cung áp dụng`);
    if (!l.nghia.trim()) loi.push(`${n}: thiếu câu nghĩa`);
    const sach = new Set(l.nguon.filter((s) => s.sach && s.dong > 0).map((s) => s.sach));
    if (sach.size < 2) loi.push(`${n}: cần ≥2 sách khác nhau có số dòng`);
  }
  return loi;
}
