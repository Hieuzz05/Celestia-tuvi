import { lunarToSolar, solarToLunar } from './lunar';

/**
 * "Bây giờ" theo cách lá số đếm thời gian.
 *
 * Lá số chia tháng theo tuần trăng. `cungNguyetHan` nhận tháng ÂM LỊCH, nhưng
 * bốn chỗ trong dự án đang đưa thẳng `new Date().getMonth() + 1` — tháng dương —
 * vào đó. Hai bề mặt cùng nói "tháng này" mà ra hai cung khác nhau: Hành trình
 * đổi lịch trước khi tính, còn Bản đồ, Khám phá sâu và hai tuyến API thì không.
 * Một trong hai phải sai, và chỗ sai là chỗ không đổi lịch.
 *
 * Gom về một hàm để không còn chỗ nào tự quyết định lấy tháng nào nữa.
 *
 * Kèm theo là `khoangDuongCuaThangAm`: tháng âm số mấy thì người dùng không tự
 * đối chiếu được với lịch treo tường của họ. Hiện tháng 8 âm rơi vào khoảng
 * tháng 9 dương, nên màn hình ghi "Tháng 8" trong khi điện thoại ghi tháng 9 —
 * đúng về thiên văn nhưng nhìn thì y như phần mềm chạy sai. Hiện thêm khoảng
 * ngày dương là hết nhầm, mà không phải bẻ lịch cho sai.
 */

export interface ThoiDiemAm {
  nam: number;
  thang: number;
  ngay: number;
}

/** Năm, tháng, ngày âm lịch của hôm nay */
export function bayGioAm(moc: Date = new Date()): ThoiDiemAm {
  const al = solarToLunar(moc.getDate(), moc.getMonth() + 1, moc.getFullYear());
  return { nam: al.year, thang: al.month, ngay: al.day };
}

/** Tháng âm lịch hiện tại — dùng làm mặc định cho mọi `thangXem` */
export function thangAmHienTai(moc: Date = new Date()): number {
  return bayGioAm(moc).thang;
}

/** Năm âm lịch hiện tại — khác năm dương ở quãng đầu năm, trước Tết */
export function namAmHienTai(moc: Date = new Date()): number {
  return bayGioAm(moc).nam;
}

/**
 * Khoảng ngày dương mà một tháng âm trải qua, dạng "11/9 – 10/10".
 *
 * Trả null khi không đổi được — thiếu một dòng phụ chú thì không sao, nhưng
 * hiện sai khoảng ngày thì tệ hơn hẳn việc không hiện.
 */
export function khoangDuongCuaThangAm(namAm: number, thangAm: number): string | null {
  const dau = lunarToSolar(1, thangAm, namAm);
  if (!dau) return null;

  // Tháng âm dài 29 hoặc 30 ngày. Lấy mồng 1 tháng sau rồi lùi một ngày thì
  // đúng cho cả hai, không phải đoán.
  const thangSau = thangAm === 12 ? 1 : thangAm + 1;
  const namSau = thangAm === 12 ? namAm + 1 : namAm;
  const dauSau = lunarToSolar(1, thangSau, namSau);
  if (!dauSau) return null;

  const d = new Date(Date.UTC(dauSau.year, dauSau.month - 1, dauSau.day));
  d.setUTCDate(d.getUTCDate() - 1);

  return `${dau.day}/${dau.month} – ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}
