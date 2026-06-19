import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import cron from 'node-cron';
import { config } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { routesRouter } from './routes/routes.js';
import { offersRouter } from './routes/offers.js';
import { requestsRouter } from './routes/requests.js';
import { bookingsRouter } from './routes/bookings.js';
import { tripsRouter } from './routes/trips.js';
import { contributionsRouter } from './routes/contributions.js';
import { runMatcher } from './services/matching.js';
import { getWeekStartMonday } from '@commutepool/shared';

// Config is validated at import time — will throw and halt boot if vars are missing
const app = new Hono();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use('*', logger());
app.use(
  '*',
  cors({
    origin:
      config.NODE_ENV === 'production'
        ? ['https://app.commutepool.pghive.in']
        : ['http://localhost:3001', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (c) =>
  c.json({ success: true, data: { status: 'ok' }, error: null }),
);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.route('/auth', authRouter);
app.route('/users', usersRouter);
app.route('/routes', routesRouter);
app.route('/offers', offersRouter);
app.route('/requests', requestsRouter);
app.route('/bookings', bookingsRouter);
app.route('/trips', tripsRouter);
app.route('/contributions', contributionsRouter);

// ---------------------------------------------------------------------------
// 404 fallback
// ---------------------------------------------------------------------------
app.notFound((c) =>
  c.json({ success: false, data: null, error: 'Route not found' }, 404),
);

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------
app.onError((err, c) => {
  console.error('[CommutePool] Unhandled error:', err);
  return c.json(
    { success: false, data: null, error: 'Internal server error' },
    500,
  );
});

// ---------------------------------------------------------------------------
// Nightly matching batch — 22:00 IST every day
// node-cron handles the Asia/Kolkata timezone; no manual UTC offset arithmetic.
// ---------------------------------------------------------------------------
cron.schedule(
  '0 22 * * *',
  () => {
    const now = new Date();
    const weekStrs = Array.from(
      new Set([
        getWeekStartMonday(now),
        getWeekStartMonday(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
      ]),
    );
    for (const ws of weekStrs) {
      const weekStart = new Date(ws + 'T00:00:00Z');
      console.log(`[Cron] Nightly matcher starting — week=${ws}`);
      for (const period of ['MORNING', 'EVENING'] as const) {
        runMatcher({ type: 'batch', weekStartDate: weekStart, period }).catch(
          (err: unknown) => {
            console.error(`[Cron] Matcher failed week=${ws} period=${period}:`, err);
          },
        );
      }
    }
  },
  { timezone: 'Asia/Kolkata' },
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
serve(
  {
    fetch: app.fetch,
    port: config.PORT,
  },
  (info) => {
    console.log(`[CommutePool API] Running on http://localhost:${info.port} (${config.NODE_ENV})`);
  },
);

export default app;
