import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

export const contributionsRouter = new Hono();

contributionsRouter.use('*', requireAuth);

// ---------------------------------------------------------------------------
// GET /contributions  (static — registered before /:id)
// List contributions where caller is rider OR owner.
// ---------------------------------------------------------------------------

contributionsRouter.get('/', async (c) => {
  const userId = c.get('userId');

  const contributions = await prisma.contribution.findMany({
    where: { OR: [{ rider_id: userId }, { owner_id: userId }] },
    orderBy: { created_at: 'desc' },
    include: {
      trip: {
        select: {
          id: true,
          scheduled_date: true,
          scheduled_departure: true,
          period: true,
          status: true,
        },
      },
    },
  });

  return c.json({ success: true, data: { contributions }, error: null });
});

// ---------------------------------------------------------------------------
// POST /contributions/:id/rider-confirm — rider sets payment method + confirms
// Registered before GET /:id so the static sub-path wins.
// ---------------------------------------------------------------------------

const riderConfirmSchema = z.object({
  paymentMethod: z.enum(['CASH', 'UPI'], {
    errorMap: () => ({ message: 'paymentMethod must be CASH or UPI' }),
  }),
});

contributionsRouter.post(
  '/:id/rider-confirm',
  zValidator('json', riderConfirmSchema, (result, c) => {
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
    const contributionId = c.req.param('id');
    const { paymentMethod } = c.req.valid('json');

    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      select: { id: true, rider_id: true, confirmed_by_rider_at: true },
    });

    if (!contribution)
      return c.json({ success: false, data: null, error: 'Contribution not found' }, 404);
    if (contribution.rider_id !== userId)
      return c.json({ success: false, data: null, error: 'Only the rider may confirm payment method' }, 403);

    const updated = await prisma.contribution.update({
      where: { id: contributionId },
      data: { payment_method: paymentMethod, confirmed_by_rider_at: new Date() },
    });

    return c.json({ success: true, data: { contribution: updated }, error: null });
  },
);

// ---------------------------------------------------------------------------
// POST /contributions/:id/owner-confirm — owner marks payment received
// Requires rider to have confirmed first.
// ---------------------------------------------------------------------------

contributionsRouter.post('/:id/owner-confirm', async (c) => {
  const userId = c.get('userId');
  const contributionId = c.req.param('id');

  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    select: { id: true, owner_id: true, confirmed_by_rider_at: true, marked_paid_at: true },
  });

  if (!contribution)
    return c.json({ success: false, data: null, error: 'Contribution not found' }, 404);
  if (contribution.owner_id !== userId)
    return c.json({ success: false, data: null, error: 'Only the owner may confirm receipt of payment' }, 403);
  if (contribution.confirmed_by_rider_at === null)
    return c.json({ success: false, data: null, error: 'Rider has not confirmed payment yet' }, 400);

  const updated = await prisma.contribution.update({
    where: { id: contributionId },
    data: { marked_paid_at: new Date() },
  });

  return c.json({ success: true, data: { contribution: updated }, error: null });
});

// ---------------------------------------------------------------------------
// GET /contributions/:id — single contribution (rider or owner only)
// Registered LAST so static sub-paths above match first.
// ---------------------------------------------------------------------------

contributionsRouter.get('/:id', async (c) => {
  const userId = c.get('userId');
  const contributionId = c.req.param('id');

  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    include: {
      trip: {
        select: {
          id: true,
          scheduled_date: true,
          scheduled_departure: true,
          period: true,
          status: true,
        },
      },
    },
  });

  if (!contribution)
    return c.json({ success: false, data: null, error: 'Contribution not found' }, 404);
  if (contribution.rider_id !== userId && contribution.owner_id !== userId)
    return c.json({ success: false, data: null, error: 'Forbidden' }, 403);

  return c.json({ success: true, data: { contribution }, error: null });
});
