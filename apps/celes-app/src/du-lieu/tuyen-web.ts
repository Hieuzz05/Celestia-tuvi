import type { Href } from 'expo-router';

/**
 * Đổi đường dẫn WEB mà máy chủ gửi về (lối đi tiếp của Celes) sang tuyến app.
 *
 * Máy chủ dùng chung cho web và app nên chỉ biết đường dẫn web. Đường nào app
 * chưa có màn tương ứng thì trả null — màn hình ẩn lối đó, thà thiếu một liên
 * kết còn hơn đưa người dùng vào ngõ cụt.
 */
/** chuDe cũ của web (/luan-giai?chuDe=…) → id chủ đề khung v3 của app */
const CHU_DE_CU: Record<string, string> = {
  'tong-quan': 'tong-quan',
  'su-nghiep': 'su-nghiep',
  'tai-chinh': 'tien-bac',
  'tinh-duyen': 'tinh-duyen',
  'suc-khoe': 'suc-khoe',
  'gia-dao': 'gia-dinh',
  'van-han': 'van-han',
};

export function tuyenApp(duong: string): Href | null {
  const [goc, truyVan = ''] = duong.split('?');
  // Không dùng URLSearchParams: bản của React Native từng thiếu get()
  const chuDe = /(?:^|&)chuDe=([a-z-]+)/.exec(truyVan)?.[1];
  switch (goc) {
    case '/luan-giai': {
      const nhom = chuDe ? CHU_DE_CU[chuDe] : undefined;
      return nhom ? { pathname: '/luan-giai/[nhom]', params: { nhom } } : '/luan-giai';
    }
    case '/luan-giai/sau':
      return chuDe ? { pathname: '/luan-giai/[nhom]', params: { nhom: chuDe } } : '/luan-giai';
    case '/la-so':
      return '/ban-do';
    case '/hanh-trinh':
      return '/(tabs)/hanh-trinh';
    case '/hanh-trinh/chi-tiet': {
      const lay = (k: string) => new RegExp(`(?:^|&)${k}=([\w-]+)`).exec(truyVan)?.[1];
      const params: Record<string, string> = {};
      for (const k of ['cap', 'nam', 'thang']) {
        const v = lay(k);
        if (v) params[k] = v;
      }
      return { pathname: '/chi-tiet-han', params };
    }
    case '/hop-tuoi':
      return '/(tabs)/ket-noi';
    default:
      return null;
  }
}
