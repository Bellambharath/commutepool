# CommutePool Web PWA

Angular 17 Progressive Web App — user-facing surface.

## Stack

- Angular 17 + TypeScript
- Angular Material (UI components)
- RxJS (reactive state)
- @angular/service-worker (PWA / offline)
- Shared libs: `@commutepool/api-client`, `@commutepool/shared-models`, `@commutepool/auth`

## Structure

```
web/
├── src/
│   ├── app/
│   │   ├── auth/          # OTP login, token refresh
│   │   ├── commute/       # Commute profile setup
│   │   ├── offers/        # Browse and manage offers
│   │   ├── requests/      # Ride requests
│   │   ├── trips/         # Trip history and detail
│   │   ├── support/       # Support tickets
│   │   ├── profile/       # User profile and verification status
│   │   └── notifications/ # Notification centre
│   ├── environments/
│   └── manifest.webmanifest
├── angular.json
├── package.json
└── tsconfig.json
```

## Getting Started

```bash
npm install
ng serve
```

See `docs/setup/local-web.md` for env config.
