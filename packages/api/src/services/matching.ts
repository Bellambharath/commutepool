import { prisma } from '../lib/prisma.js';

// ---------------------------------------------------------------------------
// Types for raw SQL candidate rows
// ---------------------------------------------------------------------------

interface CandidateRow {
  offer_id: string;
  request_id: string;
  owner_id: string;
  rider_id: string;
  distance_meters: number;
  mileage_override_kmpl: number | null;
  bike_model: string | null;
  pickup_walk_meters: number;
  dropoff_walk_meters: number;
  pickup_point_lng: number;
  pickup_point_lat: number;
  dropoff_point_lng: number;
  dropoff_point_lat: number;
  route_usage_pct: number;
}

// ---------------------------------------------------------------------------
// Scope types — nightly batch runs over a full week+period;
// on-demand runs scoped to a single offer or request.
// ---------------------------------------------------------------------------

export type MatcherScope =
  | { type: 'batch'; weekStartDate: Date; period: 'MORNING' | 'EVENING' }
  | { type: 'offer'; offerId: string }
  | { type: 'request'; requestId: string };

// ---------------------------------------------------------------------------
// clamp helper
// ---------------------------------------------------------------------------

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

// ---------------------------------------------------------------------------
// runMatcher
// ---------------------------------------------------------------------------

