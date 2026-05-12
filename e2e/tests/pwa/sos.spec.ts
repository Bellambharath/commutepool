import { test, expect } from '@playwright/test';
import { loginAsPwaUser } from '../helpers/pwa-login.helper';

test.describe('PWA — SOS', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPwaUser(page);
  });

  test('SOS screen is reachable', async ({ page }) => {
    await page.goto('/sos');
    await expect(page.locator('.sos-btn, .sos-page')).toBeVisible({ timeout: 6000 });
  });

  test('SOS page shows big red button', async ({ page }) => {
    await page.goto('/sos');
    const btn = page.locator('button.sos-btn, .sos-trigger').first();
    await expect(btn).toBeVisible({ timeout: 6000 });
    // colour is red-family
    const bg = await btn.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/rgb\(19[0-9]|20[0-9]|21[0-9]|22[0-9]/);
  });
});
