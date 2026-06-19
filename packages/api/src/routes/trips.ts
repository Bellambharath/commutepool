import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { istHHMMToUtcDate, minutesUntil } from '@commutepool/shared';
import { sendSms } from '../services/sms.js';
import { config } from '../config/env.js';

export const tripsRouter = new Hono();

tripsRouter.use('*', requireAuth);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a trip's scheduled_date (stored as UTC midnight Date) and
 * scheduled_departure (HH:MM IST string) to a UTC Date representing the
 * exact departure moment. Uses istHHMMToUtcDate from @commutepool/shared —
 * no inline IST arithmetic.
 */
function tripDepartureUtc(scheduledDate: Date, scheduledDeparture: string): Date {
  const yyyy = scheduledDate.getUTCFullYear();
  const mm = String(scheduledDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(scheduledDate.getUTCDate()).padStart(2, '0');
  return istHHMMToUtcDate(`${yyyy}-${mm}-${dd}`, scheduledDeparture);
}

// ---------------------------------------------------------------------------
// GET /trips  (static — registered before /:id)
// ---------------------------------------------------------------------------

const VALID_TRIP_STATUSES = [
  'SCHEDULED', 'ARRIVING', 'STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED',
] as const;

tripsRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const statusParam = c.req.query('status');

  if (
    statusParam !== undefined &&
    !VALID_TRIP_STATUSES.includes(statusParam as (typeof VALID_TRIP_STATUSES)[number])
  ) {
    return c.json(
      { success: false, data: null, error: `Invalid status. Must be one of: ${VALID_TRIP_STATUSES.join(', ')}` },
      400,
    );
  }

  const trips = await prisma.trip.findMany({
    where: {
      OR: [{ rider_id: userId }, { owner_id: userId }],
      ...(statusParam ? { status: statusParam as (typeof VALID_TRIP_STATUSES)[number] } : {}),
    },
    orderBy: { scheduled_date: 'asc' },
    include: {
      booking: {
        select: {
          id: true,
          status: true,
          contribution_per_day_paise: true,
          days_confirmed: true,
        },
      },
      contributions: {
        select: {
          id: true,
          amount_paise: true,
          payment_method: true,
          marked_paid_at: true,
          confirmed_by_rider_at: true,
        },
      },
    },
  });

  return c.json({ success: true, data: { trips }, error: null });
});

// ---------------------------------------------------------------------------
// POST /trips/:id/arriving — SCHEDULED -> ARRIVING (owner only)
// ---------------------------------------------------------------------------

tripsRouter.post('/:id/arriving', async (c) => {
  const userId = c.get('userId');
  const tripId = c.req.param('id');

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, owner_id: true, status: true },
  });

  if (!trip) return c.json({ success: false, data: null, error: 'Trip not found' }, 404);
  if (trip.owner_id !== userId)
    return c.json({ success: false, data: null, error: 'Only the owner may update trip status' }, 403);
  if (trip.status !== 'SCHEDULED')
    return c.json(
      { success: false, data: null, error: `Trip is ${trip.status}; expected SCHEDULED to transition to ARRIVING` },
      400,
    );

  const updated = await prisma.trip.update({ where: { id: tripId }, data: { status: 'ARRIVING' } });
  return c.json({ success: true, data: { trip: updated }, error: null });
});

// ---------------------------------------------------------------------------
// POST /trips/:id/start — ARRIVING -> STARTED (owner only)
// Sets actual_departure = now
// ---------------------------------------------------------------------------

tripsRouter.post('/:id/start', async (c) => {
  const userId = c.get('userId');
  const tripId = c.req.param('id');

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, owner_id: true, status: true },
  });

  if (!trip) return c.json({ success: false, data: null, error: 'Trip not found' }, 404);
  if (trip.owner_id !== userId)
    return c.json({ success: false, data: null, error: 'Only the owner may update trip status' }, 403);
  if (trip.status !== 'ARRIVING')
    return c.json(
      { success: false, data: null, error: `Trip is ${trip.status}; expected ARRIVING to transition to STARTED` },
      400,
    );

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { status: 'STARTED', actual_departure: new Date() },
  });
  return c.json({ success: true, data: { trip: updated }, error: null });
});

// ---------------------------------------------------------------------------
// POST /trips/:id/pickup-confirmed — STARTED -> IN_PROGRESS (owner only)
// Sets pickup_confirmed_at = now
// ---------------------------------------------------------------------------

