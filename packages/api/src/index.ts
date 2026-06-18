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
import { runMatcher } from './services/matching.js';
import { getCurrentISTWeekStartDate } from '@commutepool/shared';

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
        ? ['https://commutepool.in', 'https://www.commutepool.in']
        : '*',
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
    const weekStart = getCurrentISTWeekStartDate();
    console.log(`[Cron] Nightly matcher starting — week=${weekStart.toISOString()}`);
    for (const period of ['MORNING', 'EVENING'] as const) {
      runMatcher({ type: 'batch', weekStartDate: weekStart, period }).catch(
        (err: unknown) => {
          console.error(`[Cron] Matcher failed for period=${period}:`, err);
        },
      );
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
