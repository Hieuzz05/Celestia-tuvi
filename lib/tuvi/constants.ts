/**
 * Hằng số Tử Vi - hệ Nam phái.
 * Quy ước index cung: 0 = Tý, 1 = Sửu, 2 = Dần ... 11 = Hợi.
 */

export const CAN = [
  'Giáp',
  'Ất',
  'Bính',
  'Đinh',
  'Mậu',
  'Kỷ',
  'Canh',
  'Tân',
  'Nhâm',
  'Quý',
] as const;

export const CHI = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
] as const;

/**
 * Tên 12 cung kể từ cung Mệnh, đếm NGƯỢC chiều địa chi.
 * Nghĩa là Huynh Đệ nằm ở cung liền TRƯỚC Mệnh (Mệnh − 1), Phụ Mẫu ở cung liền
 * SAU Mệnh (Mệnh + 1). Đếm nhầm chiều là toàn bộ 10 cung còn lại sai tên.
 */
export const TEN_CUNG = [
  'Mệnh',
  'Huynh Đệ',
  'Phu Thê',
  'Tử Tức',
  'Tài Bạch',
  'Tật Ách',
  'Thiên Di',
  'Nô Bộc',
  'Quan Lộc',
  'Điền Trạch',
  'Phúc Đức',
  'Phụ Mẫu',
] as const;

export const NGU_HANH = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'] as const;
export type NguHanh = (typeof NGU_HANH)[number];

/** Ngũ hành của 12 địa chi, index 0 = Tý */
export const NGU_HANH_CHI: NguHanh[] = [
  'Thủy', // Tý
  'Thổ', // Sửu
  'Mộc', // Dần
  'Mộc', // Mão
  'Thổ', // Thìn
  'Hỏa', // Tỵ
  'Hỏa', // Ngọ
  'Thổ', // Mùi
  'Kim', // Thân
  'Kim', // Dậu
  'Thổ', // Tuất
  'Thủy', // Hợi
];

/** 30 cặp nạp âm của lục thập hoa giáp, index = floor(vị trí trong vòng 60 / 2) */
export const NAP_AM: { ten: string; hanh: NguHanh }[] = [
  { ten: 'Hải Trung Kim', hanh: 'Kim' },
  { ten: 'Lư Trung Hỏa', hanh: 'Hỏa' },
  { ten: 'Đại Lâm Mộc', hanh: 'Mộc' },
  { ten: 'Lộ Bàng Thổ', hanh: 'Thổ' },
  { ten: 'Kiếm Phong Kim', hanh: 'Kim' },
  { ten: 'Sơn Đầu Hỏa', hanh: 'Hỏa' },
  { ten: 'Giản Hạ Thủy', hanh: 'Thủy' },
  { ten: 'Thành Đầu Thổ', hanh: 'Thổ' },
  { ten: 'Bạch Lạp Kim', hanh: 'Kim' },
  { ten: 'Dương Liễu Mộc', hanh: 'Mộc' },
  { ten: 'Tuyền Trung Thủy', hanh: 'Thủy' },
  { ten: 'Ốc Thượng Thổ', hanh: 'Thổ' },
  { ten: 'Tích Lịch Hỏa', hanh: 'Hỏa' },
  { ten: 'Tùng Bách Mộc', hanh: 'Mộc' },
  { ten: 'Trường Lưu Thủy', hanh: 'Thủy' },
  { ten: 'Sa Trung Kim', hanh: 'Kim' },
  { ten: 'Sơn Hạ Hỏa', hanh: 'Hỏa' },
  { ten: 'Bình Địa Mộc', hanh: 'Mộc' },
  { ten: 'Bích Thượng Thổ', hanh: 'Thổ' },
  { ten: 'Kim Bạch Kim', hanh: 'Kim' },
  { ten: 'Phú Đăng Hỏa', hanh: 'Hỏa' },
  { ten: 'Thiên Hà Thủy', hanh: 'Thủy' },
  { ten: 'Đại Trạch Thổ', hanh: 'Thổ' },
  { ten: 'Thoa Xuyến Kim', hanh: 'Kim' },
  { ten: 'Tang Đố Mộc', hanh: 'Mộc' },
  { ten: 'Đại Khê Thủy', hanh: 'Thủy' },
  { ten: 'Sa Trung Thổ', hanh: 'Thổ' },
  { ten: 'Thiên Thượng Hỏa', hanh: 'Hỏa' },
  { ten: 'Thạch Lựu Mộc', hanh: 'Mộc' },
  { ten: 'Đại Hải Thủy', hanh: 'Thủy' },
];

