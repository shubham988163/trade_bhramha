import {
  LayoutDashboard, Compass, Grid, Zap, Activity, BarChart2, CandlestickChart,
} from 'lucide-react';

/**
 * Single source of truth for the view registry.
 *
 * `App.renderActiveView()`, `Sidebar`, and the global keyboard shortcuts all
 * read this list, so adding a view means adding one entry here plus the case
 * in `renderActiveView()` — the nav, the shortcut and the mobile drawer come
 * along for free.
 */
export const NAV_ITEMS = [
  { id: 'pulse', label: 'TradeBrahmand', short: 'Pulse', icon: LayoutDashboard, badge: 'LIVE' },
  { id: 'optionclock', label: 'OptionClock', short: 'Chain', icon: Compass, badge: 'HOT' },
  { id: 'heatmap', label: 'MarketWise', short: 'Sectors', icon: Grid },
  { id: 'scanners', label: 'StockOn', short: 'Signals', icon: Zap, badge: '5' },
  { id: 'tradeflow', label: 'TradeFlow', short: 'Flow', icon: Activity },
  { id: 'indexmover', label: 'IndexMover', short: 'Movers', icon: BarChart2 },
  { id: 'tradex', label: 'TradeX', short: 'TradeX', icon: CandlestickChart, highlight: true },
];
