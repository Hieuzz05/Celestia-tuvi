import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit đọc tệp font bằng fs — để nguyên trong node_modules, không gói vào bundle (CEL-137)
  serverExternalPackages: ["pdfkit"],
  // Font Be Vietnam Pro cho PDF xuất luận giải phải theo route lên máy chủ Vercel
  outputFileTracingIncludes: {
    "/api/admin/xuat-luan-giai": ["./lib/xuat/fonts/**"],
  },
  experimental: {
    // CSS (Tailwind, ~10KB) nhúng thẳng vào <head> thay vì một tệp <link> chặn hiển thị:
    // bỏ một vòng tải trước khi vẽ lần đầu. Đo 27/09/2026: tệp CSS chặn ~150ms ở mọi trang.
    inlineCss: true,
  },
};

export default nextConfig;
