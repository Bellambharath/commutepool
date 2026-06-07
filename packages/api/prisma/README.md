# Database Setup Order

Follow these steps exactly when setting up the database for the first time.

## Prerequisites

- Railway PostgreSQL instance is running
- `DATABASE_URL` is set in `.env`
- Node.js ≥ 20 and `npm install` have been run from the repo root

## Steps

### 1. Set DATABASE_URL

```bash
# In packages/api/.env (or repo root .env)
DATABASE_URL=postgresql://...
```

### 2. Create all 17 tables via Prisma

```bash
cd packages/api
npx prisma migrate dev --name init
```

Prisma reads `schema.prisma` and generates the full schema (all enums, tables,
foreign keys, B-tree indexes). This is the **only** source of truth for the
base table structure.

### 3. Add PostGIS extension + geometry columns + spatial indexes

```bash
npx prisma db execute --stdin < prisma/postgis.sql
```

This adds:
- `CREATE EXTENSION IF NOT EXISTS postgis`
- `route_geometry geometry(LINESTRING, 4326)` on `commute_routes`
- `pickup_geometry geometry(POINT, 4326)` on `weekly_requests`
- `dropoff_geometry geometry(POINT, 4326)` on `weekly_requests`
- Three `GIST` spatial indexes for `ST_DWithin` matching queries

> **Why a separate file?** Prisma's migration engine does not support PostGIS
> geometry column types natively. The geometry columns are intentionally kept
> out of `schema.prisma` to avoid drift warnings; they are managed exclusively
> via `postgis.sql`.

### 4. Generate PrismaClient

```bash
npx prisma generate
```

### 5. Seed reference data

```bash
npx tsx prisma/seed.ts
```

Seeds: 1 admin user, 2 Hyderabad fuel prices, 5 bike models with real-world mileage.

---

## One-liner (all steps)

```bash
cd packages/api && npm run db:setup
```

## Individual scripts

| Script | Command |
|---|---|
| `db:init` | `prisma migrate dev --name init` |
| `db:postgis` | `psql $DATABASE_URL -f prisma/postgis.sql` |
| `db:generate` | `prisma generate` |
| `db:seed` | `tsx prisma/seed.ts` |
| `db:setup` | All of the above in order |
| `db:studio` | `prisma studio` |
| `db:reset` | `prisma migrate reset --force` |
