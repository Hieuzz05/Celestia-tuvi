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
 *  - `LUAT_TO_HOP` — bảng hạt giống, chủ dự án duyệt từng dòng (commit 2b, 17/10/2026; bản
 *    trình `D:\Celestia\BANG-LUAT-TO-HOP-2b.md`). Mỗi dòng phải có ≥2 nguồn ĐỘC LẬP (khác nhóm
 *    trong `NHOM_NGUON`) ghi giống nhau, kèm sách:dòng.
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

/**
 * Các thành phần phải cùng nằm ở đâu so với cung đang xét.
 *  - `xung-chieu`: sao gốc / hoá gốc phải ĐỒNG CUNG với cung xét; sao lưu / hoá theo hạn ở cung
 *    đó hoặc cung xung. Đúng câu sách «hạn ngộ KÌNH có lưu KÌNH xung» (Ứng dụng – Phụ Tinh 2067).
 *    Không cho sao gốc nằm ở cung xung: nếu không, năm Kình gốc và Lưu Kình cùng đóng cung A thì
 *    luật lại khớp ở cung đối diện A — một cung không có sao nào (phản biện 2b, 17/10/2026).
 */
export type PhamViToHop = 'dong-cung' | 'xung-chieu' | 'tam-phuong';

/** Cung nào của lớp hạn được đem ra xét luật */
export type CungXet = 'cung-hoi' | 'tieu-han' | 'dai-van' | 'nguyet-han';

export type ChieuToHop = 'thuan' | 'can-tro' | 'hai-mat';

export interface NguonSach {
  /** Tên tệp sách trong kho tài liệu (D:/Tài liệu tử vi/markdown) */
  sach: string;
  dong: number;
  /**
   * Nguyên văn trích từ đúng dòng đó, phải nói đúng tổ hợp của luật (không phải một bộ sao rộng
   * hơn có chứa nó). Bài CI đối chiếu với tệp sách khi máy có kho tài liệu.
   */
  trich: string;
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
  /** Thuộc lá số gốc (sao gốc, hoá gốc) — khác sao lưu / hoá theo hạn */
  laGoc: boolean;
}

export interface KhopLuat {
  luat: LuatToHop;
  cungXet: CungXet;
  /** Cung đang xét (0 = Tý) */
  chiIndex: number;
  viTri: ViTriThanhPhan[];
}

/**
 * Nhóm nguồn: hai tệp cùng nhóm chỉ tính là MỘT nguồn khi đếm ≥2. Nhóm theo gốc câu chữ, không
 * hẳn theo tác giả: Vũ Tài Lục, Chìa khoá và Ảo bí cùng chép phú của Tử Vi Đẩu Số Toàn Thư (gộp
 * cả ba là đếm thiếu ở những đoạn không phải phú — chấp nhận, thà thiếu còn hơn đếm hai lần một
 * câu). Tệp không có ở đây không được dùng làm nguồn (bài CI chặn trên bảng thật).
 */
export const NHOM_NGUON: Readonly<Record<string, string>> = {
  'Tử Vi đẩu số toàn thư - Vũ Tài Lục.md': 'phu-toan-thu',
  'Chìa khóa Tử Vi.md': 'phu-toan-thu',
  'Tử Vi ảo bí - Việt Viêm Tử.md': 'phu-toan-thu',
  'Tử vi tổng hợp.md': 'nguyen-phat-loc',
  'Tử Vi hàm số - Nguyễn Phát Lộc.md': 'nguyen-phat-loc',
  'Tử Vi ứng dụng - Chính Tinh.md': 'tu-vi-ung-dung',
  'Tử Vi ứng dụng - Phụ Tinh.md': 'tu-vi-ung-dung',
  'Tử Vi nghiệm lý toàn thư - Thiên Lương.md': 'thien-luong',
  'Tử vi nghiệm lý 1974 - Thiên Lương.md': 'thien-luong',
  'Phú Tử Vi Lê Quý Đôn.md': 'le-quy-don',
  'Số Tử Vi dưới mắt khoa học.md': 'ha-thuc-hong',
  'Tử Vi Bổ Túc - Nguyễn Mạnh Bảo.md': 'nguyen-manh-bao',
  'Tử Vi khảo luận.md': 'tu-vi-khao-luan',
  'Tự Điển Tử Vi - Đắc Lộc.md': 'dac-loc',
  // Bốn sách tứ hoá nạp 26/10/2026 (chủ dự án nhận làm nguồn 31/10). Hai tập Tứ Hóa Phái
  // cùng một tác giả nên là MỘT nhóm: không được tự đứng làm "hai nguồn" cho một luật.
  'Trung Châu Tử Vi Đẩu Số - Tứ Hóa Phái - Tập 1.md': 'tu-hoa-phai',
  'Trung Châu Tử Vi Đẩu Số - Tứ Hóa Phái - Tập 2.md': 'tu-hoa-phai',
  'Tử Vi Đẩu Số Tinh Thành - Tập 2.md': 'tinh-thanh',
  'Giáo Trình Phi Tinh Lương Phái.md': 'luong-phai',
};

const PHU_TINH = 'Tử Vi ứng dụng - Phụ Tinh.md';

