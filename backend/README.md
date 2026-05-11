# CommutePool Backend

Kotlin + Spring Boot 3 modular monolith.

## Tech Stack

- Kotlin 1.9+
- Spring Boot 3.2+
- PostgreSQL (Supabase)
- Flyway (migrations)
- Hilt / Spring DI
- Coroutines
- Outbox pattern for async events

## Module Structure

```
backend/
├── app/                        # Spring Boot application entry point
├── modules/
│   ├── identity/               # OTP auth, session
│   ├── user-profile/           # User account, emergency contact
│   ├── company/                # Company tenant, work-email verification
│   ├── verification/           # DL, RC, selfie review lifecycle
│   ├── vehicle/                # Bike registry
│   ├── corridor/               # Service corridors, pickup rules
│   ├── commute/                # Commute profiles, schedules
│   ├── offer/                  # Ride offers
│   ├── request/                # Ride requests
│   ├── matching/               # Match generation, scoring, recurring pairs
│   ├── pickup-engine/          # Pickup option generation, pricing delta
│   ├── trip/                   # Trip lifecycle
│   ├── trust-rating/           # Ratings, trust scores
│   ├── safety-incident/        # SOS, incidents, escalation
│   ├── support-grievance/      # Support tickets, grievance workflows
│   ├── notification/           # Push, email, in-app notifications
│   ├── pricing-policy/         # Contribution caps, corridor pricing
│   ├── admin-audit/            # Admin actions, suspensions, audit log
│   ├── analytics/              # Funnel, match quality, trip metrics
│   └── outbox/                 # Transactional outbox for event publication
├── shared/                     # Shared domain models, utils, base classes
├── infrastructure/             # DB config, external adapters, security
└── migrations/                 # Flyway SQL migrations
    └── sql/
```

## Getting Started

See `docs/setup/local-backend.md`.
