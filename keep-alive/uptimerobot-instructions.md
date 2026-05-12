# UptimeRobot Keep-Alive Setup

Prevents Render free API from sleeping during your 15-day testing window.

## Steps

1. Visit https://uptimerobot.com and create a free account
2. Click **+ Add New Monitor**
3. Fill in:
   - **Monitor Type:** HTTP(S)
   - **Friendly Name:** CommutePool API Keep-Alive
   - **URL (or IP):** `https://api.pghive.in/health`
   - **Monitoring Interval:** 5 minutes
4. Click **Create Monitor**

## What it does

Pings `GET /health` every 5 minutes.
Render only sleeps after **15 minutes** of no traffic.
Result: API stays warm 24/7 for free.

## UptimeRobot Free Limits
- 50 monitors
- 5-minute minimum interval
- Email alerts on downtime
- All free, no credit card needed

## Bonus — Downtime Alerts
UptimeRobot will email you at `bharathyadav620@gmail.com` whenever the API goes down.
Add it in **Alert Contacts** when setting up the monitor.
