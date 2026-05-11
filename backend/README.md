# CommutePool Backend

.NET 9 + ASP.NET Core Web API — modular monolith.

## Tech Stack

- .NET 9 / ASP.NET Core 9
- EF Core 9 + Npgsql (PostgreSQL / Supabase)
- FluentValidation
- JWT Bearer authentication
- IHostedService background workers (Outbox relay, match gen, etc.)
- MediatR (CQRS commands/queries)
- Serilog (structured logging)

## Module Structure

```
backend/
├── CommutePool.Api/           # Entry point, controllers, middleware, DI wiring
├── CommutePool.Shared/        # Base classes, result types, pagination, guards
├── CommutePool.Infrastructure/ # EF Core DbContext, migrations, email, storage
└── CommutePool.Modules/
    ├── Identity/              # OTP auth, JWT, sessions
    ├── UserProfile/           # User account, emergency contact
    ├── Company/               # Company tenant, work-email verification
    ├── Verification/          # DL, RC, selfie review lifecycle
    ├── Vehicle/               # Bike registry
    ├── Corridor/              # Service corridors
    ├── Commute/               # Commute profiles, schedules
    ├── Offer/                 # Ride offers
    ├── Request/               # Ride requests
    ├── Matching/              # Match generation, scoring
    ├── PickupEngine/          # Pickup option generation
    ├── Trip/                  # Trip lifecycle
    ├── TrustRating/           # Ratings, trust scores
    ├── SafetyIncident/        # SOS, incidents, escalation
    ├── SupportGrievance/      # Support tickets, grievance
    ├── Notification/          # Push, email, in-app
    ├── PricingPolicy/         # Contribution caps
    ├── AdminAudit/            # Admin actions, audit log
    ├── Analytics/             # Funnel and trip metrics
    └── Outbox/                # Transactional outbox worker
```

## Getting Started

See `docs/setup/local-backend.md`.
