import { test, expect } from '@playwright/test';
import { loginAsPwaUser } from '../helpers/pwa-login.helper';

test.describe('PWA — Trips', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPwaUser(page);
  });

  test('trips list loads', async ({ page }) => {
    await page.goto('/trips');
    await expect(page.locator('.trip-card, .empty-state')).toBeVisible({ timeout: 8000 });
  });

  test('trip detail opens', async ({ page }) => {
    await page.goto('/trips');
    const card = page.locator('.trip-card').first();
    if (await card.isVisible()) {
      await card.click();
      await expect(page).toHaveURL(/\/trips\//);
      await expect(page.locator('.trip-status')).toBeVisible({ timeout: 6000 });
    }
  });
});
