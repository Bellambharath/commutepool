-- V006: Ratings, trust scores, incidents, support tickets
-- Belongs to: trust-rating + safety-incident + support-grievance modules

-- ─────────────────────────────────────────
-- RATINGS
-- ─────────────────────────────────────────
CREATE TABLE ratings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id     UUID NOT NULL REFERENCES trips(id),
    rater_id    UUID NOT NULL REFERENCES users(id),
    ratee_id    UUID NOT NULL REFERENCES users(id),
    score       INT NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(trip_id, rater_id)
);

CREATE INDEX idx_ratings_ratee ON ratings(ratee_id);
CREATE INDEX idx_ratings_trip ON ratings(trip_id);

-- ─────────────────────────────────────────
-- TRUST SCORES
-- ─────────────────────────────────────────
CREATE TABLE trust_scores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    score           NUMERIC(4,2) NOT NULL DEFAULT 5.0,
    trip_count      INT NOT NULL DEFAULT 0,
    rating_count    INT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ts_user ON trust_scores(user_id);

-- ─────────────────────────────────────────
-- INCIDENTS
-- ─────────────────────────────────────────
CREATE TABLE incidents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id         UUID REFERENCES trips(id),
    reporter_id     UUID NOT NULL REFERENCES users(id),
    incident_type   VARCHAR(40) NOT NULL,
    -- UNSAFE_BEHAVIOR | ROUTE_DEVIATION | HARASSMENT | ACCIDENT | SOS | OTHER
    severity        VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    -- LOW | MEDIUM | HIGH | CRITICAL
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    -- OPEN | UNDER_REVIEW | RESOLVED | ESCALATED
    description     TEXT,
    assignee_id     UUID REFERENCES users(id),
    resolution_note TEXT,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_reporter ON incidents(reporter_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_trip ON incidents(trip_id);

-- ─────────────────────────────────────────
-- SUPPORT TICKETS
-- ─────────────────────────────────────────
CREATE TABLE support_tickets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    trip_id         UUID REFERENCES trips(id),
    incident_id     UUID REFERENCES incidents(id),
    subject         VARCHAR(160) NOT NULL,
    category        VARCHAR(60),
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    -- OPEN | IN_PROGRESS | WAITING_USER | RESOLVED | CLOSED
    priority        VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    assignee_id     UUID REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_st_user ON support_tickets(user_id);
CREATE INDEX idx_st_status ON support_tickets(status);
CREATE INDEX idx_st_priority ON support_tickets(priority);

-- ─────────────────────────────────────────
-- SUPPORT TICKET MESSAGES
-- ─────────────────────────────────────────
CREATE TABLE support_ticket_messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id   UUID NOT NULL REFERENCES users(id),
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stm_ticket ON support_ticket_messages(ticket_id);
