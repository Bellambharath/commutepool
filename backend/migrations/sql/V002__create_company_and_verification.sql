-- V002: Companies, memberships, verification cases
-- Belongs to: company + verification modules

-- ─────────────────────────────────────────
-- COMPANIES
-- ─────────────────────────────────────────
CREATE TABLE companies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(200) NOT NULL,
    email_domain        VARCHAR(255) NOT NULL UNIQUE,
    enterprise_mode     BOOLEAN NOT NULL DEFAULT FALSE,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_domain ON companies(email_domain);

-- ─────────────────────────────────────────
-- USER COMPANY MEMBERSHIPS
-- ─────────────────────────────────────────
CREATE TABLE user_company_memberships (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES companies(id),
    work_email      VARCHAR(254) NOT NULL,
    verified        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

CREATE INDEX idx_ucm_user ON user_company_memberships(user_id);
CREATE INDEX idx_ucm_company ON user_company_memberships(company_id);

-- ─────────────────────────────────────────
-- VERIFICATION CASES
-- ─────────────────────────────────────────
CREATE TABLE verification_cases (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type   VARCHAR(30) NOT NULL, -- OFFICE_EMAIL | DRIVER_LICENSE | VEHICLE_RC | SELFIE
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED
    artifact_url    TEXT,
    rejection_reason VARCHAR(300),
    reviewer_id     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vc_user ON verification_cases(user_id);
CREATE INDEX idx_vc_status ON verification_cases(status);
CREATE INDEX idx_vc_type ON verification_cases(document_type);

-- ─────────────────────────────────────────
-- OWNER ELIGIBILITY
-- ─────────────────────────────────────────
CREATE TABLE owner_eligibility (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    status              VARCHAR(20) NOT NULL DEFAULT 'NOT_ELIGIBLE', -- NOT_ELIGIBLE | PENDING | ELIGIBLE
    last_evaluated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_oe_user ON owner_eligibility(user_id);
CREATE INDEX idx_oe_status ON owner_eligibility(status);
