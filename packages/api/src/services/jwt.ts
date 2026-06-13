import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env.js';
import type { UserRole } from '@commutepool/shared';

interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  type: 'access';
}

interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
}

export function signAccessToken(userId: string, role: UserRole): string {
  const payload: AccessTokenPayload = { userId, role, type: 'access' };
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { userId, type: 'refresh' };
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyAccessToken(
  token: string,
): { userId: string; role: UserRole } | null {
  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
    if (decoded.type !== 'access') return null;
    return { userId: decoded.userId, role: decoded.role };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    if (decoded.type !== 'refresh') return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

/** SHA-256 hash of a raw token string — used for storing refresh tokens safely in DB. */
export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
