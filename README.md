# CommutePool

> Verified office commute-pooling for Telangana — Android · Web/PWA · Admin Portal

## Overview

CommutePool connects verified office commuters for safe, shared bike-based travel to IT corridors in Hyderabad. Bike owners offer seats; riders request matches. The system handles commute profiles, recurring pairs, trip lifecycle, safety/SOS, support, and grievance workflows.

## Monorepo Structure

```
commutepool/
├── backend/           # .NET 8 LTS + ASP.NET Core modular monolith
├── android/           # Kotlin + Jetpack Compose offline-first app
├── web/               # Next.js user PWA (planning/management surface)
├── admin/             # Next.js admin portal (ops/compliance/support)
├── shared/            # Shared contracts, types, tokens, validation
└── docs/              # Architecture decisions, contracts, runbooks
```

## Platform Scope

| Surface | Scope |
|---|---|
| Android | Full operational — auth, commute, offers, requests, matching, trip, safety, support |
| Web/PWA | Management — planning, commute setup, match review, history, support |
| Admin | Ops/compliance — verification, incidents, support queue, corridor, audit |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | C#, .NET 8 LTS, ASP.NET Core Web API, EF Core 8, PostgreSQL (Supabase), MediatR, FluentValidation, Serilog |
| Android | Kotlin, Jetpack Compose, Room, Retrofit, WorkManager, Hilt |
| Web/PWA | Next.js 14, TypeScript, TanStack Query, Tailwind CSS |
| Admin | Next.js 14, TypeScript, TanStack Query, Tailwind CSS |
| Shared | TypeScript types, design tokens, validation rules, analytics events |

## Getting Started

See `docs/setup/` for local dev, environment, and deployment setup.

## Blueprint

All frozen contracts live in `docs/contracts/`. Do not modify contract files without updating the change log.

## License

Private — All rights reserved.
