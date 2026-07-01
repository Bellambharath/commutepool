import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

export const matchesRouter = new Hono();

matchesRouter.use('*', requireAuth);

matchesRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const weekParam = c.req.query('week');

  const userFilter = {
    OR: [
      { offer: { owner_id: userId } },
      { request: { rider_id: userId } },
    ],
  };

  const matches = await prisma.match.findMany({
    where: weekParam
      ? { AND: [userFilter, { offer: { week_start_date: new Date(weekParam) } }] }
      : userFilter,
    include: {
      offer: {
        select: {
          id: true,
          owner_id: true,
          period: true,
          days_available: true,
          departure_window_start: true,
          departure_window_end: true,
          week_start_date: true,
          route: {
            select: {
              source_address: true,
              destination_address: true,
              distance_meters: true,
            },
          },
        },
      },
      request: {
        select: {
          id: true,
          days_needed: true,
          pickup_address: true,
          dropoff_address: true,
          week_start_date: true,
        },
      },
      bookings: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return c.json({ success: true, data: { matches }, error: null });
});
