/**
 * Bộ đo cố định của lát cắt "Sự nghiệp — lá số gốc" (KIEN-TRUC-LUAN-GIAI.md mục 11)
 * — dùng chung cho do-thu-vien.ts và do-nhan-dien.ts để hai script đo đúng một bộ.
 */
export const CAU_LAT_CAT = ['SN01', 'SN02', 'SN03', 'SN05', 'SN06'];

/** 12 lá số TỔNG HỢP cố định — LCG, chạy lại ra đúng bộ này. Không phải lá số thật. */
export function boLaSo(n: number) {
  let x = 20260926;
  const r = (m: number) => ((x = (x * 1103515245 + 12345) % 2147483648), x % m);
  return Array.from({ length: n }, () => ({
    ngay: 1 + r(28),
    thang: 1 + r(12),
    nam: 1965 + r(36),
    gio: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23][r(12)],
    gioiTinh: (r(2) ? 'nam' : 'nu') as 'nam' | 'nu',
  }));
}
