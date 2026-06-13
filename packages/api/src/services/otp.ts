import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { sendOtp } from './sms.js';

const OTP_BCRYPT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_SEND_PER_HOUR = 3;
const OTP_MAX_VERIFY_ATTEMPTS = 3;

/** Generate a cryptographically secure 6-digit OTP string. */
export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export type RequestOtpResult =
  | { success: true }
  | { success: false; error: 'RATE_LIMITED'; retryAfterSeconds: number }
  | { success: false; error: 'SMS_FAILED' };

/**
 * Request an OTP for the given phone number.
 * Enforces max 3 sends per phone per hour (counted by created_at timestamp).
 * Invalidates all previous unverified OTPs so only one is ever live.
 * Stores a bcrypt hash in otp_attempts with 5-minute expiry.
 */
export async function requestOtp(phone: string): Promise<RequestOtpResult> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Rate-limit: count sends in the last hour by created_at (unaffected by
  // the invalidation below because we count rows regardless of verified status)
  const recentSends = await prisma.otpAttempt.count({
    where: {
      phone,
      created_at: { gte: oneHourAgo },
    },
  });

  if (recentSends >= OTP_MAX_SEND_PER_HOUR) {
    const oldest = await prisma.otpAttempt.findFirst({
      where: { phone, created_at: { gte: oneHourAgo } },
      orderBy: { created_at: 'asc' },
    });
    const retryAfterSeconds = oldest
      ? Math.ceil((oldest.created_at.getTime() + 60 * 60 * 1000 - Date.now()) / 1000)
      : 3600;
    return { success: false, error: 'RATE_LIMITED', retryAfterSeconds };
  }

  // Fix 1: Invalidate all existing unverified OTPs for this phone so only
  // one OTP is ever live at a time.
  await prisma.otpAttempt.updateMany({
    where: { phone, verified: false },
    data: { verified: true },
  });

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, OTP_BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpAttempt.create({
    data: {
      phone,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempts: 0,
      verified: false,
    },
  });

  const sent = await sendOtp(phone, otp);
  if (!sent) {
    return { success: false, error: 'SMS_FAILED' };
  }

  return { success: true };
}

export type VerifyOtpResult =
  | { success: true }
  | { success: false; error: 'INVALID_OR_EXPIRED' }
  | { success: false; error: 'MAX_ATTEMPTS_EXCEEDED' }
  | { success: false; error: 'ALREADY_VERIFIED' };

/**
 * Verify the OTP submitted by the user.
 * Checks the latest unexpired, unverified otp_attempts row for the phone.
 * Increments attempt counter before comparing (prevents timing attacks).
 * Marks verified: true on success.
 */
export async function verifyOtp(
  phone: string,
  otp: string,
): Promise<VerifyOtpResult> {
  const now = new Date();

  const attempt = await prisma.otpAttempt.findFirst({
    where: {
      phone,
      verified: false,
      expires_at: { gt: now },
    },
    orderBy: { created_at: 'desc' },
  });

  if (!attempt) {
    return { success: false, error: 'INVALID_OR_EXPIRED' };
  }

  if (attempt.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
    return { success: false, error: 'MAX_ATTEMPTS_EXCEEDED' };
  }

  // Increment attempt counter before comparing
  await prisma.otpAttempt.update({
    where: { id: attempt.id },
    data: { attempts: attempt.attempts + 1 },
  });

  const isMatch = await bcrypt.compare(otp, attempt.otp_hash);

  if (!isMatch) {
    if (attempt.attempts + 1 >= OTP_MAX_VERIFY_ATTEMPTS) {
      return { success: false, error: 'MAX_ATTEMPTS_EXCEEDED' };
    }
    return { success: false, error: 'INVALID_OR_EXPIRED' };
  }

  await prisma.otpAttempt.update({
    where: { id: attempt.id },
    data: { verified: true },
  });

  return { success: true };
}
