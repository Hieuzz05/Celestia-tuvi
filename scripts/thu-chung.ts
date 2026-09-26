/**
 * Dùng chung cho mọi script ĐO / DỰNG gọi AI (26/09/2026 — một ngày đo tiêu ~11 tr token, góp phần
 * làm hết credit OpenAI). Gọi `batDauLuotThu()` NGAY SAU khi nạp .env.local, TRƯỚC mọi import động
 * tới lib/ai (fallback.ts đọc biến môi trường lúc nạp module).
 *
 * - AI_NHAN=test → chi phí ghi riêng dòng "<model>@test" trong ai_usage_logs, không lẫn người dùng thật.
 * - AI_NGAN_SACH_TOKEN mặc định 1.000.000: vượt là dừng hẳn. Lượt lớn hơn phải truyền rõ
 *   `--ngan-sach <số>` — và theo quy ước dự án, hỏi chủ dự án trước.
 * - In tổng token đã dùng khi script kết thúc.
 */
export function batDauLuotThu(tenScript: string, nganSachMacDinh = 1_000_000): void {
  const i = process.argv.indexOf('--ngan-sach');
  const nganSach = i > 0 ? Number(process.argv[i + 1]) : nganSachMacDinh;
  process.env.AI_NHAN ??= 'test';
  // Model chỉ định (giám khảo) không gọi được thì báo lỗi, không tự lùi sang model đắt hơn
  process.env.AI_KHONG_LUI ??= '1';
  process.env.AI_NGAN_SACH_TOKEN ??= String(nganSach);
  console.log(`[${tenScript}] ngân sách lượt này: ${Number(process.env.AI_NGAN_SACH_TOKEN).toLocaleString('vi-VN')} token (đổi bằng --ngan-sach) · chi phí ghi nhãn @${process.env.AI_NHAN}`);
  // 'exit' phải đồng bộ, và KHÔNG import lib/ai ở đầu tệp (kéo theo cấu hình Supabase đọc env trước khi
  // script nạp .env.local) — lớp gọi AI ghi sẵn số token vào biến toàn cục
  process.on('exit', () =>
    console.log(`[${tenScript}] đã dùng ${((globalThis as { __celestiaTokenDaDung?: number }).__celestiaTokenDaDung ?? 0).toLocaleString('vi-VN')} token`)
  );
}
