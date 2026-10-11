import { test as goc, expect, type Page } from '@playwright/test';

/**
 * Nền chung cho mọi bài E2E.
 *
 * Chặn TOÀN BỘ /api/*: bài E2E chỉ kiểm phần tất định của giao diện. Để lọt một
 * route là gọi model thật (tốn ngân sách AI) hoặc ghi vào DB. Thẻ "điểm nổi bật"
 * nhận 204 = giữ thẻ tất định, đúng hợp đồng của trang; các route khác nhận 503
 * như lúc AI bận — trang phải vẫn đứng được.
 */
export const test = goc.extend<{ apiDaGoi: string[] }>({
  apiDaGoi: [
    // Tham số thứ hai đặt tên khác `use` — luật hook của React nhầm nó là hook
    async ({ page }, dung) => {
      const ds: string[] = [];
      await page.route('**/api/**', (route) => {
        const url = new URL(route.request().url());
        ds.push(url.pathname);
        if (url.pathname === '/api/diem-noi-bat') return route.fulfill({ status: 204 });
        return route.fulfill({ status: 503, contentType: 'application/json', body: '{"loi":"e2e"}' });
      });
      await dung(ds);
    },
    // auto: chặn cả ở bài không khai báo apiDaGoi — thiếu cờ này là bài đó gọi API thật
    { auto: true },
  ],
});

export { expect };

/** Các route gọi model — trang tĩnh không được tự gọi chúng khi vừa mở */
export const ROUTE_AI = /^\/api\/(diem-noi-bat|luan-giai|hoi-dap|nhip|hop-tuoi)/;

/**
 * Trang đã hydrate: curl / HTML thô có chữ TRƯỚC khi JS chạy, nhìn vào đó mà
 * kết luận là sai (bẫy ghi ở CEL-076). Chờ <html lang> do bộ ngôn ngữ phía máy
 * khách đặt, rồi chờ mạng lặng — sau đó mới đọc chữ trên trang.
 */
export async function moTrang(page: Page, duong: string) {
  await page.goto(duong);
  await expect(page.locator('html')).toHaveAttribute('lang', /^(vi|en)$/);
  await page.waitForLoadState('networkidle');
}

/** Không cuộn ngang — luật màn 390px */
export async function khongCuonNgang(page: Page) {
  const { rong, khung } = await page.evaluate(() => ({
    rong: document.documentElement.scrollWidth,
    khung: document.documentElement.clientWidth,
  }));
  expect(rong, `trang rộng ${rong}px trong khung ${khung}px`).toBeLessThanOrEqual(khung);
}
