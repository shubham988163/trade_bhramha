import React from 'react';
import { Play, Pause, Volume2, VolumeX, TrendingUp, TrendingDown, Wifi, WifiOff, Menu } from 'lucide-react';
import Logo from './Logo';
import { num, signed, pct } from '../utils/format';

export default function HeaderTicker({
  indices, isRunning, onToggleSimulation, audioEnabled, setAudioEnabled,
  fyersLive, fyersProfile, onOpenNav,
}) {
  const indexList = Object.values(indices);

  return (
    <header className="app-header w-full relative z-20 shrink-0">
      <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
        {/* Brand + mobile nav trigger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <button
            onClick={onOpenNav}
            aria-label="Open navigation"
            className="md:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus-ring"
          >
            <Menu style={{ width: 18, height: 18 }} />
          </button>

          <Logo size={32} textClass="text-base sm:text-lg" />

          <span className="badge-cyan font-mono text-[9px] uppercase font-bold tracking-widest hidden lg:inline-flex">
            Pro Terminal
          </span>
        </div>

        {/* Center status pills */}
        <div className="hidden xl:flex items-center gap-2.5 font-mono text-xs">
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className={isRunning ? 'pulse-green' : 'dot-idle'} />
            <span className="text-slate-400 font-sans text-[11px]">FEED</span>
            <span className={`font-bold text-[11px] ${isRunning ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isRunning ? 'STREAMING' : 'PAUSED'}
            </span>
          </div>

          {fyersLive ? (
            <div className="flex items-center gap-2 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/40">
              <Wifi style={{ width: 13, height: 13 }} className="text-emerald-400" />
              <span className="text-emerald-400 font-bold text-[11px]">FYERS LIVE</span>
              {fyersProfile && (
                <span className="text-emerald-300 text-[10px] font-bold">{fyersProfile.fy_id}</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <WifiOff style={{ width: 13, height: 13 }} className="text-slate-500" />
              <span className="text-slate-500 text-[11px]">SIMULATED DATA</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleSimulation}
            aria-pressed={isRunning}
            title={isRunning ? 'Pause the live feed' : 'Resume the live feed'}
            className={`btn-sec-pro text-xs px-3 py-1.5 focus-ring ${
              isRunning ? 'border-emerald-500/40 text-emerald-400' : 'border-amber-500/40 text-amber-400'
            }`}
          >
            {isRunning
              ? <><Pause style={{ width: 13, height: 13 }} /><span className="hidden sm:inline text-[11px]">PAUSE</span></>
              : <><Play style={{ width: 13, height: 13 }} /><span className="hidden sm:inline text-[11px]">RESUME</span></>}
          </button>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            aria-pressed={audioEnabled}
            title={audioEnabled ? 'Mute sound alerts' : 'Enable sound alerts'}
            className="btn-sec-pro text-xs px-2.5 py-1.5 focus-ring"
          >
            {audioEnabled
              ? <Volume2 style={{ width: 14, height: 14 }} className="text-sky-400" />
              : <VolumeX style={{ width: 14, height: 14 }} className="text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Index ticker strip */}
      <div className="ticker-strip px-3 sm:px-4 py-1.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-3 text-xs font-mono min-w-max">
          {indexList.map((idx) => {
            const isPositive = idx.change >= 0;
            const Arrow = isPositive ? TrendingUp : TrendingDown;
            return (
              <div
                key={idx.symbol}
                className="ticker-chip flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800/80 cursor-default"
              >
                <span className="text-slate-400 font-semibold font-sans text-[11px]">{idx.symbol}</span>
                <span className="text-white font-extrabold">{num(idx.price)}</span>
                <span className={`flex items-center gap-1 font-bold text-[11px] ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <Arrow style={{ width: 11, height: 11 }} />
                  {signed(idx.change)}
                  <span className="text-slate-500">·</span>
                  {pct(idx.pChange)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
