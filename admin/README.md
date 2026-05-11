# CommutePool Admin Portal

Angular 17 dashboard — ops/compliance/support surface.

## Stack

- Angular 17 + TypeScript
- Angular Material (tables, forms, dialogs)
- RxJS
- ng2-charts (analytics charts)
- Shared libs: `@commutepool/api-client`, `@commutepool/shared-models`, `@commutepool/auth`

## Structure

```
admin/
├── src/
│   ├── app/
│   │   ├── verification/  # Review DL / RC / Selfie queue
│   │   ├── incidents/     # Safety incidents + SOS alerts
│   │   ├── support/       # Support ticket queue + threaded view
│   │   ├── corridors/     # Corridor management
│   │   ├── pricing/       # Pricing policy per corridor
│   │   ├── analytics/     # Trip metrics + funnel charts
│   │   ├── audit/         # Admin audit log
│   │   └── users/         # User list, profile, trust score
│   └── environments/
├── angular.json
├── package.json
└── tsconfig.json
```

## Getting Started

```bash
npm install
ng serve
```

See `docs/setup/local-admin.md` for env config.
