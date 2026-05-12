import { test, expect } from '@playwright/test';
import { loginAsPwaUser } from '../helpers/pwa-login.helper';

test.describe('PWA — Support', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPwaUser(page);
  });

  test('support list loads', async ({ page }) => {
    await page.goto('/support');
    await expect(page.locator('.ticket-card, .empty-state, .raise-btn')).toBeVisible({ timeout: 8000 });
  });

  test('raise ticket dialog opens', async ({ page }) => {
    await page.goto('/support');
    await page.getByRole('button', { name: /raise ticket/i }).click();
    await expect(page.locator('.dialog, mat-dialog-container, .bottom-sheet')).toBeVisible({ timeout: 6000 });
  });

  test('submits a support ticket', async ({ page }) => {
    await page.goto('/support');
    await page.getByRole('button', { name: /raise ticket/i }).click();
    const dialog = page.locator('.dialog, mat-dialog-container, .bottom-sheet').first();
    await dialog.getByPlaceholder(/subject/i).fill('E2E test ticket');
    await dialog.locator('select, [role=listbox]').first().selectOption({ index: 1 }).catch(() => {});
    await dialog.getByPlaceholder(/describe/i).fill('Automated E2E test — please ignore');
    await dialog.getByRole('button', { name: /submit/i }).click();
    await expect(page.locator('.ticket-card').first()).toBeVisible({ timeout: 8000 });
  });
});
