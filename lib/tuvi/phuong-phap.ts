/**
 * Phương pháp tính đang dùng, có phiên bản.
 *
 * Spec v4 (mục 5) bác việc gắn nhãn "Bắc phái"/"Nam phái" chung chung ở giao
 * diện: một cái tên trường phái không nói được quy tắc nào đang chạy, và không
 * tái lập được kết quả. Thay vào đó mỗi lần luận ghi lại đúng bộ quy tắc và
 * phiên bản của nó, để sau này đọc lại còn biết kết quả sinh ra từ đâu.
 *
 * Đổi bất cứ biến thể nào bên dưới thì PHẢI tăng `phienBan` — nếu không, hai kết
 * quả khác nhau sẽ cùng mang một nhãn và không ai lần lại được.
 */

export interface BienThePhuongPhap {
  /** Giờ Tý sớm (23h thuộc ngày hôm sau) hay Tý muộn */
  tyDauCuoi: 'ty-som' | 'ty-muon';
  /** Cách xử lý tháng nhuận khi quy về âm lịch */
  thangNhuan: 'theo-thang-chinh' | 'tach-rieng';
  /** Bộ Tứ Hóa đang dùng */
  boTuHoa: string;
  /** Chiều an đại vận */
  chieuDaiVan: 'theo-am-duong-nam-nu';
}

export interface PhuongPhap {
  id: string;
  phienBan: string;
  bienThe: BienThePhuongPhap;
  /** Những lớp dữ kiện engine thực sự tính được — không liệt kê thứ chưa có */
  lopHoTro: string[];
}

export const PHUONG_PHAP: PhuongPhap = {
  id: 'celestia-nam-phai',
  phienBan: '2026.09.1',
  bienThe: {
    tyDauCuoi: 'ty-som',
    thangNhuan: 'theo-thang-chinh',
    boTuHoa: 'tu-hoa-theo-can-nam-sinh',
    chieuDaiVan: 'theo-am-duong-nam-nu',
  },
  lopHoTro: [
    'chinh-tinh',
    'phu-tinh',
    'do-sang',
    'tu-hoa-ban-menh',
    'tuan-triet',
    'dai-van',
    'tieu-han',
    'nguyet-han',
    'luu-tinh-theo-nam',
    'tam-phuong-tu-chinh',
  ],
};

/** Nhãn ngắn để ghi kèm mỗi bài luận — dùng ở phần căn cứ */
export function nhanPhuongPhap(): string {
  return `${PHUONG_PHAP.id} · v${PHUONG_PHAP.phienBan}`;
}

/** Engine có tính được lớp này không? Dùng để không nói bừa về thứ chưa có. */
export function coLop(lop: string): boolean {
  return PHUONG_PHAP.lopHoTro.includes(lop);
}
