// Fyers integration client. Talks to the local Express backend (server/index.js)
// via the Vite dev proxy at /api — the Fyers App Secret never touches the browser.

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

const POLL_INTERVAL_MS = 2000;

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
    this.pollTimer = setInterval(() => this.fetchQuotes(), POLL_INTERVAL_MS);
    this.fetchQuotes();
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /** Fetch live quotes for indices and major equities from Fyers */
  async fetchQuotes() {
    const baseSymbols = Object.values(FYERS_INDEX_SYMBOLS);
    const extraEquities = ['NSE:RELIANCE-EQ', 'NSE:TCS-EQ', 'NSE:HDFCBANK-EQ', 'NSE:INFY-EQ', 'NSE:TATAMOTORS-EQ'];
    const allSymbols = [...baseSymbols, ...extraEquities].join(',');

    try {
      const data = await api(`/quotes?symbols=${encodeURIComponent(allSymbols)}`);
      if (data.s !== 'ok' || !Array.isArray(data.d)) return;

      const quotes = {};
      const indices = {};
      for (const entry of data.d) {
        // Check if it's an index
        const indexKey = Object.keys(FYERS_INDEX_SYMBOLS).find(
          (k) => FYERS_INDEX_SYMBOLS[k] === entry.n
        );

        const v = entry.v;
        if (!v) continue;

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
        // Also index by raw symbol key (e.g. 'NSE:RELIANCE-EQ' and 'RELIANCE')
        quotes[entry.n] = formatted;
        const cleanName = entry.n.split(':')[1]?.replace('-EQ', '')?.replace('-INDEX', '');
        if (cleanName) {
          quotes[cleanName] = formatted;
        }
      }

      if (Object.keys(quotes).length) {
        this.liveQuotes = { ...(this.liveQuotes || {}), ...quotes };
        this.liveIndices = { ...(this.liveIndices || {}), ...indices };
        this.notify();
      }
    } catch {
      // Transient failure — keep showing last known quotes.
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
