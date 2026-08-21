import React from 'react';
import { Zap, ArrowUpRight, ArrowDownRight, BarChart3, Sparkles, TrendingUp, Activity } from 'lucide-react';
import { SECTOR_DATA, INITIAL_AI_SIGNALS } from '../services/marketSimulator';

export default function MarketPulseView({ indices, tradeFlowLogs, onSelectSignal, onNavigate }) {
  const topSectors = [...SECTOR_DATA].sort((a, b) => b.pChange - a.pChange).slice(0, 5);
  const recentLogs = tradeFlowLogs ? tradeFlowLogs.slice(0, 6) : [];

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <div className="pro-card p-5 border-sky-500/20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(4,8,20,0.95) 0%, rgba(10,18,38,0.9) 50%, rgba(4,12,28,0.95) 100%)' }}>
        {/* Background decoration */}
        <div className="absolute right-0 top-0 w-64 h-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at right top, #38bdf8 0%, transparent 70%)' }}></div>
        <div className="absolute right-24 bottom-0 w-48 h-32 opacity-5 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, #10b981 0%, transparent 70%)' }}></div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-cyan font-mono text-[10px] uppercase tracking-widest flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-sky-400" /> INSTITUTIONAL QUANT ENGINE
              </span>
              <span className="badge-bull font-mono text-[10px]">BULLISH MOMENTUM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight shimmer-text">
              AI Market Pulse
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              Real-time algorithmic scanning, option chain OI analysis, sector breath tracking &amp; paper execution.
            </p>
          </div>

          {/* AI Score + Stats */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center gap-4 font-mono shadow-2xl">
              <div className="w-14 h-14 rounded-full border-[3px] border-emerald-500/80 flex items-center justify-center
                bg-emerald-950/50 text-emerald-400 font-extrabold text-lg shadow-lg shadow-emerald-500/20">
                68%
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-sans font-bold">AI BULL SCORE</span>
                <span className="text-sm font-bold text-emerald-400 block">Strong Buying</span>
                <span className="text-[10px] text-slate-500 block">Win Rate: 79.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="pro-card card-cyan-accent p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider">NIFTY SPOT</span>
            <span className="pulse-green"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{indices.nifty.price.toFixed(2)}</span>
          </div>
          <span className={`text-xs font-bold ${indices.nifty.pChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {indices.nifty.pChange >= 0 ? '+' : ''}{indices.nifty.pChange}%
          </span>
          <div className="text-[10px] text-slate-600 mt-1 font-sans">
            H: {indices.nifty.high?.toFixed(2)} L: {indices.nifty.low?.toFixed(2)}
          </div>
        </div>

        <div className="pro-card card-green-accent p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider">FII + DII FLOW</span>
            <span className="badge-bull text-[9px]">NET BUY</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 glow-green">+₹2,280 Cr</div>
          <div className="text-[10px] text-slate-500 mt-1 font-sans">Institutional Net Buying</div>
        </div>

        <div className="pro-card card-amber-accent p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider">OPTION PCR</span>
            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">MAX PAIN: 24,550</span>
          </div>
          <div className="text-2xl font-black text-amber-400">1.24</div>
          <div className="text-[10px] text-slate-500 mt-1 font-sans">ATM IV: 13.2% (Low VIX)</div>
        </div>

        <div className="pro-card card-purple-accent p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider">MARKET BREADTH</span>
            <span className="badge-cyan text-[9px]">NIFTY 50</span>
          </div>
          <div className="text-xl font-extrabold text-sky-400">34 Adv / 16 Dec</div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex mt-2">
            <div className="bg-emerald-500 h-full rounded-l-full" style={{ width: '68%' }}></div>
            <div className="bg-rose-500 h-full rounded-r-full" style={{ width: '32%' }}></div>
          </div>
        </div>
      </div>

      {/* Main content: Signals + Sectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Signals — 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">Featured Signals</h2>
              <span className="badge-cyan text-[9px] font-mono">{INITIAL_AI_SIGNALS.length} ACTIVE</span>
            </div>
            <button onClick={() => onNavigate('scanners')} className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1">
              View All Signals →
            </button>
          </div>

          <div className="space-y-3">
            {INITIAL_AI_SIGNALS.slice(0, 5).map((sig) => {
              const isBuy = sig.signal.includes('BUY');
              return (
                <div key={sig.id} className="pro-card p-4 flex flex-wrap items-center justify-between gap-4 hover:border-sky-500/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isBuy ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-rose-500/15 border border-rose-500/30'}`}>
                      {isBuy ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : <ArrowDownRight className="w-5 h-5 text-rose-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-mono flex-wrap">
                        <span className="font-extrabold text-sm text-white">{sig.symbol}</span>
                        <span className="badge-cyan text-[9px]">{sig.type}</span>
                        <span className={`badge ${isBuy ? 'badge-bull' : 'badge-bear'} text-[9px]`}>{sig.signal}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-sans">{sig.strategy}</p>
                      {/* Confidence bar */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-24 bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-sky-500 h-full rounded-full" style={{ width: `${sig.confidence}%` }}></div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{sig.confidence}% conf</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-xs">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block uppercase">Entry</span>
                      <span className="text-white font-bold">₹{sig.entry}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block uppercase">Target</span>
                      <span className="text-emerald-400 font-bold">₹{sig.target1}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block uppercase">SL</span>
                      <span className="text-rose-400 font-bold">₹{sig.sl}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block uppercase">R:R</span>
                      <span className="text-amber-400 font-bold">{sig.rrRatio}</span>
                    </div>
                    <button onClick={() => onSelectSignal(sig)} className="btn-primary-pro text-xs py-1.5 px-3 ml-1">
                      TradeX →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Sectors + Trade Flow */}
        <div className="space-y-5">
          {/* Sector Leaders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">Top Sectors</h2>
              </div>
              <button onClick={() => onNavigate('heatmap')} className="text-xs text-sky-400 hover:text-sky-300 font-bold">
                Full Grid →
              </button>
            </div>
            <div className="space-y-2">
              {topSectors.map((sec) => {
                const isGain = sec.pChange >= 0;
                const advPct = (sec.advancing / sec.stocks) * 100;
                return (
                  <div key={sec.id} className="pro-card p-3 flex items-center justify-between hover:border-slate-700 transition-all">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-white block truncate">{sec.name}</span>
                      <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden flex mt-1.5">
                        <div className="bg-emerald-500 h-full" style={{ width: `${advPct}%` }}></div>
                        <div className="bg-rose-500 h-full flex-1"></div>
                      </div>
                    </div>
                    <div className="text-right font-mono ml-3 shrink-0">
                      <span className={`text-sm font-black ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGain ? '+' : ''}{sec.pChange}%
                      </span>
                      <span className="text-[9px] text-slate-600 block">{sec.advancing}A {sec.declining}D</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Trade Pulse */}
          {recentLogs.length > 0 && (
            <div className="pro-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">Live Order Pulse</h3>
                <span className="live-dot ml-auto"></span>
              </div>
              <div className="space-y-2">
                {recentLogs.map((log, i) => {
                  const isBull = log.sentiment === 'BULLISH';
                  return (
                    <div key={i} className="flex items-center justify-between text-[11px] font-mono py-1 border-b border-slate-800/60 last:border-0">
                      <span className="text-slate-500 w-14">{log.time}</span>
                      <span className="text-white font-bold flex-1 mx-2 truncate">{log.symbol}</span>
                      <span className={`font-bold ${isBull ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isBull ? '▲' : '▼'} {log.val}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => onNavigate('tradeflow')} className="w-full text-center text-[10px] text-sky-400 hover:text-sky-300 font-bold pt-1">
                View Full Order Flow →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pro-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <TrendingUp className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">INDIA VIX</div>
            <div className="text-lg font-black text-white font-mono">
              {indices.indiaVix?.price.toFixed(2) ?? '13.24'}
              <span className="text-rose-400 text-xs ml-2">{indices.indiaVix?.pChange?.toFixed(2) ?? '-3.36'}%</span>
            </div>
            <div className="text-[10px] text-slate-500">Volatility Index</div>
          </div>
        </div>

        <div className="pro-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">GIFT NIFTY</div>
            <div className="text-lg font-black text-white font-mono">
              {indices.giftNifty?.price.toLocaleString('en-IN') ?? '24,625'}
              <span className="text-emerald-400 text-xs ml-2">+{indices.giftNifty?.pChange?.toFixed(2) ?? '0.72'}%</span>
            </div>
            <div className="text-[10px] text-slate-500">SGX Futures</div>
          </div>
        </div>

        <div className="pro-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">BANK NIFTY</div>
            <div className="text-lg font-black text-white font-mono">
              {indices.bankNifty?.price.toLocaleString('en-IN') ?? '52,140'}
              <span className="text-emerald-400 text-xs ml-2">+{indices.bankNifty?.pChange?.toFixed(2) ?? '0.60'}%</span>
            </div>
            <div className="text-[10px] text-slate-500">Banking Index</div>
          </div>
        </div>
      </div>
    </div>
  );
}
