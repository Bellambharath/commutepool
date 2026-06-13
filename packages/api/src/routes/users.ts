import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { UserRole } from '@commutepool/shared';

export const usersRouter = new Hono();

// Apply requireAuth to all routes in this router
usersRouter.use('*', requireAuth);

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const PHONE_REGEX = /^\+91[6-9]\d{9}$/;

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  photoUrl: z.string().url('photoUrl must be a valid URL').optional(),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'role must be RIDER, OWNER, or BOTH' }),
  }),
  emergencyContactName: z
    .string()
    .min(2, 'Emergency contact name must be at least 2 characters')
    .max(100)
    .trim()
    .optional(),
  emergencyContactPhone: z
    .string()
    .regex(PHONE_REGEX, 'Emergency contact phone must be in format +91XXXXXXXXXX')
    .optional(),
});

// ---------------------------------------------------------------------------
// POST /users/profile — complete or update profile
// ---------------------------------------------------------------------------
usersRouter.post(
  '/profile',
  zValidator('json', updateProfileSchema),
  async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, deleted_at: true },
    });

    if (!existingUser || existingUser.deleted_at !== null) {
      return c.json(
        { success: false, data: null, error: 'User not found' },
        404,
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name,
        photo_url: body.photoUrl ?? undefined,
        role: body.role,
        emergency_contact_name: body.emergencyContactName ?? undefined,
        emergency_contact_phone: body.emergencyContactPhone ?? undefined,
        // Promote PENDING -> ACTIVE on first profile completion
        status: existingUser.status === 'PENDING' ? 'ACTIVE' : undefined,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        photo_url: true,
        role: true,
        status: true,
        emergency_contact_name: true,
        emergency_contact_phone: true,
        cancellation_strikes: true,
        created_at: true,
        updated_at: true,
      },
    });

    return c.json({
      success: true,
      data: { user: updatedUser },
      error: null,
    });
  },
);

// ---------------------------------------------------------------------------
// GET /users/profile — fetch own profile with bike owner profile if exists
// ---------------------------------------------------------------------------
usersRouter.get('/profile', async (c) => {
  const userId = c.get('userId');

  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: {
      id: true,
      phone: true,
      name: true,
      photo_url: true,
      role: true,
      status: true,
      emergency_contact_name: true,
      emergency_contact_phone: true,
      cancellation_strikes: true,
      created_at: true,
      updated_at: true,
      bike_owner_profiles: {
        select: {
          bike_model: true,
          verification_status: true,
        },
      },
    },
  });

  if (!user) {
    return c.json(
      { success: false, data: null, error: 'User not found' },
      404,
    );
  }

  const { bike_owner_profiles, ...userFields } = user;

  return c.json({
    success: true,
    data: {
      user: userFields,
      bikeOwnerProfile: bike_owner_profiles ?? null,
    },
    error: null,
  });
});

// ---------------------------------------------------------------------------
// GET /users/me — alias for GET /users/profile
// ---------------------------------------------------------------------------
usersRouter.get('/me', async (c) => {
  const userId = c.get('userId');

  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: {
      id: true,
      phone: true,
      name: true,
      photo_url: true,
      role: true,
      status: true,
      emergency_contact_name: true,
      emergency_contact_phone: true,
      cancellation_strikes: true,
      created_at: true,
      updated_at: true,
      bike_owner_profiles: {
        select: {
          bike_model: true,
          verification_status: true,
        },
      },
    },
  });

  if (!user) {
    return c.json(
      { success: false, data: null, error: 'User not found' },
      404,
    );
  }

  const { bike_owner_profiles, ...userFields } = user;

  return c.json({
    success: true,
    data: {
      user: userFields,
      bikeOwnerProfile: bike_owner_profiles ?? null,
    },
    error: null,
  });
});
