import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { searchPlaces } from '../services/places.js';

export const placesRouter = new Hono();

placesRouter.use('*', requireAuth);

placesRouter.get('/search', async (c) => {
  const q = c.req.query('q');

  if (!q || q.trim() === '') {
    return c.json(
      { success: false, data: null, error: 'q query param is required' },
      400,
    );
  }

  const places = await searchPlaces(q.trim());

  return c.json({
    success: true,
    data: { places },
    error: null,
  });
});
