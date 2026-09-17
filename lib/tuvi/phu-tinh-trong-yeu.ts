/**
 * Phụ tinh trọng yếu — nhóm sao phụ đủ sức đổi cách đọc một cung.
 *
 * Trước đây danh sách này chỉ nằm trong `components/laso/types.ts` để quyết
 * định sao nào in đậm trên mệnh bàn. Engine luận giải cũng cần đúng danh sách
 * đó, mà engine thì không được phụ thuộc vào tầng giao diện — nên nó chuyển về
 * đây và cả hai bên cùng đọc một nguồn.
 */
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
