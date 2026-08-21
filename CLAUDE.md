# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TradeBrahma** (`tradebrahma_app`) — a React 19 + Vite 8 frontend that simulates an institutional-grade Indian stock market (NSE) trading platform. There is **no backend**: all market data (indices, option chains, trade flow, AI signals) is mocked/simulated client-side.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — run oxlint (config in `.oxlintrc.json`, react + oxc plugins, `react/rules-of-hooks` is an error)

No test framework is configured. No TypeScript — plain JSX with `@types/react` for editor hints.

## Architecture

### Data flow: single simulated source of truth

`src/services/marketSimulator.js` is the core of the app:

- Exports a singleton `marketSimulator` (a `MarketSimulatorService`) — a pub/sub event emitter that ticks every **1.8s**, drifting NIFTY/BANKNIFTY prices and randomly pushing new trade-flow log entries.
- Also exports static mock-data constants consumed directly by components: `INITIAL_INDICES`, `SECTOR_DATA`, `INITIAL_AI_SIGNALS`, `INDEX_MOVERS_DATA`, `INSTITUTIONAL_FLOW`, and `generateOptionChain(atmPrice)`.
- `App.jsx` is the **only subscriber** (`marketSimulator.subscribe` in a `useEffect`); the resulting `snapshot` (`{ indices, optionChain, tradeFlowLogs, isRunning }`) is passed down to views as props. Components needing live data should follow this prop-drilling pattern rather than subscribing themselves. Simulation play/pause goes through `marketSimulator.toggleSimulation()`.

### View routing: state-driven, no router

`App.jsx` holds `activeTab` state and switches views in `renderActiveView()`:

| Tab key | Component |
|---|---|
| `pulse` (default) | `MarketPulseView` |
| `optionclock` | `OptionClock` |
| `heatmap` | `SectorHeatmap` |
| `scanners` | `AIScanners` |
| `tradeflow` | `TradeFlow` |
| `indexmover` | `IndexMover` |
| `tradex` | `TradingChart` |

Cross-view navigation for signals: `handleSelectSignal(sig)` stores the signal and jumps to the `tradex` tab — `TradingChart` pre-fills its order ticket (symbol, side, entry, SL, target) from `selectedSignal` via a sync `useEffect`.

### Notable component internals

- `TradingChart.jsx` — draws candlesticks manually on a `<canvas>` (mock random-walk data, no chart library); includes a paper-trading ticket with a ₹5,00,000 mock wallet and `canvas-confetti` on order placement.
- `BrokerSettingsModal.jsx` — mock broker-connection UI (Dhan, Zerodha, Upstox, Fyers, Angel One). It simulates a successful connection; **no real API calls are made** — credentials go nowhere.
- Icons come from `lucide-react` throughout.

## Styling conventions

- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin (no `tailwind.config` file — v4 CSS-first setup with `@import "tailwindcss"` in `src/index.css`).
- `src/index.css` additionally defines the design system as plain CSS custom classes and `:root` variables — **reuse these instead of recreating**: `.pro-card`, `.badge-bull` / `.badge-bear` / `.badge-cyan`, `.glow-cyan` / `.glow-green` / `.glow-red`, `.btn-primary-pro` / `.btn-sec-pro`, `.trade-table-pro`, `.pulse-green`.
- Dark theme only; base background `#070b14`, cards `#0d1424`, accent cyan `#38bdf8`, bull green `#10b981`, bear red `#f43f5e`. Numeric/terminal-style UI uses `.font-mono` (IBM Plex Mono).

## When extending

- New simulated data belongs in `marketSimulator.js` (constant or on the service), not inline in components.
- New views: add a tab key + case in `App.jsx`'s `renderActiveView()` and an entry in `Sidebar.jsx`.
