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

- Backend: feature-complete and runtime-proven end-to-end through Prompt 9a
  (auth → profile → routes → offers → requests → matching → booking → trip
  lifecycle → SOS → payment confirmation).
- Auth refactor: refresh token moved to httpOnly cookie, CORS fixed — DONE,
  proven in PowerShell and in-browser including rotation, logout, and the
  returning-session redirect case.
- Frontend: PWA slice 1 complete — login (OTP), profile-setup, home stub.
  Proven in-browser: new user → profile-setup → home; returning ACTIVE user →
  home directly; already-authed user hitting /login → bounced to home; cookie
  survives hard refresh.
- `GET /places/search` backend proxy — DONE and runtime-proven. Raw fetch to
  Places API New (`POST places.googleapis.com/v1/places:searchText`), field
  mask `places.id,places.displayName,places.formattedAddress,places.location`,
  behind `requireAuth`, returns `{ success, data: { places: PlaceSuggestion[] }, error }`.
  Verified in-process: OTP flow for +919876543210 → token → GET /places/search?q=Hitech City Hyderabad
  returned HTTP 200 with real Places API data (placeId ChIJ32ldjNyTyzsR7qB_VeuLaBk,
  "HITEC City", lat 17.4470457, lng 78.3778342). Files: packages/api/src/services/places.ts
  (new), packages/api/src/routes/places.ts (new), packages/api/src/index.ts (mount),
  packages/shared/src/types/index.ts (PlaceSuggestion type added).
- Not started: owner route-creation UI, owner offer-posting UI, rider request
  UI (places-search endpoint now available), list/empty-state views,
  Prompt 10 (cancellation strikes — deliberately deferred), admin portal.

## KNOWN DEFERRED DEBT (do not fix unless explicitly asked)

- `refresh_tokens` table has no cleanup job — rows accumulate forever. Fine
  for pilot scale, not for production.
- `firstZodError` helper in `packages/api/src/routes/auth.ts` is dead code
  (unused export) since the cookie refactor removed its only caller.
- No shared route-guard component on the frontend yet — each protected page
  duplicates its own auth check. Fine for 2 pages, revisit at 3+.
- GOOGLE_MAPS_API_KEY and DB password have appeared in plaintext in past chat
  history — must be rotated before any public (non-pilot) launch.
- Google Maps API key currently has no restrictions (HTTP referrer / API
  restrictions) — must be restricted before public launch. Less urgent now
  that Maps calls are backend-only, but still real exposure if the key leaks.