/** Số cục theo ngũ hành nạp âm của cung Mệnh */
export const CUC_THEO_HANH: Record<NguHanh, { so: number; ten: string }> = {
  Thủy: { so: 2, ten: 'Thủy Nhị Cục' },
  Mộc: { so: 3, ten: 'Mộc Tam Cục' },
  Kim: { so: 4, ten: 'Kim Tứ Cục' },
  Thổ: { so: 5, ten: 'Thổ Ngũ Cục' },
  Hỏa: { so: 6, ten: 'Hỏa Lục Cục' },
};

/** Can của cung Dần theo can năm (ngũ hổ độn) */
export const CAN_CUNG_DAN = [2, 4, 6, 8, 0]; // Giáp/Kỷ→Bính, Ất/Canh→Mậu, Bính/Tân→Canh, Đinh/Nhâm→Nhâm, Mậu/Quý→Giáp

/** Vị trí Lộc Tồn theo can năm */
export const VI_TRI_LOC_TON = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];

/**
 * Thiên Khôi / Thiên Việt theo can năm — bảng NAM PHÁI.
 * Nam phái gộp Canh và Tân chung một hàng (Khôi Ngọ, Việt Dần), khác với bảng
 * Trung Hoa vốn gộp Giáp–Mậu–Canh. Dùng nhầm bảng là hai sao này lệch hẳn cung.
 * Giáp/Mậu: Sửu–Mùi · Ất/Kỷ: Tý–Thân · Bính/Đinh: Hợi–Dậu
 * Canh/Tân: Ngọ–Dần · Nhâm/Quý: Mão–Tỵ
 */
export const VI_TRI_THIEN_KHOI = [1, 0, 11, 11, 1, 0, 6, 6, 3, 3];
export const VI_TRI_THIEN_VIET = [7, 8, 9, 9, 7, 8, 2, 2, 5, 5];

/** Triệt lộ không vong theo can năm (2 cung liền nhau) */
export const VI_TRI_TRIET: [number, number][] = [
  [8, 9], // Giáp, Kỷ: Thân Dậu
  [6, 7], // Ất, Canh: Ngọ Mùi
  [4, 5], // Bính, Tân: Thìn Tỵ
  [2, 3], // Đinh, Nhâm: Dần Mão
  [0, 1], // Mậu, Quý: Tý Sửu
];

/** Nhóm tam hợp chi năm: 0 = Thân Tý Thìn, 1 = Dần Ngọ Tuất, 2 = Tỵ Dậu Sửu, 3 = Hợi Mão Mùi */
export function nhomTamHop(chiNam: number): number {
  switch (chiNam % 12) {
    case 8:
    case 0:
    case 4:
      return 0;
    case 2:
    case 6:
    case 10:
      return 1;
    case 5:
    case 9:
    case 1:
      return 2;
    default:
      return 3;
  }
}

/** Thiên Mã theo tam hợp: Thân Tý Thìn→Dần, Dần Ngọ Tuất→Thân, Tỵ Dậu Sửu→Hợi, Hợi Mão Mùi→Tỵ */
export const VI_TRI_THIEN_MA = [2, 8, 11, 5];

/** Đào Hoa theo tam hợp */
export const VI_TRI_DAO_HOA = [9, 3, 6, 0];

/** Kiếp Sát theo tam hợp */
export const VI_TRI_KIEP_SAT = [5, 11, 2, 8];

/**
 * Hỏa Tinh / Linh Tinh: mỗi nhóm tam hợp có cung khởi VÀ chiều đếm riêng — đây
 * là chỗ dễ sai nhất vì nhiều tài liệu chỉ ghi cung khởi mà bỏ qua chiều.
 * Index theo nhomTamHop: 0 = Thân Tý Thìn, 1 = Dần Ngọ Tuất, 2 = Tỵ Dậu Sửu, 3 = Hợi Mão Mùi.
 * Mỗi mục: [cung khởi, chiều] với chiều 1 = thuận, -1 = nghịch.
 */
