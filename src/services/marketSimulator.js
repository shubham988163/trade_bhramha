// Market Simulation Engine — fallback data source when no broker is connected

import { computeIndexMoverState, RAW_INDEX_CONSTITUENTS } from './indexMoverData';

const INITIAL_NIFTY_STATE = computeIndexMoverState(RAW_INDEX_CONSTITUENTS.nifty);
const INITIAL_BANKNIFTY_STATE = computeIndexMoverState(RAW_INDEX_CONSTITUENTS.bankNifty);
const INITIAL_SENSEX_STATE = computeIndexMoverState(RAW_INDEX_CONSTITUENTS.sensex);

export const INITIAL_INDICES = {
  nifty: { symbol: 'NIFTY 50', price: INITIAL_NIFTY_STATE.indexPrice, change: 146.50, pChange: 0.60, high: 24610.00, low: 24420.10 },
  bankNifty: { symbol: 'BANK NIFTY', price: INITIAL_BANKNIFTY_STATE.indexPrice, change: 312.40, pChange: 0.60, high: 52280.00, low: 51800.50 },
  sensex: { symbol: 'SENSEX', price: INITIAL_SENSEX_STATE.indexPrice, change: 425.10, pChange: 0.53, high: 80750.00, low: 80210.00 },
  indiaVix: { symbol: 'INDIA VIX', price: 13.24, change: -0.46, pChange: -3.36, high: 13.90, low: 13.10 },
  giftNifty: { symbol: 'GIFT NIFTY', price: INITIAL_NIFTY_STATE.indexPrice + 42, change: 175.00, pChange: 0.72, high: 24650.00, low: 24450.00 },
};

export const SECTOR_DATA = [
  { id: 'banking', name: 'NIFTY BANK', pChange: 0.85, stocks: 12, advancing: 9, declining: 3, leader: 'HDFCBANK (+1.4%)' },
  { id: 'it', name: 'NIFTY IT', pChange: 1.42, stocks: 10, advancing: 8, declining: 2, leader: 'INFY (+2.1%)' },
  { id: 'auto', name: 'NIFTY AUTO', pChange: -0.35, stocks: 15, advancing: 5, declining: 10, leader: 'TATAMOTORS (-1.2%)' },
  { id: 'pharma', name: 'NIFTY PHARMA', pChange: 0.54, stocks: 20, advancing: 14, declining: 6, leader: 'SUNPHARMA (+1.1%)' },
  { id: 'energy', name: 'NIFTY ENERGY', pChange: 1.15, stocks: 10, advancing: 7, declining: 3, leader: 'RELIANCE (+1.8%)' },
  { id: 'fmcg', name: 'NIFTY FMCG', pChange: -0.18, stocks: 15, advancing: 6, declining: 9, leader: 'ITC (-0.5%)' },
  { id: 'metal', name: 'NIFTY METAL', pChange: 2.05, stocks: 15, advancing: 13, declining: 2, leader: 'TATASTEEL (+2.9%)' },
  { id: 'fin', name: 'NIFTY FIN SERVICE', pChange: 0.78, stocks: 20, advancing: 15, declining: 5, leader: 'ICICIBANK (+1.3%)' },
  { id: 'media', name: 'NIFTY MEDIA', pChange: -1.10, stocks: 10, advancing: 2, declining: 8, leader: 'ZEEL (-2.3%)' },
  { id: 'realty', name: 'NIFTY REALTY', pChange: 1.88, stocks: 10, advancing: 8, declining: 2, leader: 'DLF (+3.1%)' },
];

export const INITIAL_AI_SIGNALS = [
  {
    id: 'sig-1',
    symbol: 'RELIANCE',
    sector: 'ENERGY',
    type: 'SWING_SPECTRUM',
    signal: 'BUY',
    time: '11:42 AM',
    strategy: 'Volume Breakout + 20 EMA Bounce',
    entry: 2985.50,
    sl: 2940.00,
    target1: 3040.00,
    target2: 3090.00,
    rrRatio: '1 : 2.2',
    winRate: '78%',
    status: 'ACTIVE',
    confidence: 88,
  },
  {
    id: 'sig-2',
    symbol: 'INFY',
    sector: 'IT',
    type: 'STOCK_ON',
    signal: 'BUY',
    time: '11:35 AM',
    strategy: 'RSI Bullish Divergence',
    entry: 1820.00,
    sl: 1795.00,
    target1: 1860.00,
    target2: 1895.00,
    rrRatio: '1 : 2.6',
    winRate: '82%',
    status: 'TARGET 1 MET',
    confidence: 91,
  },
  {
    id: 'sig-3',
    symbol: 'NIFTY 24600 CE',
    sector: 'INDEX OPTION',
    type: 'OPTION_CLOCK',
    signal: 'BUY_CALL',
    time: '11:28 AM',
    strategy: 'Call OI Unwinding @ Resistance',
    entry: 135.00,
    sl: 105.00,
    target1: 175.00,
    target2: 210.00,
    rrRatio: '1 : 2.5',
    winRate: '75%',
    status: 'ACTIVE',
    confidence: 85,
  },
  {
    id: 'sig-4',
    symbol: 'TATASTEEL',
    sector: 'METAL',
    type: 'SWING_SPECTRUM',
    signal: 'BUY',
    time: '11:15 AM',
    strategy: 'Supertrend Bullish Flip (15M)',
    entry: 164.20,
    sl: 160.50,
    target1: 170.00,
    target2: 174.50,
    rrRatio: '1 : 2.8',
    winRate: '80%',
    status: 'ACTIVE',
    confidence: 86,
  },
  {
    id: 'sig-5',
    symbol: 'TATAMOTORS',
    sector: 'AUTO',
    type: 'STOCK_ON',
    signal: 'SELL',
    time: '10:50 AM',
    strategy: 'Intraday Breakdown below VWAP',
    entry: 1065.00,
    sl: 1082.00,
    target1: 1040.00,
    target2: 1025.00,
    rrRatio: '1 : 2.3',
    winRate: '71%',
    status: 'ACTIVE',
    confidence: 76,
  },
];

