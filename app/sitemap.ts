import type { MetadataRoute } from 'next';
import { URL_GOC } from '@/lib/trang-web';

/**
 * Sitemap cho máy tìm kiếm — chỉ các trang công khai, khách đọc được mà không
 * cần tài khoản. Trang cá nhân (Hôm nay, Tài khoản, Lá số của tôi) và trang quản
 * trị không nằm ở đây; robots.ts chặn chúng.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const nay = new Date();
  return [
    { url: `${URL_GOC}/`, lastModified: nay, changeFrequency: 'weekly', priority: 1 },
    { url: `${URL_GOC}/la-so`, lastModified: nay, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${URL_GOC}/gioi-thieu`, lastModified: nay, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
