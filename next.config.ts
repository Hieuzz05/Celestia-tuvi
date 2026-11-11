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
  // Ba tiêu đề an toàn không đổi hành vi trang: chống nhúng khung, chống đoán kiểu tệp,
  // không gửi đường dẫn đầy đủ sang trang khác. Chính sách nguồn nội dung (CSP) để sau:
  // dễ làm hỏng đăng nhập Google và trang thanh toán (rà soát 11/11/2026, A5).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
