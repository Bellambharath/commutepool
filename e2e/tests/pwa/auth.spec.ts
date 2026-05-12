import { test, expect } from '@playwright/test';

test.describe('PWA — Auth flow', () => {
  test('shows OTP request screen', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder(/phone/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send otp/i })).toBeVisible();
  });

  test('requests OTP and shows verify screen', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/phone/i).fill('9000000001');
    await page.getByRole('button', { name: /send otp/i }).click();
    await expect(page.getByPlaceholder(/otp/i)).toBeVisible({ timeout: 6000 });
  });

  test('shows error on wrong OTP', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/phone/i).fill('9000000001');
    await page.getByRole('button', { name: /send otp/i }).click();
    await page.getByPlaceholder(/otp/i).fill('000000');
    await page.getByRole('button', { name: /verify/i }).click();
    await expect(page.locator('.error')).toBeVisible({ timeout: 6000 });
  });
});
