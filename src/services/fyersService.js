// Fyers integration client. Talks to the local Express backend (server/index.js)
// via the Vite dev proxy at /api — the Fyers App Secret never touches the browser.

import { ALL_CONSTITUENT_SYMBOLS } from './indexMoverData';

// Fyers symbols mapped onto the simulator's index keys.
export const FYERS_INDEX_SYMBOLS = {
  nifty: 'NSE:NIFTY50-INDEX',
  bankNifty: 'NSE:NIFTYBANK-INDEX',
  sensex: 'BSE:SENSEX-INDEX',
  indiaVix: 'NSE:INDIAVIX-INDEX',
  finNifty: 'NSE:FINNIFTY-INDEX',
};

// Stock mapping helper for Fyers symbol conventions
export function toFyersSymbol(sym) {
  if (!sym) return 'NSE:RELIANCE-EQ';
  if (sym.startsWith('NSE:') || sym.startsWith('BSE:')) return sym;
  if (sym.includes('NIFTY') || sym.includes('INDEX')) {
    if (sym.includes('BANK')) return 'NSE:NIFTYBANK-INDEX';
    if (sym.includes('FIN')) return 'NSE:FINNIFTY-INDEX';
    return 'NSE:NIFTY50-INDEX';
  }
  return `NSE:${sym}-EQ`;
}

// Fyers /quotes accepts at most 50 symbols per request.
const QUOTE_CHUNK_SIZE = 50;

// Two cadences, because the request budget is the binding constraint (Fyers
// allows ~200 req/min and answers 429 past it). The five index symbols fit one
// request and drive the header ticker, so they stay fast. The ~60 constituents
// take two requests and only feed IndexMover's contribution table, which does
// not need sub-second granularity — so they poll far less often.
//   indices:      1 req / 2s  = 30 req/min
//   constituents: 2 req / 12s = 10 req/min
const POLL_INTERVAL_MS = 2000;
const CONSTITUENT_INTERVAL_MS = 12000;

// On a 429 we back off rather than keep hammering, doubling up to a ceiling.
const BACKOFF_START_MS = 15000;
const BACKOFF_MAX_MS = 120000;

async function api(path, options) {
  const resp = await fetch(`/api/fyers${path}`, options);
  return resp.json();
}

class FyersService {
  constructor() {
    this.connected = false;
    this.profile = null;
    // Lookup map keyed by every alias of a symbol (index key, 'NSE:X-EQ', 'X').
    // Used for point lookups, e.g. TradingChart resolving its active symbol.
    this.liveQuotes = null;
    // Only the five index keys. Kept separate because this is what gets merged
    // into the simulator's `indices` — spreading the alias map there would put
    // every equity and every alias into the header ticker.
    this.liveIndices = null;
    this.funds = null;
    this.positions = null;
    this.listeners = [];
    this.pollTimer = null;
    this.constituentTimer = null;
    // 429 backoff bookkeeping.
    this.throttledUntil = 0;
    this.backoffMs = 0;
    this.rateLimited = false;
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((cb) => cb(state));
  }

  getState() {
    return {
      connected: this.connected,
      profile: this.profile,
      liveQuotes: this.liveQuotes,
      liveIndices: this.liveIndices,
      rateLimited: this.rateLimited,
      funds: this.funds,
      positions: this.positions,
    };
  }

  /** Check backend session; starts the quote poller when connected. */
  async refreshStatus() {
    try {
      const data = await api('/status');
      this.connected = !!data.connected;
      this.profile = data.profile || null;
    } catch {
      this.connected = false;
      this.profile = null;
    }
    if (this.connected) {
      this.startPolling();
      this.fetchFunds();
      this.fetchPositions();
    } else {
      this.stopPolling();
      this.liveQuotes = null;
      this.liveIndices = null;
    }
    this.notify();
    return this.connected;
  }

  /** Kick off OAuth: asks the backend for the Fyers login URL and opens it. */
  async connect() {
    const data = await api('/login-url');
    if (!data.url) throw new Error(data.error || 'Could not build Fyers login URL');
    window.open(data.url, '_blank', 'width=640,height=760');
  }

  /** Validate manually entered auth_code or redirect URL */
  async validateCode(code) {
    const data = await api('/validate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (data.error) {
      throw new Error(data.error);
    }
    await this.refreshStatus();
    return data;
  }

  async logout() {
    await api('/logout', { method: 'POST' });
    this.connected = false;
    this.profile = null;
    this.liveQuotes = null;
    this.liveIndices = null;
    this.funds = null;
    this.positions = null;
    this.stopPolling();
    this.notify();
  }

