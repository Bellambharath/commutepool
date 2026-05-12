import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: 2,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'pwa-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env['BASE_URL_PWA'] ?? 'http://localhost:4200',
      },
      testMatch: 'pwa/**/*.spec.ts',
    },
    {
      name: 'admin-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env['BASE_URL_ADMIN'] ?? 'http://localhost:4201',
      },
      testMatch: 'admin/**/*.spec.ts',
    },
  ],
});
