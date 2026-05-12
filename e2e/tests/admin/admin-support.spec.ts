import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/admin-login.helper';

test.describe('Admin — Support Queue', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('support queue loads', async ({ page }) => {
    await page.goto('/support');
    await expect(page.locator('.data-table, .empty-state')).toBeVisible({ timeout: 8000 });
  });

  test('can filter by status', async ({ page }) => {
    await page.goto('/support');
    await page.locator('select').selectOption('InProgress');
    await page.waitForTimeout(500);
    await expect(page.locator('.data-table')).toBeVisible();
  });

  test('ticket detail loads', async ({ page }) => {
    await page.goto('/support');
    const link = page.locator('.link').first();
    if (await link.isVisible()) {
      await link.click();
      await expect(page.locator('.detail-card')).toBeVisible({ timeout: 8000 });
      await expect(page.locator('.message-thread')).toBeVisible();
    }
  });
});