export const AN_HOA_TINH: [number, number][] = [
  [3, 1], // Thân Tý Thìn: khởi Mão, thuận
  [2, 1], // Dần Ngọ Tuất: khởi Dần, thuận
  [2, -1], // Tỵ Dậu Sửu: khởi Dần, nghịch
  [8, -1], // Hợi Mão Mùi: khởi Thân, nghịch
];

export const AN_LINH_TINH: [number, number][] = [
  [9, -1], // Thân Tý Thìn: khởi Dậu, nghịch
  [2, -1], // Dần Ngọ Tuất: khởi Dần, nghịch
  [11, 1], // Tỵ Dậu Sửu: khởi Hợi, thuận
  [11, 1], // Hợi Mão Mùi: khởi Hợi, thuận
];

/** Khởi Trường Sinh theo cục số */
export const KHOI_TRUONG_SINH: Record<number, number> = {
  2: 8, // Thủy nhị cục - Thân
  3: 11, // Mộc tam cục - Hợi
  4: 5, // Kim tứ cục - Tỵ
  5: 8, // Thổ ngũ cục - Thân
  6: 2, // Hỏa lục cục - Dần
};

/** Khởi tiểu hạn năm 1 tuổi theo tam hợp chi năm */
export const KHOI_TIEU_HAN = [10, 4, 7, 1];

export const VONG_TRANG_SINH = [
  'Trường Sinh',
  'Mộc Dục',
  'Quan Đới',
  'Lâm Quan',
  'Đế Vượng',
  'Suy',
  'Bệnh',
  'Tử',
  'Mộ',
  'Tuyệt',
  'Thai',
  'Dưỡng',
] as const;

export const VONG_THAI_TUE = [
  'Thái Tuế',
  'Thiếu Dương',
  'Tang Môn',
  'Thiếu Âm',
  'Quan Phù',
  'Tử Phù',
  'Tuế Phá',
  'Long Đức',
  'Bạch Hổ',
  'Phúc Đức',
  'Điếu Khách',
  'Trực Phù',
] as const;

export const VONG_LOC_TON = [
  'Bác Sĩ',
  'Lực Sĩ',
  'Thanh Long',
  'Tiểu Hao',
  'Tướng Quân',
  'Tấu Thư',
  'Phi Liêm',
  'Hỷ Thần',
  'Bệnh Phù',
  'Đại Hao',
  'Phục Binh',
  'Quan Phủ',
] as const;

/** 14 chính tinh */
export const CHINH_TINH = [
  'Tử Vi',
  'Thiên Cơ',
  'Thái Dương',
  'Vũ Khúc',
  'Thiên Đồng',
  'Liêm Trinh',
  'Thiên Phủ',
  'Thái Âm',
  'Tham Lang',
  'Cự Môn',
  'Thiên Tướng',
  'Thiên Lương',
  'Thất Sát',
  'Phá Quân',
] as const;

/** Tứ Hóa theo can năm: [Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ] */
export const TU_HOA: [string, string, string, string][] = [
  ['Liêm Trinh', 'Phá Quân', 'Vũ Khúc', 'Thái Dương'], // Giáp
  ['Thiên Cơ', 'Thiên Lương', 'Tử Vi', 'Thái Âm'], // Ất
  ['Thiên Đồng', 'Thiên Cơ', 'Văn Xương', 'Liêm Trinh'], // Bính
  ['Thái Âm', 'Thiên Đồng', 'Thiên Cơ', 'Cự Môn'], // Đinh
  ['Tham Lang', 'Thái Âm', 'Hữu Bật', 'Thiên Cơ'], // Mậu
  ['Vũ Khúc', 'Tham Lang', 'Thiên Lương', 'Văn Khúc'], // Kỷ
  ['Thái Dương', 'Vũ Khúc', 'Thái Âm', 'Thiên Đồng'], // Canh — "Nhật Vũ Âm Đồng"
  ['Cự Môn', 'Thái Dương', 'Văn Khúc', 'Văn Xương'], // Tân
  ['Thiên Lương', 'Tử Vi', 'Tả Phù', 'Vũ Khúc'], // Nhâm
  ['Phá Quân', 'Cự Môn', 'Thái Âm', 'Tham Lang'], // Quý
];

