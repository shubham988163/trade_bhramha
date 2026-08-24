import React from 'react';
import { Search, Circle, Settings, TrendingUp, IndianRupee, Menu } from 'lucide-react';
import { num } from '../../utils/format';

/**
 * Light-themed phone frame used across the landing page.
 *
 * The reference site renders the real product inside its mockups rather than
 * pasting a flat image, so these screens are driven by live simulator data —
 * the hero shows an actual ticking table.
 */

const AVATAR_TINTS = ['#fee2e2', '#dbeafe', '#dcfce7', '#fef3c7', '#ede9fe', '#ffe4e6'];
const AVATAR_INK = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#e11d48'];

function BottomNav({ active = 0 }) {
  const items = [
    { icon: Circle, label: 'Verse' },
    { icon: Settings, label: 'Market' },
    { icon: TrendingUp, label: 'Trade Fl…' },
    { icon: IndianRupee, label: 'Index' },
    { icon: Menu, label: 'More' },
  ];
  return (
    <div className="flex items-stretch justify-between border-t border-slate-200 bg-white px-1 pt-1.5 pb-2">
      {items.map((it, i) => {
        const Icon = it.icon;
        const on = i === active;
        return (
          <div key={it.label} className="flex-1 flex flex-col items-center gap-0.5">
            <Icon style={{ width: 11, height: 11 }} className={on ? 'text-sky-600' : 'text-slate-400'} />
            <span className={`text-[5.5px] font-semibold ${on ? 'text-sky-600' : 'text-slate-400'}`}>
              {it.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Market Rockers — the live gainers table from the reference hero. */
function RockersScreen({ rows }) {
  const up = rows.filter((r) => r.pChange >= 0).length;
  const pctUp = rows.length ? (up / rows.length) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-2.5 pt-2.5 pb-2 border-b border-slate-200">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[8px] font-extrabold tracking-wide text-slate-900">MARKET ROCKERS</span>
          <span className="flex items-center gap-1 text-[6px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
            <span className="w-1 h-1 rounded-full bg-rose-500" /> LIVE
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-md px-1.5 py-1">
          <Search style={{ width: 7, height: 7 }} className="text-slate-400" />
          <span className="text-[6px] text-slate-400">Search…</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[5.5px] text-emerald-600 font-semibold">
            ● {up} stocks ({pctUp.toFixed(1)}% Up)
          </span>
          <span className="text-[5.5px] text-rose-500 font-semibold">
            ● {rows.length - up} Down
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] gap-1 px-2.5 py-1 bg-slate-100 text-[5.5px] font-bold text-slate-500">
        <span>SYMBOL</span><span className="text-right">LTP</span><span className="text-right w-9">%CHG</span>
      </div>

      <div className="flex-1 overflow-hidden bg-white">
        {rows.map((r, i) => (
          <div key={r.symbol} className="grid grid-cols-[1fr_auto_auto] gap-1 items-center px-2.5 py-[5px] border-b border-slate-100">
            <div className="flex items-center gap-1 min-w-0">
              <span
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[5px] font-extrabold shrink-0"
                style={{ background: AVATAR_TINTS[i % 6], color: AVATAR_INK[i % 6] }}
              >
                {r.symbol.slice(0, 2)}
              </span>
              <span className="text-[6px] font-bold text-slate-800 truncate">{r.symbol}</span>
            </div>
            <span className="text-[6px] font-bold text-slate-900 text-right tabular-nums">₹{num(r.price)}</span>
            <span className={`text-[6px] font-bold text-right w-9 tabular-nums ${r.pChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {r.pChange >= 0 ? '▲' : '▼'} {Math.abs(r.pChange).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      <BottomNav active={0} />
    </div>
  );
}

/** OptionClock — PCR / bulls vs bears distribution. */
function OptionClockScreen({ pcr = 0.76 }) {
  const bulls = 56.8;
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-2.5 pt-2.5 pb-2 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-extrabold text-slate-900">Option Chain Clock</span>
          <span className="flex items-center gap-1 text-[6px] font-bold text-emerald-600">
            <span className="w-1 h-1 rounded-full bg-emerald-500" /> LIVE
          </span>
        </div>
        <div className="mt-1.5 inline-flex items-center gap-1 bg-slate-100 rounded-md px-1.5 py-0.5">
          <span className="text-[6px] font-bold text-slate-700">NIFTY 50</span>
          <span className="text-[5px] text-slate-400">▼</span>
        </div>
      </div>

      <div className="p-2.5 space-y-2 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[6.5px] font-bold text-slate-700">Market Distribution</span>
          <span className="text-[5.5px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">BEARISH</span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-2 text-center">
          <span className="text-[5.5px] text-slate-500 font-semibold block">PCR</span>
          <span className="text-[15px] font-black text-slate-900 leading-none tabular-nums">{pcr}</span>
        </div>

        <div className="space-y-1.5">
          <div className="bg-white rounded-lg border border-slate-200 p-1.5 flex items-center justify-between">
            <span className="text-[6px] font-bold text-emerald-700">🐂 BULLS (CE)</span>
            <span className="text-[6px] font-black text-slate-900">30.45Cr · {bulls}%</span>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-1.5 flex items-center justify-between">
            <span className="text-[6px] font-bold text-rose-700">🐻 BEARS (PE)</span>
            <span className="text-[6px] font-black text-slate-900">23.18Cr · {(100 - bulls).toFixed(1)}%</span>
          </div>
        </div>

        <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-200">
          <span className="bg-emerald-500" style={{ width: `${bulls}%` }} />
          <span className="bg-rose-500 border-l-2 border-slate-50" style={{ width: `${100 - bulls}%` }} />
        </div>
      </div>

      <BottomNav active={3} />
    </div>
  );
}

/** Sector heatmap grid. */
function HeatmapScreen({ sectors }) {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-2.5 pt-2.5 pb-2 border-b border-slate-200">
        <span className="text-[8px] font-extrabold text-slate-900">Sectoral Heatmap</span>
        <p className="text-[5.5px] text-slate-400 mt-0.5">Live sector breadth</p>
      </div>
      <div className="grid grid-cols-2 gap-1 p-2 flex-1 content-start">
        {sectors.slice(0, 8).map((s) => {
          const up = s.pChange >= 0;
          return (
            <div
              key={s.id}
              className="rounded-md p-1.5"
              style={{
                background: up ? 'rgba(16,185,129,0.10)' : 'rgba(244,63,94,0.10)',
                border: `1px solid ${up ? 'rgba(16,185,129,0.30)' : 'rgba(244,63,94,0.30)'}`,
              }}
            >
              <span className="text-[5.5px] font-bold text-slate-700 block truncate">{s.name}</span>
              <span className={`text-[8px] font-black ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
                {up ? '+' : ''}{s.pChange}%
              </span>
            </div>
          );
        })}
      </div>
      <BottomNav active={1} />
    </div>
  );
}

/** TradeFlow — institutional order log. */
function TradeFlowScreen({ logs = [] }) {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-2.5 pt-2.5 pb-2 border-b border-slate-200 flex items-center justify-between">
        <span className="text-[8px] font-extrabold text-slate-900">TradeFlow</span>
        <span className="flex items-center gap-1 text-[6px] font-bold text-emerald-600">
          <span className="w-1 h-1 rounded-full bg-emerald-500" /> STREAMING
        </span>
      </div>
      <div className="flex-1 overflow-hidden bg-white">
        {logs.slice(0, 9).map((l, i) => {
          const bull = l.sentiment === 'BULLISH';
          return (
            <div key={i} className="px-2.5 py-[5px] border-b border-slate-100">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[6px] font-bold text-slate-800 truncate">{l.symbol}</span>
                <span className={`text-[6px] font-black ${bull ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {bull ? '▲' : '▼'} {l.val}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[5px] text-slate-400">{l.time}</span>
                <span
                  className="text-[5px] font-bold px-1 rounded"
                  style={{ background: bull ? '#dcfce7' : '#ffe4e6', color: bull ? '#15803d' : '#be123c' }}
                >
                  {l.type}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <BottomNav active={2} />
    </div>
  );
}

/** SwingSpectrum — ranked AI signal cards. */
function SignalsScreen({ signals = [] }) {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-2.5 pt-2.5 pb-2 border-b border-slate-200 flex items-center justify-between">
        <span className="text-[8px] font-extrabold text-slate-900">SwingSpectrum</span>
        <span className="text-[5.5px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full">
          {signals.length} SIGNALS
        </span>
      </div>
      <div className="flex-1 overflow-hidden p-1.5 space-y-1.5">
        {signals.slice(0, 4).map((s) => {
          const buy = s.signal.includes('BUY');
          return (
            <div key={s.id} className="bg-white rounded-md border border-slate-200 p-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[6.5px] font-extrabold text-slate-900 truncate">{s.symbol}</span>
                <span
                  className="text-[5px] font-black px-1 py-0.5 rounded"
                  style={{ background: buy ? '#dcfce7' : '#ffe4e6', color: buy ? '#15803d' : '#be123c' }}
                >
                  {s.signal}
                </span>
              </div>
              <p className="text-[5px] text-slate-400 mt-0.5 truncate">{s.strategy}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="flex-1 h-[3px] rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${s.confidence}%` }} />
                </div>
                <span className="text-[5px] font-bold text-slate-500">{s.confidence}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <BottomNav active={4} />
    </div>
  );
}

const SCREENS = {
  rockers: RockersScreen,
  optionclock: OptionClockScreen,
  heatmap: HeatmapScreen,
  tradeflow: TradeFlowScreen,
  signals: SignalsScreen,
};

export default function PhoneMockup({ screen = 'rockers', className = '', glow = '#64c8ff', ...props }) {
  const Screen = SCREENS[screen] || RockersScreen;

  return (
    <div className={`relative ${className}`}>
      {/* Radial glow beneath the device, as on the reference site. */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 -translate-x-1/2 bottom-[-14%] w-[130%] h-[45%] pointer-events-none blur-2xl"
        style={{ background: `radial-gradient(ellipse, ${glow}55 0%, transparent 70%)` }}
      />
      <div className="relative w-[186px] rounded-[24px] bg-slate-900 p-[5px] shadow-2xl ring-1 ring-white/15">
        <div className="relative rounded-[20px] overflow-hidden bg-white h-[382px] flex flex-col">
          {/* notch */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[7px] bg-slate-900 rounded-full z-10" />
          <div className="h-3 bg-white shrink-0" />
          <div className="flex-1 min-h-0">
            <Screen {...props} />
          </div>
        </div>
      </div>
    </div>
  );
}