tripsRouter.post('/:id/pickup-confirmed', async (c) => {
  const userId = c.get('userId');
  const tripId = c.req.param('id');

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, owner_id: true, status: true },
  });

  if (!trip) return c.json({ success: false, data: null, error: 'Trip not found' }, 404);
  if (trip.owner_id !== userId)
    return c.json({ success: false, data: null, error: 'Only the owner may update trip status' }, 403);
  if (trip.status !== 'STARTED')
    return c.json(
      { success: false, data: null, error: `Trip is ${trip.status}; expected STARTED to transition to IN_PROGRESS` },
      400,
    );

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { status: 'IN_PROGRESS', pickup_confirmed_at: new Date() },
  });
  return c.json({ success: true, data: { trip: updated }, error: null });
});

// ---------------------------------------------------------------------------
// POST /trips/:id/complete — IN_PROGRESS -> COMPLETED (owner only)
// Sets actual_arrival = now. Auto-creates Contribution (idempotent).
// ---------------------------------------------------------------------------

tripsRouter.post('/:id/complete', async (c) => {
  const userId = c.get('userId');
  const tripId = c.req.param('id');

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      booking: { select: { id: true, contribution_per_day_paise: true } },
    },
  });

  if (!trip) return c.json({ success: false, data: null, error: 'Trip not found' }, 404);
  if (trip.owner_id !== userId)
    return c.json({ success: false, data: null, error: 'Only the owner may update trip status' }, 403);
  if (trip.status !== 'IN_PROGRESS')
    return c.json(
      { success: false, data: null, error: `Trip is ${trip.status}; expected IN_PROGRESS to transition to COMPLETED` },
      400,
    );

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { status: 'COMPLETED', actual_arrival: new Date() },
  });

  // Idempotent guard — only create if no Contribution exists for this trip yet
  const existing = await prisma.contribution.findFirst({
    where: { trip_id: tripId },
    select: { id: true },
  });

  let contribution = null;
  if (!existing) {
    contribution = await prisma.contribution.create({
      data: {
        trip_id: tripId,
        rider_id: trip.rider_id,
        owner_id: trip.owner_id,
        // FROZEN — copied directly from booking, never recomputed
        amount_paise: trip.booking.contribution_per_day_paise,
        // Provisional default; overwritten by rider via /contributions/:id/rider-confirm
        payment_method: 'CASH',
      },
    });
  }

  return c.json({
    success: true,
    data: { trip: updated, contribution: contribution ?? { note: 'already existed' } },
    error: null,
  });
});

// ---------------------------------------------------------------------------
// POST /trips/:id/cancel — rider OR owner may cancel (not COMPLETED/CANCELLED)
// Writes Cancellation row. Strikes/suspensions deferred to Prompt 10.
// ---------------------------------------------------------------------------

const cancelSchema = z.object({
  reasonCode: z.enum(['PENALTY_FREE', 'LATE_CANCEL', 'NO_SHOW', 'FORCE_MAJEURE'], {
    errorMap: () => ({ message: 'reasonCode must be PENALTY_FREE, LATE_CANCEL, NO_SHOW, or FORCE_MAJEURE' }),
  }),
});

tripsRouter.post(
  '/:id/cancel',
  zValidator('json', cancelSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? 'Validation failed' },
        422,
      );
    }
    return undefined;
  }),
  async (c) => {
    const userId = c.get('userId');
    const tripId = c.req.param('id');
    const { reasonCode } = c.req.valid('json');

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        rider_id: true,
        owner_id: true,
        status: true,
        booking_id: true,
        scheduled_date: true,
        scheduled_departure: true,
      },
    });

    if (!trip) return c.json({ success: false, data: null, error: 'Trip not found' }, 404);
    if (trip.rider_id !== userId && trip.owner_id !== userId)
      return c.json({ success: false, data: null, error: 'Forbidden' }, 403);
    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED')
      return c.json({ success: false, data: null, error: `Trip is already ${trip.status}` }, 400);

    // minutesUntil from @commutepool/shared — no inline IST math
    const departureUtc = tripDepartureUtc(trip.scheduled_date, trip.scheduled_departure);
    const minutesBefore = minutesUntil(departureUtc);

    const [updatedTrip, cancellation] = await prisma.$transaction([
      prisma.trip.update({ where: { id: tripId }, data: { status: 'CANCELLED' } }),
      prisma.cancellation.create({
        data: {
          booking_id: trip.booking_id,
          trip_id: tripId,
          cancelled_by_id: userId,
          reason_code: reasonCode,
          minutes_before_departure: minutesBefore,
          penalty_applied: 0,
          dispute_raised: false,
        },
      }),
    ]);

    return c.json({ success: true, data: { trip: updatedTrip, cancellation }, error: null });
  },
);

// ---------------------------------------------------------------------------
// POST /trips/:id/sos — rider OR owner; only when STARTED or IN_PROGRESS
// Steps a/b/c are independent — failure in one logs and continues.
// ---------------------------------------------------------------------------

