import React from 'react';
import { Activity, Flame, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { INSTITUTIONAL_FLOW } from '../services/marketSimulator';

export default function TradeFlow({ tradeFlowLogs }) {
  return (
    <div className="space-y-6">
      {/* Top Telemetry Header */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white uppercase tracking-wide">TradeFlow Telemetry</h1>
            <p className="text-xs text-slate-400">Institutional order tracking, large block transactions & volume surge alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="live-dot"></span>
          <span className="text-xs font-mono text-emerald-400 font-semibold">STREAMING LIVE ORDERS</span>
        </div>
      </div>

      {/* Institutional Activity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-sans">FII Cash Net Buying</span>
            <span className="badge badge-bullish">+14.2% YoY</span>
          </div>
          <span className="text-2xl font-black text-emerald-400 glow-green">+₹{INSTITUTIONAL_FLOW.fiiNet} Cr</span>
          <span className="text-[11px] text-slate-500 block mt-1">Foreign Portfolio Investors</span>
        </div>

        <div className="glass-card p-4 font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-sans">DII Domestic Flow</span>
            <span className="badge badge-bullish">+8.4% YoY</span>
          </div>
          <span className="text-2xl font-black text-emerald-400 glow-green">+₹{INSTITUTIONAL_FLOW.diiNet} Cr</span>
          <span className="text-[11px] text-slate-500 block mt-1">Domestic Mutual Funds & Insurance</span>
        </div>

        <div className="glass-card p-4 font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-sans">FII Derivatives Position</span>
            <span className="badge badge-cyan">NET LONG</span>
          </div>
          <span className="text-lg font-bold text-white block truncate">{INSTITUTIONAL_FLOW.fiiOiChange}</span>
          <span className="text-[11px] text-sky-400 block mt-1">Options PCR Ratio 1.24</span>
        </div>
      </div>

      {/* Streaming Live Order Log Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" /> Real-time Large Transaction Feed
          </h2>
          <span className="text-xs text-slate-400 font-mono">Showing latest 25 orders</span>
        </div>

        <div className="overflow-x-auto max-h-[500px] scrollbar-thin">
          <table className="trade-table font-mono text-xs">
            <thead>
              <tr>
                <th>Time</th>
                <th>Symbol / Instrument</th>
                <th>Flow Type</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Price (₹)</th>
                <th className="text-right">Value</th>
                <th className="text-center">Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {tradeFlowLogs.map((log, idx) => {
                const isBullish = log.sentiment === 'BULLISH';

                return (
                  <tr key={idx} className="hover:bg-slate-800/80">
                    <td className="text-slate-400">{log.time}</td>
                    <td className="font-bold text-white">{log.symbol}</td>
                    <td>
                      <span className="badge badge-cyan text-[10px]">{log.type}</span>
                    </td>
                    <td className="text-right text-slate-300">{log.qty.toLocaleString('en-IN')}</td>
                    <td className="text-right font-semibold text-white">₹{log.price}</td>
                    <td className="text-right font-bold text-sky-300">{log.val}</td>
                    <td className="text-center">
                      <span className={`badge ${isBullish ? 'badge-bullish' : 'badge-bearish'}`}>
                        {isBullish ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
                        {log.sentiment}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
