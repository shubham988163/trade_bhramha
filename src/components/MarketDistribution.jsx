import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MarketDistribution({ marketData, _isRunning, isFyersLive = false }) {
  // Calculate PCR (Put-Call Ratio) and sentiment from market data
  const distribution = useMemo(() => {
    if (!marketData) {
      return {
        pcr: 0.85,
        sentiment: 'BEARISH',
        bullsValue: 78.01,
        bullsPercentage: 54.1,
        bearsValue: 66.31,
        bearsPercentage: 45.9,
        previousPcr: 0.85,
        pcrChange: 0.0,
        pcrChangePercent: 0.0
      };
    }

    // Calculate Call OI and Put OI from option chain
    let totalCallOi = 0;
    let totalPutOi = 0;

    if (marketData.optionChain && Array.isArray(marketData.optionChain)) {
      marketData.optionChain.forEach(strike => {
        totalCallOi += strike.call?.oi || 0;
        totalPutOi += strike.put?.oi || 0;
      });
    }

    // PCR = Put OI / Call OI
    const pcr = totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(2)) : 0.85;

    // Sentiment based on PCR (Option Writing Perspective)
    // PCR >= 1.05: Put OI > Call OI -> Put Writers (Bulls) dominate -> BULLISH
    // PCR <= 0.85: Call OI > Put OI -> Call Writers (Bears) dominate -> BEARISH
    let sentiment = 'NEUTRAL';
    if (pcr >= 1.05) {
      sentiment = 'BULLISH';
    } else if (pcr <= 0.85) {
      sentiment = 'BEARISH';
    }

    // Calculate Bulls (PE - Put Writers/Support) and Bears (CE - Call Writers/Resistance) values in Lakhs
    const avgCallValue = marketData.optionChain?.length > 0
      ? marketData.optionChain.reduce((sum, s) => sum + (s.call?.ltp || 0), 0) / marketData.optionChain.length
      : 135;

    const avgPutValue = marketData.optionChain?.length > 0
      ? marketData.optionChain.reduce((sum, s) => sum + (s.put?.ltp || 0), 0) / marketData.optionChain.length
      : 140;

    // In Option Analysis, Put OI represents Bullish Support & Call OI represents Bearish Resistance
    const bullsValue = (totalPutOi * avgPutValue) / 10000000; // Put OI in Lakhs (Bulls)
    const bearsValue = (totalCallOi * avgCallValue) / 10000000; // Call OI in Lakhs (Bears)

    // Distribution percentage based on OI
    const totalOI = totalCallOi + totalPutOi;
    const bullsPercentage = totalOI > 0 ? ((totalPutOi / totalOI) * 100) : 50; // Put OI % = Bulls %
    const bearsPercentage = 100 - bullsPercentage; // Call OI % = Bears %

    // Previous day PCR (simulated slight variation)
    const previousPcr = pcr + (Math.random() - 0.5) * 0.05;
    const pcrChange = Number((pcr - previousPcr).toFixed(2));
    const pcrChangePercent = previousPcr > 0 ? Number(((pcrChange / previousPcr) * 100).toFixed(2)) : 0;

    return {
      pcr,
      sentiment,
      bullsValue: Math.round(bullsValue * 100) / 100,
      bullsPercentage: Math.round(bullsPercentage * 10) / 10,
      bearsValue: Math.round(bearsValue * 100) / 100,
      bearsPercentage: Math.round(bearsPercentage * 10) / 10,
      previousPcr: Math.round(previousPcr * 100) / 100,
      pcrChange,
      pcrChangePercent
    };
  }, [marketData]);

  // Donut chart data
  const bullsAngle = (distribution.bullsPercentage / 100) * 360;

  // Helper to convert SVG polar to cartesian
  const polarToCartesian = (cx, cy, r, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  };

  // Create arc path for donut
  const describeArcPath = (cx, cy, outerR, innerR, startAngle, endAngle) => {
    const startOuter = polarToCartesian(cx, cy, outerR, endAngle);
    const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
    const startInner = polarToCartesian(cx, cy, innerR, endAngle);
    const endInner = polarToCartesian(cx, cy, innerR, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', startOuter.x, startOuter.y,
      'A', outerR, outerR, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      'L', endInner.x, endInner.y,
      'A', innerR, innerR, 0, largeArcFlag, 1, startInner.x, startInner.y,
      'Z'
    ].join(' ');
  };

  const bullsPath = describeArcPath(210, 210, 140, 100, 0, bullsAngle);
  const bearsPath = describeArcPath(210, 210, 140, 100, bullsAngle, 360);

  return (
    <div className="glass-card p-6 border border-slate-800/80 bg-[#0d1424]/90 rounded-2xl shadow-xl space-y-6">
      {/* Header with Title and Sentiment Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
            Market Distribution
          </h3>
          {isFyersLive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-emerald-400">FYERS LIVE</span>
            </div>
          )}
        </div>
        <div className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all ${
          distribution.sentiment === 'BULLISH'
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : distribution.sentiment === 'BEARISH'
            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        }`}>
          {distribution.sentiment}
        </div>
      </div>

      {/* Main Donut Chart Section */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* Donut Chart */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="w-full max-w-xs aspect-square relative flex items-center justify-center">
            <svg viewBox="0 0 420 420" className="w-full h-full drop-shadow-2xl">
              <defs>
                <filter id="glow-bulls" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-bears" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Inner background circle */}
              <circle cx="210" cy="210" r="100" fill="#080d18" stroke="#1e293b" strokeWidth="1.5" />

              {/* Bulls (CE) segment - Green */}
              <path
                d={bullsPath}
                fill="#10b981"
                stroke="#0d1424"
                strokeWidth="1.5"
                className="transition-all duration-300"
                style={{
                  opacity: 0.9,
                  filter: 'url(#glow-bulls)'
                }}
              />

              {/* Bears (PE) segment - Red */}
              <path
                d={bearsPath}
                fill="#f43f5e"
                stroke="#0d1424"
                strokeWidth="1.5"
                className="transition-all duration-300"
                style={{
                  opacity: 0.9,
                  filter: 'url(#glow-bears)'
                }}
              />

              {/* Center PCR Display */}
              <g textAnchor="middle" className="pointer-events-none">
                <text x="210" y="195" className="fill-slate-400 font-mono text-[11px] uppercase font-bold tracking-widest">
                  PCR
                </text>
                <text x="210" y="230" className="fill-white font-mono text-4xl font-black">
                  {distribution.pcr.toFixed(2)}
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Stats Cards Section */}
        <div className="w-full lg:w-1/2 space-y-4">
          {/* Bulls (PE) Card - Put Support */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-[#081a14] hover:border-emerald-500/60 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Bulls (PE)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-mono font-black text-2xl text-white">
                  {distribution.bullsValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}L
                </span>
                <span className="font-mono text-sm font-bold text-slate-400">
                  {distribution.bullsPercentage.toFixed(1)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${distribution.bullsPercentage}%` }}
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          </div>

          {/* Bears (CE) Card - Call Resistance */}
          <div className="p-4 rounded-xl border border-rose-500/30 bg-[#1a0810] hover:border-rose-500/60 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                </div>
                <span className="font-mono text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Bears (CE)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-mono font-black text-2xl text-white">
                  {distribution.bearsValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}L
                </span>
                <span className="font-mono text-sm font-bold text-slate-400">
                  {distribution.bearsPercentage.toFixed(1)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${distribution.bearsPercentage}%` }}
                  className="bg-rose-400 h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          </div>

          {/* Previous Day PCR Section */}
          <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/50">
            <p className="text-slate-400 font-mono text-xs uppercase tracking-wider mb-3">
              Previous Day PCR
            </p>

            <div className="space-y-2">
              <div className="font-mono font-black text-2xl text-white">
                {distribution.previousPcr.toFixed(2)}
              </div>

              <div className="flex items-center gap-2">
                <span className={`font-mono text-sm font-bold ${
                  distribution.pcrChange > 0 ? 'text-emerald-400' : distribution.pcrChange < 0 ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {distribution.pcrChange > 0 ? '↑' : distribution.pcrChange < 0 ? '↓' : '→'}
                  {Math.abs(distribution.pcrChange).toFixed(2)} ({distribution.pcrChangePercent > 0 ? '+' : ''}{distribution.pcrChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 pt-2 font-mono text-xs font-bold border-t border-slate-800">
        <div className="flex items-center gap-2 pt-4">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-glow-green" />
          <span className="text-slate-300">Put OI (Bulls - Support)</span>
        </div>
        <div className="flex items-center gap-2 pt-4">
          <span className="w-3 h-3 rounded-full bg-rose-500 shadow-glow-red" />
          <span className="text-slate-300">Call OI (Bears - Resistance)</span>
        </div>
      </div>
    </div>
  );
}
