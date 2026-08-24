# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Trade_wid_SP** (`trade_wid_sp`) — a React 19 + Vite 8 trading terminal for Indian markets (NSE), fronted by a public marketing page.

Two data sources:

- **Simulated (default).** `src/services/marketSimulator.js` drives everything when no broker is connected.
- **Live (Fyers).** `server/index.js` is a small Express proxy that holds the OAuth token and forwards to Fyers; `src/services/fyersService.js` polls it. When connected, live index quotes override the simulated ones. Credentials live in `server/.env` (gitignored) — see `server/README.md`.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run server` — Fyers API proxy on :3001
- `npm run dev:all` — both together
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — oxlint (`react/rules-of-hooks` is an error)

No test framework is configured. No TypeScript — plain JSX with `@types/react` for editor hints.

## Architecture

### Data flow: single simulated source of truth

`src/services/marketSimulator.js` is the core of the app:

- Exports a singleton `marketSimulator` (a `MarketSimulatorService`) — a pub/sub event emitter that ticks every **1.8s**, drifting NIFTY/BANKNIFTY prices and randomly pushing new trade-flow log entries.
- Also exports static mock-data constants consumed directly by components: `INITIAL_INDICES`, `SECTOR_DATA`, `INITIAL_AI_SIGNALS`, `INDEX_MOVERS_DATA`, `INSTITUTIONAL_FLOW`, and `generateOptionChain(atmPrice)`.
- `App.jsx` is the **only subscriber** (`marketSimulator.subscribe` in a `useEffect`); the resulting `snapshot` (`{ indices, optionChain, tradeFlowLogs, isRunning }`) is passed down to views as props. Components needing live data should follow this prop-drilling pattern rather than subscribing themselves. Simulation play/pause goes through `marketSimulator.toggleSimulation()`.

### Routing: hash-based, no router library

`App.jsx` reads `#/app/<tab>`. With no hash it renders the public `Landing`
page; with one it renders the terminal on that tab. Back/Forward work, and a
deep link survives reload. `renderActiveView()` maps tab → component:

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
- `BrokerSettingsModal.jsx` — broker-connection UI (Dhan, Zerodha, Upstox, Fyers, Angel One). **Fyers is the only real integration**; the others are placeholder UI that simulate a connection. The Fyers path runs a genuine OAuth handshake through `server/index.js` — the app secret stays on the server and never reaches the browser.
- Icons come from `lucide-react` throughout.

### Brand

All naming, colours and contact links live in `src/brand.js`, rendered through
`src/components/Logo.jsx`. Rename in one place — do not hardcode the name.

### Adding a view

Add an entry to `src/navigation.js` (the single registry read by the sidebar,
the keyboard shortcuts and the mobile drawer) plus a case in
`renderActiveView()`.

## Styling conventions

- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin (no `tailwind.config` — v4 CSS-first setup with `@import "tailwindcss"` in `src/index.css`).
- **Never add an unlayered `* { margin: 0; padding: 0 }` reset to `index.css`.** Tailwind v4 puts utilities in `@layer utilities`, and any unlayered rule outranks every layered one — such a reset silently kills every padding and margin utility app-wide. Preflight already handles it.
- `src/index.css` additionally defines the design system as plain CSS custom classes and `:root` variables — **reuse these instead of recreating**: `.pro-card`, `.badge-bull` / `.badge-bear` / `.badge-cyan`, `.glow-cyan` / `.glow-green` / `.glow-red`, `.btn-primary-pro` / `.btn-sec-pro`, `.trade-table-pro`, `.pulse-green`.
- Dark theme only; base background `#070b14`, cards `#0d1424`, accent cyan `#38bdf8`, bull green `#10b981`, bear red `#f43f5e`. Numeric/terminal-style UI uses `.font-mono` (IBM Plex Mono).

## When extending

- New simulated data belongs in `marketSimulator.js` (constant or on the service), not inline in components.
- New views: add an entry to `src/navigation.js` and a case in `renderActiveView()`.
- Numbers render through `src/utils/format.js` (Indian locale) — do not hand-roll `toFixed`/`toLocaleString` in components.
- Landing copy lives in `src/landingContent.js`.
