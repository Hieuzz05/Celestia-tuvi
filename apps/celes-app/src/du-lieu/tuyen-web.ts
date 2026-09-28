import type { Href } from 'expo-router';

/**
 * Đổi đường dẫn WEB mà máy chủ gửi về (lối đi tiếp của Celes) sang tuyến app.
 *
 * Máy chủ dùng chung cho web và app nên chỉ biết đường dẫn web. Đường nào app
 * chưa có màn tương ứng thì trả null — màn hình ẩn lối đó, thà thiếu một liên
 * kết còn hơn đưa người dùng vào ngõ cụt.
 */
export function tuyenApp(duong: string): Href | null {
  switch (duong.split('?')[0]) {
    case '/la-so':
      return '/ban-do';
    case '/hanh-trinh':
      return '/(tabs)/hanh-trinh';
    case '/hop-tuoi':
      return '/(tabs)/ket-noi';
    // '/luan-giai?chuDe=…' chờ màn luận giải của app — tới lúc đó rơi xuống null
    default:
      return null;
  }
}