export { RAW_INDEX_CONSTITUENTS, computeIndexMoverState };

export const INDEX_MOVERS_DATA = {
  nifty: computeIndexMoverState(RAW_INDEX_CONSTITUENTS.nifty),
  bankNifty: computeIndexMoverState(RAW_INDEX_CONSTITUENTS.bankNifty),
  sensex: computeIndexMoverState(RAW_INDEX_CONSTITUENTS.sensex)
};

export const INSTITUTIONAL_FLOW = {
  fiiNet: 1420.50, // in Cr
  diiNet: 860.20,
  fiiOiChange: '+12,450 Contracts (Call Buying)',
  sentiment: 'Strong Institutional Buying'
};

// Generate Option Chain Strikes around current NIFTY price (24,580)
export function generateOptionChain(atmPrice = 24600) {
  const strikes = [];
  const baseStrike = Math.round(atmPrice / 50) * 50;
  
  for (let i = -10; i <= 10; i++) {
    const strike = baseStrike + (i * 50);
    const isAtm = strike === baseStrike;
    const isItmCall = strike < atmPrice;
    const isItmPut = strike > atmPrice;
    
    // Simulating Realistic OI & IV
    const callOi = Math.round(Math.abs(80 - Math.abs(i) * 6) * 1250 + Math.random() * 5000);
    const putOi = Math.round(Math.abs(85 - Math.abs(i) * 5) * 1180 + Math.random() * 5000);
    
    const callLtp = isItmCall 
      ? Math.round((atmPrice - strike + Math.random() * 30 + 40) * 10) / 10 
      : Math.round(Math.max(5, 160 - (strike - atmPrice) * 0.85 + Math.random() * 10) * 10) / 10;
      
    const putLtp = isItmPut 
      ? Math.round((strike - atmPrice + Math.random() * 30 + 40) * 10) / 10 
      : Math.round(Math.max(5, 160 - (atmPrice - strike) * 0.85 + Math.random() * 10) * 10) / 10;

    strikes.push({
      strike,
      isAtm,
      call: {
        oi: callOi,
        oiChange: Math.round((Math.random() * 8000) - 2500),
        iv: Math.round((13.2 + Math.random() * 2) * 10) / 10,
        volume: Math.round(callOi * (0.8 + Math.random() * 0.5)),
        ltp: callLtp,
        change: Math.round((Math.random() * 24 - 8) * 10) / 10,
      },
      put: {
        oi: putOi,
        oiChange: Math.round((Math.random() * 8500) - 2000),
        iv: Math.round((13.5 + Math.random() * 2) * 10) / 10,
        volume: Math.round(putOi * (0.8 + Math.random() * 0.5)),
        ltp: putLtp,
        change: Math.round((Math.random() * 24 - 8) * 10) / 10,
      }
    });
  }
  return strikes;
}

