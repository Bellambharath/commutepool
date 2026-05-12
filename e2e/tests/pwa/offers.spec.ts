import { test, expect } from '@playwright/test';
import { loginAsPwaUser } from '../helpers/pwa-login.helper';

test.describe('PWA — Offers', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPwaUser(page);
  });

  test('offers list loads', async ({ page }) => {
    await page.goto('/offers');
    await expect(page.locator('.offer-card, .empty-state')).toBeVisible({ timeout: 8000 });
  });

  test('creates a new offer', async ({ page }) => {
    await page.goto('/offers/create');
    // direction
    await page.locator('.chip', { hasText: /home.*office/i }).first().click();
    // date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.getByLabel(/date/i).fill(tomorrow.toISOString().slice(0, 10));
    // time
    await page.getByLabel(/departure/i).fill('08:30');
    // seats
    await page.getByLabel(/seats/i).fill('2');
    await page.getByRole('button', { name: /create offer/i }).click();
    await expect(page).toHaveURL(/\/offers/, { timeout: 8000 });
  });

  test('offer detail opens', async ({ page }) => {
    await page.goto('/offers');
    const card = page.locator('.offer-card').first();
    if (await card.isVisible()) {
      await card.click();
      await expect(page).toHaveURL(/\/offers\//);
    }
  });
});
