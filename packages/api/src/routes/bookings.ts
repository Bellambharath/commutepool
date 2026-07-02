import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { istHHMMToUtcDate, minutesUntil } from '@commutepool/shared';

export const bookingsRouter = new Hono();

bookingsRouter.use('*', requireAuth);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Given a week_start_date (Monday) and a day-of-week integer (0=Sun…6=Sat),
 * return the ISO YYYY-MM-DD string for the calendar date of that day within
 * that week.
 *
 * CommutePool convention: days[] uses 0=Sunday…6=Saturday and
 * week_start_date is always Monday (day=1). So:
 *   Monday   (1) → +0 days
 *   Tuesday  (2) → +1 day
 *   …
 *   Sunday   (0) → +6 days
 */
function weekDayToISODate(weekStartDate: Date, dayOfWeek: number): string {
  // days_available: 0=Sun,1=Mon,…,6=Sat
  // week_start_date is Monday (dayOfWeek=1)
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const ms = weekStartDate.getTime() + offset * 24 * 60 * 60 * 1000;
  const d = new Date(ms);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// POST /bookings — rider creates booking for a match
// ---------------------------------------------------------------------------

const createBookingSchema = z.object({
  matchId: z.string().uuid('matchId must be a valid UUID'),
  daysConfirmed: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'daysConfirmed must contain at least one day'),
});

bookingsRouter.post(
  '/',
  zValidator('json', createBookingSchema, (result, c) => {
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
    const body = c.req.valid('json');

    // 1. Resolve match with offer + request
    const match = await prisma.match.findUnique({
      where: { id: body.matchId },
      include: {
        offer: {
          select: {
            id: true,
            owner_id: true,
            week_start_date: true,
            days_available: true,
            departure_window_start: true,
            departure_window_end: true,
            period: true,
          },
        },
        request: {
          select: {
            id: true,
            rider_id: true,
            days_needed: true,
          },
        },
      },
    });

    if (!match) {
      return c.json({ success: false, data: null, error: 'Match not found' }, 404);
    }

    // RULE 1: only the rider on the match's weekly_request can create a booking
    if (match.request.rider_id !== userId) {
      return c.json(
        { success: false, data: null, error: 'Only the rider for this match may create a booking' },
        403,
      );
    }

    // RULE 2: one ACTIVE (PENDING/ACCEPTED) booking per match_id — declined/expired/cancelled bookings do not block retry
    const existing = await prisma.booking.findFirst({
      where: { match_id: body.matchId, status: { in: ['PENDING', 'ACCEPTED'] } },
      select: { id: true },
    });
    if (existing) {
      return c.json(
        { success: false, data: null, error: 'A pending or accepted booking already exists for this match' },
        409,
      );
    }

    // RULE 3: daysConfirmed must be a non-empty subset of the intersection of
    //         days_available ∩ days_needed
    const intersection = match.offer.days_available.filter((d: number) =>
      match.request.days_needed.includes(d),
    );
    const invalidDays = body.daysConfirmed.filter((d: number) => !intersection.includes(d));
    if (invalidDays.length > 0) {
      return c.json(
        {
          success: false,
          data: null,
          error: `Days ${invalidDays.join(', ')} are not in the offer/request intersection (${intersection.join(', ')})`,
        },
        400,
      );
    }

    // RULE 4: contribution_per_day_paise = match.total_contribution_paise (frozen)
    const contribution_per_day_paise = match.total_contribution_paise;

    // RULE 5: expires_at = min(now+3h, departureTime - 45min)
    //   departureTime derived from offer.departure_window_start on the earliest
    //   confirmed day in the offer's week.
    const now = new Date();
    const sortedDays = [...body.daysConfirmed].sort((a, b) => {
      // sort by calendar offset so earliest date first
      const offsetA = a === 0 ? 6 : a - 1;
      const offsetB = b === 0 ? 6 : b - 1;
      return offsetA - offsetB;
    });
    const earliestDay = sortedDays[0]!;
    const earliestDateISO = weekDayToISODate(match.offer.week_start_date, earliestDay);
    const departureUtc = istHHMMToUtcDate(earliestDateISO, match.offer.departure_window_start);
    const cutoffUtc = new Date(departureUtc.getTime() - 45 * 60 * 1000);
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const expires_at = cutoffUtc < threeHoursLater ? cutoffUtc : threeHoursLater;

    const booking = await prisma.booking.create({
      data: {
        match_id: body.matchId,
        rider_id: userId,
        owner_id: match.offer.owner_id,
        status: 'PENDING',
        days_confirmed: body.daysConfirmed,
        contribution_per_day_paise,
        request_sent_at: now,
        expires_at,
      },
    });

    return c.json({ success: true, data: { booking }, error: null }, 201);
  },
);

// ---------------------------------------------------------------------------
// GET /bookings — list bookings where caller is rider OR owner
// ---------------------------------------------------------------------------

bookingsRouter.get('/', async (c) => {
  const userId = c.get('userId');

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [{ rider_id: userId }, { owner_id: userId }],
    },
    orderBy: { created_at: 'desc' },
    include: {
      match: {
        select: {
          id: true,
          compatibility_score: true,
          total_contribution_paise: true,
          base_contribution_paise: true,
          pickup_point_lat: true,
          pickup_point_lng: true,
          pickup_walk_meters: true,
          dropoff_point_lat: true,
          dropoff_point_lng: true,
          dropoff_walk_meters: true,
          is_partial_route: true,
          route_usage_percentage: true,
        },
      },
      trips: {
        select: {
          id: true,
          scheduled_date: true,
          scheduled_departure: true,
          period: true,
          status: true,
        },
        orderBy: { scheduled_date: 'asc' },
      },
    },
  });

  return c.json({ success: true, data: { bookings }, error: null });
});