  startPolling() {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => this.fetchIndexQuotes(), POLL_INTERVAL_MS);
    this.constituentTimer = setInterval(
      () => this.fetchConstituentQuotes(), CONSTITUENT_INTERVAL_MS
    );
    this.fetchIndexQuotes();
    this.fetchConstituentQuotes();
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.constituentTimer) {
      clearInterval(this.constituentTimer);
      this.constituentTimer = null;
    }
  }

  /** True while a 429 backoff is in effect. */
  isThrottled() {
    return this.throttledUntil > Date.now();
  }

  /** Register a rate-limit response and extend the backoff window. */
  noteThrottled() {
    this.backoffMs = this.backoffMs
      ? Math.min(this.backoffMs * 2, BACKOFF_MAX_MS)
      : BACKOFF_START_MS;
    this.throttledUntil = Date.now() + this.backoffMs;
    this.rateLimited = true;
    this.notify();
  }

  /** Clear throttle state after a successful call. */
  noteOk() {
    if (this.rateLimited || this.backoffMs) {
      this.backoffMs = 0;
      this.throttledUntil = 0;
      this.rateLimited = false;
      this.notify();
    }
  }

  /** Request one batch of symbols; returns entries or null on failure. */
  async fetchBatch(symbols) {
    const data = await api(`/quotes?symbols=${encodeURIComponent(symbols.join(','))}`)
      .catch(() => null);
    if (!data) return null;
    // The proxy forwards Fyers' 429 as { error, detail: { code: 429 } }.
    if (data.detail?.code === 429 || /limit reached/i.test(data.detail?.message || '')) {
      this.noteThrottled();
      return null;
    }
    if (data.s !== 'ok' || !Array.isArray(data.d)) return null;
    this.noteOk();
    return data.d;
  }

  /** Index symbols only — one request, fast cadence. */
  async fetchIndexQuotes() {
    if (this.isThrottled()) return;
    const entries = await this.fetchBatch(Object.values(FYERS_INDEX_SYMBOLS));
    if (entries) this.applyQuoteEntries(entries);
  }

  /** Index constituents — chunked, slow cadence. */
  async fetchConstituentQuotes() {
    if (this.isThrottled()) return;
    const unique = [...new Set(ALL_CONSTITUENT_SYMBOLS.map(toFyersSymbol))];
    const chunks = [];
    for (let i = 0; i < unique.length; i += QUOTE_CHUNK_SIZE) {
      chunks.push(unique.slice(i, i + QUOTE_CHUNK_SIZE));
    }
    // Sequential, not parallel: two simultaneous calls count against the
    // per-second budget and make a 429 more likely for no latency benefit here.
    for (const chunk of chunks) {
      if (this.isThrottled()) return;
      const entries = await this.fetchBatch(chunk);
      if (entries) this.applyQuoteEntries(entries);
    }
  }

  /** Fold a batch of quote entries into the lookup and index maps. */
  applyQuoteEntries(entries) {
    const quotes = {};
    const indices = {};

    for (const entry of entries) {
      const v = entry.v;
      if (!v) continue;

      const indexKey = Object.keys(FYERS_INDEX_SYMBOLS).find(
        (k) => FYERS_INDEX_SYMBOLS[k] === entry.n
      );

      const formatted = {
        symbol: v.short_name || entry.n,
        price: Number(v.lp) || 0,
        change: Number(v.ch) || 0,
        pChange: Number(v.chp) || 0,
        high: Number(v.high_price) || Number(v.lp) || 0,
        low: Number(v.low_price) || Number(v.lp) || 0,
        open: Number(v.open_price) || Number(v.lp) || 0,
        prevClose: Number(v.prev_close_price) || Number(v.lp) || 0,
        volume: Number(v.volume) || 0,
      };

      if (indexKey) {
        quotes[indexKey] = formatted;
        indices[indexKey] = formatted;
      }
      // Also key by raw symbol and bare ticker ('NSE:RELIANCE-EQ', 'RELIANCE').
      quotes[entry.n] = formatted;
      const bare = entry.n.split(':')[1]?.replace('-EQ', '')?.replace('-INDEX', '');
      if (bare) quotes[bare] = formatted;
    }

    if (Object.keys(quotes).length) {
      this.liveQuotes = { ...(this.liveQuotes || {}), ...quotes };
      if (Object.keys(indices).length) {
        this.liveIndices = { ...(this.liveIndices || {}), ...indices };
      }
      this.notify();
    }
  }

  /** Fetch real historical candlestick data for any stock from Fyers */
  async getHistoricalCandles(symbol, timeframe = '5m') {
    if (!this.connected) return null;

    const fyersSymbol = toFyersSymbol(symbol);
    // Resolution mapping for Fyers: '1', '5', '15', '60', '1D'
    const resolution = timeframe === '1D' ? '1D' : timeframe === '1h' ? '60' : timeframe.replace('m', '');

    try {
      const data = await api(`/history?symbol=${encodeURIComponent(fyersSymbol)}&resolution=${resolution}`);
      if (data.s === 'ok' && Array.isArray(data.candles) && data.candles.length > 0) {
        return data.candles;
      }
    } catch {
      // Fallback
    }
    return null;
  }

  /** Fetch user funds from Fyers */
  async fetchFunds() {
    if (!this.connected) return;
    try {
      const data = await api('/funds');
      if (data.s === 'ok') {
        this.funds = data.fund_limit || data;
        this.notify();
      }
    } catch {}
  }

  /** Fetch user positions from Fyers */
  async fetchPositions() {
    if (!this.connected) return;
    try {
      const data = await api('/positions');
      if (data.s === 'ok') {
        this.positions = data.netPositions || [];
        this.notify();
      }
    } catch {}
  }
}

export const fyersService = new FyersService();
