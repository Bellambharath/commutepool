import type { Context, MiddlewareHandler } from 'hono';
import { verifyAccessToken } from '../services/jwt.js';
import type { UserRole } from '@commutepool/shared';

export interface AuthVariables {
  userId: string;
  role: UserRole;
}

const ADMIN_PHONE = process.env['ADMIN_PHONE'] ?? '+919999999999';

/**
 * Shared helper: reads and verifies the Bearer token from the Authorization header.
 * On success, sets userId and role on context and returns the payload.
 * On failure, writes a 401 JSON response and returns null.
 */
async function verifyBearer(
  c: Context,
): Promise<{ userId: string; role: UserRole } | null> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    c.res = c.json(
      { success: false, data: null, error: 'Authorization header missing or malformed' },
      401,
    ) as Response;
    return null;
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    c.res = c.json(
      { success: false, data: null, error: 'Invalid or expired access token' },
      401,
    ) as Response;
    return null;
  }

  c.set('userId', payload.userId);
  c.set('role', payload.role);

  return payload;
}

/** Middleware: verifies the Bearer access token and attaches { userId, role } to context. */
export const requireAuth: MiddlewareHandler = async (c: Context, next) => {
  const payload = await verifyBearer(c);
  if (!payload) return;
  await next();
};

/** Middleware: requireAuth + checks that the authenticated user is the platform admin. */
export const requireAdmin: MiddlewareHandler = async (c: Context, next) => {
  const payload = await verifyBearer(c);
  if (!payload) return;

  const { prisma } = await import('../lib/prisma.js');
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, phone: true, deleted_at: true },
  });

  if (!user || user.deleted_at !== null || user.phone !== ADMIN_PHONE) {
    return c.json(
      { success: false, data: null, error: 'Forbidden: admin access required' },
      403,
    );
  }

  await next();
};
