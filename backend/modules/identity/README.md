# Identity Module

Owns OTP auth, session bootstrap, role claims, and surface context.

## Commands
- RequestOtp
- VerifyOtp
- LogoutSession

## Queries
- GetCurrentSessionContext
- GetNavigationBootstrap

## Events
- OtpRequested
- UserAuthenticated
- SessionRevoked
