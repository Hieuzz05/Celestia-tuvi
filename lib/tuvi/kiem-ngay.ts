/**
 * Ngày dương lịch có thật hay không.
 *
 * Engine đổi ngày sang số Julian nên không tự báo lỗi: 31/4 lặng lẽ thành 1/5,
 * 31/2 thành 2/3 hoặc 3/3 — người gõ nhầm nhận lá số của một ngày khác mà không
 * hề biết. Mọi chỗ nhận ngày sinh từ bên ngoài phải chặn bằng hàm này trước khi
 * gọi lapLaSo.
 */
export function laNgayDuongCoThat(ngay: unknown, thang: unknown, nam: unknown): boolean {
  if (typeof ngay !== 'number' || typeof thang !== 'number' || typeof nam !== 'number') return false;
  if (![ngay, thang, nam].every(Number.isInteger)) return false;
  if (thang < 1 || thang > 12 || ngay < 1) return false;
  const nhuan = (nam % 4 === 0 && nam % 100 !== 0) || nam % 400 === 0;
  const soNgay = [31, nhuan ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][thang - 1];
  return ngay <= soNgay;
}
