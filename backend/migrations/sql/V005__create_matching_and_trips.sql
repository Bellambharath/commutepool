-- V005: Match candidates, pickup options, trips
-- Belongs to: matching + pickup-engine + trip modules

-- ─────────────────────────────────────────
-- MATCH CANDIDATES
-- ─────────────────────────────────────────
CREATE TABLE match_candidates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id            UUID NOT NULL REFERENCES ride_offers(id),
    request_id          UUID NOT NULL REFERENCES ride_requests(id),
    corridor_id         UUID NOT NULL REFERENCES corridors(id),
    score               NUMERIC(5,2),
    status              VARCHAR(30) NOT NULL DEFAULT 'PROPOSED',
    -- PROPOSED | PENDING_USER_ACTION | ACCEPTED | REJECTED | EXPIRED | RECURRING_ACTIVE
    owner_action        VARCHAR(20),  -- ACCEPTED | REJECTED | null
    rider_action        VARCHAR(20),  -- ACCEPTED | REJECTED | null
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mc_offer ON match_candidates(offer_id);
CREATE INDEX idx_mc_request ON match_candidates(request_id);
CREATE INDEX idx_mc_status ON match_candidates(status);

-- ─────────────────────────────────────────
-- RECURRING PAIRS
-- ─────────────────────────────────────────
CREATE TABLE recurring_pairs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id        UUID NOT NULL REFERENCES match_candidates(id),
    owner_id        UUID NOT NULL REFERENCES users(id),
    rider_id        UUID NOT NULL REFERENCES users(id),
    corridor_id     UUID NOT NULL REFERENCES corridors(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | PAUSED | CANCELLED
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rp_owner ON recurring_pairs(owner_id);
CREATE INDEX idx_rp_rider ON recurring_pairs(rider_id);

-- ─────────────────────────────────────────
-- PICKUP OPTIONS
-- ─────────────────────────────────────────
CREATE TABLE pickup_options (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id        UUID NOT NULL REFERENCES match_candidates(id),
    option_type     VARCHAR(30) NOT NULL, -- ROUTE_POINT | NEAR_RIDER_POINT
    label           VARCHAR(200),
    geo             JSONB,   -- {lat, lng}
    detour_minutes  INT NOT NULL DEFAULT 0,
    price_delta     NUMERIC(8,2) NOT NULL DEFAULT 0,
    selected        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_po_match ON pickup_options(match_id);

-- ─────────────────────────────────────────
-- TRIPS
-- ─────────────────────────────────────────
CREATE TABLE trips (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id            UUID NOT NULL REFERENCES match_candidates(id),
    owner_id            UUID NOT NULL REFERENCES users(id),
    rider_id            UUID NOT NULL REFERENCES users(id),
    corridor_id         UUID NOT NULL REFERENCES corridors(id),
    pickup_option_id    UUID REFERENCES pickup_options(id),
    status              VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    -- SCHEDULED | ARRIVING | STARTED | IN_PROGRESS | COMPLETED | CANCELLED | REPORTED
    scheduled_at        TIMESTAMPTZ,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    cancel_reason       VARCHAR(200),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trips_owner ON trips(owner_id);
CREATE INDEX idx_trips_rider ON trips(rider_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_match ON trips(match_id);

-- ─────────────────────────────────────────
-- TRIP CHECKPOINTS
-- ─────────────────────────────────────────
CREATE TABLE trip_checkpoints (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    checkpoint  VARCHAR(50) NOT NULL,  -- PICKUP_REACHED | TRIP_STARTED | MIDPOINT | DESTINATION
    geo         JSONB,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tc_trip ON trip_checkpoints(trip_id);