// ---------------------------------------------------------------------------
// GET /bookings/:id — single booking (only rider or owner)
// NOTE: static routes above must come before parameterised routes.
//       /bookings, then /bookings/:id/accept, /bookings/:id/reject, /bookings/:id
//       are registered in this order below — Hono matches in registration order.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// POST /bookings/:id/accept — owner accepts; creates Trip rows per day
// ---------------------------------------------------------------------------

bookingsRouter.post('/:id/accept', async (c) => {
  const userId = c.get('userId');
  const bookingId = c.req.param('id');

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      match: {
        include: {
          offer: {
            select: {
              id: true,
              owner_id: true,
              week_start_date: true,
              departure_window_start: true,
              period: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    return c.json({ success: false, data: null, error: 'Booking not found' }, 404);
  }

  // RULE 7: only the offer owner may accept
  if (booking.owner_id !== userId) {
    return c.json(
      { success: false, data: null, error: 'Only the ride owner may accept a booking' },
      403,
    );
  }

  // RULE 7: booking must be PENDING
  if (booking.status !== 'PENDING') {
    return c.json(
      { success: false, data: null, error: `Booking is ${booking.status}, not PENDING` },
      400,
    );
  }

  // RULE 6: cannot accept within 30 minutes of departure_window_start on earliest confirmed day
  const now = new Date();
  const sortedDays = [...booking.days_confirmed].sort((a, b) => {
    const offsetA = a === 0 ? 6 : a - 1;
    const offsetB = b === 0 ? 6 : b - 1;
    return offsetA - offsetB;
  });
  const earliestDay = sortedDays[0]!;
  const earliestDateISO = weekDayToISODate(
    booking.match.offer.week_start_date,
    earliestDay,
  );
  const departureUtc = istHHMMToUtcDate(
    earliestDateISO,
    booking.match.offer.departure_window_start,
  );
  const minsUntilDeparture = minutesUntil(departureUtc, now);
  if (minsUntilDeparture < 30) {
    return c.json(
      {
        success: false,
        data: null,
        error: `Cannot accept: departure is in ${minsUntilDeparture} minutes (cutoff is 30 minutes before departure)`,
      },
      400,
    );
  }

// RULE 8: update booking status first
  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'ACCEPTED',
      responded_at: now,
    },
  });

  // Close the request now that it has an accepted booking. This prevents the
  // matcher (matching.ts, which filters wr.status = 'OPEN') from creating any
  // further matches against this request, and stops a second rider from being
  // able to book the same commute slot via a different match.
  await prisma.weeklyRequest.update({
    where: { id: booking.match.request_id },
    data: { status: 'MATCHED' },
  });

  // RULE 8: create one Trip per confirmed day
  //   Catch P2002 (trips_owner_slot_unique) per trip individually — do not
  //   roll back trips that already succeeded.
  const createdTrips: string[] = [];
  const conflicts: string[] = [];

  for (const dayOfWeek of booking.days_confirmed) {
    const dateISO = weekDayToISODate(booking.match.offer.week_start_date, dayOfWeek);
    try {
      const trip = await prisma.trip.create({
        data: {
          booking_id: bookingId,
          rider_id: booking.rider_id,
          owner_id: booking.owner_id,
          scheduled_date: new Date(dateISO + 'T00:00:00Z'),
          scheduled_departure: booking.match.offer.departure_window_start,
          period: booking.match.offer.period,
          status: 'SCHEDULED',
        },
      });
      createdTrips.push(trip.id);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'P2002') {
        // Slot conflict on this specific date — record it, continue with others
        conflicts.push(dateISO);
      } else {
        throw err;
      }
    }
  }

  return c.json(
    {
      success: true,
      data: {
        booking: updatedBooking,
        trips_created: createdTrips.length,
        ...(conflicts.length > 0 ? { conflicts } : {}),
      },
      error: null,
    },
    200,
  );
});

