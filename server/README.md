# Fyers backend server

Small Express server that owns the Fyers OAuth flow and proxies market-data
calls, so the App Secret never reaches the browser.

## One-time setup

1. Create an app at <https://myapi.fyers.in/dashboard>:
   - **App name:** anything, e.g. `TradeBrahma`
   - **Redirect URL:** `http://localhost:3001/api/fyers/callback` (must match exactly)
2. Copy `.env.example` to `.env` and paste your **App ID** and **Secret Key**.
3. Install deps from the project root (already done if you ran `npm install`).

## Run

```bash
# from the project root — starts BOTH vite (5173) and this server (3001)
npm run dev:all
```

Or separately: `npm run server` in one terminal, `npm run dev` in another.

## Connect

Open the app → Broker Settings (sidebar) → select **Fyers API v3** →
**Connect with Fyers**. Log in on the Fyers page; you'll be redirected back
with the account connected. Access tokens expire daily (~24h) — reconnect
each trading day. The token is cached in `server/.fyers-token.json`
(gitignored) so server restarts within the day stay connected.

## Endpoints

| Route | Purpose |
|---|---|
| `GET /api/fyers/login-url` | Build the Fyers OAuth URL |
| `GET /api/fyers/callback` | OAuth redirect target — exchanges code for token |
| `GET /api/fyers/status` | `{ connected, profile }` |
| `GET /api/fyers/quotes?symbols=NSE:NIFTY50-INDEX` | Proxied live quotes |
| `POST /api/fyers/logout` | Clear the stored token |