// Global Event Emitter for live market updates
class MarketSimulatorService {
  constructor() {
    this.listeners = [];
    this.isRunning = true;
    this.timer = null;
    this.indices = { ...INITIAL_INDICES };
    this.rawIndexMovers = JSON.parse(JSON.stringify(RAW_INDEX_CONSTITUENTS));
    this.optionChain = generateOptionChain(this.indices.nifty.price);
    
    this.tradeFlowLogs = [
      { time: '11:44:12', symbol: 'NIFTY 24600 CE', type: 'OPTION_BUY', qty: 7500, price: 138.5, val: '₹10.38 Lac', sentiment: 'BULLISH' },
      { time: '11:43:50', symbol: 'RELIANCE', type: 'BLOCK_DEAL', qty: 25000, price: 2986.0, val: '₹7.46 Cr', sentiment: 'BULLISH' },
      { time: '11:42:10', symbol: 'HDFCBANK', type: 'VOL_SPIKE', qty: 45000, price: 1642.1, val: '₹7.38 Cr', sentiment: 'BULLISH' },
      { time: '11:40:05', symbol: 'TATAMOTORS', type: 'SHORT_BUILDUP', qty: 12000, price: 1064.5, val: '₹1.27 Cr', sentiment: 'BEARISH' },
    ];

    this.startSimulation();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this.getSnapshot()));
  }

  getSnapshot() {
    const niftyState = computeIndexMoverState(this.rawIndexMovers.nifty);
    const bankNiftyState = computeIndexMoverState(this.rawIndexMovers.bankNifty);
    const sensexState = computeIndexMoverState(this.rawIndexMovers.sensex);

    // Override indexPrice to match the simulated indices (INITIAL_INDICES)
    // This ensures consistency between Header ticker and IndexMover
    niftyState.indexPrice = this.indices.nifty.price;
    bankNiftyState.indexPrice = this.indices.bankNifty.price;
    sensexState.indexPrice = this.indices.sensex.price;

    // Recalculate pChange based on the actual base prices from constituent data
    const niftyBasePrice = this.rawIndexMovers.nifty.basePrice;
    const bankBasePrice = this.rawIndexMovers.bankNifty.basePrice;
    const sensexBasePrice = this.rawIndexMovers.sensex.basePrice;

    // Use base prices from the raw index data for accurate percentage calculations
    niftyState.pChange = Math.round(((this.indices.nifty.price - niftyBasePrice) / niftyBasePrice) * 10000) / 100;
    bankNiftyState.pChange = Math.round(((this.indices.bankNifty.price - bankBasePrice) / bankBasePrice) * 10000) / 100;
    sensexState.pChange = Math.round(((this.indices.sensex.price - sensexBasePrice) / sensexBasePrice) * 10000) / 100;

    return {
      indices: { ...this.indices },
      optionChain: [...this.optionChain],
      tradeFlowLogs: [...this.tradeFlowLogs],
      indexMovers: {
        nifty: niftyState,
        bankNifty: bankNiftyState,
        sensex: sensexState
      },
      isRunning: this.isRunning
    };
  }

  toggleSimulation() {
    this.isRunning = !this.isRunning;
    if (this.isRunning) {
      this.startSimulation();
    } else if (this.timer) {
      clearInterval(this.timer);
    }
    this.notify();
  }

  startSimulation() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.isRunning) return;

      // Random price drift for Nifty
      const niftyDelta = (Math.random() - 0.48) * 3.5;
      this.indices.nifty.price = Math.round((this.indices.nifty.price + niftyDelta) * 100) / 100;
      this.indices.nifty.change = Math.round((this.indices.nifty.change + niftyDelta) * 100) / 100;
      this.indices.nifty.pChange = Math.round((this.indices.nifty.change / 24435) * 10000) / 100;

      // Bank Nifty drift
      const bankDelta = (Math.random() - 0.47) * 9.0;
      this.indices.bankNifty.price = Math.round((this.indices.bankNifty.price + bankDelta) * 100) / 100;
      this.indices.bankNifty.change = Math.round((this.indices.bankNifty.change + bankDelta) * 100) / 100;

      // Drift index mover constituent stocks slightly
      ['nifty', 'bankNifty', 'sensex'].forEach(idxKey => {
        const rawIdx = this.rawIndexMovers[idxKey];
        if (!rawIdx) return;
        const randomConstituent = rawIdx.constituents[Math.floor(Math.random() * rawIdx.constituents.length)];
        if (randomConstituent) {
          const ptShift = Math.round((Math.random() - 0.49) * 0.4 * 10) / 10;
          randomConstituent.points = Math.round((randomConstituent.points + ptShift) * 10) / 10;
          randomConstituent.pChange = Math.round((randomConstituent.pChange + (ptShift * 0.15)) * 100) / 100;
        }
      });

      // Occasionally push a new Trade Flow order log
      if (Math.random() > 0.6) {
        const symbols = ['NIFTY 24650 CE', 'INFY', 'TATASTEEL', 'BANKNIFTY 52200 PE', 'ICICIBANK'];
        const types = ['OPTION_BUY', 'VOL_SPIKE', 'BLOCK_DEAL', 'SHORT_COVERING'];
        const sym = symbols[Math.floor(Math.random() * symbols.length)];
        const typ = types[Math.floor(Math.random() * types.length)];
        const isBull = typ !== 'SHORT_BUILDUP';
        
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];

        this.tradeFlowLogs.unshift({
          time: timeStr,
          symbol: sym,
          type: typ,
          qty: Math.floor(Math.random() * 20000 + 2000),
          price: Math.round((Math.random() * 1500 + 100) * 10) / 10,
          val: `₹${(Math.random() * 8 + 0.5).toFixed(2)} Cr`,
          sentiment: isBull ? 'BULLISH' : 'BEARISH'
        });

        if (this.tradeFlowLogs.length > 25) {
          this.tradeFlowLogs.pop();
        }
      }

      this.notify();
    }, 1800);
  }
}

export const marketSimulator = new MarketSimulatorService();
