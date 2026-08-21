import React, { useMemo } from 'react';
import { BarChart2, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { INDEX_MOVERS_DATA } from '../services/marketSimulator';
import { pct, signed } from '../utils/format';

/** One contribution row: name, signed points, and a magnitude bar. */
function MoverRow({ stock, maxPoints, positive }) {
  const widthPct = (Math.abs(stock.points) / maxPoints) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-white truncate">
          {stock.symbol}
          <span className="text-[10px] text-slate-500 font-normal ml-1.5">{stock.category}</span>
        </span>
        <span className={`font-bold shrink-0 ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {signed(stock.points, 1)} pts
          <span className="text-slate-500 mx-1">·</span>
          {pct(stock.pChange)}
        </span>
      </div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{
            width: `${widthPct}%`,
            background: positive
              ? 'linear-gradient(90deg, #059669, #34d399)'
              : 'linear-gradient(90deg, #be123c, #fb7185)',
          }}
        />
      </div>
    </div>
  );
}

export default function IndexMover() {
  const movers = INDEX_MOVERS_DATA.nifty;

  // Totals are summed from the rows rather than hard-coded, so the header
  // badges always match the bars underneath them.
  const stats = useMemo(() => {
    const up = movers.positive.reduce((n, s) => n + s.points, 0);
    const down = movers.negative.reduce((n, s) => n + s.points, 0);
    const maxPoints = Math.max(
      ...movers.positive.map((p) => Math.abs(p.points)),
      ...movers.negative.map((n) => Math.abs(n.points))
    );
    return { up, down, net: up + down, maxPoints };
  }, [movers]);

  // Share of gross movement attributable to the up side.
  const gross = Math.abs(stats.up) + Math.abs(stats.down);
  const upShare = gross > 0 ? (Math.abs(stats.up) / gross) * 100 : 0;

  // Net points per sector, rolled up from the same rows shown above.
  const sectorRollup = useMemo(() => {
    const totals = new Map();
    [...movers.positive, ...movers.negative].forEach((s) => {
      totals.set(s.category, (totals.get(s.category) || 0) + s.points);
    });
    const rows = [...totals.entries()]
      .map(([category, points]) => ({ category, points }))
      .sort((a, b) => b.points - a.points);
    const scale = Math.max(...rows.map((r) => Math.abs(r.points)), 1);
    return rows.map((r) => ({ ...r, scale }));
  }, [movers]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 shrink-0">
            <BarChart2 style={{ width: 22, height: 22 }} className="text-sky-400" />
          </div>
          <div className="min-w-0">
            <h1 className="section-title text-base">IndexMover Analytics</h1>
            <p className="section-sub">Points-contribution breakdown for the Nifty 50 constituents</p>
          </div>
        </div>
        <span className="badge-cyan font-mono text-[10px] uppercase tracking-widest">NIFTY 50</span>
      </div>

      {/* Net impact summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="pro-card card-green-accent p-4">
          <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider block mb-2">
            Positive Contribution
          </span>
          <div className="text-2xl font-black text-emerald-400 glow-green">{signed(stats.up, 1)}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-sans">
            {movers.positive.length} top drivers
          </div>
        </div>

        <div className="pro-card card-red-accent p-4">
          <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider block mb-2">
            Negative Contribution
          </span>
          <div className="text-2xl font-black text-rose-400 glow-red">{signed(stats.down, 1)}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-sans">
            {movers.negative.length} top drags
          </div>
        </div>

        <div className="pro-card card-cyan-accent p-4">
          <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider block mb-2">
            Net Index Impact
          </span>
          <div className={`text-2xl font-black ${stats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {signed(stats.net, 1)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-sans">Points, top 10 movers</div>
        </div>

        <div className="pro-card card-purple-accent p-4">
          <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider block mb-2">
            Up-side Share
          </span>
          <div className="text-2xl font-black text-sky-400">{upShare.toFixed(0)}%</div>
          <div className="mt-2 meter" role="img" aria-label={`${upShare.toFixed(0)}% of gross movement is positive`}>
            <span className="meter-adv" style={{ width: `${upShare}%` }} />
            <span className="meter-dec" style={{ width: `${100 - upShare}%` }} />
          </div>
        </div>
      </div>

      {/* Drivers vs drags — one shared scale so bar lengths are comparable
          across both panels. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <TrendingUp style={{ width: 18, height: 18 }} className="text-emerald-400 shrink-0" />
              <h2 className="section-title truncate">Top Drivers</h2>
            </div>
            <span className="badge-bull font-mono shrink-0">{signed(stats.up, 1)} pts</span>
          </div>
          <div className="space-y-3.5 font-mono">
            {movers.positive.map((s) => (
              <MoverRow key={s.symbol} stock={s} maxPoints={stats.maxPoints} positive />
            ))}
          </div>
        </div>

        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <TrendingDown style={{ width: 18, height: 18 }} className="text-rose-400 shrink-0" />
              <h2 className="section-title truncate">Top Drags</h2>
            </div>
            <span className="badge-bear font-mono shrink-0">{signed(stats.down, 1)} pts</span>
          </div>
          <div className="space-y-3.5 font-mono">
            {movers.negative.map((s) => (
              <MoverRow key={s.symbol} stock={s} maxPoints={stats.maxPoints} positive={false} />
            ))}
          </div>
        </div>
      </div>

      {/* Sector attribution, rolled up from the same rows. */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Scale style={{ width: 18, height: 18 }} className="text-sky-400" />
          <h2 className="section-title">Net Contribution by Sector</h2>
        </div>

        <div className="space-y-3 font-mono">
          {sectorRollup.map((row) => {
            const isUp = row.points >= 0;
            const widthPct = (Math.abs(row.points) / row.scale) * 100;
            return (
              <div key={row.category} className="flex items-center gap-3">
                <span className="text-xs font-bold text-white w-24 shrink-0 truncate">{row.category}</span>
                {/* Two half-tracks meeting at a centre baseline: bars grow left
                    for drags and right for drivers, so sign is positional. */}
                <div className="flex-1 flex items-center min-w-0">
                  <div className="flex-1 flex justify-end">
                    {!isUp && (
                      <div
                        className="h-2 rounded-l-full"
                        style={{ width: `${widthPct}%`, background: 'linear-gradient(270deg, #be123c, #fb7185)' }}
                      />
                    )}
                  </div>
                  <div className="w-px h-4 bg-slate-700 shrink-0" />
                  <div className="flex-1">
                    {isUp && (
                      <div
                        className="h-2 rounded-r-full"
                        style={{ width: `${widthPct}%`, background: 'linear-gradient(90deg, #059669, #34d399)' }}
                      />
                    )}
                  </div>
                </div>
                <span className={`text-xs font-bold w-20 text-right shrink-0 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {signed(row.points, 1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
