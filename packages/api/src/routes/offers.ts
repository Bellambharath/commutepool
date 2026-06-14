import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getWeekStartMonday } from '@commutepool/shared';

export const offersRouter = new Hono();

offersRouter.use('*', requireAuth);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const IST_OFFSET_MS = 330 * 60 * 1000; // UTC+5:30

/**
 * Returns true when the current moment falls inside the posting window:
 * Sunday 18:00 IST (inclusive) → Friday 23:00 IST (inclusive).
 *
 * IST day-of-week: 0=Sun, 1=Mon … 6=Sat
 * Sunday  18:00–23:59 IST → open
 * Monday  00:00–23:59 IST → open
 * Tuesday 00:00–23:59 IST → open
 * Wednesday 00:00–23:59 IST → open
 * Thursday  00:00–23:59 IST → open
 * Friday  00:00–23:00 IST → open
 * Friday  23:01–23:59 IST → closed
 * Saturday  00:00–23:59 IST → closed
 */
function isWithinPostingWindow(): boolean {
  const now = new Date();
  const istMs = now.getTime() + IST_OFFSET_MS;
  const ist = new Date(istMs);
  const dow = ist.getUTCDay(); // 0=Sun…6=Sat
  const hour = ist.getUTCHours();
  const minute = ist.getUTCMinutes();
  const totalMinutes = hour * 60 + minute;

  // Saturday — always closed
  if (dow === 6) return false;
  // Sunday — open from 18:00 (1080 min) onward
  if (dow === 0) return totalMinutes >= 18 * 60;
  // Mon–Thu — always open
  if (dow >= 1 && dow <= 4) return true;
  // Friday — open until 23:00 (1380 min) inclusive, i.e. 23:00 = 1380 min exactly
  // "closes Friday 23:00 IST" means last allowed minute is 23:00:00
  return totalMinutes <= 23 * 60;
}

/**
 * Returns true iff the given ISO date string (YYYY-MM-DD) is a Monday
 * in the IST calendar.
 */
function isMonday(isoDate: string): boolean {
  // Parse as midnight UTC then shift to IST to read IST day-of-week.
  const ms = Date.parse(isoDate + 'T00:00:00Z');
  if (Number.isNaN(ms)) return false;
  const istMs = ms + IST_OFFSET_MS;
  const ist = new Date(istMs);
  return ist.getUTCDay() === 1; // 1 = Monday
}

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const createOfferSchema = z.object({
  routeId: z.string().uuid('routeId must be a valid UUID'),
  period: z.enum(['MORNING', 'EVENING'], {
    errorMap: () => ({ message: 'period must be MORNING or EVENING' }),
  }),
  weekStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'weekStartDate must be YYYY-MM-DD'),
  daysAvailable: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'daysAvailable must contain at least one day'),
  departureWindowStart: z
    .string()
    .regex(HHMM_REGEX, 'departureWindowStart must be HH:MM'),
  departureWindowEnd: z
    .string()
    .regex(HHMM_REGEX, 'departureWindowEnd must be HH:MM'),
  seatsAvailable: z
    .number()
    .int()
    .min(1)
    .max(4)
    .optional()
    .default(1),
});

// ---------------------------------------------------------------------------
// POST /offers — owner creates weekly offer
// ---------------------------------------------------------------------------
offersRouter.post(
  '/',
  zValidator('json', createOfferSchema, (result, c) => {
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

    // 1. Role guard — must be OWNER (or BOTH)
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
    if (user.role !== 'OWNER' && user.role !== 'BOTH') {
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
          error: 'Offers can only be posted Sunday 18:00 – Friday 23:00 IST',
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

    // 4. Verify the route belongs to this owner
    const route = await prisma.commuteRoute.findFirst({
      where: { id: body.routeId, user_id: userId, is_active: true },
      select: { id: true },
    });
    if (!route) {
      return c.json(
        {
          success: false,
          data: null,
          error: 'Route not found or does not belong to you',
        },
        404,
      );
    }

    // 5. Create — one active offer per owner/route/period/week
    let offer;
    try {
      offer = await prisma.weeklyOffer.create({
        data: {
          owner_id: userId,
          route_id: body.routeId,
          period: body.period,
          week_start_date: new Date(body.weekStartDate + 'T00:00:00Z'),
          days_available: body.daysAvailable,
          departure_window_start: body.departureWindowStart,
          departure_window_end: body.departureWindowEnd,
          seats_available: body.seatsAvailable,
          is_active: true,
        },
      });
    } catch (err: unknown) {
      // Unique constraint violation from DB
      const msg =
        err instanceof Error ? err.message : '';
      if (msg.includes('unique') || msg.includes('duplicate') || (err as { code?: string }).code === 'P2002') {
        return c.json(
          { success: false, data: null, error: 'Duplicate offer for this week' },
          409,
        );
      }
      throw err;
    }

    return c.json(
      { success: true, data: { offer }, error: null },
      201,
    );
  },
);

// ---------------------------------------------------------------------------
// GET /offers — list own active offers, optional ?week=YYYY-MM-DD filter
// ---------------------------------------------------------------------------
offersRouter.get('/', async (c) => {
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

  const offers = await prisma.weeklyOffer.findMany({
    where: {
      owner_id: userId,
      is_active: true,
      ...(weekFilter ? { week_start_date: weekFilter } : {}),
    },
    orderBy: [
      { week_start_date: 'desc' },
      { created_at: 'desc' },
    ],
    include: {
      route: {
        select: {
          id: true,
          period: true,
          route_label: true,
          source_address: true,
          destination_address: true,
          encoded_polyline: true,
        },
      },
    },
  });

  return c.json({ success: true, data: { offers }, error: null });
});

// ---------------------------------------------------------------------------
// DELETE /offers/:id — soft delete (is_active = false)
// ---------------------------------------------------------------------------
offersRouter.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const offerId = c.req.param('id');

  const existing = await prisma.weeklyOffer.findFirst({
    where: { id: offerId, owner_id: userId, is_active: true },
    select: { id: true },
  });

  if (!existing) {
    return c.json(
      {
        success: false,
        data: null,
        error: 'Offer not found or already deleted',
      },
      404,
    );
  }

  await prisma.weeklyOffer.update({
    where: { id: offerId },
    data: { is_active: false },
  });

  return c.json({ success: true, data: null, error: null });
});
