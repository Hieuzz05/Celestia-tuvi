import { test, expect, moTrang, khongCuonNgang, ROUTE_AI } from './co-so';
import { vi } from '../lib/i18n/vi';
import { en } from '../lib/i18n/en';

test.describe('Khung trang công khai', () => {
  test('trang chủ hiện tiêu đề chính', async ({ page, apiDaGoi }) => {
    await moTrang(page, '/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(vi.landing.tieuDe);
    await khongCuonNgang(page);
    // Trang chủ không được tự gọi model khi mở (đọc hạn mức, ghi sự kiện thì được)
    expect(apiDaGoi.filter((p) => ROUTE_AI.test(p)), apiDaGoi.join(', ')).toEqual([]);
  });

  for (const duong of ['/gioi-thieu', '/hop-tuoi', '/la-so?moi=1']) {
    test(`${duong} mở được, không cuộn ngang`, async ({ page }) => {
      await moTrang(page, duong);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      await khongCuonNgang(page);
    });
  }

  test('đổi sang tiếng Anh và giữ sau khi tải lại', async ({ page, isMobile }) => {
    await moTrang(page, '/');
    // Màn hẹp: bộ chuyển nằm trong menu
    if (isMobile) await page.getByRole('button', { name: vi.chung.menu, exact: true }).click();
    await page.getByRole('button', { name: `VI · ${vi.nav.ngonNgu}` }).filter({ visible: true }).first().click();
    await page.getByRole('menuitemradio', { name: 'English' }).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.landing.tieuDe);

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.landing.tieuDe);
  });

  test('đổi chế độ sáng/tối và giữ sau khi tải lại', async ({ page, isMobile }) => {
    await moTrang(page, '/');
    const html = page.locator('html');
    const truoc = (await html.getAttribute('data-theme')) ?? 'day';
    const sau = truoc === 'night' ? 'day' : 'night';

    if (isMobile) await page.getByRole('button', { name: vi.chung.menu, exact: true }).click();
    await page
      .getByRole('button', { name: truoc === 'night' ? vi.nav.cheDoSang : vi.nav.cheDoToi })
      .filter({ visible: true })
      .first()
      .click();
    await expect(html).toHaveAttribute('data-theme', sau);

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', sau);
  });
});
