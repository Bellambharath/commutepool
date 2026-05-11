-- V007: Notifications, outbox events, audit log, pricing policy
-- Belongs to: notification + outbox + admin-audit + pricing-policy modules

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type   VARCHAR(60) NOT NULL,
    title               VARCHAR(200),
    body                TEXT,
    deep_link           TEXT,
    read                BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifs_user ON notifications(user_id);
CREATE INDEX idx_notifs_read ON notifications(read);
CREATE INDEX idx_notifs_type ON notifications(notification_type);

-- ─────────────────────────────────────────
-- PUSH TOKENS
-- ─────────────────────────────────────────
CREATE TABLE push_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    platform    VARCHAR(20) NOT NULL, -- ANDROID | IOS | WEB
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pt_user ON push_tokens(user_id);

-- ─────────────────────────────────────────
-- OUTBOX EVENTS
-- ─────────────────────────────────────────
CREATE TABLE outbox_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type      VARCHAR(80) NOT NULL,
    event_version   INT NOT NULL DEFAULT 1,
    aggregate_type  VARCHAR(60) NOT NULL,
    aggregate_id    UUID NOT NULL,
    payload         JSONB NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING | PROCESSING | PROCESSED | DEAD
    attempts        INT NOT NULL DEFAULT 0,
    last_error      TEXT,
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbox_status ON outbox_events(status);
CREATE INDEX idx_outbox_type ON outbox_events(event_type);
CREATE INDEX idx_outbox_aggregate ON outbox_events(aggregate_type, aggregate_id);

-- ─────────────────────────────────────────
-- AUDIT LOG
-- ─────────────────────────────────────────
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id        UUID REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,
    target_type     VARCHAR(60),
    target_id       UUID,
    reason          TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ─────────────────────────────────────────
-- PRICING POLICIES
-- ─────────────────────────────────────────
CREATE TABLE pricing_policies (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corridor_id             UUID REFERENCES corridors(id),
    label                   VARCHAR(200) NOT NULL,
    base_contribution       NUMERIC(8,2) NOT NULL,
    max_contribution        NUMERIC(8,2),
    detour_price_per_min    NUMERIC(6,2) NOT NULL DEFAULT 0,
    active                  BOOLEAN NOT NULL DEFAULT FALSE,
    effective_from          DATE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pp_corridor ON pricing_policies(corridor_id);
CREATE INDEX idx_pp_active ON pricing_policies(active);
