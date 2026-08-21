import React from 'react';
import { Zap, Play, Pause, Volume2, VolumeX, TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';

export default function HeaderTicker({ indices, isRunning, onToggleSimulation, audioEnabled, setAudioEnabled, fyersLive, fyersProfile }) {
  const indexList = Object.values(indices);

  return (
    <header className="app-header w-full relative z-20">
      {/* Top Header Bar */}
      <div className="px-5 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)' }}
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30 border border-sky-400/30">
            <Zap className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-lg tracking-tight text-white glow-cyan font-sans">TradeBrahma</span>
            <span className="badge-cyan font-mono text-[9px] uppercase font-bold tracking-widest hidden sm:inline-flex">PRO TERMINAL V2.5</span>
          </div>
        </div>

        {/* Center Status Pills */}
        <div className="hidden lg:flex items-center gap-3 font-mono text-xs">
          {/* System status */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="pulse-green"></span>
            <span className="text-slate-400 font-sans text-[11px]">SYSTEM</span>
            <span className="text-emerald-400 font-bold text-[11px]">ONLINE</span>
          </div>

          {/* Fyers badge */}
          {fyersLive ? (
            <div className="flex items-center gap-2 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/40">
              <Wifi style={{ width: 13, height: 13 }} className="text-emerald-400" />
              <span className="badge-bull font-mono text-[10px] uppercase font-bold tracking-widest">FYERS LIVE</span>
              {fyersProfile && (
                <span className="text-emerald-300 text-[10px] font-bold">{fyersProfile.fy_id}</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <WifiOff style={{ width: 13, height: 13 }} className="text-slate-500" />
              <span className="text-slate-500 text-[11px]">SIMULATED</span>
            </div>
          )}

          {/* AI Confidence */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400">AI:</span>
            <span className="text-sky-400 font-bold text-[11px]">68% Bullish</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleSimulation}
            className={`btn-sec-pro text-xs px-3 py-1.5 ${isRunning ? 'border-emerald-500/40 text-emerald-400' : 'border-amber-500/40 text-amber-400'}`}
          >
            {isRunning ? (
              <><Pause style={{ width: 13, height: 13 }} className="text-emerald-400" /><span className="hidden sm:inline text-[11px]">PAUSE FEED</span></>
            ) : (
              <><Play style={{ width: 13, height: 13 }} className="text-amber-400" /><span className="hidden sm:inline text-[11px]">RESUME</span></>
            )}
          </button>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="btn-sec-pro text-xs px-2.5 py-1.5"
            title="Toggle Sound Alerts"
          >
            {audioEnabled
              ? <Volume2 style={{ width: 14, height: 14 }} className="text-sky-400" />
              : <VolumeX style={{ width: 14, height: 14 }} className="text-slate-500" />
            }
          </button>
        </div>
      </div>

      {/* Index Ticker Strip */}
      <div className="ticker-strip px-4 py-1.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-4 text-xs font-mono min-w-max">
          {indexList.map((idx) => {
            const isPositive = idx.change >= 0;
            return (
              <div key={idx.symbol}
                className="ticker-chip flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800/80 cursor-default">
                <span className="text-slate-400 font-semibold font-sans text-[11px]">{idx.symbol}:</span>
                <span className="text-white font-extrabold">{idx.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                <span className={`flex items-center font-bold text-[11px] ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositive ? <TrendingUp style={{ width: 11, height: 11 }} className="mr-0.5 inline" />
                              : <TrendingDown style={{ width: 11, height: 11 }} className="mr-0.5 inline" />}
                  {isPositive ? '+' : ''}{idx.change.toFixed(2)} ({isPositive ? '+' : ''}{idx.pChange.toFixed(2)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
