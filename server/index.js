import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config(); // root .env
dotenv.config({ path: path.join(__dirname, '.env') }); // server/.env

const TOKEN_FILE = path.join(__dirname, '.fyers-token.json');

const FYERS_APP_ID = process.env.FYERS_APP_ID || '';
const FYERS_SECRET = process.env.FYERS_SECRET || '';
const FYERS_REDIRECT_URI =
  process.env.FYERS_REDIRECT_URI || 'http://localhost:3001/api/fyers/callback';
const PORT = Number(process.env.PORT) || 3001;

const FYERS_API_BASE = 'https://api-t1.fyers.in/api/v3';
const FYERS_DATA_BASE = 'https://api-t1.fyers.in/data';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// In-memory token state, hydrated from disk so a daily token survives restarts.
let session = { accessToken: null, refreshToken: null, profile: null };
try {
  if (fs.existsSync(TOKEN_FILE)) {
    session = { ...session, ...JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8')) };
  }
} catch {
  // Corrupt token file — start fresh.
}

function persistSession() {
  fs.writeFileSync(
    TOKEN_FILE,
    JSON.stringify({ accessToken: session.accessToken, refreshToken: session.refreshToken }, null, 2)
  );
}

const app = express();
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

function authHeader() {
  return { Authorization: `${FYERS_APP_ID}:${session.accessToken}` };
}

// --- Auth flow -------------------------------------------------------------

app.get('/api/fyers/login-url', (req, res) => {
  if (!FYERS_APP_ID) {
    return res.status(400).json({ error: 'FYERS_APP_ID not configured in server/.env' });
  }
  const params = new URLSearchParams({
    client_id: FYERS_APP_ID,
    redirect_uri: FYERS_REDIRECT_URI,
    response_type: 'code',
    state: 'tradewidsp',
  });
  res.json({ url: `${FYERS_API_BASE}/generate-authcode?${params}` });
});

// Fyers redirects here after the user logs in (registered redirect URI).
app.get('/api/fyers/callback', async (req, res) => {
  const { auth_code: authCode, code } = req.query;
  const authcode = authCode || code;
  if (!authcode) {
    return res.redirect(`${FRONTEND_URL}/?fyers=error&reason=no_auth_code`);
  }

  try {
    const appIdHash = crypto
      .createHash('sha256')
      .update(`${FYERS_APP_ID}:${FYERS_SECRET}`)
      .digest('hex');

    const resp = await fetch(`${FYERS_API_BASE}/validate-authcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        appIdHash,
        code: authcode,
      }),
    });
    const data = await resp.json();

    if (data.s !== 'ok' || !data.access_token) {
      console.error('[fyers] token exchange failed:', data);
      return res.redirect(`${FRONTEND_URL}/?fyers=error&reason=token_exchange`);
    }

    session.accessToken = data.access_token;
    session.refreshToken = data.refresh_token || null;
    persistSession();

    // Best-effort profile fetch so the UI can show who connected.
    try {
      const p = await fetch(`${FYERS_API_BASE}/profile`, { headers: authHeader() });
      const pData = await p.json();
      if (pData.s === 'ok') session.profile = pData.data;
    } catch {
      session.profile = null;
    }

    res.redirect(`${FRONTEND_URL}/?fyers=connected`);
  } catch (err) {
    console.error('[fyers] callback error:', err);
    res.redirect(`${FRONTEND_URL}/?fyers=error&reason=server`);
  }
});

// Validate auth code manually (e.g. if redirect URI was set to https://fyers.in)
app.post('/api/fyers/validate-code', async (req, res) => {
  let { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Auth code is required' });
  }

  // If user pasted a full URL like https://fyers.in/?auth_code=... or similar
  if (code.includes('auth_code=') || code.includes('code=')) {
    try {
      const parsedUrl = new URL(code.startsWith('http') ? code : `https://${code}`);
      code = parsedUrl.searchParams.get('auth_code') || parsedUrl.searchParams.get('code') || code;
    } catch {
      // Keep original code if URL parsing fails
    }
  }

  try {
    const appIdHash = crypto
      .createHash('sha256')
      .update(`${FYERS_APP_ID}:${FYERS_SECRET}`)
      .digest('hex');

    const resp = await fetch(`${FYERS_API_BASE}/validate-authcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        appIdHash,
        code: code.trim(),
      }),
    });
    const data = await resp.json();

    if (data.s !== 'ok' || !data.access_token) {
      return res.status(400).json({ error: data.message || 'Token exchange failed', details: data });
    }

    session.accessToken = data.access_token;
    session.refreshToken = data.refresh_token || null;
    persistSession();

    try {
      const p = await fetch(`${FYERS_API_BASE}/profile`, { headers: authHeader() });
      const pData = await p.json();
      if (pData.s === 'ok') session.profile = pData.data;
    } catch {
      session.profile = null;
    }

    return res.json({ ok: true, profile: session.profile });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

app.get('/api/fyers/status', async (req, res) => {
  if (!session.accessToken) {
    return res.json({ connected: false });
  }
  try {
    const resp = await fetch(`${FYERS_API_BASE}/profile`, { headers: authHeader() });
    const data = await resp.json();
    if (data.s === 'ok') {
      session.profile = data.data;
      return res.json({ connected: true, profile: data.data });
    }
    if (resp.status === 401 || data.code === -16 || data.code === -8) {
      session.accessToken = null;
      persistSession();
      return res.json({ connected: false, expired: true });
    }
    return res.json({ connected: true, profile: session.profile });
  } catch {
    res.json({ connected: true, profile: session.profile });
  }
});

app.post('/api/fyers/logout', (req, res) => {
  session = { accessToken: null, refreshToken: null, profile: null };
  persistSession();
  res.json({ ok: true });
});

// --- Market data proxies ------------------------------------------------------

// Fetch live market quotes using Fyers Depth / Quote API
app.get('/api/fyers/quotes', async (req, res) => {
  if (!session.accessToken) {
    return res.status(401).json({ error: 'Not connected to Fyers' });
  }
  const symbolsQuery = req.query.symbols;
  if (!symbolsQuery) {
    return res.status(400).json({ error: 'symbols query param required' });
  }

  const symbolList = symbolsQuery.split(',').map(s => s.trim()).filter(Boolean);

  // Fyers /data/quotes takes up to 50 comma-separated symbols in ONE request
  // and already returns the { n, v: { lp, ch, chp, ... } } shape the client
  // parses. The previous implementation fanned out one /data/depth call per
  // symbol: at 10 symbols on a 2s poll that is 300 req/min, over the 200/min
  // account limit. Batched, the same poll costs 30 req/min.
  try {
    const url = `${FYERS_DATA_BASE}/quotes?symbols=${encodeURIComponent(symbolList.join(','))}`;
    const resp = await fetch(url, { headers: authHeader() });
    const json = await resp.json();

    if (json.s !== 'ok' || !Array.isArray(json.d)) {
      // Surface a throttle as 429 rather than 502 — the client backs off on
      // rate limits but treats 502 as a transient upstream blip.
      const throttled = json.code === 429 || /limit reached/i.test(json.message || '');
      return res
        .status(throttled ? 429 : 502)
        .json({ error: throttled ? 'Fyers rate limit' : 'Fyers quotes error', detail: json });
    }

    // Pass through only what the client needs, and guarantee `short_name`
    // (Fyers omits it for some index symbols).
    const data = json.d
      .filter(item => item && item.v)
      .map(item => ({
        n: item.n,
        v: {
          ...item.v,
          short_name:
            item.v.short_name ||
            item.n.split(':')[1]?.replace('-INDEX', '').replace('-EQ', '') ||
            item.n,
        },
      }));

    res.json({ s: 'ok', d: data });
  } catch (err) {
    res.status(502).json({ error: 'Fyers upstream error', detail: String(err) });
  }
});

// Fetch real historical candlestick data for any symbol & timeframe
app.get('/api/fyers/history', async (req, res) => {
  if (!session.accessToken) {
    return res.status(401).json({ error: 'Not connected to Fyers' });
  }

  const symbol = req.query.symbol || 'NSE:RELIANCE-EQ';
  const resolution = req.query.resolution || '5';
  const days = Number(req.query.days) || (resolution === '1D' ? 60 : resolution === '60' ? 15 : 5);

  const now = Math.floor(Date.now() / 1000);
  const range_from = now - (days * 86400);
  const range_to = now;

  try {
    const url = `${FYERS_DATA_BASE}/history?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&date_format=0&range_from=${range_from}&range_to=${range_to}&cont_flag=1`;
    const resp = await fetch(url, { headers: authHeader() });
    const data = await resp.json();

    if (data.s !== 'ok' || !Array.isArray(data.candles)) {
      return res.json({ s: 'ok', candles: [] });
    }

    // Format candles into standard { time, open, high, low, close, volume }
    const formatted = data.candles.map(c => {
      const [ts, open, high, low, close, vol] = c;
      const dateObj = new Date(ts * 1000);
      const timeStr = resolution === '1D' || resolution === 'D'
        ? `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })}`
        : dateObj.toTimeString().substring(0, 5);

      return {
        timestamp: ts,
        time: timeStr,
        open,
        high,
        low,
        close,
        volume: vol,
      };
    });

    res.json({ s: 'ok', symbol, resolution, candles: formatted });
  } catch (err) {
    res.status(502).json({ error: 'Fyers history upstream error', detail: String(err) });
  }
});

// Fetch live User Funds / Margin from Fyers
app.get('/api/fyers/funds', async (req, res) => {
  if (!session.accessToken) {
    return res.status(401).json({ error: 'Not connected to Fyers' });
  }
  try {
    const resp = await fetch(`${FYERS_API_BASE}/funds`, { headers: authHeader() });
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Fyers funds upstream error', detail: String(err) });
  }
});

// Fetch live User Positions from Fyers
app.get('/api/fyers/positions', async (req, res) => {
  if (!session.accessToken) {
    return res.status(401).json({ error: 'Not connected to Fyers' });
  }
  try {
    const resp = await fetch(`${FYERS_API_BASE}/positions`, { headers: authHeader() });
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Fyers positions upstream error', detail: String(err) });
  }
});

// Fetch option chain data for PCR calculation
app.get('/api/fyers/option-chain', async (req, res) => {
  if (!session.accessToken) {
    return res.status(401).json({ error: 'Not connected to Fyers' });
  }

  const symbol = req.query.symbol || 'NSE:NIFTY50-INDEX';

  try {
    const url = `${FYERS_DATA_BASE}/option-chain?symbol=${encodeURIComponent(symbol)}`;
    const resp = await fetch(url, { headers: authHeader() });
    const data = await resp.json();

    if (data.s !== 'ok' || !data.d) {
      return res.status(502).json({ error: 'Fyers option chain error', detail: data });
    }

    // Format option chain data: extract Call OI and Put OI
    const optionChain = data.d.map(strike => ({
      strike: strike.strike_price,
      call: {
        oi: Number(strike.call_oi) || 0,
        iv: Number(strike.call_iv) || 0,
        ltp: Number(strike.call_ltp) || 0,
        volume: Number(strike.call_volume) || 0,
        change: Number(strike.call_change) || 0,
        oiChange: Number(strike.call_oi_change) || 0,
      },
      put: {
        oi: Number(strike.put_oi) || 0,
        iv: Number(strike.put_iv) || 0,
        ltp: Number(strike.put_ltp) || 0,
        volume: Number(strike.put_volume) || 0,
        change: Number(strike.put_change) || 0,
        oiChange: Number(strike.put_oi_change) || 0,
      }
    }));

    res.json({ s: 'ok', d: optionChain, symbol });
  } catch (err) {
    res.status(502).json({ error: 'Fyers option chain upstream error', detail: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`[fyers-server] listening on http://localhost:${PORT}`);
  console.log(`[fyers-server] app id configured: ${FYERS_APP_ID ? 'yes' : 'NO — fill server/.env'}`);
});
