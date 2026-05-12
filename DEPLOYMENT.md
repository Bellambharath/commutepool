# CommutePool — Free Deployment Guide

Full stack on **pghive.in** — completely free for testing.

```
app.pghive.in    → Angular PWA       (Netlify — free)
admin.pghive.in  → Admin Portal      (Netlify — free)
api.pghive.in    → NestJS API        (Render  — free, sleeps after 15 min)
                   PostgreSQL        (Render  — free, 1 GB, expires in 30 days)
                   Redis Key-Value   (Render  — free)
```

---

## Step 1 — Deploy Backend on Render

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. **New → Blueprint** → connect `Bellambharath/commutepool`
3. Render reads `render.yaml` and provisions:
   - `commutepool-api` (free web service, Node 20, Singapore)
   - `commutepool-db` (free PostgreSQL, Singapore)
   - `commutepool-redis` (free Key-Value, Singapore)
4. After deploy, note your API URL → it will be:
   `https://commutepool-api.onrender.com`
5. Go to **commutepool-api → Environment** and add these manually:
   ```
   TWILIO_ACCOUNT_SID   = ACxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN    = your-token
   TWILIO_FROM          = +1XXXXXXXXXX
   ADMIN_SEED_EMAIL     = admin@commutepool.test
   ADMIN_SEED_PASSWORD  = Admin@1234!
   ```
6. Add custom domain in Render:
   - **commutepool-api → Settings → Custom Domains → Add `api.pghive.in`**
   - Render gives you a CNAME target (e.g. `commutepool-api.onrender.com`)

---

## Step 2 — Deploy PWA on Netlify

1. Go to [netlify.com](https://netlify.com) → Sign up with GitHub
2. **Add new site → Import from Git → Bellambharath/commutepool**
3. Build settings (auto-detected from `pwa/netlify.toml`):
   - Base: `pwa`
   - Build command: `npm ci && npm run build -- --configuration production`
   - Publish: `dist/pwa/browser`
4. Deploy. Note the Netlify subdomain (e.g. `commutepool-pwa.netlify.app`)
5. **Site settings → Domain management → Add custom domain: `app.pghive.in`**
   - Netlify gives you a CNAME target

---

## Step 3 — Deploy Admin Portal on Netlify

1. Netlify → **Add new site** (second site) → same repo
2. Build settings (from `admin/netlify.toml`):
   - Base: `admin`
   - Build command: `npm ci && npm run build -- --configuration production`
   - Publish: `dist/admin/browser`
3. Deploy. Note Netlify subdomain.
4. **Site settings → Domain management → Add custom domain: `admin.pghive.in`**

---

## Step 4 — Add DNS Records in Porkbun

Log in to [porkbun.com](https://porkbun.com) → **pghive.in → DNS**

Add these records (delete any conflicting existing ones for the same host):

| Type  | Host    | Value / Target                                | TTL  |
|-------|---------|-----------------------------------------------|------|
| CNAME | api     | `commutepool-api.onrender.com`                | 600  |
| CNAME | app     | `<your-pwa-netlify-subdomain>.netlify.app`    | 600  |
| CNAME | admin   | `<your-admin-netlify-subdomain>.netlify.app`  | 600  |

> `bharath` CNAME already exists → leave it as-is.

**SSL:** Your wildcard `*.pghive.in` cert from Let's Encrypt already covers all three subdomains. Both Render and Netlify also provision their own Let's Encrypt certs automatically — no extra steps needed.

---

## Step 5 — Verify Everything

| URL | Expected |
|---|---|
| `https://api.pghive.in/health` | `{ "status": "ok" }` |
| `https://app.pghive.in` | PWA login screen |
| `https://admin.pghive.in` | Admin login screen |
| `https://bharath.pghive.in` | Your portfolio (unchanged) |

---

## Step 6 — Beat the Cold Start (Free Tier Trick)

Render free API **sleeps after 15 minutes** of no traffic. During your 15-day testing period, set up a free keep-alive ping:

1. Go to [uptimerobot.com](https://uptimerobot.com) → free account
2. **Add New Monitor:**
   - Type: HTTP(S)
   - URL: `https://api.pghive.in/health`
   - Interval: **5 minutes**
3. Done. UptimeRobot pings every 5 min → API never sleeps.
> UptimeRobot free tier allows 50 monitors at 5-min intervals — more than enough.

---

## Free Tier Limits — Know Before You Test

| Resource | Limit | Impact |
|---|---|---|
| API instance hours | 750 hrs/month | ~1 service running 24/7 — fine |
| PostgreSQL | 1 GB storage, **expires in 30 days** | ⚠️ Must upgrade or recreate after 30 days |
| Redis | In-memory only, resets on restart | OTP codes lost on restart — minor inconvenience |
| API cold start | ~60 sec if idle | Mitigated by UptimeRobot |
| Netlify bandwidth | 100 GB/month | More than enough for testing |
| Netlify build minutes | 300 min/month | ~15–20 deploys — fine |

### ⚠️ PostgreSQL 30-Day Warning
Render free PostgreSQL **expires exactly 30 days after creation** and gets deleted after a 14-day grace period.
Since you're testing for 10–15 days before deciding — you're safe.
If you continue beyond 30 days, upgrade to Render's $7/month Postgres before day 28.

---

## After Testing — Low Cost Path

When ready, upgrade only what matters:

| Upgrade | Cost | What it fixes |
|---|---|---|
| Render API → Starter | $7/mo | No cold starts, always on |
| Render Postgres → Starter | $7/mo | No expiry, 1 GB, daily backups |
| Keep Netlify free | $0 | No changes needed |

**Total production cost: ~$14/month** for a fully live CommutePool.
