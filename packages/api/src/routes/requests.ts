import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

export const requestsRouter = new Hono();

requestsRouter.use('*', requireAuth);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const IST_OFFSET_MS = 330 * 60 * 1000;

/**
 * Posting window: Sunday 18:00 IST – Friday 23:00 IST.
 * Identical logic to offers.ts — kept local so each file is self-contained.
 */
function isWithinPostingWindow(): boolean {
  const now = new Date();
  const istMs = now.getTime() + IST_OFFSET_MS;
  const ist = new Date(istMs);
  const dow = ist.getUTCDay();
  const totalMinutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();

  if (dow === 6) return false;
  if (dow === 0) return totalMinutes >= 18 * 60;
  if (dow >= 1 && dow <= 4) return true;
  return totalMinutes <= 23 * 60; // Friday
}

function isMonday(isoDate: string): boolean {
  const ms = Date.parse(isoDate + 'T00:00:00Z');
  if (Number.isNaN(ms)) return false;
  const ist = new Date(ms + IST_OFFSET_MS);
  return ist.getUTCDay() === 1;
}

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const createRequestSchema = z.object({
  period: z.enum(['MORNING', 'EVENING'], {
    errorMap: () => ({ message: 'period must be MORNING or EVENING' }),
  }),
  weekStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'weekStartDate must be YYYY-MM-DD'),
  daysNeeded: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'daysNeeded must contain at least one day'),
  pickupLat: z
    .number()
    .min(-90)
    .max(90),
  pickupLng: z
    .number()
    .min(-180)
    .max(180),
  pickupAddress: z.string().min(1, 'pickupAddress is required'),
  pickupPlaceId: z.string().min(1, 'pickupPlaceId is required'),
  dropoffLat: z
    .number()
    .min(-90)
    .max(90),
  dropoffLng: z
    .number()
    .min(-180)
    .max(180),
  dropoffAddress: z.string().min(1, 'dropoffAddress is required'),
  dropoffPlaceId: z.string().min(1, 'dropoffPlaceId is required'),
  departureWindowStart: z
    .string()
    .regex(HHMM_REGEX, 'departureWindowStart must be HH:MM'),
  departureWindowEnd: z
    .string()
    .regex(HHMM_REGEX, 'departureWindowEnd must be HH:MM'),
});

// ---------------------------------------------------------------------------
// POST /requests — rider creates weekly request
// ---------------------------------------------------------------------------
requestsRouter.post(
  '/',
  zValidator('json', createRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { success: false, data: null, error: 'Validation failed' },
        422,
      );
    }
  }),
  async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');

    // 1. Role guard — must be RIDER (or BOTH)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, deleted_at: true },
    });
    if (!user || user.deleted_at !== null) {
      return c.json(
        { success: false, data: null, error: 'User not found' },
        404,
      );
    }
    if (user.role !== 'RIDER' && user.role !== 'BOTH') {
      return c.json(
        { success: false, data: null, error: 'Forbidden' },
        403,
      );
    }

    // 2. Posting window check
    if (!isWithinPostingWindow()) {
      return c.json(
        {
          success: false,
          data: null,
          error: 'Requests can only be posted Sunday 18:00 – Friday 23:00 IST',
        },
        400,
      );
    }

    // 3. week_start_date must be a Monday
    if (!isMonday(body.weekStartDate)) {
      return c.json(
        {
          success: false,
          data: null,
          error: 'weekStartDate must be a Monday (YYYY-MM-DD)',
        },
        400,
      );
    }

    // 4. Create — riders may have multiple requests per week.
    //    Only write pickup_lat/lng and dropoff_lat/lng.
    //    The DB trigger trg_wr_set_geometry populates pickup_geometry and
    //    dropoff_geometry automatically — never set them from app code.
    const request = await prisma.weeklyRequest.create({
      data: {
        rider_id: userId,
        period: body.period,
        week_start_date: new Date(body.weekStartDate + 'T00:00:00Z'),
        days_needed: body.daysNeeded,
        pickup_lat: body.pickupLat,
        pickup_lng: body.pickupLng,
        pickup_address: body.pickupAddress,
        pickup_place_id: body.pickupPlaceId,
        dropoff_lat: body.dropoffLat,
        dropoff_lng: body.dropoffLng,
        dropoff_address: body.dropoffAddress,
        dropoff_place_id: body.dropoffPlaceId,
        departure_window_start: body.departureWindowStart,
        departure_window_end: body.departureWindowEnd,
        status: 'OPEN',
      },
    });

    return c.json(
      { success: true, data: { request }, error: null },
      201,
    );
  },
);

// ---------------------------------------------------------------------------
// GET /requests — list own requests, optional ?week=YYYY-MM-DD filter
// ---------------------------------------------------------------------------
requestsRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const weekParam = c.req.query('week');

  let weekFilter: Date | undefined;
  if (weekParam) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
      return c.json(
        {
          success: false,
          data: null,
          error: 'week query param must be YYYY-MM-DD',
        },
        400,
      );
    }
    weekFilter = new Date(weekParam + 'T00:00:00Z');
  }

  const requests = await prisma.weeklyRequest.findMany({
    where: {
      rider_id: userId,
      // WeeklyRequest has no deleted_at — use status != EXPIRED as soft filter,
      // but the spec says GET excludes deleted_at IS NOT NULL. Since WeeklyRequest
      // has no deleted_at, we expose all non-expired records for the user.
      // The spec's soft-delete for requests is implemented via DELETE /:id below
      // which we model as status = 'EXPIRED' (closest available tombstone).
      status: { not: 'EXPIRED' },
      ...(weekFilter ? { week_start_date: weekFilter } : {}),
    },
    orderBy: [
      { week_start_date: 'desc' },
      { created_at: 'desc' },
    ],
  });

  return c.json({ success: true, data: { requests }, error: null });
});

// ---------------------------------------------------------------------------
// DELETE /requests/:id — soft delete: set status = EXPIRED
// WeeklyRequest has no deleted_at column. The closest available tombstone in
// the schema is status = EXPIRED (WeeklyRequestStatus enum). This hides the
// record from GET /requests without hard-deleting it.
// ---------------------------------------------------------------------------
requestsRouter.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const requestId = c.req.param('id');

  const existing = await prisma.weeklyRequest.findFirst({
    where: {
      id: requestId,
      rider_id: userId,
      status: { not: 'EXPIRED' },
    },
    select: { id: true },
  });

  if (!existing) {
    return c.json(
      {
        success: false,
        data: null,
        error: 'Request not found or already deleted',
      },
      404,
    );
  }

  await prisma.weeklyRequest.update({
    where: { id: requestId },
    data: { status: 'EXPIRED' },
  });

  return c.json({ success: true, data: null, error: null });
});
