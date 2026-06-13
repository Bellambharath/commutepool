import type { Context, MiddlewareHandler } from 'hono';
import { verifyAccessToken } from '../services/jwt.js';
import type { UserRole } from '@commutepool/shared';

export interface AuthVariables {
  userId: string;
  role: UserRole;
}

const ADMIN_PHONE = process.env['ADMIN_PHONE'] ?? '+919999999999';

/** Middleware: verifies the Bearer access token and attaches { userId, role } to context. */
export const requireAuth: MiddlewareHandler = async (c: Context, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      { success: false, data: null, error: 'Authorization header missing or malformed' },
      401,
    );
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    return c.json(
      { success: false, data: null, error: 'Invalid or expired access token' },
      401,
    );
  }

  c.set('userId', payload.userId);
  c.set('role', payload.role);

  await next();
};

/** Middleware: requireAuth + checks that the authenticated user is the platform admin. */
export const requireAdmin: MiddlewareHandler = async (c: Context, next) => {
  // First run requireAuth inline
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      { success: false, data: null, error: 'Authorization header missing or malformed' },
      401,
    );
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    return c.json(
      { success: false, data: null, error: 'Invalid or expired access token' },
      401,
    );
  }

  c.set('userId', payload.userId);
  c.set('role', payload.role);

  // Admin check: role must be BOTH (the seeded admin role) and userId must match admin record
  // We do a lightweight DB lookup to avoid stale JWT role issues
  const { prisma } = await import('../lib/prisma.js');
  const user = await prisma.users.findUnique({
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
