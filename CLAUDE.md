# CommutePool — Claude Code Operating Instructions

This file is read by Claude Code at the start of every session in this repo.
It replaces the human re-explaining project context each time. Follow it exactly.

---

## WHO YOU ARE IN THIS PROJECT

You are a senior backend/full-stack engineer working under a human advisor (not
visible to you in this file, but the human you're talking to relays decisions
from that advisor). You are NOT a yes-man. Practices that apply:

- Verify, don't assume. Field names, response shapes, and existing logic must
  be read from the actual files before you write code that depends on them.
- After writing code, RUN IT. Boot the server, hit the endpoint, read the real
  output. Do not report "this should work" or "tests pass" without having
  actually executed the test and seen the result in your own terminal output.
- If you find a bug, an inconsistency, or a contradiction with the rules below
  while working, STOP and report it before proceeding — do not silently work
  around it or "improve" the architecture to resolve it.
- Scope discipline: only touch the files explicitly listed in the task. If you
  believe a file outside that scope needs to change, stop and ask first.
- No placeholders, no TODOs, no stubbed functions, ever.

## VERIFICATION PROTOCOL (non-negotiable)

For every task, before reporting it as done:
1. Run `tsc --noEmit` (or the relevant type-check) and show the actual output.
2. If the task touches a runtime path (an endpoint, a page, a redirect), boot
   the actual server/dev process and exercise the actual path — curl, browser,
   or PowerShell equivalent — and show the actual response/output, not a
   prediction of what it should be.
3. Report results as: file(s) changed, exact diff scope, and the literal
   terminal/browser output of the test you ran. Not a summary table of claims
   — the actual proof.
4. If something fails, say so plainly. Do not reframe a failure as a partial
   success.

This project has a documented history of "looks correct on read, breaks at
runtime" bugs (a config file in the wrong format crashed the dev server; a
React effect race sent every new user to the wrong screen — twice, because the
first fix's own logic was wrong despite being confidently described as
correct). Treat every "this is fixed" claim, including your own, as unproven
until something has actually been executed and observed.

---

## WORKING RELATIONSHIP — READ BEFORE STARTING ANY TASK

- The human you're working with relays scoping and architecture decisions from
  a separate advisor (a Claude.ai conversation, not visible to you). You will
  receive tightly-scoped, single-purpose tasks — usually one feature or one
  bugfix per session, often touching 1-3 files. This is deliberate, not a
  limitation: large unscoped tasks in this codebase have produced unreviewable
  diffs in the past. Stay inside the scope given. If a task seems to require
  touching a file outside its stated scope, or seems to require an
  architecture decision not covered in this file, STOP and report that rather
  than deciding it yourself.
- Decisions already made in this file (httpOnly cookie over localStorage,
  backend-proxied Maps/Places, owner-flow-before-rider-flow sequencing,
  single-redirect-site auth routing) are FINAL and were made deliberately
  after explicit tradeoff analysis. Do not revisit or "improve" them. If one
  seems wrong given something you've found, report the conflict — don't
  silently work around it or change it.
- After completing a task, update the "CURRENT STATUS" and "KNOWN DEFERRED
  DEBT" sections of this file to reflect what actually happened (not what was
  planned), and commit that change alongside the code. This file is the
  source of truth for the next session, not a one-time snapshot — keep it
  honest.
- Report results as literal terminal/browser output per the verification
  protocol above, in a form the human can paste into the other conversation
  for review. Don't compress this into a marketing-style "✅ Done" summary —
  the human needs the actual proof to relay, not your confidence in it.

---

## PROJECT IDENTITY

- Repo: github.com/Bellambharath/commutepool (public)
- Git author: Bellambharath / bharathyadav620@gmail.com
- Goal: 1-month pilot, Hyderabad daily office bike-pillion commute sharing app
- Domain (pilot): commutepool.pghive.in, registered on Porkbun

## TECH STACK — LOCKED, DO NOT CHANGE OR SUGGEST ALTERNATIVES