// ---------------------------------------------------------------------------
// POST /bookings/:id/reject — owner declines (sets status=DECLINED)
// ---------------------------------------------------------------------------

bookingsRouter.post('/:id/reject', async (c) => {
  const userId = c.get('userId');
  const bookingId = c.req.param('id');

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, owner_id: true, status: true },
  });

  if (!booking) {
    return c.json({ success: false, data: null, error: 'Booking not found' }, 404);
  }

  // RULE 7: only the offer owner may decline
  if (booking.owner_id !== userId) {
    return c.json(
      { success: false, data: null, error: 'Only the ride owner may decline a booking' },
      403,
    );
  }

  // RULE 7: booking must be PENDING
  if (booking.status !== 'PENDING') {
    return c.json(
      { success: false, data: null, error: `Booking is ${booking.status}, not PENDING` },
      400,
    );
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'DECLINED',
      responded_at: new Date(),
    },
  });

  return c.json({ success: true, data: { booking: updatedBooking }, error: null });
});

// ---------------------------------------------------------------------------
// GET /bookings/:id — single booking with match + trip details
// Registered LAST so static sub-paths /:id/accept and /:id/reject match first.
// ---------------------------------------------------------------------------

bookingsRouter.get('/:id', async (c) => {
  const userId = c.get('userId');
  const bookingId = c.req.param('id');

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      match: {
        select: {
          id: true,
          offer_id: true,
          request_id: true,
          compatibility_score: true,
          total_contribution_paise: true,
          base_contribution_paise: true,
          detour_distance_meters: true,
          detour_cost_paise: true,
          pickup_point_lat: true,
          pickup_point_lng: true,
          pickup_walk_meters: true,
          dropoff_point_lat: true,
          dropoff_point_lng: true,
          dropoff_walk_meters: true,
          is_partial_route: true,
          route_usage_percentage: true,
        },
      },
      trips: {
        select: {
          id: true,
          scheduled_date: true,
          scheduled_departure: true,
          period: true,
          status: true,
          actual_departure: true,
          actual_arrival: true,
        },
        orderBy: { scheduled_date: 'asc' },
      },
    },
  });

  if (!booking) {
    return c.json({ success: false, data: null, error: 'Booking not found' }, 404);
  }

  // Only the rider or owner may view
  if (booking.rider_id !== userId && booking.owner_id !== userId) {
    return c.json(
      { success: false, data: null, error: 'Forbidden' },
      403,
    );
  }

  return c.json({ success: true, data: { booking }, error: null });
});
