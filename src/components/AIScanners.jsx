import React, { useState } from 'react';
import { Zap, ArrowUpRight, ArrowDownRight, ShieldCheck, Copy, CheckCircle } from 'lucide-react';
import { INITIAL_AI_SIGNALS } from '../services/marketSimulator';

export default function AIScanners({ onSelectSignal }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  const filteredSignals = INITIAL_AI_SIGNALS.filter((sig) => {
    if (activeFilter === 'SWING') return sig.type === 'SWING_SPECTRUM';
    if (activeFilter === 'STOCKON') return sig.type === 'STOCK_ON';
    if (activeFilter === 'OPTION') return sig.type === 'OPTION_CLOCK';
    return true;
  });

  const handleCopy = (sig) => {
    setCopiedId(sig.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30">
            <Zap className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white uppercase tracking-wide">SwingSpectrum & StockOn Scanners</h1>
              <span className="badge badge-bullish font-mono">5 ACTIVE SIGNALS</span>
            </div>
            <p className="text-xs text-slate-400">Automated AI algorithmic scanners for momentum, breakouts & options setups</p>
          </div>
        </div>

        {/* Strategy Filter Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 font-mono text-xs">
          {[
            { id: 'ALL', label: 'All Signals' },
            { id: 'SWING', label: 'SwingSpectrum' },
            { id: 'STOCKON', label: 'StockOn (Intraday)' },
            { id: 'OPTION', label: 'Option Buying' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeFilter === tab.id ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Signal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSignals.map((sig) => {
          const isBuy = sig.signal.includes('BUY');

          return (
            <div key={sig.id} className="glass-card p-5 space-y-4 hover:border-sky-500/50 transition-all">
              {/* Card Top Row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isBuy ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-rose-500/15 border border-rose-500/30'}`}>
                    {isBuy ? <ArrowUpRight className="w-6 h-6 text-emerald-400" /> : <ArrowDownRight className="w-6 h-6 text-rose-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-white font-mono">{sig.symbol}</span>
                      <span className="badge badge-cyan">{sig.type}</span>
                    </div>
                    <span className="text-xs text-slate-400">{sig.strategy}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`badge ${isBuy ? 'badge-bullish' : 'badge-bearish'} text-xs font-bold`}>{sig.signal}</span>
                  <span className="text-[10px] text-slate-500 block font-mono mt-1">{sig.time}</span>
                </div>
              </div>

              {/* Confidence & Win Rate bar */}
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> AI Confidence Score:
                  </span>
                  <span className="text-emerald-400 font-bold">{sig.confidence}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div style={{ width: `${sig.confidence}%` }} className="bg-emerald-400 h-full"></div>
                </div>
              </div>

              {/* Levels & Targets */}
              <div className="grid grid-cols-4 gap-2 font-mono text-center text-xs">
                <div className="bg-slate-900 p-2 rounded-md border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">ENTRY</span>
                  <span className="text-white font-bold">₹{sig.entry}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-md border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">STOP LOSS</span>
                  <span className="text-rose-400 font-bold">₹{sig.sl}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-md border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">TARGET 1</span>
                  <span className="text-emerald-400 font-bold">₹{sig.target1}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-md border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">TARGET 2</span>
                  <span className="text-emerald-400 font-bold">₹{sig.target2}</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-xs text-slate-400 font-mono">
                  Risk/Reward: <strong className="text-white">{sig.rrRatio}</strong> | Win Rate: <strong className="text-emerald-400">{sig.winRate}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(sig)}
                    className="btn-secondary text-xs p-2"
                    title="Copy Trade Parameters"
                  >
                    {copiedId === sig.id ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onSelectSignal(sig)}
                    className="btn-primary text-xs"
                  >
                    Execute in TradeX
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