tripsRouter.post('/:id/sos', async (c) => {
  const userId = c.get('userId');
  const tripId = c.req.param('id');

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      rider: { select: { id: true, phone: true, name: true } },
      owner: { select: { id: true, phone: true, name: true } },
    },
  });

  if (!trip) return c.json({ success: false, data: null, error: 'Trip not found' }, 404);
  if (trip.rider_id !== userId && trip.owner_id !== userId)
    return c.json({ success: false, data: null, error: 'Forbidden' }, 403);
  if (trip.status !== 'STARTED' && trip.status !== 'IN_PROGRESS')
    return c.json(
      { success: false, data: null, error: `SOS can only be triggered when trip is STARTED or IN_PROGRESS (current: ${trip.status})` },
      400,
    );

  const now = new Date();
  const triggeredBy = userId === trip.rider_id ? 'rider' : 'owner';

  // Step a: set sos_triggered_at (idempotent — skip if already set)
  let sosAlreadySet = false;
  if (trip.sos_triggered_at === null) {
    await prisma.trip.update({ where: { id: tripId }, data: { sos_triggered_at: now } });
  } else {
    sosAlreadySet = true;
  }

  const yyyy = trip.scheduled_date.getUTCFullYear();
  const mm = String(trip.scheduled_date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(trip.scheduled_date.getUTCDate()).padStart(2, '0');
  const scheduledDateStr = `${yyyy}-${mm}-${dd}`;

  // Step b: create SupportTicket — failure logged, does not block response
  let ticketId: string | null = null;
  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        raised_by_id: userId,
        trip_id: tripId,
        subject: 'SOS triggered',
        description:
          `SOS triggered on trip ${tripId} by ${triggeredBy} (${userId}). ` +
          `Scheduled: ${scheduledDateStr} ${trip.scheduled_departure} IST. ` +
          `Rider: ${trip.rider.name} (${trip.rider.phone}, id=${trip.rider.id}). ` +
          `Owner: ${trip.owner.name} (${trip.owner.phone}, id=${trip.owner.id}).`,
        status: 'OPEN',
      },
    });
    ticketId = ticket.id;
  } catch (err) {
    console.error(`[SOS] Failed to create support ticket for trip=${tripId}:`, err);
  }

  // Step c: send SMS to admin — failure logged, does not block response
  try {
    await sendSms(
      config.ADMIN_SOS_PHONE,
      `[CommutePool SOS] Trip ${tripId} | Date: ${scheduledDateStr} ${trip.scheduled_departure} IST | ` +
      `Triggered by: ${triggeredBy} | Rider: ${trip.rider.phone} | Owner: ${trip.owner.phone}`,
    );
  } catch (err) {
    console.error(`[SOS] Failed to send SMS for trip=${tripId}:`, err);
  }

  return c.json({
    success: true,
    data: {
      sos_triggered_at: sosAlreadySet ? trip.sos_triggered_at : now,
      already_active: sosAlreadySet,
      ticket_id: ticketId,
    },
    error: null,
  });
});

// ---------------------------------------------------------------------------
// POST /trips/:id/sos-resolve — rider OR owner resolves SOS
// ---------------------------------------------------------------------------

tripsRouter.post('/:id/sos-resolve', async (c) => {
  const userId = c.get('userId');
  const tripId = c.req.param('id');

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, rider_id: true, owner_id: true, sos_triggered_at: true },
  });

  if (!trip) return c.json({ success: false, data: null, error: 'Trip not found' }, 404);
  if (trip.rider_id !== userId && trip.owner_id !== userId)
    return c.json({ success: false, data: null, error: 'Forbidden' }, 403);
  if (trip.sos_triggered_at === null)
    return c.json({ success: false, data: null, error: 'No active SOS to resolve on this trip' }, 400);

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { sos_resolved_at: new Date() },
  });
  return c.json({ success: true, data: { trip: updated }, error: null });
});

// ---------------------------------------------------------------------------
// GET /trips/:id — single trip with booking + contributions (rider or owner only)
// Registered LAST so all static sub-paths above match first.
// ---------------------------------------------------------------------------

tripsRouter.get('/:id', async (c) => {
  const userId = c.get('userId');
  const tripId = c.req.param('id');

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      booking: {
        select: {
          id: true,
          status: true,
          contribution_per_day_paise: true,
          days_confirmed: true,
          rider_id: true,
          owner_id: true,
        },
      },
      contributions: {
        select: {
          id: true,
          amount_paise: true,
          payment_method: true,
          marked_paid_at: true,
          confirmed_by_rider_at: true,
        },
      },
    },
  });

  if (!trip) return c.json({ success: false, data: null, error: 'Trip not found' }, 404);
  if (trip.rider_id !== userId && trip.owner_id !== userId)
    return c.json({ success: false, data: null, error: 'Forbidden' }, 403);

  return c.json({ success: true, data: { trip }, error: null });
});
