-- V004: Commute profiles, ride offers, ride requests
-- Belongs to: commute + offer + request modules

-- ─────────────────────────────────────────
-- COMMUTE PROFILES
-- ─────────────────────────────────────────
CREATE TABLE commute_profiles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    corridor_id         UUID NOT NULL REFERENCES corridors(id),
    label               VARCHAR(100),
    home_zone_label     VARCHAR(200) NOT NULL,
    office_zone_label   VARCHAR(200) NOT NULL,
    home_geo            JSONB,   -- {lat, lng}
    office_geo          JSONB,   -- {lat, lng}
    working_days        INTEGER[] NOT NULL, -- [1,2,3,4,5] => Mon-Fri
    morning_window_start TIME NOT NULL,
    morning_window_end   TIME NOT NULL,
    evening_window_start TIME NOT NULL,
    evening_window_end   TIME NOT NULL,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cp_user ON commute_profiles(user_id);
CREATE INDEX idx_cp_corridor ON commute_profiles(corridor_id);
CREATE INDEX idx_cp_active ON commute_profiles(active);

-- ─────────────────────────────────────────
-- RIDE OFFERS (Bike owners)
-- ─────────────────────────────────────────
CREATE TABLE ride_offers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id            UUID NOT NULL REFERENCES users(id),
    vehicle_id          UUID NOT NULL REFERENCES vehicles(id),
    commute_profile_id  UUID NOT NULL REFERENCES commute_profiles(id),
    corridor_id         UUID NOT NULL REFERENCES corridors(id),
    pickup_mode         VARCHAR(30) NOT NULL DEFAULT 'ROUTE_POINT_ONLY',
    available_seats     INT NOT NULL DEFAULT 1,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | PAUSED | CLOSED
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ro_owner ON ride_offers(owner_id);
CREATE INDEX idx_ro_corridor ON ride_offers(corridor_id);
CREATE INDEX idx_ro_status ON ride_offers(status);

-- ─────────────────────────────────────────
-- RIDE REQUESTS (Riders)
-- ─────────────────────────────────────────
CREATE TABLE ride_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id            UUID NOT NULL REFERENCES users(id),
    commute_profile_id  UUID NOT NULL REFERENCES commute_profiles(id),
    corridor_id         UUID NOT NULL REFERENCES corridors(id),
    pickup_mode_pref    VARCHAR(30) NOT NULL DEFAULT 'ROUTE_POINT_ONLY',
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | PAUSED | CLOSED
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rr_rider ON ride_requests(rider_id);
CREATE INDEX idx_rr_corridor ON ride_requests(corridor_id);
CREATE INDEX idx_rr_status ON ride_requests(status);
