import { test, expect, moTrang, khongCuonNgang, ROUTE_AI } from './co-so';
import { vi } from '../lib/i18n/vi';

const dien = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

test.describe('Lá số', () => {
  test('lá số mẫu: phần tất định đứng được khi AI không trả lời', async ({ page, apiDaGoi }) => {
    await moTrang(page, '/la-so?mau=1');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      dien(vi.quickRead.tieuDeCoTen, { ten: 'Lá số mẫu' })
    );

    // Trang có gọi route AI — và lời gọi đó đã bị chặn ở co-so.ts, không ra ngoài
    expect(apiDaGoi.some((p) => ROUTE_AI.test(p)), apiDaGoi.join(', ')).toBe(true);

    // Bấm qua từng tab hiện được: tab được chọn phải đổi theo, trang không gãy
    const tabs = page.getByRole('tab').filter({ visible: true });
    const so = await tabs.count();
    expect(so).toBeGreaterThan(1);
    for (let i = 0; i < so; i++) {
      await tabs.nth(i).click();
      await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
      // Panel của tab phải hiện (tab "Lá số" trên điện thoại chưa có panel riêng — xem CEL-076)
      const panel = await tabs.nth(i).getAttribute('aria-controls');
      if (panel && panel !== 'panel-la-so') await expect(page.locator(`#${panel}`)).toBeVisible();
      await khongCuonNgang(page);
    }
  });

  test('nhập ngày giờ sinh qua bốn bước ra lá số mang tên mình', async ({ page }) => {
    page.on('dialog', (d) => d.dismiss());
    await moTrang(page, '/la-so?moi=1');

    const tiep = page.getByRole('button', { name: vi.chung.tiepTuc, exact: true });

    // Bước 1 — chưa chọn ý định thì chưa đi tiếp được
    await expect(tiep).toBeDisabled();
    await page.locator('button[aria-pressed]').first().click();
    await tiep.click();

    // Bước 2 — ngày sinh
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(vi.onboarding.ngayTieuDe);
    await page.getByLabel(vi.onboarding.ngayNhan).fill('1995-03-14');
    await tiep.click();

    // Bước 3 — giờ sinh
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(vi.onboarding.gioTieuDe);
    // Nhãn bọc cả ô chọn nên tên của nó gồm luôn chữ các lựa chọn — lấy ô chọn đầu (giờ)
    await page.locator('select').first().selectOption('7');
    await tiep.click();

    // Bước 4 — xác nhận
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(vi.onboarding.xacNhanTieuDe);
    await page.getByRole('button', { name: vi.onboarding.nu, exact: true }).click();
    await page.getByPlaceholder(vi.onboarding.tenGoiVD).fill('Thử E2E');
    await page.getByRole('button', { name: vi.onboarding.xong, exact: true }).click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      dien(vi.quickRead.tieuDeCoTen, { ten: 'Thử E2E' })
    );
    await khongCuonNgang(page);
  });
});
