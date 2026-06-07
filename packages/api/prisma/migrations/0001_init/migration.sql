-- ============================================================
-- CommutePool — Migration 0001: Initial schema + PostGIS setup
-- Rules:
--   Backward compatible — all additions, no destructive changes.
--   PostGIS extension must be enabled before any geometry ops.
-- ============================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE "UserRole" AS ENUM ('RIDER', 'OWNER', 'BOTH');
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "CommutePeriod" AS ENUM ('MORNING', 'EVENING');
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'ARRIVING', 'STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "CancellationReason" AS ENUM ('PENALTY_FREE', 'LATE_CANCEL', 'NO_SHOW', 'FORCE_MAJEURE');
CREATE TYPE "WeeklyRequestStatus" AS ENUM ('OPEN', 'MATCHED', 'EXPIRED');
CREATE TYPE "ContributionPaymentMethod" AS ENUM ('CASH', 'UPI');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- ---------------------------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------------------------

CREATE TABLE "users" (
  "id"                      UUID        NOT NULL DEFAULT gen_random_uuid(),
  "phone"                   TEXT        NOT NULL,
  "name"                    TEXT        NOT NULL,
  "photo_url"               TEXT,
  "role"                    "UserRole"  NOT NULL,
  "status"                  "UserStatus" NOT NULL DEFAULT 'PENDING',
  "emergency_contact_name"  TEXT,
  "emergency_contact_phone" TEXT,
  "cancellation_strikes"    INT         NOT NULL DEFAULT 0,
  "created_at"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deleted_at"              TIMESTAMPTZ,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- ---------------------------------------------------------------------------
-- 2. bike_owner_profiles
-- ---------------------------------------------------------------------------

CREATE TABLE "bike_owner_profiles" (
  "id"                    UUID                  NOT NULL DEFAULT gen_random_uuid(),
  "user_id"               UUID                  NOT NULL,
  "bike_model"            TEXT                  NOT NULL,
  "mileage_override_kmpl" INT,
  "dl_url"                TEXT                  NOT NULL,
  "rc_url"                TEXT                  NOT NULL,
  "verification_status"   "VerificationStatus"  NOT NULL DEFAULT 'PENDING',
  "verified_at"           TIMESTAMPTZ,
  "verified_by"           UUID,
  "rejection_reason"      TEXT,
  "created_at"            TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  "updated_at"            TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  CONSTRAINT "bike_owner_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bike_owner_profiles_user_id_key" ON "bike_owner_profiles"("user_id");
ALTER TABLE "bike_owner_profiles"
  ADD CONSTRAINT "bike_owner_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 3. commute_routes
-- ---------------------------------------------------------------------------

CREATE TABLE "commute_routes" (
  "id"                   UUID            NOT NULL DEFAULT gen_random_uuid(),
  "user_id"              UUID            NOT NULL,
  "period"               "CommutePeriod" NOT NULL,
  "encoded_polyline"     TEXT            NOT NULL,
  "distance_meters"      INT             NOT NULL,
  "duration_seconds"     INT             NOT NULL,
  "route_label"          TEXT,
  "is_primary"           BOOLEAN         NOT NULL DEFAULT FALSE,
  "source_place_id"      TEXT            NOT NULL,
  "source_lat"           DOUBLE PRECISION NOT NULL,
  "source_lng"           DOUBLE PRECISION NOT NULL,
  "source_address"       TEXT            NOT NULL,
  "destination_place_id" TEXT            NOT NULL,
  "destination_lat"      DOUBLE PRECISION NOT NULL,
  "destination_lng"      DOUBLE PRECISION NOT NULL,
  "destination_address"  TEXT            NOT NULL,
  "is_active"            BOOLEAN         NOT NULL DEFAULT TRUE,
  "created_at"           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updated_at"           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT "commute_routes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "commute_routes_user_id_idx" ON "commute_routes"("user_id");
CREATE INDEX "commute_routes_user_period_active_idx" ON "commute_routes"("user_id", "period", "is_active");
ALTER TABLE "commute_routes"
  ADD CONSTRAINT "commute_routes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add PostGIS geometry column for the full route polyline (LINESTRING)
ALTER TABLE "commute_routes"
  ADD COLUMN "route_geometry" geometry(LINESTRING, 4326);

-- Spatial index on the route geometry for ST_DWithin queries
CREATE INDEX "commute_routes_route_geometry_gist_idx"
  ON "commute_routes"
  USING GIST("route_geometry");

-- ---------------------------------------------------------------------------
-- 4. weekly_offers
-- ---------------------------------------------------------------------------

CREATE TABLE "weekly_offers" (
  "id"                     UUID            NOT NULL DEFAULT gen_random_uuid(),
  "owner_id"               UUID            NOT NULL,
  "route_id"               UUID            NOT NULL,
  "period"                 "CommutePeriod" NOT NULL,
  "week_start_date"        DATE            NOT NULL,
  "days_available"         INT[]           NOT NULL,
  "departure_window_start" TEXT            NOT NULL,
  "departure_window_end"   TEXT            NOT NULL,
  "seats_available"        INT             NOT NULL DEFAULT 1,
  "is_active"              BOOLEAN         NOT NULL DEFAULT TRUE,
  "created_at"             TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updated_at"             TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT "weekly_offers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "weekly_offers_owner_id_idx" ON "weekly_offers"("owner_id");
CREATE INDEX "weekly_offers_week_period_active_idx" ON "weekly_offers"("week_start_date", "period", "is_active");
ALTER TABLE "weekly_offers"
  ADD CONSTRAINT "weekly_offers_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "weekly_offers"
  ADD CONSTRAINT "weekly_offers_route_id_fkey"
  FOREIGN KEY ("route_id") REFERENCES "commute_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 5. weekly_requests
-- ---------------------------------------------------------------------------

CREATE TABLE "weekly_requests" (
  "id"                     UUID                  NOT NULL DEFAULT gen_random_uuid(),
  "rider_id"               UUID                  NOT NULL,
  "period"                 "CommutePeriod"        NOT NULL,
  "week_start_date"        DATE                  NOT NULL,
  "days_needed"            INT[]                 NOT NULL,
  "pickup_lat"             DOUBLE PRECISION      NOT NULL,
  "pickup_lng"             DOUBLE PRECISION      NOT NULL,
  "pickup_address"         TEXT                  NOT NULL,
  "pickup_place_id"        TEXT                  NOT NULL,
  "dropoff_lat"            DOUBLE PRECISION      NOT NULL,
  "dropoff_lng"            DOUBLE PRECISION      NOT NULL,
  "dropoff_address"        TEXT                  NOT NULL,
  "dropoff_place_id"       TEXT                  NOT NULL,
  "departure_window_start" TEXT                  NOT NULL,
  "departure_window_end"   TEXT                  NOT NULL,
  "status"                 "WeeklyRequestStatus" NOT NULL DEFAULT 'OPEN',
  "created_at"             TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  "updated_at"             TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  CONSTRAINT "weekly_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "weekly_requests_rider_id_idx" ON "weekly_requests"("rider_id");
CREATE INDEX "weekly_requests_week_period_status_idx" ON "weekly_requests"("week_start_date", "period", "status");
ALTER TABLE "weekly_requests"
  ADD CONSTRAINT "weekly_requests_rider_id_fkey"
  FOREIGN KEY ("rider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add PostGIS geometry columns for pickup and dropoff points
ALTER TABLE "weekly_requests"
  ADD COLUMN "pickup_geometry"  geometry(POINT, 4326),
  ADD COLUMN "dropoff_geometry" geometry(POINT, 4326);

-- Spatial indexes for ST_DWithin proximity queries
CREATE INDEX "weekly_requests_pickup_geometry_gist_idx"
  ON "weekly_requests"
  USING GIST("pickup_geometry");

CREATE INDEX "weekly_requests_dropoff_geometry_gist_idx"
  ON "weekly_requests"
  USING GIST("dropoff_geometry");

-- ---------------------------------------------------------------------------
-- 6. matches
-- ---------------------------------------------------------------------------

CREATE TABLE "matches" (
  "id"                       UUID        NOT NULL DEFAULT gen_random_uuid(),
  "offer_id"                 UUID        NOT NULL,
  "request_id"               UUID        NOT NULL,
  "compatibility_score"      INT         NOT NULL,
  "detour_distance_meters"   INT         NOT NULL,
  "detour_cost_paise"        INT         NOT NULL,
  "base_contribution_paise"  INT         NOT NULL,
  "total_contribution_paise" INT         NOT NULL,
  "pickup_point_lat"         DOUBLE PRECISION NOT NULL,
  "pickup_point_lng"         DOUBLE PRECISION NOT NULL,
  "pickup_walk_meters"       INT         NOT NULL,
  "dropoff_point_lat"        DOUBLE PRECISION NOT NULL,
  "dropoff_point_lng"        DOUBLE PRECISION NOT NULL,
  "dropoff_walk_meters"      INT         NOT NULL,
  "is_partial_route"         BOOLEAN     NOT NULL DEFAULT FALSE,
  "route_usage_percentage"   INT         NOT NULL,
  "created_at"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "matches_offer_id_idx" ON "matches"("offer_id");
CREATE INDEX "matches_request_id_idx" ON "matches"("request_id");
ALTER TABLE "matches"
  ADD CONSTRAINT "matches_offer_id_fkey"
  FOREIGN KEY ("offer_id") REFERENCES "weekly_offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "matches"
  ADD CONSTRAINT "matches_request_id_fkey"
  FOREIGN KEY ("request_id") REFERENCES "weekly_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 7. bookings
-- ---------------------------------------------------------------------------

CREATE TABLE "bookings" (
  "id"                         UUID            NOT NULL DEFAULT gen_random_uuid(),
  "match_id"                   UUID            NOT NULL,
  "rider_id"                   UUID            NOT NULL,
  "owner_id"                   UUID            NOT NULL,
  "status"                     "BookingStatus" NOT NULL DEFAULT 'PENDING',
  "days_confirmed"             INT[]           NOT NULL,
  "contribution_per_day_paise" INT             NOT NULL,
  "request_sent_at"            TIMESTAMPTZ     NOT NULL,
  "expires_at"                 TIMESTAMPTZ     NOT NULL,
  "responded_at"               TIMESTAMPTZ,
  "created_at"                 TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updated_at"                 TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bookings_rider_id_idx" ON "bookings"("rider_id");
CREATE INDEX "bookings_owner_id_idx" ON "bookings"("owner_id");
CREATE INDEX "bookings_status_expires_at_idx" ON "bookings"("status", "expires_at");
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_match_id_fkey"
  FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_rider_id_fkey"
  FOREIGN KEY ("rider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 8. trips
-- ---------------------------------------------------------------------------

CREATE TABLE "trips" (
  "id"                  UUID            NOT NULL DEFAULT gen_random_uuid(),
  "booking_id"          UUID            NOT NULL,
  "rider_id"            UUID            NOT NULL,
  "owner_id"            UUID            NOT NULL,
  "scheduled_date"      DATE            NOT NULL,
  "scheduled_departure" TEXT            NOT NULL,
  "period"              "CommutePeriod" NOT NULL,
  "status"              "TripStatus"    NOT NULL DEFAULT 'SCHEDULED',
  "actual_departure"    TIMESTAMPTZ,
  "actual_arrival"      TIMESTAMPTZ,
  "pickup_confirmed_at" TIMESTAMPTZ,
  "sos_triggered_at"    TIMESTAMPTZ,
  "sos_resolved_at"     TIMESTAMPTZ,
  "created_at"          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updated_at"          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "trips_booking_id_idx" ON "trips"("booking_id");
CREATE INDEX "trips_rider_date_idx" ON "trips"("rider_id", "scheduled_date");
CREATE INDEX "trips_owner_date_idx" ON "trips"("owner_id", "scheduled_date");
CREATE INDEX "trips_status_date_idx" ON "trips"("status", "scheduled_date");
ALTER TABLE "trips"
  ADD CONSTRAINT "trips_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trips"
  ADD CONSTRAINT "trips_rider_id_fkey"
  FOREIGN KEY ("rider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trips"
  ADD CONSTRAINT "trips_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 9. contributions
-- ---------------------------------------------------------------------------

CREATE TABLE "contributions" (
  "id"                     UUID                        NOT NULL DEFAULT gen_random_uuid(),
  "trip_id"                UUID                        NOT NULL,
  "rider_id"               UUID                        NOT NULL,
  "owner_id"               UUID                        NOT NULL,
  "amount_paise"           INT                         NOT NULL,
  "payment_method"         "ContributionPaymentMethod" NOT NULL,
  "marked_paid_at"         TIMESTAMPTZ,
  "confirmed_by_rider_at"  TIMESTAMPTZ,
  "created_at"             TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
  CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "contributions_trip_id_idx" ON "contributions"("trip_id");
ALTER TABLE "contributions"
  ADD CONSTRAINT "contributions_trip_id_fkey"
  FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contributions"
  ADD CONSTRAINT "contributions_rider_id_fkey"
  FOREIGN KEY ("rider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contributions"
  ADD CONSTRAINT "contributions_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 10. ratings
-- ---------------------------------------------------------------------------

CREATE TABLE "ratings" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "trip_id"    UUID        NOT NULL,
  "rater_id"   UUID        NOT NULL,
  "ratee_id"   UUID        NOT NULL,
  "score"      INT         NOT NULL CHECK ("score" >= 1 AND "score" <= 5),
  "comment"    TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ratings_trip_rater_key" ON "ratings"("trip_id", "rater_id");
CREATE INDEX "ratings_ratee_id_idx" ON "ratings"("ratee_id");
ALTER TABLE "ratings"
  ADD CONSTRAINT "ratings_trip_id_fkey"
  FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ratings"
  ADD CONSTRAINT "ratings_rater_id_fkey"
  FOREIGN KEY ("rater_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ratings"
  ADD CONSTRAINT "ratings_ratee_id_fkey"
  FOREIGN KEY ("ratee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 11. cancellations
-- ---------------------------------------------------------------------------

CREATE TABLE "cancellations" (
  "id"                     UUID                  NOT NULL DEFAULT gen_random_uuid(),
  "booking_id"             UUID,
  "trip_id"                UUID,
  "cancelled_by_id"        UUID                  NOT NULL,
  "reason_code"            "CancellationReason"  NOT NULL,
  "hours_before_departure" DOUBLE PRECISION      NOT NULL,
  "penalty_applied"        INT                   NOT NULL DEFAULT 0,
  "dispute_raised"         BOOLEAN               NOT NULL DEFAULT FALSE,
  "dispute_resolved_at"    TIMESTAMPTZ,
  "created_at"             TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  CONSTRAINT "cancellations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "cancellations_cancelled_by_id_idx" ON "cancellations"("cancelled_by_id");
CREATE INDEX "cancellations_booking_id_idx" ON "cancellations"("booking_id");
CREATE INDEX "cancellations_trip_id_idx" ON "cancellations"("trip_id");
ALTER TABLE "cancellations"
  ADD CONSTRAINT "cancellations_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cancellations"
  ADD CONSTRAINT "cancellations_trip_id_fkey"
  FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cancellations"
  ADD CONSTRAINT "cancellations_cancelled_by_id_fkey"
  FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 12. support_tickets
-- ---------------------------------------------------------------------------

CREATE TABLE "support_tickets" (
  "id"              UUID                  NOT NULL DEFAULT gen_random_uuid(),
  "raised_by_id"    UUID                  NOT NULL,
  "trip_id"         UUID,
  "booking_id"      UUID,
  "subject"         TEXT                  NOT NULL,
  "description"     TEXT                  NOT NULL,
  "status"          "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "resolved_at"     TIMESTAMPTZ,
  "resolved_by_id"  UUID,
  "created_at"      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "support_tickets_raised_by_id_idx" ON "support_tickets"("raised_by_id");
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");
ALTER TABLE "support_tickets"
  ADD CONSTRAINT "support_tickets_raised_by_id_fkey"
  FOREIGN KEY ("raised_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "support_tickets"
  ADD CONSTRAINT "support_tickets_resolved_by_id_fkey"
  FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "support_tickets"
  ADD CONSTRAINT "support_tickets_trip_id_fkey"
  FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "support_tickets"
  ADD CONSTRAINT "support_tickets_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 13. audit_logs — IMMUTABLE: no update, no delete, ever
-- ---------------------------------------------------------------------------

CREATE TABLE "audit_logs" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "admin_id"    UUID        NOT NULL,
  "action"      TEXT        NOT NULL,
  "entity_type" TEXT        NOT NULL,
  "entity_id"   TEXT        NOT NULL,
  "old_value"   JSONB,
  "new_value"   JSONB,
  "ip_address"  TEXT        NOT NULL,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_admin_id_idx" ON "audit_logs"("admin_id");
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity_type", "entity_id");
ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 14. admin_fuel_prices
-- ---------------------------------------------------------------------------

CREATE TABLE "admin_fuel_prices" (
  "id"                    UUID        NOT NULL DEFAULT gen_random_uuid(),
  "city"                  TEXT        NOT NULL DEFAULT 'Hyderabad',
  "price_paise_per_litre" INT         NOT NULL,
  "effective_from"        TIMESTAMPTZ NOT NULL,
  "created_by_id"         UUID        NOT NULL,
  "created_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "admin_fuel_prices_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "admin_fuel_prices_city_effective_idx" ON "admin_fuel_prices"("city", "effective_from");
ALTER TABLE "admin_fuel_prices"
  ADD CONSTRAINT "admin_fuel_prices_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 15. admin_bike_mileage
-- ---------------------------------------------------------------------------

CREATE TABLE "admin_bike_mileage" (
  "id"              UUID        NOT NULL DEFAULT gen_random_uuid(),
  "bike_model"      TEXT        NOT NULL,
  "real_world_kmpl" INT         NOT NULL,
  "created_by_id"   UUID        NOT NULL,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "admin_bike_mileage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "admin_bike_mileage_bike_model_key" ON "admin_bike_mileage"("bike_model");
ALTER TABLE "admin_bike_mileage"
  ADD CONSTRAINT "admin_bike_mileage_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 16. otp_attempts
-- ---------------------------------------------------------------------------

CREATE TABLE "otp_attempts" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "phone"      TEXT        NOT NULL,
  "otp_hash"   TEXT        NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "attempts"   INT         NOT NULL DEFAULT 0,
  "verified"   BOOLEAN     NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "otp_attempts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "otp_attempts_phone_expires_idx" ON "otp_attempts"("phone", "expires_at");

-- ---------------------------------------------------------------------------
-- 17. refresh_tokens
-- ---------------------------------------------------------------------------

CREATE TABLE "refresh_tokens" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    UUID        NOT NULL,
  "token_hash" TEXT        NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "revoked_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");
ALTER TABLE "refresh_tokens"
  ADD CONSTRAINT "refresh_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