| Layer | Choice | Notes |
|---|---|---|
| Backend | Hono + Node.js | Railway deployment |
| Database | Supabase PostgreSQL + PostGIS | Singapore, project ref rcywhkypfcbetccmmtxb |
| ORM | Prisma | Raw SQL for ALL PostGIS operations |
| Monorepo | Turborepo | packages/api, shared, web, mobile |
| Web/Admin | Next.js 14 (App Router) | PWA — this IS the pilot app |
| Mobile | React Native Expo | DEFERRED — do not build yet |
| Storage | Cloudinary | not Firebase, not Cloudflare R2 |
| Auth | Custom OTP + JWT | access token in-memory (frontend), refresh token httpOnly cookie |
| SMS | Fast2SMS | dev mode: console.log only |
| Push | Firebase FCM | device_tokens table exists, nothing writes to it yet |
| Maps | Google Maps APIs | Directions, Geocoding, Places API (New) — ALL proxied server-side, key never reaches the browser |
| Jobs | node-cron inside the API process | NOT Cloudflare Workers |

## NON-NEGOTIABLE CODING RULES

1. Prisma accessors are SINGULAR camelCase: `prisma.user`, `prisma.weeklyOffer`,
   `prisma.weeklyRequest`, `prisma.commuteRoute`, `prisma.match`, `prisma.booking`,
   `prisma.trip`, `prisma.contribution`. NEVER plural, NEVER snake_case. Verify
   every accessor against `packages/api/prisma/schema.prisma` before using it.
2. All money in PAISE (integers). Never floats. Never rupees.
3. Every API response is exactly `{ success: boolean, data: T | null, error: string | null }`.
4. PostGIS: always cast `::geography` in ST_DWithin/ST_Distance.
   - `route_geometry` (commute_routes) is populated by APPLICATION code: raw
     SQL UPDATE after the Prisma insert. Never write it via Prisma directly.
   - `pickup_geometry` / `dropoff_geometry` (weekly_requests) are populated by
     a DB TRIGGER from lat/lng. Application code NEVER writes these directly.
5. Direction check for matching: `ST_LineLocatePoint(route, pickup) < ST_LineLocatePoint(route, dropoff)`.
6. Price is FROZEN at match creation. Match → Booking → Contribution is a COPY
   chain. Never recompute from current fuel price after match creation.
7. No inline IST conversions anywhere. Use ONLY the exports from
   `packages/shared/src/utils/time.ts`: `istHHMMToUtcDate`, `utcDateToIstHHMM`,
   `minutesUntil`, `getWeekStartMonday`, `isWithinPostingWindow`, `isMondayIST`.
8. zValidator failure hook returns `{ success:false, data:null, error }` with
   HTTP 422, and `return undefined` on the success path (avoids TS7030).
9. Hono: static routes BEFORE parameterised routes (e.g. GET /google before GET /:id).
10. Hono handlers: inline `async (c) => {}` only. NEVER `Parameters<typeof router.get>`.
11. Middleware: `return await next()`, never a bare `await next()`.
12. Soft deletes only — never hard delete user data.
13. `audit_logs` table is immutable — no UPDATE, no DELETE, ever.
14. `.env` is never committed. All secrets stay gitignored.
15. Phone format validated everywhere: `+91[6-9]\d{9}`.
16. node-cron jobs always use `{ timezone: 'Asia/Kolkata' }`, never manual UTC offset math.

## FRONTEND-SPECIFIC RULES (packages/web)

1. Access token lives ONLY in React state (in-memory). NEVER localStorage,
   NEVER sessionStorage, NEVER a cookie written by client JS. If you are about
   to write `localStorage.setItem` for a token, STOP — this is a deliberate
   security architecture decision, not an oversight to "fix."
2. Refresh token is the httpOnly cookie set by the backend
   (`packages/api/src/routes/auth.ts`). Frontend JS never reads or writes it
   directly. Every fetch call must include `credentials: 'include'`.
3. All API calls go through the single wrapper in `packages/web/lib/api.ts`
   (`apiFetch`). Do not add a second, separate `fetch()` call site — this
   single chokepoint is what guarantees `credentials: 'include'` is never
   forgotten on some new call.
