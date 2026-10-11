import { defineConfig, devices } from '@playwright/test';

/**
 * E2E (CEL-076) — CHỈ chạy trên máy dev, không nằm trong CI.
 *
 *   npm run e2e            # tự bật `next dev --webpack` ở cổng 3112 nếu chưa có
 *   npm run e2e -- --headed
 *
 * Dùng Chrome đã cài trên máy (channel 'chrome') — không tải trình duyệt nào.
 * Mọi /api/* bị chặn trong e2e/co-so.ts: test không gọi model, không chạm DB.
 */
const CONG = Number(process.env.E2E_CONG ?? 3112);

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // Dev server biên dịch trang lần đầu khá chậm — ít luồng thì ổn định hơn
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${CONG}`,
    channel: 'chrome',
    locale: 'vi-VN',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'may-tinh', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    {
      name: 'dien-thoai',
      use: { channel: 'chrome', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    // Turbopack sập trong worktree vì node_modules là junction — dùng webpack
    command: `npx next dev --webpack -p ${CONG}`,
    url: `http://localhost:${CONG}`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
