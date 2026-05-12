# CommutePool Admin Portal

Angular 17 operations portal for CommutePool admins.

## Stack
- Angular 17 standalone components, signals-based state
- Collapsible sidebar shell
- Typed `AdminApiService` wired to `/api/admin/*` endpoints

## Screens

| Screen | Path | What it does |
|---|---|---|
| Login | `/login` | Admin email + password → JWT |
| Dashboard | `/dashboard` | KPI cards + user funnel bar chart |
| Users | `/users` | Searchable + paginated list; suspend / unsuspend / set eligibility |
| User Detail | `/users/:id` | Full profile + actions |
| Offers | `/offers` | Filter by status; admin cancel |
| Trips | `/trips` | Filter by status; force-complete / force-cancel |
| Support Queue | `/support` | Filter by status; navigate to thread |
| Ticket Detail | `/support/:id` | Message thread + admin reply + resolve + close |
| Safety | `/safety` | SOS tab + Incidents tab; resolve per item |
| Audit Log | `/audit` | Paginated; filter by entity type / admin |
| Analytics | `/analytics` | Trip metrics KPIs, corridor stats table, funnel bars |

## Getting Started

```bash
cd admin
npm install
npm start   # http://localhost:4201
```
