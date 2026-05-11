# CommutePool Android

Kotlin + Jetpack Compose offline-first Android application.

## Tech Stack

- Kotlin 1.9+
- Jetpack Compose
- Coroutines + Flow
- Hilt (DI)
- Room (local DB)
- WorkManager (background jobs)
- Retrofit + OkHttp (API)
- DataStore (preferences)
- Coil (images)

## Module Structure

```
android/
├── app/                    # Application shell, DI wiring, navigation graph
├── core/
│   ├── model/              # Shared UI models, enums
│   ├── common/             # Result wrappers, dispatchers, network monitor
│   ├── ui/                 # Loading, error, empty state primitives
│   ├── designsystem/       # Theme, colors, typography, icons, spacing
│   ├── navigation/         # Typed routes, nav arguments, deep links
│   ├── network/            # Retrofit, OkHttp, auth interceptor
│   ├── database/           # Room, DAOs, entities, migrations
│   ├── preferences/        # Encrypted DataStore
│   ├── analytics/          # Analytics interface
│   ├── location/           # Fused location, trip checkpoints
│   ├── notifications/      # Push parsing, local notifications
│   └── security/           # Encrypted storage, session helpers
├── data/
│   ├── auth/
│   ├── user/
│   ├── company/
│   ├── verification/
│   ├── vehicle/
│   ├── corridor/
│   ├── commute/
│   ├── offer/
│   ├── request/
│   ├── match/
│   ├── trip/
│   ├── safety/
│   ├── support/
│   ├── rating/
│   └── notification/
├── feature/
│   ├── auth/
│   ├── onboarding/
│   ├── home/
│   ├── commute/
│   ├── offer/
│   ├── request/
│   ├── match/
│   ├── trip/
│   ├── safety/
│   ├── support/
│   ├── notifications/
│   └── profile/
└── sync/
    ├── core/
    └── workers/
```

## Getting Started

See `docs/setup/local-android.md`.