/**
 * Bảng hạt giống — chủ dự án duyệt 17/10/2026, sau phản biện và soát lại từng dòng nguồn. Đã
 * cân nhắc và để ngoài (chờ thêm sách): Bạch Hổ + Lưu Hổ (chỉ nhóm Ứng dụng nói đúng Hổ đơn; Hàm
 * số 2567/2587 nói bộ Tang Hổ), Đà gốc + Lưu Đà (nghĩa chỉ một nguồn), Tang Môn + Lưu Tang (chỉ
 * nhóm Nguyễn Phát Lộc), song Lộc Tồn (Tổng hợp 1102 trung tính, Chính Tinh 4301/4303 là một lá
 * cụ thể), Lưu Kình + Lưu Tang (chỉ khớp ở tam phương, ~31% số năm), Thất Sát + «刑忌» (một câu
 * phú).
 */
export const LUAT_TO_HOP: readonly LuatToHop[] = [
  {
    ma: 'KINH_TRUNG_LUU',
    thanhPhan: [
      { loai: 'sao', ten: 'Kình Dương', lop: 'goc' },
      { loai: 'sao', ten: 'Kình Dương', lop: 'luu' },
    ],
    phamVi: 'xung-chieu',
    // Sách nói Mệnh và hạn; không dòng nào cho áp vào cung hỏi bất kỳ
    apDung: ['tieu-han', 'dai-van'],
    chieu: 'can-tro',
    nghia: 'Giai đoạn này dễ va chạm hoặc bị khiêu khích; giữ bình tĩnh, tránh đối đầu trực diện.',
    nguon: [
      { sach: 'Tử Vi đẩu số toàn thư - Vũ Tài Lục.md', dong: 762, trich: 'Kình Dương trùng phùng lưu Dương' },
      { sach: 'Tử Vi ảo bí - Việt Viêm Tử.md', dong: 5465, trich: 'Kình-dương trùng phùng lưu Dương' },
      { sach: 'Chìa khóa Tử Vi.md', dong: 253, trich: 'Kình Dương trùng phùng lưu Dương' },
      { sach: PHU_TINH, dong: 2067, trich: 'hạn ngộ KÌNH có lưu KÌNH xung' },
      { sach: 'Tử Vi ứng dụng - Chính Tinh.md', dong: 4812, trich: 'Kình cố định gặp Kình lưu động xung hội họp' },
    ],
  },
];

/** Vị trí có nằm trong vùng xét không — ở `xung-chieu` sao gốc chỉ được đồng cung */
function trongVung(chiIndex: number, phamVi: PhamViToHop, v: ViTriThanhPhan): boolean {
  if (v.chiIndex === chiIndex) return true;
  const xung = (chiIndex + 6) % 12;
  if (phamVi === 'dong-cung') return false;
  if (phamVi === 'xung-chieu') return !v.laGoc && v.chiIndex === xung;
  return v.chiIndex === xung || tamPhuongTuChinh(chiIndex).tamHop.includes(v.chiIndex);
}

/** Mọi chỗ một thành phần xuất hiện trên lá số + lớp hạn */
function timThanhPhan(laSo: LaSo, lh: LopHan, tp: ThanhPhan): ViTriThanhPhan[] {
  if (tp.loai === 'sao') {
    const ra: ViTriThanhPhan[] = [];
    if (tp.lop !== 'luu') {
      for (const c of laSo.cungs)
        if (c.sao.some((s) => s.ten === tp.ten)) ra.push({ thanhPhan: tp, ten: tp.ten, chiIndex: c.chiIndex, laGoc: true });
    }
    if (tp.lop !== 'goc') {
      const tenLuu = `Lưu ${tp.ten}`;
      for (const s of lh.luuTinh) if (s.ten === tenLuu) ra.push({ thanhPhan: tp, ten: tenLuu, chiIndex: s.chiIndex, laGoc: false });
    }
    return ra;
  }
  const nguon: NguonHoa[] =
    tp.nguon === 'bat-ky' ? ['goc', 'nam', 'dai-van'] : tp.nguon === 'han' ? ['nam', 'dai-van'] : [tp.nguon];
  return [...lh.tuHoaGoc, ...lh.luuTuHoa, ...lh.tuHoaDaiVan]
    .filter((h) => h.hoa === tp.hoa && nguon.includes(h.nguon) && h.chiIndex >= 0)
    .map((h) => ({ thanhPhan: tp, ten: `${h.hoa} (${h.sao})`, chiIndex: h.chiIndex, laGoc: h.nguon === 'goc' }));
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
      const viTri: ViTriThanhPhan[] = [];
      let du = true;
      for (const tp of luat.thanhPhan) {
        const trong = timThanhPhan(laSo, lh, tp).filter((v) => trongVung(chi, luat.phamVi, v));
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
 * thật hay không do bài CI đối chiếu với lá số quét (tệp này không giữ danh sách sao). Tệp sách
 * lạ (không có trong `NHOM_NGUON`) tự thành một nhóm ở đây; bài CI chặn riêng trên bảng thật.
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
    if (l.phamVi === 'xung-chieu' && l.thanhPhan.every(laThanhPhanHan))
      loi.push(`${n}: xung-chieu cần ít nhất một sao / hoá gốc làm neo ở cung xét`);
    if (!l.apDung.length) loi.push(`${n}: thiếu cung áp dụng`);
    if (!l.nghia.trim()) loi.push(`${n}: thiếu câu nghĩa`);
    const nhom = new Set(l.nguon.filter((s) => s.sach && s.dong > 0 && s.trich.trim()).map((s) => NHOM_NGUON[s.sach] ?? s.sach));
    if (nhom.size < 2) loi.push(`${n}: cần ≥2 nguồn độc lập (khác nhóm sách) có số dòng và trích`);
  }
  return loi;
}
