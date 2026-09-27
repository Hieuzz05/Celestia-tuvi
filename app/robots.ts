import type { MetadataRoute } from 'next';
import { URL_GOC } from '@/lib/trang-web';

/** Cho máy tìm kiếm đọc trang công khai; chặn API, quản trị và các trang cá nhân. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin', '/auth/', '/tai-khoan', '/ho-so', '/support/checkout/'],
    },
    sitemap: `${URL_GOC}/sitemap.xml`,
  };
}
