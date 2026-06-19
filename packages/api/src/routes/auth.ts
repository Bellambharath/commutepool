import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z, type ZodError } from 'zod';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { requestOtp, verifyOtp } from '../services/otp.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../services/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/env.js';
import type { UserRole } from '@commutepool/shared';

const PHONE_REGEX = /^\+91[6-9]\d{9}$/;

const phoneSchema = z.object({
  phone: z
    .string()
    .regex(PHONE_REGEX, 'Phone must be in format +91XXXXXXXXXX (6-9 series)'),
});

const verifyOtpSchema = z.object({
  phone: z
    .string()
    .regex(PHONE_REGEX, 'Phone must be in format +91XXXXXXXXXX (6-9 series)'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

/** Cookie options for the refresh token. */
const refreshCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'Lax' as const,
  path: '/auth',
  maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  domain:
    config.NODE_ENV === 'production' ? '.commutepool.pghive.in' : undefined,
} as const;

/** Extract the first error message from a ZodError. */
function firstZodError(err: ZodError): string {
  return err.errors[0]?.message ?? 'Validation error';
}

export const authRouter = new Hono();

// ---------------------------------------------------------------------------
// POST /auth/request-otp
// ---------------------------------------------------------------------------
authRouter.post(
  '/request-otp',
  zValidator('json', phoneSchema),
  async (c) => {
    const validationResult = c.req.valid('json');
    const { phone } = validationResult;
    const result = await requestOtp(phone);

    if (!result.success) {
      if (result.error === 'RATE_LIMITED') {
        return c.json(
          {
            success: false,
            data: null,
            error: `Too many OTP requests. Retry in ${result.retryAfterSeconds} seconds.`,
          },
          429,
        );
      }
      return c.json(
        { success: false, data: null, error: 'Failed to send OTP. Please try again.' },
        503,
      );
    }

    return c.json({ success: true, data: { message: 'OTP sent successfully' }, error: null });
  },
);

// ---------------------------------------------------------------------------
// POST /auth/verify-otp
// Refresh token is set as an httpOnly cookie; NOT returned in the response body.
// ---------------------------------------------------------------------------
authRouter.post(
  '/verify-otp',
  zValidator('json', verifyOtpSchema),
  async (c) => {
    const { phone, otp } = c.req.valid('json');
    const verifyResult = await verifyOtp(phone, otp);

    if (!verifyResult.success) {
      const statusCode =
        verifyResult.error === 'MAX_ATTEMPTS_EXCEEDED' ? 429 : 400;
      return c.json(
        {
          success: false,
          data: null,
          error:
            verifyResult.error === 'MAX_ATTEMPTS_EXCEEDED'
              ? 'Maximum verification attempts exceeded. Please request a new OTP.'
              : 'Invalid or expired OTP.',
        },
        statusCode,
      );
    }

    // OTP verified — find or create user
    let user = await prisma.user.findFirst({
      where: { phone, deleted_at: null },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          phone,
          name: '',
          role: 'RIDER' as UserRole,
          status: 'PENDING',
        },
      });
    }

    const accessToken = signAccessToken(user.id, user.role as UserRole);
    const rawRefreshToken = signRefreshToken(user.id);
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    // Set refresh token in httpOnly cookie — never exposed in response body
    setCookie(c, 'refresh_token', rawRefreshToken, refreshCookieOptions);

    return c.json({
      success: true,
      data: {
        accessToken,
        isNewUser,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          status: user.status,
        },
      },
      error: null,
    });
  },
);

// ---------------------------------------------------------------------------
// POST /auth/refresh
// Reads refresh token from httpOnly cookie (not request body).
// Issues new access token in JSON body + rotates cookie.
// ---------------------------------------------------------------------------
authRouter.post('/refresh', async (c) => {
  const refreshToken = getCookie(c, 'refresh_token');

  if (!refreshToken || refreshToken.trim() === '') {
    return c.json(
      { success: false, data: null, error: 'Refresh token missing' },
      401,
    );
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return c.json(
      { success: false, data: null, error: 'Invalid or expired refresh token' },
      401,
    );
  }

  const tokenHash = hashToken(refreshToken);
  const now = new Date();

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      user_id: payload.userId,
      token_hash: tokenHash,
      revoked_at: null,
      expires_at: { gt: now },
    },
  });

  if (!storedToken) {
    return c.json(
      { success: false, data: null, error: 'Refresh token has been revoked or does not exist' },
      401,
    );
  }

  // Revoke old token (rotation)
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked_at: now },
  });

  // Fetch user to embed current role in new access token
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, deleted_at: true },
  });

  if (!user || user.deleted_at !== null) {
    return c.json(
      { success: false, data: null, error: 'User not found or account suspended' },
      401,
    );
  }

  const newAccessToken = signAccessToken(user.id, user.role as UserRole);
  const newRawRefreshToken = signRefreshToken(user.id);
  const newTokenHash = hashToken(newRawRefreshToken);
  const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: newTokenHash,
      expires_at: newExpiresAt,
    },
  });

  // Rotate: set new refresh token cookie
  setCookie(c, 'refresh_token', newRawRefreshToken, refreshCookieOptions);

  return c.json({
    success: true,
    data: { accessToken: newAccessToken },
    error: null,
  });
});

// ---------------------------------------------------------------------------
// POST /auth/logout   (requireAuth)
// ---------------------------------------------------------------------------
authRouter.post('/logout', requireAuth, async (c) => {
  const userId = c.get('userId');

  await prisma.refreshToken.updateMany({
    where: {
      user_id: userId,
      revoked_at: null,
    },
    data: { revoked_at: new Date() },
  });

  deleteCookie(c, 'refresh_token', {
    path: '/auth',
    domain:
      config.NODE_ENV === 'production' ? '.commutepool.pghive.in' : undefined,
  });

  return c.json({ success: true, data: { message: 'Logged out successfully' }, error: null });
});

export { firstZodError };