export async function runMatcher(scope: MatcherScope): Promise<void> {
  // 1. Fetch latest Hyderabad fuel price ONCE per run.
  const fuelPriceRow = await prisma.adminFuelPrice.findFirst({
    where: { city: 'Hyderabad' },
    orderBy: { effective_from: 'desc' },
    select: { price_paise_per_litre: true },
  });

  if (!fuelPriceRow) {
    console.warn('[Matcher] No fuel price found for Hyderabad — aborting run.');
    return;
  }

  const pricePaisePerLitre: number = fuelPriceRow.price_paise_per_litre;

  // 2. Build the scope-specific WHERE fragment and parameters.
  //    The main candidate query always joins offers × requests × commute_routes
  //    × bike_owner_profiles. The scope clause is appended as an extra filter.
  let scopeClause: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scopeParams: any[] = [];

  if (scope.type === 'batch') {
    scopeClause = `wo.week_start_date = $1 AND wo.period = $2::"CommutePeriod"`;
    scopeParams.push(scope.weekStartDate, scope.period);
  } else if (scope.type === 'offer') {
    scopeClause = `wo.id = $1`;
    scopeParams.push(scope.offerId);
  } else {
    // request
    scopeClause = `wr.id = $1`;
    scopeParams.push(scope.requestId);
  }

  // 3. Execute candidate query.
  //    All ST_DWithin calls use ::geography so the distance threshold is in METRES.
  //    ST_Distance with ::geography also returns metres.
  //    ST_ClosestPoint operates on geometry (degrees) then we extract coords.
  //    ST_LineLocatePoint operates on geometry — returns 0..1 fraction.
  const candidates = (await prisma.$queryRawUnsafe(
    `
    SELECT
      wo.id                                                           AS offer_id,
      wr.id                                                           AS request_id,
      wo.owner_id                                                     AS owner_id,
      wr.rider_id                                                     AS rider_id,
      cr.distance_meters                                              AS distance_meters,
      bop.mileage_override_kmpl                                       AS mileage_override_kmpl,
      bop.bike_model                                                  AS bike_model,
      ROUND(ST_Distance(
        cr.route_geometry::geography,
        wr.pickup_geometry::geography
      ))::int                                                         AS pickup_walk_meters,
      ROUND(ST_Distance(
        cr.route_geometry::geography,
        wr.dropoff_geometry::geography
      ))::int                                                         AS dropoff_walk_meters,
      ST_X(ST_ClosestPoint(cr.route_geometry, wr.pickup_geometry))    AS pickup_point_lng,
      ST_Y(ST_ClosestPoint(cr.route_geometry, wr.pickup_geometry))    AS pickup_point_lat,
      ST_X(ST_ClosestPoint(cr.route_geometry, wr.dropoff_geometry))   AS dropoff_point_lng,
      ST_Y(ST_ClosestPoint(cr.route_geometry, wr.dropoff_geometry))   AS dropoff_point_lat,
      ROUND(
        (
          ST_LineLocatePoint(cr.route_geometry, wr.dropoff_geometry)
          - ST_LineLocatePoint(cr.route_geometry, wr.pickup_geometry)
        ) * 100
      )::int                                                          AS route_usage_pct
    FROM weekly_offers   wo
    JOIN commute_routes  cr  ON cr.id = wo.route_id
    JOIN weekly_requests wr  ON TRUE
    JOIN bike_owner_profiles bop ON bop.user_id = wo.owner_id
    WHERE
      ${scopeClause}
      AND wo.period            = wr.period
      AND wo.week_start_date   = wr.week_start_date
      AND wo.is_active         = TRUE
      AND wr.deleted_at        IS NULL
      AND wr.status            = 'OPEN'
      AND wo.days_available    && wr.days_needed
      AND wo.departure_window_start <= wr.departure_window_end
      AND wr.departure_window_start <= wo.departure_window_end
      AND ST_DWithin(
            cr.route_geometry::geography,
            wr.pickup_geometry::geography,
            500
          )
      AND ST_DWithin(
            cr.route_geometry::geography,
            wr.dropoff_geometry::geography,
            500
          )
      AND ST_LineLocatePoint(cr.route_geometry, wr.pickup_geometry)
            < ST_LineLocatePoint(cr.route_geometry, wr.dropoff_geometry)
    `,
   ...scopeParams,
  )) as CandidateRow[];

  if (candidates.length === 0) {
    console.log(`[Matcher] No candidates found for scope: ${JSON.stringify(scope)}`);
    return;
  }

  console.log(`[Matcher] ${candidates.length} candidate pair(s) found for scope: ${JSON.stringify(scope)}`);

  // 4. Process each candidate pair.
  for (const row of candidates) {
    // 4a. Skip if a Match already exists for this (offer_id, request_id) pair.
    const existing = await prisma.match.findFirst({
      where: { offer_id: row.offer_id, request_id: row.request_id },
      select: { id: true },
    });
    if (existing) {
      continue;
    }

    // 4b. Resolve mileage: owner override takes precedence; fallback to admin table.
    let mileageKmpl: number | null = row.mileage_override_kmpl;

    if (mileageKmpl === null && row.bike_model !== null) {
      const adminMileage = await prisma.adminBikeMileage.findUnique({
        where: { bike_model: row.bike_model },
        select: { real_world_kmpl: true },
      });
      mileageKmpl = adminMileage?.real_world_kmpl ?? null;
    }

    if (mileageKmpl === null) {
      console.warn(
        `[Matcher] Cannot resolve mileage for offer=${row.offer_id} request=${row.request_id} ` +
          `bike_model=${String(row.bike_model)} — skipping pair.`,
      );
      continue;
    }

    // 4c. Pricing — float chain, Math.round once per output field.
    const routeUsagePct = row.route_usage_pct;
    const distanceKm = row.distance_meters / 1000;

    const costPerKm = pricePaisePerLitre / mileageKmpl;
    const fullCost = distanceKm * costPerKm;
    const base = fullCost / 2;
    const rawTotal = routeUsagePct >= 70 ? base : base * (routeUsagePct / 100);

    const baseContributionPaise = Math.round(base);
    const totalContributionPaise = Math.max(Math.round(rawTotal), 2500);

    // Detour is 0 for v1 — detour pickup is not yet computed server-side.
    const detourDistanceMeters = 0;
    const detourCostPaise = 0;

    const isPartialRoute = routeUsagePct < 100;

    // Compatibility score: penalise walk distance; clamp 0-100.
    const totalWalkKm = (row.pickup_walk_meters + row.dropoff_walk_meters) / 1000;
    const compatibilityScore = clamp(0, 100, Math.round(100 - 40 * totalWalkKm));

    // 4d. Insert Match row.
    try {
      await prisma.match.create({
        data: {
          offer_id: row.offer_id,
          request_id: row.request_id,
          compatibility_score: compatibilityScore,
          detour_distance_meters: detourDistanceMeters,
          detour_cost_paise: detourCostPaise,
          base_contribution_paise: baseContributionPaise,
          total_contribution_paise: totalContributionPaise,
          pickup_point_lat: row.pickup_point_lat,
          pickup_point_lng: row.pickup_point_lng,
          pickup_walk_meters: row.pickup_walk_meters,
          dropoff_point_lat: row.dropoff_point_lat,
          dropoff_point_lng: row.dropoff_point_lng,
          dropoff_walk_meters: row.dropoff_walk_meters,
          is_partial_route: isPartialRoute,
          route_usage_percentage: routeUsagePct,
        },
      });
      console.log(
        `[Matcher] Created match offer=${row.offer_id} request=${row.request_id} ` +
          `score=${compatibilityScore} total_paise=${totalContributionPaise}`,
      );
    } catch (err: unknown) {
      // P2002 = unique constraint violation — pair was already inserted by a
      // concurrent run; safe to ignore.
      if ((err as { code?: string }).code === 'P2002') {
        continue;
      }
      throw err;
    }
  }
}
