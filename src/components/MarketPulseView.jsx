import React, { useMemo } from 'react';
import { Zap, ArrowUpRight, ArrowDownRight, BarChart3, Sparkles, Activity } from 'lucide-react';
import { SECTOR_DATA, INITIAL_AI_SIGNALS, INSTITUTIONAL_FLOW } from '../services/marketSimulator';
import {
  computeOptionMetrics, computeBullScore, computeSignalStats, computeInstitutionalFlow,
} from '../services/marketAnalytics';
import { num, pct, inrPrice, signed } from '../utils/format';

const TONE = {
  bull: { text: 'text-emerald-400', ring: '#10b981', badge: 'badge-bull' },
  bear: { text: 'text-rose-400', ring: '#f43f5e', badge: 'badge-bear' },
  neutral: { text: 'text-slate-300', ring: '#94a3b8', badge: 'badge' },
};

/**
 * Radial score dial. The arc length encodes the score, so the ring is a second
 * read of the number rather than fixed decoration.
 */
function ScoreDial({ score, tone, size = 56 }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const color = TONE[tone]?.ring ?? TONE.neutral.ring;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-extrabold text-base ${TONE[tone]?.text ?? ''}`}
        role="img"
        aria-label={`Bull score ${score} out of 100`}
      >
        {score}
      </span>
    </div>
  );
}

/** Advance/decline meter — segment widths always sum to 100% of the track. */
function BreadthMeter({ advancing, declining }) {
  const total = Math.max(1, advancing + declining);
  return (
    <div
      className="meter"
      role="img"
      aria-label={`${advancing} advancing, ${declining} declining`}
    >
      <span className="meter-adv" style={{ width: `${(advancing / total) * 100}%` }} />
      <span className="meter-dec" style={{ width: `${(declining / total) * 100}%` }} />
    </div>
  );
}

/** One aligned metric cell inside the signal row's grid. */
function Metric({ label, value, tone }) {
  return (
    <div className="min-w-0">
      <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-sans">{label}</span>
      <span className={`block text-xs font-bold truncate ${tone}`}>{value}</span>
    </div>
  );
}

export default function MarketPulseView({
  indices, tradeFlowLogs, optionChain, onSelectSignal, onNavigate,
}) {
  const topSectors = [...SECTOR_DATA].sort((a, b) => b.pChange - a.pChange).slice(0, 6);
  const recentLogs = tradeFlowLogs ? tradeFlowLogs.slice(0, 7) : [];

  // Every headline below is computed from the data already on this screen.
  // These were previously hardcoded literals (68% / 79.4% / PCR 1.24 / max
  // pain 24,550), so they never moved and could contradict the live feed.
  const optionMetrics = useMemo(
    () => computeOptionMetrics(optionChain, indices?.nifty?.price),
    [optionChain, indices?.nifty?.price]
  );

  const bull = useMemo(
    () => computeBullScore({ indices, sectors: SECTOR_DATA, optionMetrics }),
    [indices, optionMetrics]
  );

  const stats = useMemo(() => computeSignalStats(INITIAL_AI_SIGNALS), []);
  const flow = useMemo(() => computeInstitutionalFlow(INSTITUTIONAL_FLOW), []);

  // Market-wide breadth, derived from the sector constituents rather than
  // hard-coded, so the headline always agrees with the sector list below it.
  const advTotal = SECTOR_DATA.reduce((s, x) => s + x.advancing, 0);
  const decTotal = SECTOR_DATA.reduce((s, x) => s + x.declining, 0);
  const advPct = (advTotal / (advTotal + decTotal)) * 100;

  const nifty = indices.nifty;

  return (
    <div className="space-y-5">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="pro-card p-5 border-sky-500/20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(4,8,20,0.95) 0%, rgba(10,18,38,0.9) 50%, rgba(4,12,28,0.95) 100%)' }}
      >
        <div
          className="absolute right-0 top-0 w-72 h-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at right top, #38bdf8 0%, transparent 70%)' }}
        />
        <div className="flex flex-wrap items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-cyan font-mono text-[10px] uppercase tracking-widest flex items-center gap-1 font-bold badge-pop">
                <Sparkles style={{ width: 12, height: 12 }} /> Institutional Quant Engine
              </span>
              {bull && (
                <span className={`${TONE[bull.tone].badge} font-mono text-[10px]`}>
                  {bull.label.toUpperCase()}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight shimmer-text">
              AI Market Pulse
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              Real-time algorithmic scanning, option-chain OI analysis, sector breadth tracking
              &amp; paper execution.
            </p>
          </div>

          {bull && (
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-2xl shrink-0 w-full sm:w-auto sm:max-w-sm">
              <div className="flex items-center gap-4 font-mono">
                <ScoreDial score={bull.score} tone={bull.tone} />
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-sans font-bold">
                    AI Bull Score
                  </span>
                  <span className={`text-sm font-bold block ${TONE[bull.tone].text}`}>
                    {bull.label}
                  </span>
                  {stats && (
                    <span className="text-[10px] text-slate-500 block">
                      {stats.expectedWinRate != null && (
                        <>Est. win rate {stats.expectedWinRate.toFixed(1)}%</>
                      )}
                      {stats.closed > 0 && (
                        <> · {stats.wins}/{stats.closed} closed</>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* What the score is made of, so the number is auditable rather
                  than a black box. */}
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                {bull.components.map((c) => (
                  <div key={c.key} className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 w-[104px] shrink-0 truncate">
                      {c.label}
                    </span>
                    <div className="bar-track flex-1" style={{ height: 4 }}>
                      <div
                        className="bar-fill"
                        style={{
                          width: `${c.pct}%`,
                          background: c.pct >= 55
                            ? 'linear-gradient(90deg,#059669,#34d399)'
                            : c.pct <= 45
                            ? 'linear-gradient(90deg,#be123c,#fb7185)'
                            : 'linear-gradient(90deg,#64748b,#94a3b8)',
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 w-7 text-right shrink-0">
                      {c.pct}
                    </span>
                    <span className="text-[8px] font-mono text-slate-600 w-7 text-right shrink-0">
                      {c.weight}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 font-mono">
        <div className="pro-card card-cyan-accent p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider">Nifty Spot</span>
            <span className="pulse-green" />
          </div>
          <div className="text-2xl font-black text-white">{num(nifty.price)}</div>
          <div className={`text-xs font-bold ${nifty.pChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {signed(nifty.change)} · {pct(nifty.pChange)}
          </div>
          <div className="text-[10px] text-slate-600 mt-1 font-sans">
            H {num(nifty.high)} · L {num(nifty.low)}
          </div>
        </div>

        <div className="pro-card card-green-accent p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider">FII + DII Flow</span>
            <span className={`text-[9px] ${flow?.tone === 'bull' ? 'badge-bull' : 'badge-bear'}`}>
              {flow?.label ?? '—'}
            </span>
          </div>
          <div className={`text-2xl font-black ${flow && flow.net >= 0 ? 'text-emerald-400 glow-green' : 'text-rose-400 glow-red'}`}>
            {flow ? `${flow.net >= 0 ? '+' : '-'}₹${num(Math.abs(flow.net), 0)} Cr` : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-sans">
            {flow ? `FII ${signed(flow.fii, 0)} · DII ${signed(flow.dii, 0)} Cr` : 'No flow data'}
          </div>
        </div>

        <div className="pro-card card-amber-accent p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider">Option PCR</span>
            <span className="badge-amber text-[9px]">
              {optionMetrics?.maxPain != null ? `MAX PAIN ${num(optionMetrics.maxPain, 0)}` : 'NO CHAIN'}
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {optionMetrics?.pcr != null ? optionMetrics.pcr.toFixed(2) : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-sans">
            {optionMetrics?.atmIv != null
              ? `ATM IV ${optionMetrics.atmIv.toFixed(1)}% · ${optionMetrics.bias.toLowerCase()}`
              : 'Awaiting option chain'}
          </div>
        </div>

        <div className="pro-card card-purple-accent p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider">Market Breadth</span>
            <span className="badge-cyan text-[9px]">ALL SECTORS</span>
          </div>
          <div className="text-2xl font-black text-sky-400">
            {advTotal}<span className="text-slate-600 text-base"> / </span>{decTotal}
          </div>
          <div className="mt-2">
            <BreadthMeter advancing={advTotal} declining={decTotal} />
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-sans">
            {advPct.toFixed(0)}% advancing
          </div>
        </div>
      </div>

      {/* ── Signals + right rail ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg icon-badge-cyan shrink-0">
                <Zap style={{ width: 15, height: 15 }} />
              </div>
              <h2 className="section-title truncate">Featured Signals</h2>
              <span className="badge-cyan text-[9px] font-mono shrink-0 badge-pop">{INITIAL_AI_SIGNALS.length} ACTIVE</span>
            </div>
            <button
              onClick={() => onNavigate('scanners')}
              className="text-xs text-sky-400 hover:text-sky-300 font-bold shrink-0 focus-ring rounded px-1"
            >
              View all →
            </button>
          </div>

          <div className="space-y-3">
            {INITIAL_AI_SIGNALS.map((sig) => {
              const isBuy = sig.signal.includes('BUY');
              return (
                <div key={sig.id} className="pro-card p-4">
                  {/* Identity row */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 border ${isBuy ? 'icon-badge-green border-emerald-500/40' : 'icon-badge-rose border-rose-500/40'}`}>
                      {isBuy
                        ? <ArrowUpRight style={{ width: 18, height: 18 }} className="text-emerald-400" />
                        : <ArrowDownRight style={{ width: 18, height: 18 }} className="text-rose-400" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-mono flex-wrap">
                        <span className="font-extrabold text-sm text-white">{sig.symbol}</span>
                        <span className="badge-cyan text-[9px]">{sig.type}</span>
                        <span className={`${isBuy ? 'badge-bull' : 'badge-bear'} text-[9px]`}>{sig.signal}</span>
                        {sig.status !== 'ACTIVE' && (
                          <span className="badge-amber text-[9px]">{sig.status}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{sig.strategy}</p>
                    </div>

                    <button
                      onClick={() => onSelectSignal(sig)}
                      className="btn-primary-pro text-xs py-1.5 px-3 shrink-0 focus-ring"
                    >
                      TradeX →
                    </button>
                  </div>

                  {/* Metrics — a fixed grid, so Entry/Target/SL/R:R sit in the
                      same columns on every row and can be scanned vertically. */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-3 mt-3 pt-3 border-t border-slate-800/70 font-mono">
                    <Metric label="Entry" value={inrPrice(sig.entry)} tone="text-white" />
                    <Metric label="Target" value={inrPrice(sig.target1)} tone="text-emerald-400" />
                    <Metric label="Stop loss" value={inrPrice(sig.sl)} tone="text-rose-400" />
                    <Metric label="R : R" value={sig.rrRatio} tone="text-amber-400" />
                    <div className="col-span-3 sm:col-span-1 min-w-0">
                      <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-sans">
                        Confidence
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="bar-track" style={{ height: 6 }}>
                          <div
                            className="bar-fill"
                            style={{ width: `${sig.confidence}%`, background: 'linear-gradient(90deg,#0ea5e9,#38bdf8)' }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-300 font-bold shrink-0">{sig.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg icon-badge-green shrink-0">
                  <BarChart3 style={{ width: 15, height: 15 }} />
                </div>
                <h2 className="section-title truncate">Top Sectors</h2>
              </div>
              <button
                onClick={() => onNavigate('heatmap')}
                className="text-xs text-sky-400 hover:text-sky-300 font-bold shrink-0 focus-ring rounded px-1"
              >
                Full grid →
              </button>
            </div>

            <div className="pro-card divide-y divide-slate-800/70">
              {topSectors.map((sec) => {
                const isGain = sec.pChange >= 0;
                return (
                  <div key={sec.id} className="p-3">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-xs font-bold text-white truncate">{sec.name}</span>
                      <div className="text-right font-mono shrink-0">
                        <span className={`text-sm font-black ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pct(sec.pChange)}
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          {sec.advancing}A · {sec.declining}D
                        </span>
                      </div>
                    </div>
                    <BreadthMeter advancing={sec.advancing} declining={sec.declining} />
                  </div>
                );
              })}
            </div>
          </div>

          {recentLogs.length > 0 && (
            <div className="pro-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Activity style={{ width: 15, height: 15 }} className="text-emerald-400" />
                <h3 className="section-title">Live Order Pulse</h3>
                <span className="live-dot ml-auto" />
              </div>
              <div className="space-y-0.5">
                {recentLogs.map((log, i) => {
                  const isBull = log.sentiment === 'BULLISH';
                  return (
                    <div
                      key={`${log.time}-${log.symbol}-${i}`}
                      className="flex items-center gap-2 text-[11px] font-mono py-1.5 border-b border-slate-800/50 last:border-0"
                    >
                      <span className="text-slate-500 shrink-0 w-[52px]">{log.time.slice(0, 5)}</span>
                      <span className="text-white font-bold flex-1 truncate">{log.symbol}</span>
                      <span className={`font-bold shrink-0 ${isBull ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isBull ? '▲' : '▼'} {log.val}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => onNavigate('tradeflow')}
                className="w-full text-center text-[10px] text-sky-400 hover:text-sky-300 font-bold pt-1 focus-ring rounded"
              >
                View full order flow →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
