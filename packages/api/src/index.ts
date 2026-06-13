import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from './config/env.js';
import { authRouter } from './routes/auth.js';

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