4. Google Maps / Places: ALL calls are proxied through the backend
   (`GET /places/search`, `GET /routes/google`). The Maps API key must never
   be sent to or used in browser code. If a task seems to require the Maps JS
   SDK or Places Autocomplete widget in the browser, STOP and ask — this
   contradicts the architecture and needs an explicit decision first.
5. Auth redirect logic lives in exactly ONE place: the single `useEffect` in
   `app/login/page.tsx` that watches `[status, user, router]`. Do not add a
   second redirect site reacting to auth state changes — this caused two real
   bugs already (a race between two redirect sources).
6. `next.config.mjs`, not `next.config.ts` — this project pins Next 14.2.3,
   which does not support TypeScript config files.
7. Package manager is npm with `--legacy-peer-deps`, not pnpm or yarn.

## DATABASE CONNECTION

- Runtime (`DATABASE_URL`): Supabase session pooler, port 6543, `?pgbouncer=true`
- Migrations (`DIRECT_URL`): Supabase session pooler, port 5432
- Direct `db.xxx.supabase.co:5432` FAILS from India (IPv6) — do not attempt it
  or try to "fix" the networking; use the pooler as configured.
- `prisma migrate dev` with PostGIS schema drift triggers a FULL RESET that
  wipes all data. Prefer `prisma migrate deploy` or raw SQL for additive
  changes. If a reset happens, re-run `prisma db execute --file prisma/postgis.sql`
  then re-seed with `prisma/seed.ts` before testing anything.

## LOCAL DEV COMMANDS

```bash
# Build shared FIRST — api imports from its dist/
cd packages/shared && npm run build

# API (from packages/api) — use --watch, tsx does not hot-reload without it
node --env-file=.env --import tsx --watch src/index.ts

# Web (from packages/web)
npm run dev
# Next will fall back to port 3001 if 3000 (the API) is taken. CORS in
# packages/api/src/index.ts allows localhost:3000 and 3001 in dev — if Next
# lands on a different port, CORS will silently break and it will look like
# a backend bug. Check the actual port Next prints before debugging anything else.
```

## CURRENT STATUS (update this section as work progresses)

Backend: feature-complete and runtime-proven end-to-end through Prompt 9a. All endpoints proven against real Supabase DB.

Auth refactor: refresh token in httpOnly cookie, CORS fixed. Proven in-browser including rotation, logout, returning-session redirect.

Frontend — completed and browser+DB proven:
- PWA slice 1: login (OTP), profile-setup, home stub (packages/web/app/login, profile-setup, home)
- Owner route-creation with map: packages/web/app/routes/new/page.tsx + packages/web/components/RouteMap.tsx + packages/web/components/PlaceSearch.tsx
- Owner offer-posting: packages/web/app/offers/new/page.tsx
- Rider request submission: packages/web/app/requests/new/page.tsx
- Shared API layer: packages/web/lib/api.ts (PlaceResult, RouteOption, CommuteRoute, CreateRouteBody, CreateOfferBody, CreateRequestBody, CreateBookingBody, Match/MatchOffer/MatchRequest/MatchBooking types + all callers)

Backend (prior sessions):
- GET /places/search — Places API New proxy, server-side only, behind requireAuth (packages/api/src/routes/places.ts + services/places.ts)
- GET /matches — returns matches for calling user (owner or rider), includes nested offer.route addresses, offer.owner_id, request pickup/dropoff addresses, bookings array with status (packages/api/src/routes/matches.ts)

Matching engine: proven working with real data. On-demand trigger fires on POST /offers and POST /requests. Produced real Match rows with compatibility_score=100 and total_contribution_paise=2500 (₹25 minimum) against HITEC City → Gachibowli test data in Supabase.

/matches frontend screen (packages/web/app/matches/page.tsx):
- Match cards: truncated route addresses, period badge, ₹ contribution, days-overlap chips, walk distances, compatibility badge
- Rider: "Request booking" → inline day-confirmation (toggles over days_available ∩ days_needed, pre-selected) → POST /bookings, card updated in place on 201. Browser-proven with a second real user (+919000000001 via OTP).
- Owner: pending booking shows "Booking request received" with Accept/Decline buttons (not static status text) → POST /bookings/:id/accept|reject, card updates in place to "Booked ✓" on success. Errors render inline on the specific pending booking's card without hiding the buttons. Browser-proven including a genuine backend 400 (race condition forced via direct API call) showing the real error text, not a placeholder.
- Matches list polls GET /matches every 30s while authed (setInterval useEffect, cleans up on unmount/status change); silent failure on poll errors.
- getMatches/createBooking/acceptBooking/rejectBooking + Match types in lib/api.ts.

