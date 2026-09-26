import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit đọc tệp font bằng fs — để nguyên trong node_modules, không gói vào bundle (CEL-137)
  serverExternalPackages: ["pdfkit"],
  // Font Be Vietnam Pro cho PDF xuất luận giải phải theo route lên máy chủ Vercel
  outputFileTracingIncludes: {
    "/api/admin/xuat-luan-giai": ["./lib/xuat/fonts/**"],
  },
};

export default nextConfig;
