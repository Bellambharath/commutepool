import { test, expect } from '@playwright/test';

test.describe('Admin — Auth', () => {
  test('redirects unauthenticated to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder(/admin email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('shows error on bad credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/admin email/i).fill('bad@example.com');
    await page.getByPlaceholder(/password/i).fill('wrongpass');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.locator('.error')).toBeVisible({ timeout: 6000 });
  });
});
