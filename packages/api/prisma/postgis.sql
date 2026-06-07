-- ============================================================
-- CommutePool — PostGIS setup
-- Run AFTER: npx prisma migrate dev --name init
-- Command:   npx prisma db execute --stdin < prisma/postgis.sql
-- ============================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry column for the full route polyline on commute_routes
ALTER TABLE "commute_routes"
  ADD COLUMN IF NOT EXISTS "route_geometry" geometry(LINESTRING, 4326);

-- Add geometry columns for rider pickup and dropoff points on weekly_requests
ALTER TABLE "weekly_requests"
  ADD COLUMN IF NOT EXISTS "pickup_geometry" geometry(POINT, 4326);

ALTER TABLE "weekly_requests"
  ADD COLUMN IF NOT EXISTS "dropoff_geometry" geometry(POINT, 4326);

-- Spatial index for ST_DWithin route matching queries
CREATE INDEX IF NOT EXISTS "commute_routes_route_geometry_gist_idx"
  ON "commute_routes" USING GIST("route_geometry");

-- Spatial indexes for rider pickup/dropoff proximity queries
CREATE INDEX IF NOT EXISTS "weekly_requests_pickup_geometry_gist_idx"
  ON "weekly_requests" USING GIST("pickup_geometry");

CREATE INDEX IF NOT EXISTS "weekly_requests_dropoff_geometry_gist_idx"
  ON "weekly_requests" USING GIST("dropoff_geometry");
