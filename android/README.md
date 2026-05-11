# CommutePool Android

Kotlin + Jetpack Compose offline-first Android app.

## Stack

- Kotlin, Jetpack Compose, Material3
- Hilt (DI), Retrofit + OkHttp (network), Room (local DB), DataStore (token store), WorkManager (background sync)
- Target SDK 35, Min SDK 26 (Android 8+)

## Screens

| Screen | Module |
|---|---|
| Login (OTP request) | auth |
| OTP Verify | auth |
| Commute Setup | commute |
| My Offers + Create Offer | offers |
| Offer Detail + Accept/Decline Requests | offers |
| My Requests | requests |
| My Trips + Trip Detail | trips |
| Notifications | notifications |
| Support Tickets + Thread | support |
| SOS | safety |
| Report Incident | safety |

## Architecture

Clean layered architecture:
- `data/remote` — Retrofit ApiService + DTOs + AuthInterceptor
- `data/local` — DataStore TokenStore (Room in next iteration)
- `di` — Hilt modules (NetworkModule)
- `ui/screens` — Screen + ViewModel per feature
- `ui/navigation` — NavHost + Routes
- `ui/theme` — Material3 CommutePool brand theme

## Getting Started

```bash
# Open android/ in Android Studio Ladybug or newer
# Sync Gradle, run on emulator or device
```
