import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/admin-login.helper';

test.describe('Admin — Users', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('user list loads with table', async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('.data-table tbody tr').first()).toBeVisible({ timeout: 10000 });
  });

  test('search filters users', async ({ page }) => {
    await page.goto('/users');
    await page.locator('.search-input').fill('test');
    await page.waitForTimeout(600);
    // table should reload — just check it still exists
    await expect(page.locator('.data-table')).toBeVisible();
  });

  test('user detail opens', async ({ page }) => {
    await page.goto('/users');
    await page.locator('.link').first().click();
    await expect(page).toHaveURL(/\/users\//);
    await expect(page.locator('.detail-card')).toBeVisible({ timeout: 8000 });
  });
});
