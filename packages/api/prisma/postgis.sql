-- CommutePool — PostGIS setup
-- Run AFTER prisma migrate dev. Idempotent.
-- Usage: psql $DATABASE_URL -f packages/api/prisma/postgis.sql

CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- Geometry columns
-- ============================================================

-- route_geometry is populated by APPLICATION CODE (not a trigger).
-- Workflow: decode Google encoded polyline in TypeScript → build
-- LINESTRING WKT → raw SQL UPDATE inside the same transaction as
-- the route INSERT/UPDATE.
ALTER TABLE "commute_routes"  ADD COLUMN IF NOT EXISTS "route_geometry"   geometry(LINESTRING, 4326);

-- pickup_geometry and dropoff_geometry are populated by the
-- DB trigger wr_set_geometry defined below. App code never writes them.
ALTER TABLE "weekly_requests" ADD COLUMN IF NOT EXISTS "pickup_geometry"  geometry(POINT, 4326);
ALTER TABLE "weekly_requests" ADD COLUMN IF NOT EXISTS "dropoff_geometry" geometry(POINT, 4326);

-- ============================================================
-- Spatial indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS "commute_routes_route_geometry_gist_idx"
  ON "commute_routes"  USING GIST("route_geometry");

CREATE INDEX IF NOT EXISTS "weekly_requests_pickup_geometry_gist_idx"
  ON "weekly_requests" USING GIST("pickup_geometry");

CREATE INDEX IF NOT EXISTS "weekly_requests_dropoff_geometry_gist_idx"
  ON "weekly_requests" USING GIST("dropoff_geometry");

-- ============================================================
-- Trigger: auto-populate pickup/dropoff geometry from lat/lng
-- ============================================================

CREATE OR REPLACE FUNCTION wr_set_geometry() RETURNS trigger AS $$
BEGIN
  NEW.pickup_geometry  := ST_SetSRID(ST_MakePoint(NEW.pickup_lng,  NEW.pickup_lat),  4326);
  NEW.dropoff_geometry := ST_SetSRID(ST_MakePoint(NEW.dropoff_lng, NEW.dropoff_lat), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wr_set_geometry ON "weekly_requests";
CREATE TRIGGER trg_wr_set_geometry
  BEFORE INSERT OR UPDATE OF pickup_lat, pickup_lng, dropoff_lat, dropoff_lng
  ON "weekly_requests"
  FOR EACH ROW EXECUTE FUNCTION wr_set_geometry();

-- ============================================================
-- Seat protection: one active trip per owner per date per period
-- ============================================================
-- Booking acceptance must catch unique_violation (PostgreSQL error 23505)
-- and return a 409 Conflict to the caller.

CREATE UNIQUE INDEX IF NOT EXISTS "trips_owner_slot_unique"
  ON "trips" ("owner_id", "scheduled_date", "period")
  WHERE "status" NOT IN ('CANCELLED');

-- ============================================================
-- Distance query reminder
-- ============================================================
-- IMPORTANT: columns are geometry(…, 4326). Calling ST_DWithin on a
-- raw geometry column uses DEGREES, not meters. Always cast to geography:
--   ST_DWithin(route_geometry::geography, point::geography, 500)
-- See TECH_DECISIONS.md §PostGIS Rules rule 1.
