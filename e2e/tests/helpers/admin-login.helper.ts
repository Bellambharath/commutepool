import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page): Promise<void> {
  const apiUrl   = process.env['API_URL']         ?? 'http://localhost:3000';
  const baseUrl  = process.env['BASE_URL_ADMIN']  ?? 'http://localhost:4201';
  const email    = process.env['ADMIN_TEST_EMAIL']    ?? 'admin@commutepool.test';
  const password = process.env['ADMIN_TEST_PASSWORD'] ?? 'Admin@1234!';

  const res = await page.request.post(`${apiUrl}/admin/auth/login`, {
    data: { email, password }
  });

  if (res.ok()) {
    const { accessToken, refreshToken } = await res.json();
    await page.goto(baseUrl);
    await page.evaluate(
      ({ at, rt }) => { localStorage.setItem('accessToken', at); localStorage.setItem('refreshToken', rt); },
      { at: accessToken, rt: refreshToken }
    );
  }
  await page.goto(`${baseUrl}/dashboard`);
}
