import { config } from '../config/env.js';

interface Fast2SmsResponse {
  return: boolean;
  request_id: string;
  message: string[];
}

/**
 * Low-level SMS send via Fast2SMS (transactional/DLT route).
 * In non-production environments logs to console instead of calling the API.
 *
 * @param phone   - Recipient phone in +91XXXXXXXXXX format
 * @param message - Plain-text message body
 * @returns true if sent (or simulated), false on error
 */
export async function sendSms(phone: string, message: string): Promise<boolean> {
  const mobileNumber = phone.replace(/^\+91/, '');

  if (config.NODE_ENV !== 'production') {
    console.log(
      `[CommutePool SMS — DEV] To ${phone}: ${message} (not sent via Fast2SMS in ${config.NODE_ENV})`,
    );
    return true;
  }

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: config.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify({
        route: 'q',
        message,
        numbers: mobileNumber,
        flash: '0',
      }),
    });

    if (!response.ok) {
      console.error(`[CommutePool SMS] Fast2SMS HTTP error: ${response.status}`);
      return false;
    }

    const data = (await response.json()) as Fast2SmsResponse;

    if (!data.return) {
      console.error('[CommutePool SMS] Fast2SMS rejected request:', data.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[CommutePool SMS] sendSms failed:', err);
    return false;
  }
}

/**
 * Send an OTP via Fast2SMS.
 * In non-production environments, logs the OTP to console instead of calling the API.
 */
export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  const mobileNumber = phone.replace(/^\+91/, '');

  if (config.NODE_ENV !== 'production') {
    console.log(
      `[CommutePool SMS — DEV] OTP for ${phone}: ${otp} (not sent via Fast2SMS in ${config.NODE_ENV})`,
    );
    return true;
  }

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: config.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: otp,
        numbers: mobileNumber,
        flash: '0',
      }),
    });

    if (!response.ok) {
      console.error(`[CommutePool SMS] Fast2SMS HTTP error: ${response.status}`);
      return false;
    }

    const data = (await response.json()) as Fast2SmsResponse;

    if (!data.return) {
      console.error(`[CommutePool SMS] Fast2SMS rejected request:`, data.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[CommutePool SMS] Failed to call Fast2SMS:', err);
    return false;
  }
}
