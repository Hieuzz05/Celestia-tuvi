/**
 * Độ sáng (miếu / vượng / đắc / lợi / bình / hãm) của sao theo cung an.
 * Bảng tham chiếu: dự án mã nguồn mở CanChi (https://github.com/duckocancode/canchi,
 * src/lib/canchi-engine.ts) — được nêu trong design spec lá số.
 * Index cung: 0 = Tý ... 11 = Hợi.
 */

export type DoSang = 'M' | 'V' | 'D' | 'L' | 'B' | 'H';

export const NHAN_DO_SANG: Record<DoSang, { ten: string; moTa: string }> = {
  M: { ten: 'Miếu', moTa: 'Sao ở vị trí tốt nhất, phát huy tối đa sức mạnh' },
  V: { ten: 'Vượng', moTa: 'Sao ở vị trí mạnh, năng lượng dồi dào' },
  D: { ten: 'Đắc', moTa: 'Sao ở vị trí khá, phát huy được' },
  L: { ten: 'Lợi', moTa: 'Sao có lợi thế nhẹ tại cung này' },
  B: { ten: 'Bình', moTa: 'Sao ở mức trung bình, không tốt không xấu' },
  H: { ten: 'Hãm', moTa: 'Sao ở vị trí yếu, giảm sức mạnh đáng kể' },
};

type BangDoSang = { M: number[]; V: number[]; D: number[]; H: number[]; B: number[] };

const CHINH_TINH_DO_SANG: Record<string, BangDoSang> = {
  'Tử Vi': { M: [2, 5, 6, 8], V: [4, 10], D: [1, 7, 11], H: [0], B: [3, 9] },
  'Liêm Trinh': { M: [4, 10], V: [0, 2, 6, 8], D: [1, 7], H: [3, 5, 9, 11], B: [] },
  'Thiên Đồng': { M: [2, 8], V: [0], D: [3, 5, 11], H: [1, 4, 6, 7, 9, 10], B: [] },
  'Vũ Khúc': { M: [1, 4, 7, 10], V: [0, 2, 6, 8], D: [3, 9], H: [5, 11], B: [] },
  'Thái Dương': { M: [5, 6], V: [2, 3, 4], D: [1, 7], H: [0, 8, 9, 10, 11], B: [] },
  'Thiên Cơ': { M: [3, 4, 9, 10], V: [5, 7, 8], D: [0, 1, 6], H: [2, 11], B: [] },
  'Thiên Phủ': { M: [0, 2, 6, 8], V: [4, 10], D: [1, 3, 5, 7, 9, 11], H: [], B: [] },
  'Thái Âm': { M: [9, 10, 11], V: [0, 8], D: [1, 7], H: [2, 3, 4, 5, 6], B: [] },
  'Tham Lang': { M: [1, 7], V: [4, 10], D: [2, 8], H: [0, 3, 5, 6, 9, 11], B: [] },
  'Cự Môn': { M: [3, 9], V: [0, 2, 6], D: [8, 11], H: [1, 4, 5, 7, 10], B: [] },
  'Thiên Tướng': { M: [2, 8], V: [0, 4, 6, 10], D: [1, 5, 7, 11], H: [3, 9], B: [] },
  'Thiên Lương': { M: [0, 4, 6], V: [2, 3, 8, 10], D: [1, 7], H: [5, 9, 11], B: [] },
  'Thất Sát': { M: [0, 2, 6, 8], V: [5, 11], D: [1, 7], H: [3, 4, 9, 10], B: [] },
  'Phá Quân': { M: [0, 6], V: [1, 7], D: [4, 10], H: [2, 3, 5, 8, 9, 11], B: [] },
};

/** Lục sát tinh & phụ tinh quan trọng: chỉ phân Đắc hoặc Hãm */
const DAC_DIA: Record<string, number[]> = {
  'Địa Không': [2, 5, 8, 11],
  'Địa Kiếp': [2, 5, 8, 11],
  'Kình Dương': [1, 4, 7, 10],
  'Đà La': [1, 4, 7, 10],
  'Hỏa Tinh': [2, 3, 5, 6],
  'Linh Tinh': [2, 5, 6],
  'Bạch Hổ': [2, 3, 8, 9],
  'Văn Xương': [1, 4, 5, 7, 10, 11],
  'Văn Khúc': [1, 4, 5, 7, 10, 11],
  'Thiên Mã': [2, 5, 8, 11],
  'Thiên Riêu': [2, 3, 8, 9],
  'Thiên Hình': [2, 3, 8, 9],
  'Đại Hao': [2, 3, 8, 9],
  'Tiểu Hao': [2, 3, 8, 9],
  'Tang Môn': [2, 3, 8, 9],
  /*
   * Khốc Hư đắc ở Tý, Ngọ, Mão, Dậu và Mùi; hãm ở Dần, Thìn, Tỵ, Thân, Tuất,
   * Hợi. Bản trước ghi [Tý, Dần, Ngọ, Thân] — nhầm Mão/Dậu sang Dần/Thân — và
   * thiếu hẳn Thiên Hư. Bắt được 24/09/2026 khi chủ dự án đối chiếu với lá số
   * tuvivietnam.vn: Thiên Khốc ở Dần hiện "Đắc" trong khi phải là Hãm.
   * Sửu không có trong cả hai danh sách của nguồn; bảng hai mức nên xếp Hãm.
   */
  'Thiên Khốc': [0, 3, 6, 7, 9],
  'Thiên Hư': [0, 3, 6, 7, 9],
  /*
   * Hóa Kỵ đắc ở tứ mộ (Thìn, Tuất, Sửu, Mùi — Thổ chế Thủy), hãm ở tám cung
   * còn lại. Bản trước luôn trả Hãm, nên Kỵ ở tứ mộ bị luận thành xấu.
   */
  'Hóa Kỵ': [1, 4, 7, 10],
};

export function doSangCuaSao(tenSao: string, cungIndex: number): DoSang | null {
  const bang = CHINH_TINH_DO_SANG[tenSao];
  if (bang) {
    if (bang.M.includes(cungIndex)) return 'M';
    if (bang.V.includes(cungIndex)) return 'V';
    if (bang.D.includes(cungIndex)) return 'D';
    if (bang.H.includes(cungIndex)) return 'H';
    return 'B';
  }
  const dacDia = DAC_DIA[tenSao];
  if (dacDia) return dacDia.includes(cungIndex) ? 'D' : 'H';
  return null;
}
