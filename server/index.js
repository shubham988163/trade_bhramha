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
const PORT = Number(process.env.PORT) || 3001;

// Public base URL. On Render this is injected automatically as
// RENDER_EXTERNAL_URL (https://<app>.onrender.com); elsewhere fall back to
// localhost. FYERS_REDIRECT_URI / FRONTEND_URL derive from it so production
// needs only FYERS_APP_ID + FYERS_SECRET set explicitly.
const PUBLIC_URL = (
  process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
).replace(/\/+$/, '');

const FYERS_REDIRECT_URI = process.env.FYERS_REDIRECT_URI || `${PUBLIC_URL}/api/fyers/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || PUBLIC_URL;

const FYERS_API_BASE = 'https://api-t1.fyers.in/api/v3';
const FYERS_DATA_BASE = 'https://api-t1.fyers.in/data';

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
  try {
    fs.writeFileSync(
      TOKEN_FILE,
      JSON.stringify({ accessToken: session.accessToken, refreshToken: session.refreshToken }, null, 2)
    );
  } catch (err) {
    // Ephemeral or read-only filesystem (e.g. Render free tier) — the token just
    // won't survive restarts, which is fine because Fyers tokens expire daily.
    console.warn('[fyers] could not persist token file:', err.message);
  }
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

    // Check response status first
    if (!resp.ok) {
      const text = await resp.text();
      console.error('[fyers] validate-authcode failed:', resp.status, text);
      return res.redirect(`${FRONTEND_URL}/?fyers=error&reason=http_${resp.status}`);
    }

    let data;
    try {
      data = await resp.json();
    } catch (parseErr) {
      console.error('[fyers] JSON parse failed:', parseErr, 'response:', await resp.text());
      return res.redirect(`${FRONTEND_URL}/?fyers=error&reason=invalid_response`);
    }

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
      if (p.ok) {
        const pData = await p.json();
        if (pData.s === 'ok') session.profile = pData.data;
      }
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

    // Check response status
    if (!resp.ok) {
      const text = await resp.text();
      console.error('[fyers] validate-code failed:', resp.status, text);
      return res.status(resp.status).json({ 
        error: `Fyers API error (${resp.status})`, 
        details: text 
      });
    }

    let data;
    try {
      data = await resp.json();
    } catch (parseErr) {
      const text = await resp.text();
      console.error('[fyers] JSON parse failed in validate-code:', parseErr, 'response:', text);
      return res.status(502).json({ 
        error: 'Invalid response from Fyers API', 
        details: text.substring(0, 200) 
      });
    }

    if (data.s !== 'ok' || !data.access_token) {
      return res.status(400).json({ error: data.message || 'Token exchange failed', details: data });
    }

    session.accessToken = data.access_token;
    session.refreshToken = data.refresh_token || null;
    persistSession();

    try {
      const p = await fetch(`${FYERS_API_BASE}/profile`, { headers: authHeader() });
      if (p.ok) {
        const pData = await p.json();
        if (pData.s === 'ok') session.profile = pData.data;
      }
    } catch {
      session.profile = null;
    }

    return res.json({ ok: true, profile: session.profile });
  } catch (err) {
    console.error('[fyers] validate-code error:', err);
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
    console.log(`[fyers-server] Fetching quotes from: ${url}`);
    console.log(`[fyers-server] Auth header: ${JSON.stringify(authHeader())}`);
    
    const resp = await fetch(url, { 
      headers: authHeader(),
      // Add timeout and proper error handling
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    console.log(`[fyers-server] Quotes response status: ${resp.status}`);
    
    const text = await resp.text();
    console.log(`[fyers-server] Quotes response text: ${text.substring(0, 500)}`);
    
    let json;
    try {
      json = JSON.parse(text);
    } catch (parseErr) {
      console.error(`[fyers-server] JSON parse error:`, parseErr);
      return res.status(502).json({ error: 'Invalid JSON from Fyers', detail: text.substring(0, 200) });
    }

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

    console.log(`[fyers-server] Successfully fetched ${data.length} quotes`);
    res.json({ s: 'ok', d: data });
  } catch (err) {
    console.error(`[fyers-server] Quotes fetch error:`, err);
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
    return res.json({ s: 'error', connected: false, error: 'Not connected to Fyers' });
  }
  try {
    const resp = await fetch(`${FYERS_API_BASE}/funds`, { headers: authHeader() });
    const data = await resp.json();
    if (data.code === -16 || data.code === -8 || resp.status === 401) {
      session.accessToken = null;
      persistSession();
      return res.json({ s: 'error', connected: false, expired: true, error: 'Session expired' });
    }
    res.json(data);
  } catch (err) {
    res.json({ s: 'error', error: 'Fyers funds upstream error', detail: String(err) });
  }
});

// Fetch live User Positions from Fyers
app.get('/api/fyers/positions', async (req, res) => {
  if (!session.accessToken) {
    return res.json({ s: 'error', connected: false, error: 'Not connected to Fyers' });
  }
  try {
    const resp = await fetch(`${FYERS_API_BASE}/positions`, { headers: authHeader() });
    const data = await resp.json();
    if (data.code === -16 || data.code === -8 || resp.status === 401) {
      session.accessToken = null;
      persistSession();
      return res.json({ s: 'error', connected: false, expired: true, error: 'Session expired' });
    }
    res.json(data);
  } catch (err) {
    res.json({ s: 'error', error: 'Fyers positions upstream error', detail: String(err) });
  }
});

// Fetch option chain data for PCR calculation
app.get('/api/fyers/option-chain', async (req, res) => {
  if (!session.accessToken) {
    return res.json({ s: 'error', connected: false, error: 'Not connected to Fyers' });
  }

  const symbol = req.query.symbol || 'NSE:NIFTY50-INDEX';

  try {
    const url = `${FYERS_DATA_BASE}/option-chain?symbol=${encodeURIComponent(symbol)}`;
    console.log(`[fyers-server] Fetching option chain from: ${url}`);
    
    const resp = await fetch(url, { 
      headers: authHeader(),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    console.log(`[fyers-server] Option chain response status: ${resp.status}`);
    
    const text = await resp.text();
    console.log(`[fyers-server] Option chain response (first 500 chars): ${text.substring(0, 500)}`);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error(`[fyers-server] Option chain JSON parse error:`, parseErr);
      return res.json({ s: 'error', error: 'Invalid JSON from Fyers', detail: text.substring(0, 200) });
    }

    if (data.code === -16 || data.code === -8 || resp.status === 401) {
      console.log(`[fyers-server] Token expired or invalid`);
      session.accessToken = null;
      persistSession();
      return res.json({ s: 'error', connected: false, expired: true, error: 'Session expired' });
    }

    if (data.s !== 'ok' || !Array.isArray(data.d)) {
      console.log(`[fyers-server] Option chain error response:`, data);
      return res.json({ s: 'error', error: 'Fyers option chain error', detail: data });
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

    console.log(`[fyers-server] Successfully fetched ${optionChain.length} strikes`);
    res.json({ s: 'ok', d: optionChain, symbol });
  } catch (err) {
    console.error(`[fyers-server] Option chain fetch error:`, err);
    res.json({ s: 'error', error: 'Fyers option chain upstream error', detail: String(err) });
  }
});

// --- Production static frontend ----------------------------------------------

// In production the built frontend (dist/) is served by this same Express
// process, so the whole app — UI + /api proxy — runs on one HTTPS origin.
// Render terminates HTTPS for us, and the browser talks same-origin to /api.
const DIST_DIR = path.join(__dirname, '..', 'dist');

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));

  // SPA fallback: the app uses hash routing (#/app/<tab>), so any non-API GET
  // path is the frontend and should load index.html.
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      return res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
    next();
  });

  console.log(`[fyers-server] serving static build from ${DIST_DIR}`);
} else {
  console.log('[fyers-server] no dist/ build found — running API-only (run `npm run build`)');
}

app.listen(PORT, () => {
  console.log(`[fyers-server] listening on http://localhost:${PORT}`);
  console.log(`[fyers-server] public URL: ${PUBLIC_URL}`);
  console.log(`[fyers-server] fyers redirect URI: ${FYERS_REDIRECT_URI}`);
  console.log(`[fyers-server] app id configured: ${FYERS_APP_ID ? 'yes' : 'NO — fill server/.env'}`);
});
