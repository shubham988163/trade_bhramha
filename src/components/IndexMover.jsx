import React, { useState } from 'react';
import { BarChart2, TrendingUp, TrendingDown } from 'lucide-react';
import { INDEX_MOVERS_DATA } from '../services/marketSimulator';

export default function IndexMover() {
  const [selectedIdx, setSelectedIdx] = useState('nifty');
  const movers = INDEX_MOVERS_DATA[selectedIdx];

  const maxPoints = Math.max(
    ...movers.positive.map(p => Math.abs(p.points)),
    ...movers.negative.map(n => Math.abs(n.points))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30">
            <BarChart2 className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white uppercase tracking-wide">IndexMover Analytics</h1>
            <p className="text-xs text-slate-400">Detailed points contribution breakdown for Nifty 50 & Bank Nifty</p>
          </div>
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 font-mono text-xs">
          <button
            onClick={() => setSelectedIdx('nifty')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              selectedIdx === 'nifty' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            NIFTY 50 MOVERS
          </button>
        </div>
      </div>

      {/* Main Grid: Positive vs Negative Contribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positive Contributors */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top Drivers (Positive Points)</h2>
            </div>
            <span className="badge badge-bullish">+128.0 Pts Total</span>
          </div>

          <div className="space-y-3 font-mono">
            {movers.positive.map((stock) => {
              const widthPct = (Math.abs(stock.points) / maxPoints) * 100;
              return (
                <div key={stock.symbol} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{stock.symbol} <span className="text-[10px] text-slate-500">({stock.category})</span></span>
                    <span className="text-emerald-400 font-bold">+{stock.points} Pts (+{stock.pChange}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div style={{ width: `${widthPct}%` }} className="bg-emerald-400 h-full rounded-full transition-all duration-500"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Negative Drags */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top Drags (Negative Points)</h2>
            </div>
            <span className="badge badge-bearish">-27.9 Pts Total</span>
          </div>

          <div className="space-y-3 font-mono">
            {movers.negative.map((stock) => {
              const widthPct = (Math.abs(stock.points) / maxPoints) * 100;
              return (
                <div key={stock.symbol} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{stock.symbol} <span className="text-[10px] text-slate-500">({stock.category})</span></span>
                    <span className="text-rose-400 font-bold">{stock.points} Pts ({stock.pChange}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div style={{ width: `${widthPct}%` }} className="bg-rose-400 h-full rounded-full transition-all duration-500"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
