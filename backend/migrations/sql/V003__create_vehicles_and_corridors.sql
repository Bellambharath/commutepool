-- V003: Vehicles, corridors, corridor company restrictions
-- Belongs to: vehicle + corridor modules

-- ─────────────────────────────────────────
-- VEHICLES
-- ─────────────────────────────────────────
CREATE TABLE vehicles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    make            VARCHAR(100),
    model           VARCHAR(100),
    registration_no VARCHAR(20) NOT NULL,
    vehicle_type    VARCHAR(20) NOT NULL DEFAULT 'BIKE',
    active          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_user ON vehicles(user_id);
CREATE INDEX idx_vehicles_active ON vehicles(active);

-- ─────────────────────────────────────────
-- CORRIDORS
-- ─────────────────────────────────────────
CREATE TABLE corridors (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(200) NOT NULL,
    origin_label            VARCHAR(200) NOT NULL,
    destination_label       VARCHAR(200) NOT NULL,
    origin_geo              JSONB,        -- {lat, lng, radius_meters}
    destination_geo         JSONB,        -- {lat, lng, radius_meters}
    max_detour_minutes      INT NOT NULL DEFAULT 10,
    exact_pickup_enabled    BOOLEAN NOT NULL DEFAULT FALSE, -- frozen FALSE in v1
    active                  BOOLEAN NOT NULL DEFAULT FALSE,
    operational_notes       TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_corridors_active ON corridors(active);

-- ─────────────────────────────────────────
-- CORRIDOR COMPANY RESTRICTIONS
-- ─────────────────────────────────────────
CREATE TABLE corridor_company_restrictions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corridor_id     UUID NOT NULL REFERENCES corridors(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES companies(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(corridor_id, company_id)
);

CREATE INDEX idx_ccr_corridor ON corridor_company_restrictions(corridor_id);
