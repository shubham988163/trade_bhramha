/**
 * Copy for the public landing page.
 *
 * Module vocabulary is shared with the terminal so the marketing site
 * and the app speak one language (TradeVerse, MarketWise,
 * TradeFlow, StockOn, SwingSpectrum, TradeX, OptionClock, IndexMover).
 */

import { BRAND } from './brand';

export const HERO_BULLETS = [
  { icon: '🏆', text: 'Find Best Trades In Live Market' },
  { icon: '💎', text: 'Use Small Capital Efficiently' },
  { icon: '⚡', text: 'Real-Time AI-Powered Signals' },
  { icon: '🎯', text: 'Track All Sectors At A Glance' },
  { icon: '📊', text: 'Option Chain & PCR Analysis' },
];

/** Alternating image/text feature sections. `tab` deep-links into the terminal. */
export const FEATURE_SECTIONS = [
  {
    id: 'everything',
    screen: 'rockers',
    title: 'Everything A Trader Needs',
    points: ['Real-time AI-powered signals', 'Complete sectoral heatmap', 'Option chain & PCR analysis'],
    tab: 'pulse',
    accent: '#64c8ff',
  },
  {
    id: 'tradeflow',
    screen: 'tradeflow',
    title: 'Trade Flow',
    points: ['Track real-time trade movements', 'Identify institutional activity', 'Catch momentum before it fades'],
    tab: 'tradeflow',
    accent: '#4ade80',
  },
  {
    id: 'marketwise',
    screen: 'heatmap',
    title: 'Market Wise',
    points: ['Hold Winning Trades', 'Avoid False Breakout', 'Increase Trading Accuracy'],
    tab: 'heatmap',
    accent: '#8b5ef6',
  },
  {
    id: 'swing',
    screen: 'signals',
    title: 'Swing Spectrum',
    points: ['Find BO Stocks', 'Find Reversal Stocks', 'Get Broader Market Trend'],
    tab: 'scanners',
    accent: '#ffa500',
  },
];

export const MODULES = [
  { name: 'TradeVerse', desc: 'Complete trading universe at a glance', icon: 'Orbit', tab: 'pulse', accent: '#64c8ff' },
  { name: 'MarketWise', desc: 'Smart market insights & analysis', icon: 'Grid', tab: 'heatmap', accent: '#8b5ef6' },
  { name: 'TradeFlow', desc: 'Track real-time trade movements', icon: 'Activity', tab: 'tradeflow', accent: '#4ade80' },
  { name: 'StockOn', desc: 'Instant stock alerts & signals', icon: 'Zap', tab: 'scanners', accent: '#facc15' },
  { name: 'SwingSpectrum', desc: 'Identify swing trading opportunities', icon: 'Waves', tab: 'scanners', accent: '#fb7185' },
  { name: 'TradeX', desc: 'Advanced trading execution tools', icon: 'CandlestickChart', tab: 'tradex', accent: '#38bdf8' },
  { name: 'OptionClock', desc: 'Real-time option chain tracking', icon: 'Compass', tab: 'optionclock', accent: '#f97316' },
  { name: 'IndexMover', desc: 'See which stocks move the index', icon: 'BarChart2', tab: 'indexmover', accent: '#2dd4bf' },
];

export const FAQS = [
  ['What exactly is Trade_wid_SP?',
   'Trade_wid_SP is an AI-driven market scanner for Indian equities and derivatives. It watches the whole NSE universe in real time and surfaces the handful of setups worth your attention — momentum breakouts, reversals, unusual institutional flow and option-chain shifts — so you spend your time deciding, not searching.'],
  ['Who is Trade_wid_SP made for?',
   'Active intraday and swing traders in Indian markets who want an analytical edge without building their own scanning stack. It suits both people running a discretionary process and those following a fixed rulebook.'],
  ['How does Trade_wid_SP actually help me?',
   'It compresses hours of chart-flipping into a ranked list. Every signal arrives with an entry, a stop loss, two targets and a confidence score, so you can size the trade and judge the risk immediately rather than reverse-engineering the idea.'],
  ['Will Trade_wid_SP make me guaranteed profits?',
   'No. Nothing in markets is guaranteed, and any tool that claims otherwise should be treated with suspicion. Trade_wid_SP improves the quality and speed of your analysis; risk management and execution discipline remain yours. Trading carries real risk of loss.'],
  ['Is it beginner-friendly?',
   'Yes. Signals are presented in plain language with the reasoning attached, and the paper-trading terminal lets you rehearse ideas with a simulated wallet before any real money is involved.'],
  ['Which markets does it work for?',
   'NSE cash equities, index and stock F&O, with dedicated coverage of Nifty 50, Bank Nifty and the sectoral indices.'],
  ['Do I need deep technical analysis knowledge?',
   'No. The scanners do the pattern recognition and explain what triggered each signal. Existing technical knowledge lets you filter more selectively, but it is not a prerequisite.'],
  ['Can I use it with my existing strategy?',
   'Yes. Most traders use it as a discovery layer — filter by scanner type, sector or confidence, then apply your own rules to whatever survives the filter.'],
  ['Does it connect directly to my broker?',
   'It connects to Fyers for live quotes and historical candles. Order placement depends on your broker app permissions; the built-in ticket is paper trading by default, so nothing is sent to an exchange unless you explicitly wire it up.'],
  ['Can I use it on mobile?',
   'Yes. The full terminal is responsive and every module — heatmap, option chain, charts and order flow — is usable on a phone.'],
  ['Is there a free trial?',
   'Yes. You can sign up and explore the complete module set on a free trial before committing to a subscription.'],
  ['Do I need fast internet?',
   'A normal broadband or 4G connection is enough. Updates stream incrementally rather than reloading whole pages, so the terminal stays responsive on modest bandwidth.'],
  ['Can I use it for swing or intraday trading?',
   'Both. SwingSpectrum targets multi-day positional setups while StockOn and TradeFlow focus on intraday momentum and institutional activity.'],
  ['How do I start using it after purchase?',
   'Sign in, optionally connect your broker for live data, and open the terminal. No installation is required — it runs entirely in the browser.'],
  ['Is it helpful for option trading?',
   'Yes. OptionClock tracks the live chain with open interest, IV, PCR and max-pain levels, and flags OI build-up and unwinding at each strike.'],
  ['Why do traders love Trade_wid_SP?',
   'Because it removes the tedious part. Instead of scanning hundreds of charts for a setup that may not exist, you open one screen that already knows where the market is active.'],
  ['How can I contact Trade_wid_SP support?',
   'Reach the team on Telegram or WhatsApp, or email support@tradewidsp.com.'],
];

export const LEGAL_DOCS = [
  { title: 'Disclaimer', desc: 'Important legal disclaimer regarding trading risks and service limitations', accent: '#f97316' },
  { title: 'Disclosures', desc: 'Complete transparency about our services, operations, and regulatory compliance', accent: '#3b82f6' },
  { title: 'Privacy Policy', desc: 'How we collect, use, and protect your personal information and data', accent: '#22c55e' },
  { title: 'Refund Policy', desc: 'Terms and conditions for subscription cancellations and refunds', accent: '#a855f7' },
];

export const CONTACT_EMAIL = BRAND.email;
