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

/** Phụ tinh trọng yếu — hiển thị nổi hơn nhóm phụ tinh còn lại */
export const PHU_TINH_TRONG_YEU = new Set([
  'Tả Phù',
  'Hữu Bật',
  'Văn Xương',
  'Văn Khúc',
  'Thiên Khôi',
  'Thiên Việt',
  'Lộc Tồn',
  'Thiên Mã',
  'Kình Dương',
  'Đà La',
  'Hỏa Tinh',
  'Linh Tinh',
  'Địa Không',
  'Địa Kiếp',
]);
