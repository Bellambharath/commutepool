import { Page } from '@playwright/test';

/**
 * Logs in as a test PWA user by hitting the API directly to get a token,
 * then injects it into localStorage so the Angular app treats the session as valid.
 */
export async function loginAsPwaUser(page: Page): Promise<void> {
  const apiUrl = process.env['API_URL'] ?? 'http://localhost:3000';
  const baseUrl = process.env['BASE_URL_PWA'] ?? 'http://localhost:4200';

  // Seed user: +91 90000 00001, OTP bypass in test env returns 123456
  const otpRes = await page.request.post(`${apiUrl}/auth/otp/request`, {
    data: { phone: '9000000001' }
  });

  const verifyRes = await page.request.post(`${apiUrl}/auth/otp/verify`, {
    data: { phone: '9000000001', otp: '123456' }
  });

  if (verifyRes.ok()) {
    const { accessToken, refreshToken } = await verifyRes.json();
    // Navigate to app root first so we can set localStorage on the correct origin
    await page.goto(baseUrl);
    await page.evaluate(
      ({ at, rt }) => { localStorage.setItem('accessToken', at); localStorage.setItem('refreshToken', rt); },
      { at: accessToken, rt: refreshToken }
    );
  }
  // Navigate to home — guard will pick up token
  await page.goto(`${baseUrl}/offers`);
}
