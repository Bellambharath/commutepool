# CommutePool

> Verified office commute-pooling for Telangana — Android · Web PWA · Admin Portal

## Overview

CommutePool connects verified office commuters for safe, shared bike-based travel to IT corridors in Hyderabad. Bike owners offer seats; riders request matches. The system handles commute profiles, recurring pairs, trip lifecycle, safety/SOS, support, and grievance workflows.

## Monorepo Structure

```
commutepool/
├── backend/           # .NET 8 LTS — ASP.NET Core modular monolith
├── android/           # Kotlin + Jetpack Compose offline-first app
├── web/               # Angular 17 PWA — user-facing (commute, trips, support)
├── admin/             # Angular 17 — ops/compliance/support dashboard
├── libs/
│   ├── api-client/    # Auto-typed Angular HTTP services matching .NET controllers
│   ├── shared-models/ # TypeScript interfaces mirroring C# DTOs exactly
│   └── auth/          # JWT interceptor, auth guard, token refresh
└── docs/              # Architecture decisions, contracts, runbooks
```

## Platform Scope

| Surface | Scope |
|---|---|
| Android | Full operational — auth, commute, offers, requests, matching, trip, safety, support |
| Web PWA | User management — commute setup, match review, trip history, support tickets |
| Admin | Ops/compliance — verification queue, incidents, support queue, corridor mgmt, audit log |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | C#, .NET 8 LTS, ASP.NET Core Web API, EF Core 8, PostgreSQL (Supabase), MediatR, FluentValidation, Serilog |
| Android | Kotlin, Jetpack Compose, Room, Retrofit, WorkManager, Hilt |
| Web PWA | Angular 17, TypeScript, RxJS, Angular Material, @angular/service-worker |
| Admin Portal | Angular 17, TypeScript, RxJS, Angular Material, ng2-charts |
| Shared Libs | TypeScript — api-client, shared-models, auth |
| Database | PostgreSQL via Supabase (shared schema, row-level security) |
| Auth | Phone OTP → JWT (access + refresh), Supabase Auth |

## Module Map (Backend)

| Module | Responsibility |
|---|---|
| Identity | OTP auth, JWT, session management |
| UserProfile | Account, emergency contact |
| Company | Work-email verification, company tenant |
| Verification | DL / RC / Selfie review, owner eligibility |
| Vehicle | Bike registry, active vehicle management |
| Corridor | Service corridor management |
| Commute | Commute profile, schedule, pause/resume |
| Offer | Ride offers, seat management |
| Request | Ride requests, accept/decline |
| Matching | Score-based match generation |
| PickupEngine | Pickup option generation and selection |
| Trip | Trip lifecycle — start/complete/cancel/no-show |
| TrustRating | Star ratings, weighted trust score |
| SafetyIncident | SOS, incident reporting, escalation |
| SupportGrievance | Support tickets, threaded messages |
| Notification | Push, email, in-app notifications |
| PricingPolicy | Contribution caps and fare rules |
| AdminAudit | Admin action audit log |
| Analytics | Funnel and trip metrics |
| Outbox | Transactional outbox relay worker |

## Getting Started

See `docs/setup/` for local dev, environment, and deployment.

## License

Private — All rights reserved.