/** Cô Thần / Quả Tú theo nhóm chi năm (Dần Mão Thìn / Tỵ Ngọ Mùi / Thân Dậu Tuất / Hợi Tý Sửu) */
export function viTriCoThanQuaTu(chiNam: number): { coThan: number; quaTu: number } {
  const c = chiNam % 12;
  if (c >= 2 && c <= 4) return { coThan: 5, quaTu: 1 };
  if (c >= 5 && c <= 7) return { coThan: 8, quaTu: 4 };
  if (c >= 8 && c <= 10) return { coThan: 11, quaTu: 7 };
  return { coThan: 2, quaTu: 10 };
}


/**
 * Bảng an sao theo CAN năm (index 0 = Giáp ... 9 = Quý), giá trị là index cung
 * (0 = Tý ... 11 = Hợi). Chuyển từ bảng 1-index của dự án tham chiếu CanChi.
 */
export const VI_TRI_QUOC_AN = [10, 11, 1, 2, 1, 2, 4, 5, 7, 8];
export const VI_TRI_DUONG_PHU = [7, 8, 10, 11, 10, 11, 1, 2, 4, 5];
export const VI_TRI_LUU_HA = [9, 10, 7, 8, 5, 6, 4, 3, 11, 2];
export const VI_TRI_THIEN_TRU = [5, 6, 0, 5, 6, 8, 2, 6, 9, 10];
export const VI_TRI_THIEN_QUAN = [7, 4, 5, 2, 3, 9, 11, 9, 10, 6];
export const VI_TRI_THIEN_PHUC = [9, 8, 0, 11, 3, 2, 6, 5, 6, 5];

/** Lưu niên Văn tinh theo can năm: Giáp-Tỵ, Ất-Ngọ, Bính/Mậu-Thân, Đinh/Kỷ-Dậu, Canh-Hợi, Tân-Tý, Nhâm-Dần, Quý-Mão */
export const VI_TRI_LN_VAN_TINH = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];

/** Bảng an sao theo CHI năm (index 0 = Tý ... 11 = Hợi) */
export const VI_TRI_HOA_CAI = [4, 1, 10, 7, 4, 1, 10, 7, 4, 1, 10, 7];
export const VI_TRI_PHA_TOAI = [5, 1, 9, 5, 1, 9, 5, 1, 9, 5, 1, 9];

export type LoaiSao = 'chinh-tinh' | 'phu-tinh' | 'vong-sao' | 'tu-hoa' | 'khong-vong';

export interface Sao {
  ten: string;
  loai: LoaiSao;
  /** Sao tốt (cát), xấu (hung) hay trung tính — dùng cho hiển thị và luận giải */
  tinhChat?: 'cat' | 'hung' | 'trung';
  /** Độ sáng tại cung đang an: M/V/D/L/B/H */
  doSang?: 'M' | 'V' | 'D' | 'L' | 'B' | 'H' | null;
}

/** Quan hệ ngũ hành giữa Mệnh (nạp âm) và Cục */
export function quanHeNguHanh(menh: NguHanh, cuc: NguHanh): string {
  if (menh === cuc) return 'Mệnh Cục tương hòa';
  const sinh: Record<NguHanh, NguHanh> = {
    Kim: 'Thủy',
    Thủy: 'Mộc',
    Mộc: 'Hỏa',
    Hỏa: 'Thổ',
    Thổ: 'Kim',
  };
  const khac: Record<NguHanh, NguHanh> = {
    Kim: 'Mộc',
    Mộc: 'Thổ',
    Thổ: 'Thủy',
    Thủy: 'Hỏa',
    Hỏa: 'Kim',
  };
  if (sinh[cuc] === menh) return 'Cục sinh Mệnh';
  if (sinh[menh] === cuc) return 'Mệnh sinh Cục';
  if (khac[cuc] === menh) return 'Cục khắc Mệnh';
  if (khac[menh] === cuc) return 'Mệnh khắc Cục';
  return 'Mệnh Cục tương hòa';
}
