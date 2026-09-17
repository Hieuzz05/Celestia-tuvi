export interface DisplaySettings {
  chinhTinh: boolean;
  phuTinh: boolean;
  doSang: boolean;
  tuHoa: boolean;
  trangSinh: boolean;
  daiHan: boolean;
  tieuHan: boolean;
  nguyetHan: boolean;
  tuanTriet: boolean;
  tamPhuongTuChinh: boolean;
  vongSao: boolean;
  luuTinh: boolean;
}

export const MAC_DINH_SETTINGS: DisplaySettings = {
  chinhTinh: true,
  phuTinh: true,
  doSang: true,
  tuHoa: true,
  trangSinh: true,
  daiHan: true,
  tieuHan: true,
  nguyetHan: true,
  tuanTriet: true,
  tamPhuongTuChinh: true,
  vongSao: true,
  luuTinh: false,
};

/**
 * Ba chế độ đọc bản đồ.
 *
 * Cùng một lá số, khác nhau ở chỗ bật bao nhiêu lớp. Bản spec đặt ra ba mức vì
 * người mới mở mệnh bàn đầy đủ lên là thấy hàng trăm nhãn và đóng lại ngay,
 * còn người biết Tử Vi thì thiếu lớp nào là không đối chiếu được.
 *
 * Đây là ba mức ĐỘ DÀY, không phải ba bản tính khác nhau: an sao luôn y hệt.
 */
export type CheDoBanDo = 'de-hieu' | 'co-dien' | 'chuyen-sau';

/** Thứ tự ba chế độ trên thanh chọn; chữ hiển thị nằm ở `t.banDo` */
export const THU_TU_CHE_DO: CheDoBanDo[] = ['de-hieu', 'co-dien', 'chuyen-sau'];

export const SETTINGS_THEO_CHE_DO: Record<CheDoBanDo, DisplaySettings> = {
  'de-hieu': {
    chinhTinh: true,
    phuTinh: false,
    doSang: false,
    tuHoa: false,
    trangSinh: false,
    daiHan: true,
    tieuHan: true,
    nguyetHan: false,
    tuanTriet: false,
    tamPhuongTuChinh: true,
    vongSao: false,
    luuTinh: false,
  },
  'co-dien': MAC_DINH_SETTINGS,
  'chuyen-sau': { ...MAC_DINH_SETTINGS, luuTinh: true },
};

export const NHAN_SETTINGS: { key: keyof DisplaySettings; nhan: string }[] = [
  { key: 'chinhTinh', nhan: 'Chính tinh' },
  { key: 'phuTinh', nhan: 'Phụ tinh' },
  { key: 'doSang', nhan: 'Độ sáng sao' },
  { key: 'tuHoa', nhan: 'Tứ Hóa' },
  { key: 'vongSao', nhan: 'Vòng Thái Tuế / Lộc Tồn' },
  { key: 'trangSinh', nhan: 'Vòng Tràng Sinh' },
  { key: 'daiHan', nhan: 'Đại hạn' },
  { key: 'tieuHan', nhan: 'Tiểu hạn' },
  { key: 'nguyetHan', nhan: 'Nguyệt hạn' },
  { key: 'tuanTriet', nhan: 'Tuần / Triệt' },
  { key: 'luuTinh', nhan: 'Lưu tinh (theo năm xem)' },
  { key: 'tamPhuongTuChinh', nhan: 'Tam phương tứ chính' },
];

/** Vị trí cố định của từng chi trên lưới 4×4 truyền thống (1-indexed row/col) */
export const VI_TRI_GRID: Record<number, { row: number; col: number }> = {
  5: { row: 1, col: 1 }, // Tỵ
  6: { row: 1, col: 2 }, // Ngọ
  7: { row: 1, col: 3 }, // Mùi
  8: { row: 1, col: 4 }, // Thân
  4: { row: 2, col: 1 }, // Thìn
  9: { row: 2, col: 4 }, // Dậu
  3: { row: 3, col: 1 }, // Mão
  10: { row: 3, col: 4 }, // Tuất
  2: { row: 4, col: 1 }, // Dần
  1: { row: 4, col: 2 }, // Sửu
  0: { row: 4, col: 3 }, // Tý
  11: { row: 4, col: 4 }, // Hợi
};

// Danh sách sao chuyển về lib/tuvi/phu-tinh-trong-yeu.ts: engine luận giải cũng
// cần đúng danh sách này, mà engine không được phụ thuộc vào tầng giao diện.
export { PHU_TINH_TRONG_YEU } from '@/lib/tuvi/phu-tinh-trong-yeu';
