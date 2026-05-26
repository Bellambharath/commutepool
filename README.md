# CommutePool

> Verified office commute-pooling for Telangana — Android · Web PWA · Admin Portal

## Overview

CommutePool connects verified office commuters for safe, shared bike-based travel to IT corridors in Hyderabad. Bike owners offer seats; riders request matches. The system handles commute profiles, recurring pairs, trip lifecycle, safety/SOS, support, and grievance workflows.

## Monorepo Structure

```
commutepool/
├── backend/           # .NET 8 LTS — ASP.NET Core modular monolith
├── android/           # Kotlin + Jetpack Compose offline-first app
├── web/               # Next.js 14 (App Router) — user-facing PWA
│   └── src/app/       # Pages: /offers, /trips, /profile, /commute, /requests, /notifications
├── admin/             # Angular 17 — ops/compliance/support dashboard
├── pwa/               # Netlify config (base dir) → builds web/ Next.js app
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
| Backend | C#, .NET 8 LTS, ASP.NET Core Web API, EF Core 8, PostgreSQL, MediatR, FluentValidation, Serilog |
| Android | Kotlin, Jetpack Compose, Room, Retrofit, WorkManager, Hilt |
| Web PWA | **Next.js 14** (App Router), TypeScript, React 18, Tailwind CSS |
| Admin Portal | Angular 17, TypeScript, RxJS, Angular Material |
| Auth | Phone OTP → JWT (access + refresh tokens stored as cookies) |
| Hosting | Netlify (web + admin), Render (backend API + PostgreSQL + Redis) |

## Web PWA — Page Map

| Route | Description |
|---|---|
| `/auth/login` | Phone number entry, sends OTP |
| `/auth/otp-verify` | 6-digit OTP verification, sets auth cookies |
| `/offers` | Home dashboard — available rides (GET /api/offers/available) |
| `/trips` | Trip history (GET /api/trips) |
| `/commute` | Commute profile setup/edit (GET/PUT /api/commute/profile) |
| `/requests` | Incoming ride requests with accept/decline (GET /api/requests) |
| `/notifications` | Notification feed (GET /api/notifications) |
| `/profile` | User profile, logout (GET /api/users/me) |
| `/safety` | SOS + incident reporting |
| `/support` | Support tickets + FAQ |

## Getting Started

See `docs/setup/` for local dev, environment, and deployment.
See `DEPLOYMENT.md` for free-tier deployment to Netlify + Render.

## License

Private — All rights reserved.