Session (2026-07-02) bugfix history worth knowing for next session: the first accept/reject implementation tracked `actionBookingId` and `actionError` as two separate useState variables, cleared in sequence on the failure path. Under React 18 automatic batching, both updates land in the same render, so the render guard comparing them could never be true — errors were silently swallowed. Verified via a real race (reject a booking server-side while the browser's stale UI still shows it PENDING, then click Accept → genuine 400, no error text ever appeared). Fixed by replacing both with one atomic state object (`actionState: { bookingId, submitting, error: { bookingId, message } | null }`) so submitting state and the error update together in a single render. Re-verified the same way: error text now renders correctly, success path still works. If touching action-error UI patterns elsewhere in this app, use the single-object pattern, not parallel useState calls whose ordering matters.

IMMEDIATE NEXT: to be scoped by advisor. Natural candidates: Prompt 10 (cancellation strikes/suspensions), admin portal, or re-booking semantics (see KNOWN DEFERRED DEBT below — now partially resolved, re-read before assuming it's still fully open).
- HEAD: e3cc7fb

## KNOWN DEFERRED DEBT (do not fix unless explicitly asked)

- refresh_tokens table has no cleanup job — rows accumulate forever. Fine for pilot scale.
- firstZodError helper in packages/api/src/routes/auth.ts is dead code (unused export since cookie refactor).
- No shared route-guard component on frontend — each protected page duplicates its own auth check. Revisit when adding 4th+ protected screen.
- GOOGLE_MAPS_API_KEY and DB password have appeared in plaintext in past chat history — rotate before public launch.
- Google Maps API key has no restrictions — restrict before public launch. Less urgent since Maps calls are backend-proxied except map rendering (client-side uses NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY must be added to Railway env before deploy.
- ADMIN_SOS_PHONE must be added to Railway env before deploy.
- Supabase free-tier auto-pause will break pilot if DB sits idle — decide on paid tier or keep-alive before pilot launch.
- icon-192.png and icon-512.png missing from packages/web/public/ — PWA install ("Add to Home Screen") will fail until these exist.
- enableAllProjectMcpServers: true in .claude/settings.local.json — revisit before adding any new MCP with write access.
- Prompt 10 (cancellation strikes/suspensions) deliberately deferred — Cancellation rows record penalty_applied: 0 placeholder.
- Route-deviation detection (Prompt 9b) blocked on mobile GPS — deferred until React Native exists.
- List/empty-state views for routes, offers, requests not yet built — deferred until create flows existed (they now do).
- RESOLVED (2026-07-02, commit ab6e5af): POST /bookings RULE 2 now only blocks on an existing PENDING/ACCEPTED booking for the match_id — a DECLINED/EXPIRED/CANCELLED booking no longer permanently blocks retry. Verified end-to-end via a real rider booking flow after a DECLINED prior attempt. Note: BookingStatus enum is PENDING/ACCEPTED/DECLINED/EXPIRED/CANCELLED — there is no REJECTED status despite some task docs saying "REJECTED".
- POST /bookings/:id/accept RULE 6 (cannot accept within 30 min of departure_window_start on the earliest confirmed day) will permanently block acceptance if a booking's earliest confirmed day has already passed — there is no path to un-stick a booking whose week has partially elapsed with a still-PENDING booking on it. Hit this for real during testing (a booking for week 2026-06-29 was unacceptable by 2026-07-02). Not necessarily a bug — may be correct pilot behavior (an owner shouldn't be able to "accept" a ride that already happened) — but there's currently no UI affordance explaining *why* Accept is failing in this specific case vs. a genuine race/error, since the 400 message ("Cannot accept: departure is in -X minutes...") is technical. Consider a friendlier message or an auto-expire path for these.
- Admin portal not started.
- React Native Expo app deferred — build last after pilot validates matching.
