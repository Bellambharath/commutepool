import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { polylineToWkt } from '../utils/polyline.js';
import { getRoutes, geocodeAddress } from '../services/maps.js';

export const routesRouter = new Hono();

routesRouter.use('*', requireAuth);

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createRouteSchema = z.object({
  period: z.enum(['MORNING', 'EVENING'], {
    errorMap: () => ({ message: 'period must be MORNING or EVENING' }),
  }),
  sourcePlaceId: z.string().min(1, 'sourcePlaceId is required'),
  sourceLat: z.number({ required_error: 'sourceLat is required' }),
  sourceLng: z.number({ required_error: 'sourceLng is required' }),
  sourceAddress: z.string().min(1, 'sourceAddress is required'),
  destinationPlaceId: z.string().min(1, 'destinationPlaceId is required'),
  destinationLat: z.number({ required_error: 'destinationLat is required' }),
  destinationLng: z.number({ required_error: 'destinationLng is required' }),
  destinationAddress: z.string().min(1, 'destinationAddress is required'),
  encodedPolyline: z.string().min(1, 'encodedPolyline is required'),
  distanceMeters: z
    .number()
    .int('distanceMeters must be an integer')
    .positive('distanceMeters must be positive'),
  durationSeconds: z
    .number()
    .int('durationSeconds must be an integer')
    .positive('durationSeconds must be positive'),
  routeLabel: z.string().max(200).optional(),
  isPrimary: z.boolean({ required_error: 'isPrimary is required' }),
});

// ---------------------------------------------------------------------------
// POST /routes — save a commute route chosen by the user
// ---------------------------------------------------------------------------
routesRouter.post(
  '/',
  zValidator('json', createRouteSchema),
  async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');

    // If this route is being set as primary, demote all existing primary routes
    // for this user + period BEFORE creating the new one.
    if (body.isPrimary) {
      await prisma.commuteRoute.updateMany({
        where: {
          user_id: userId,
          period: body.period,
          is_primary: true,
          is_active: true,
        },
        data: { is_primary: false },
      });
    }

    const route = await prisma.commuteRoute.create({
      data: {
        user_id: userId,
        period: body.period,
        encoded_polyline: body.encodedPolyline,
        distance_meters: body.distanceMeters,
        duration_seconds: body.durationSeconds,
        route_label: body.routeLabel ?? null,
        is_primary: body.isPrimary,
        source_place_id: body.sourcePlaceId,
        source_lat: body.sourceLat,
        source_lng: body.sourceLng,
        source_address: body.sourceAddress,
        destination_place_id: body.destinationPlaceId,
        destination_lat: body.destinationLat,
        destination_lng: body.destinationLng,
        destination_address: body.destinationAddress,
        is_active: true,
      },
    });

    // Populate PostGIS route_geometry via raw SQL immediately after create.
    // prisma.$executeRaw does not know the geometry column — this is intentional.
    const wkt = polylineToWkt(body.encodedPolyline);
    await prisma.$executeRaw`
      UPDATE "commute_routes"
      SET route_geometry = ST_SetSRID(ST_GeomFromText(${wkt}), 4326)
      WHERE id = ${route.id}
    `;

    return c.json(
      {
        success: true,
        data: { route },
        error: null,
      },
      201,
    );
  },
);

// ---------------------------------------------------------------------------
// GET /routes — list active commute routes for the authenticated user
// ---------------------------------------------------------------------------
routesRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const periodParam = c.req.query('period');

  const periodFilter =
    periodParam === 'MORNING' || periodParam === 'EVENING'
      ? periodParam
      : undefined;

  const userRoutes = await prisma.commuteRoute.findMany({
    where: {
      user_id: userId,
      is_active: true,
      ...(periodFilter ? { period: periodFilter } : {}),
    },
    orderBy: [
      { is_primary: 'desc' },
      { created_at: 'desc' },
    ],
  });

  return c.json({
    success: true,
    data: { routes: userRoutes },
    error: null,
  });
});

// ---------------------------------------------------------------------------
// DELETE /routes/:id — soft delete (is_active = false)
// ---------------------------------------------------------------------------
routesRouter.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const routeId = c.req.param('id');

  const existing = await prisma.commuteRoute.findFirst({
    where: { id: routeId, user_id: userId, is_active: true },
    select: { id: true },
  });

  if (!existing) {
    return c.json(
      { success: false, data: null, error: 'Route not found or already deleted' },
      404,
    );
  }

  await prisma.commuteRoute.update({
    where: { id: routeId },
    data: { is_active: false },
  });

  return c.json({ success: true, data: null, error: null });
});

// ---------------------------------------------------------------------------
// GET /routes/google — fetch route options from Google before saving
// ---------------------------------------------------------------------------
routesRouter.get('/google', async (c) => {
  const originPlaceId = c.req.query('originPlaceId');
  const destinationPlaceId = c.req.query('destinationPlaceId');

  if (!originPlaceId || !destinationPlaceId) {
    return c.json(
      {
        success: false,
        data: null,
        error: 'originPlaceId and destinationPlaceId query params are required',
      },
      400,
    );
  }

  const [originLatLng, destinationLatLng] = await Promise.all([
    geocodeAddress(originPlaceId),
    geocodeAddress(destinationPlaceId),
  ]);

  if (!originLatLng) {
    return c.json(
      { success: false, data: null, error: 'Could not geocode originPlaceId' },
      422,
    );
  }
  if (!destinationLatLng) {
    return c.json(
      { success: false, data: null, error: 'Could not geocode destinationPlaceId' },
      422,
    );
  }

  const routeOptions = await getRoutes(originLatLng, destinationLatLng);

  return c.json({
    success: true,
    data: { routes: routeOptions },
    error: null,
  });
});
