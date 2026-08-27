# 🚀 Public Launch — Render + Free SSL

Deploy **Trade_wid_SP** publicly on Render's free tier. Render gives you a
public HTTPS URL automatically — TLS is provisioned and **auto-renewed for
free** — and the single web service runs both the frontend and the Fyers `/api`
proxy on the same origin.

**Public URL:** `https://tradewidsp.onrender.com` (subdomain = service name;
change it in `render.yaml` if taken).

---

## What was set up

| File | What it does |
|---|---|
| `server/index.js` | Now serves the built frontend (`dist/`) **plus** `/api` on one process. Derives the public URL from Render's `RENDER_EXTERNAL_URL`, so the Fyers redirect URI and CORS origin point at `https://…` automatically. Token file writes are guarded against Render's ephemeral disk. |
| `package.json` | Added `start` (what Render runs) and `engines.node >= 20`. |
| `render.yaml` | Render Blueprint — free plan, `npm run build` then `npm start`, with `FYERS_APP_ID` / `FYERS_SECRET` requested at deploy time. |

Secrets stay safe: `.env`, `*.token.json`, and `.fyers-token.json` are gitignored
and are never pushed to GitHub.

---

## Deploy (one-time, ~10 min)

1. **Push this repo to GitHub** (origin is already `shubham988163/trade_bhramha`):
   ```bash
   git add .
   git commit -m "feat: render deployment — serve frontend + api on one origin"
   git push origin main
   ```

2. **Create the service on Render**
   - Go to <https://dashboard.render.com> (sign up free if needed).
   - **New → Blueprint** → connect your GitHub account → pick `trade_bhramha`.
   - Render reads `render.yaml`, creates the `tradewidsp` web service, and asks
     you to fill in the env vars:
     - `FYERS_APP_ID` → `J8ZMHWBTBW-100`
     - `FYERS_SECRET` → your Fyers secret key
   - Click **Apply**. The first build + deploy takes a few minutes.

3. **Point Fyers at the live URL** (critical)
   - Open <https://myapi.fyers.in/dashboard> → your **Trade_wid_SP** app.
   - Change **Redirect URL** to:
     ```
     https://tradewidsp.onrender.com/api/fyers/callback
     ```
   - The server already uses this as `FYERS_REDIRECT_URI` automatically
     (derived from the Render URL). You don't need to set it in Render.

4. **Open it**
   - Visit `https://tradewidsp.onrender.com` → you'll get the public landing page.
   - Click **Launch Terminal** → Broker Settings → Fyers → Connect → log in.
   - Fyers redirects back to the app over HTTPS and you'll see **FYERS LIVE**.

---

## How the free SSL works

- Render terminates TLS at their edge and issues a certificate for
  `*.onrender.com` automatically — nothing to install, renew, or configure.
- All app traffic is HTTPS; the Fyers OAuth callback is served over HTTPS too
  (Fyers requires an HTTPS redirect URI).

---

## Known caveats of the free plan

- **Cold start:** the free web service sleeps after ~15 min of inactivity. The
  first visit after a nap takes ~30–60 s to spin up, then stays warm.
- **Ephemeral disk:** the Fyers token file isn't persistent across redeploys.
  Tokens expire daily anyway, so you reconnect each trading day — same as local.
- **750 instance-hours/month** are included; a single always-warm service uses
  ~720 (leaves headroom for other projects).

---

## Re-deploy after code changes

Push to `main` → Render auto-deploys (or use the dashboard **Manual Deploy**).

## Local test of the production build

```bash
npm run build     # builds dist/
npm start         # serves dist/ + /api on :3001, same as Render will
# open http://localhost:3001
```
