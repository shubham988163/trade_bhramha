import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart2, TrendingUp, TrendingDown, PlayCircle, X, Search,
  Info, ExternalLink, Activity, ChevronDown
} from 'lucide-react';
import { INDEX_MOVERS_DATA } from '../services/marketSimulator';
import { num, pct, signed } from '../utils/format';

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

export default function IndexMover({ indexMovers, isRunning, onNavigate, onSelectSignal }) {
  const [selectedIdxKey, setSelectedIdxKey] = useState('nifty');
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all', 'gainers', 'losers'
  const [hoveredStock, setHoveredStock] = useState(null);

  // Escape closes whichever overlay is open. App.jsx's global handler only
  // knows about the broker modal and the mobile drawer, so this view has to
  // dismiss its own — otherwise the backdrop traps every subsequent click.
  useEffect(() => {
    if (!isHowToUseOpen && !selectedStock) return;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setIsHowToUseOpen(false);
      setSelectedStock(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isHowToUseOpen, selectedStock]);

  const liveData = indexMovers?.[selectedIdxKey];
  const activeData = (liveData && typeof liveData.indexPrice === 'number' && liveData.allConstituents?.length > 0)
    ? liveData
    : (INDEX_MOVERS_DATA[selectedIdxKey] || INDEX_MOVERS_DATA.nifty);

  const {
    symbol, indexPrice, netPoints, pChange, gainersCount, losersCount,
    gainers, losers, allConstituents
  } = activeData;

  const totalStocks = gainersCount + losersCount;
  const gainersPct = totalStocks > 0 ? (gainersCount / totalStocks) * 100 : 50;

  // Filtered lists for contributor cards
  const filteredGainers = useMemo(() => {
    return gainers.filter(s =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [gainers, searchQuery]);

  const filteredLosers = useMemo(() => {
    return losers.filter(s =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [losers, searchQuery]);

  // Donut Arc calculation data
  const donutArcs = useMemo(() => {
    const sortedMovers = [...allConstituents].sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
    const totalAbsPoints = sortedMovers.reduce((acc, s) => acc + Math.abs(s.points), 0) || 1;

    let currentAngle = 0;
    const gap = 0.8; // degrees gap between segments

    return sortedMovers.map((stock) => {
      const absPts = Math.abs(stock.points);
      const sweep = Math.max(1.5, (absPts / totalAbsPoints) * 360 - gap);
      const startAngle = currentAngle;
      const endAngle = startAngle + sweep;
      currentAngle = endAngle + gap;

      return {
        stock,
        startAngle,
        endAngle,
        absPts
      };
    });
  }, [allConstituents]);

  // Top perimeter labels to highlight on the Donut Chart (e.g. INFY, KOTAKBANK, MARUTI, ICICIBANK, POWERGRID, HCLTECH, RELIANCE, ITC...)
  const highlightLabels = useMemo(() => {
    const topGainers = gainers.slice(0, 6);
    const topLosers = losers.slice(0, 6);
    return [...topGainers, ...topLosers];
  }, [gainers, losers]);

  // Polar coordinate helper for SVG Donut
  const polarToCartesian = (cx, cy, r, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  };

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

  return (
    <div className="space-y-6 select-none font-sans">
      {/* 1. Top Controls Bar: Dropdown Selector, How to Use, Market Status */}
      <div className="glass-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 border border-slate-800/80 bg-[#0d1424]/90 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedIdxKey}
              onChange={(e) => setSelectedIdxKey(e.target.value)}
              className="appearance-none bg-slate-900/90 hover:bg-slate-800 text-white font-bold font-mono text-sm px-4 py-2 pr-9 rounded-xl border border-slate-700/80 hover:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all cursor-pointer shadow-lg"
            >
              <option value="nifty">NIFTY 50</option>
              <option value="bankNifty">BANK NIFTY</option>
              <option value="sensex">SENSEX</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsHowToUseOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-500/30 shadow-md shadow-indigo-950/40 transition-all cursor-pointer active:scale-95"
          >
            <PlayCircle className="w-4 h-4 fill-white/20 text-white" />
            <span>How to Use</span>
          </button>
        </div>

        {/* Market Live / Closed Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse shadow-glow-green' : 'bg-slate-500'}`} />
          <span className="text-slate-400 font-medium">Status:</span>
          <span className={`font-bold ${isRunning ? 'text-emerald-400' : 'text-slate-300'}`}>
            {isRunning ? 'LIVE FEED' : 'CLOSED'}
          </span>
        </div>
      </div>

      {/* 2. Main Index Summary Header Box */}
      <div className="glass-card p-6 border border-slate-800/80 bg-[#0d1424]/90 rounded-2xl text-center space-y-4 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-wide text-white uppercase font-mono">
            {symbol} <span className="text-3xl font-extrabold ml-3 text-slate-100">{num(indexPrice)}</span>
          </h2>
          <div className="flex items-center justify-center gap-3 text-sm font-mono font-bold">
            <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg ${netPoints >= 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>
              {netPoints >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {netPoints >= 0 ? `+${netPoints.toFixed(2)}` : netPoints.toFixed(2)}
            </span>
            <span className={netPoints >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {netPoints >= 0 ? `+${pChange.toFixed(2)}%` : `${pChange.toFixed(2)}%`}
            </span>
          </div>
        </div>

        {/* Dual Split Gainers vs Losers Bar */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800 flex shadow-inner">
            <div
              style={{ width: `${gainersPct}%` }}
              className="bg-emerald-500 h-full rounded-l-full transition-all duration-700 shadow-glow-green"
            />
            <div
              style={{ width: `${100 - gainersPct}%` }}
              className="bg-rose-500 h-full rounded-r-full transition-all duration-700 shadow-glow-red"
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              {gainersCount} Gainers
            </span>
            <span className="text-rose-400 flex items-center gap-1.5">
              {losersCount} Losers
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Circular Donut / Radial Heatmap Section */}
      <div className="glass-card p-6 border border-slate-800/80 bg-[#0d1424]/90 rounded-2xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[540px] aspect-square relative flex items-center justify-center">
          <svg viewBox="0 0 420 420" className="w-full h-full drop-shadow-2xl overflow-visible">
            <defs>
              <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Inner background circle */}
            <circle cx="210" cy="210" r="105" fill="#080d18" stroke="#1e293b" strokeWidth="1.5" />

            {/* Donut Arc Segments */}
            {donutArcs.map(({ stock, startAngle, endAngle }) => {
              const isGainer = stock.points >= 0;
              const isHovered = hoveredStock?.symbol === stock.symbol;

              const outerR = isHovered ? 152 : 145;
              const innerR = isHovered ? 98 : 105;

              const pathD = describeArcPath(210, 210, outerR, innerR, startAngle, endAngle);

              return (
                <path
                  key={stock.symbol}
                  d={pathD}
                  fill={isGainer ? (isHovered ? '#34d399' : '#10b981') : (isHovered ? '#fb7185' : '#f43f5e')}
                  stroke="#0d1424"
                  strokeWidth="1.5"
                  className="transition-all duration-200 cursor-pointer hover:opacity-100"
                  style={{
                    opacity: hoveredStock ? (isHovered ? 1 : 0.45) : 0.9,
                    filter: isHovered ? (isGainer ? 'url(#glow-emerald)' : 'url(#glow-rose)') : 'none'
                  }}
                  onMouseEnter={() => setHoveredStock(stock)}
                  onMouseLeave={() => setHoveredStock(null)}
                  onClick={() => setSelectedStock(stock)}
                />
              );
            })}

            {/* Perimeter Stock Labels with connecting indicator lines */}
            {donutArcs.map(({ stock, startAngle, endAngle }) => {
              const isTop = highlightLabels.some(s => s.symbol === stock.symbol);
              if (!isTop && hoveredStock?.symbol !== stock.symbol) return null;

              const midAngle = (startAngle + endAngle) / 2;
              const labelPos = polarToCartesian(210, 210, 178, midAngle);
              const anchorPos = polarToCartesian(210, 210, 150, midAngle);

              const isRight = labelPos.x >= 210;
              const isGainer = stock.points >= 0;
              const isHovered = hoveredStock?.symbol === stock.symbol;

              return (
                <g key={`lbl-${stock.symbol}`} className="pointer-events-none transition-all duration-300">
                  <line
                    x1={anchorPos.x}
                    y1={anchorPos.y}
                    x2={labelPos.x}
                    y2={labelPos.y}
                    stroke={isGainer ? '#10b981' : '#f43f5e'}
                    strokeWidth={isHovered ? '2' : '1'}
                    strokeDasharray={isHovered ? 'none' : '2,2'}
                    opacity={isHovered ? 1 : 0.6}
                  />
                  <text
                    x={labelPos.x + (isRight ? 6 : -6)}
                    y={labelPos.y + 4}
                    textAnchor={isRight ? 'start' : 'end'}
                    className={`font-mono text-[11px] font-bold ${
                      isGainer ? 'fill-emerald-400' : 'fill-rose-400'
                    } ${isHovered ? 'scale-110 font-extrabold' : ''}`}
                    style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
                  >
                    {stock.symbol} {stock.points >= 0 ? `+${stock.points}` : stock.points}
                  </text>
                </g>
              );
            })}

            {/* SVG Center Info Content */}
            <g textAnchor="middle" className="pointer-events-none">
              <text x="210" y="195" className="fill-slate-400 font-mono text-[11px] uppercase font-bold tracking-widest">
                {symbol}
              </text>
              <text x="210" y="222" className="fill-white font-mono text-xl font-black">
                {hoveredStock ? hoveredStock.symbol : indexPrice.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
              </text>
              <text x="210" y="240" className={`font-mono text-xs font-bold ${
                hoveredStock
                  ? (hoveredStock.points >= 0 ? 'fill-emerald-400' : 'fill-rose-400')
                  : (netPoints >= 0 ? 'fill-emerald-400' : 'fill-rose-400')
              }`}>
                {hoveredStock
                  ? `${hoveredStock.points >= 0 ? '+' : ''}${hoveredStock.points} Pts (${hoveredStock.pChange >= 0 ? '+' : ''}${hoveredStock.pChange}%)`
                  : `${netPoints >= 0 ? '+' : ''}${netPoints.toFixed(2)} (${pChange >= 0 ? '+' : ''}${pChange.toFixed(2)}%)`
                }
              </text>
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-2 font-mono text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-glow-green" />
            <span className="text-slate-300">Gainers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-glow-red" />
            <span className="text-slate-300">Losers</span>
          </div>
        </div>
      </div>

      {/* 4. Top Contributors Section Header & Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-sky-400" />
              Top Contributors
            </h3>
            <p className="text-xs text-slate-400">Point breakdown across individual market constituents</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search stock..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900/90 text-xs font-mono text-white placeholder-slate-500 pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500/50 w-44 sm:w-56 transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 font-mono text-xs">
              <button
                onClick={() => setActiveTabFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTabFilter === 'all' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                ALL ({allConstituents.length})
              </button>
              <button
                onClick={() => setActiveTabFilter('gainers')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTabFilter === 'gainers' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                GAINERS ({gainersCount})
              </button>
              <button
                onClick={() => setActiveTabFilter('losers')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTabFilter === 'losers' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                LOSERS ({losersCount})
              </button>
            </div>
          </div>
        </div>

        {/* Dual Column Grid: Gainers (Left) vs Losers (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Gainers Column */}
          {(activeTabFilter === 'all' || activeTabFilter === 'gainers') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 px-1">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span className="uppercase tracking-wider">Top Gainers</span>
                </div>
                <span className="text-xs font-mono text-slate-400">{filteredGainers.length} Stocks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredGainers.map((stock) => {
                  const isHovered = hoveredStock?.symbol === stock.symbol;
                  return (
                    <div
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      onMouseEnter={() => setHoveredStock(stock)}
                      onMouseLeave={() => setHoveredStock(null)}
                      className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                        isHovered
                          ? 'bg-[#122228] border-emerald-500/60 shadow-lg shadow-emerald-950/50 scale-[1.02]'
                          : 'bg-[#0d1424]/90 border-slate-800/80 hover:border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono font-bold text-white text-sm tracking-wide group-hover:text-emerald-300 transition-colors">
                            {stock.symbol}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">points</div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="font-black text-emerald-400 text-base">
                            +{stock.points}
                          </div>
                          <div className="text-[11px] text-slate-400 font-semibold">
                            {stock.impactPct}%
                          </div>
                        </div>
                      </div>

                      {/* Bottom thin progress indicator */}
                      <div className="mt-2.5 w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, (stock.impactPct || 1) * 6)}%` }}
                          className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Losers Column */}
          {(activeTabFilter === 'all' || activeTabFilter === 'losers') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 px-1">
                <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-sm">
                  <TrendingDown className="w-4 h-4" />
                  <span className="uppercase tracking-wider">Top Losers</span>
                </div>
                <span className="text-xs font-mono text-slate-400">{filteredLosers.length} Stocks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredLosers.map((stock) => {
                  const isHovered = hoveredStock?.symbol === stock.symbol;
                  return (
                    <div
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      onMouseEnter={() => setHoveredStock(stock)}
                      onMouseLeave={() => setHoveredStock(null)}
                      className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                        isHovered
                          ? 'bg-[#24141d] border-rose-500/60 shadow-lg shadow-rose-950/50 scale-[1.02]'
                          : 'bg-[#0d1424]/90 border-slate-800/80 hover:border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono font-bold text-white text-sm tracking-wide group-hover:text-rose-300 transition-colors">
                            {stock.symbol}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">points</div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="font-black text-rose-400 text-base">
                            {stock.points}
                          </div>
                          <div className="text-[11px] text-slate-400 font-semibold">
                            {stock.impactPct}%
                          </div>
                        </div>
                      </div>

                      {/* Bottom thin progress indicator */}
                      <div className="mt-2.5 w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, (stock.impactPct || 1) * 6)}%` }}
                          className="bg-rose-400 h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. How to Use Modal */}
      {isHowToUseOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="How index movers work"
          // Dismiss on backdrop click. The guard keeps clicks inside the panel
          // from bubbling up and closing it.
          onMouseDown={(e) => { if (e.target === e.currentTarget) setIsHowToUseOpen(false); }}
        >
          <div className="glass-card max-w-xl w-full p-6 border border-slate-700 bg-[#0d1424] rounded-2xl shadow-2xl space-y-5 text-slate-200 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Info className="w-5 h-5 text-sky-400" />
                <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider">How Index Movers Work</h3>
              </div>
              <button
                onClick={() => setIsHowToUseOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h4 className="font-bold text-sky-400 font-mono uppercase">1. Point Contribution Logic</h4>
                <p className="text-slate-300">
                  Every stock in an index (e.g. NIFTY 50) carries a specific weightage based on its free-float market capitalization.
                  When a stock price moves by X%, it directly impacts the overall index value in points.
                </p>
                <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-emerald-400">
                  Stock Points = (Weightage % ÷ 100) × Stock Price Change % × (Index Base ÷ 100)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h4 className="font-bold text-purple-400 font-mono uppercase">2. Donut Heatmap Radial Chart</h4>
                <p className="text-slate-300">
                  The outer circular donut ring visualizes all active constituents. Arc segment length corresponds to the magnitude of points contributed (green for gainers, red for losers).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h4 className="font-bold text-emerald-400 font-mono uppercase">3. Top Contributors Cards</h4>
                <p className="text-slate-300">
                  The top gainers (left) and top losers (right) list individual stock point contributions and impact percentages to instantly spot which market leaders are driving or dragging the index.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsHowToUseOpen(false)}
                className="w-full py-2.5 rounded-xl font-mono font-bold text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-lg"
              >
                Got It, Let's Analyze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Stock Quick Details Modal */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 border border-slate-700 bg-[#0d1424] rounded-2xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white font-mono">{selectedStock.symbol}</h3>
                <p className="text-xs text-slate-400">{selectedStock.name} • {selectedStock.category}</p>
              </div>
              <button
                onClick={() => setSelectedStock(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">CURRENT PRICE</span>
                <div className="text-white font-bold text-base">₹{selectedStock.price}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">DAY CHANGE</span>
                <div className={`font-bold text-base ${selectedStock.pChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedStock.pChange >= 0 ? `+${selectedStock.pChange}%` : `${selectedStock.pChange}%`}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">POINTS CONTRIBUTION</span>
                <div className={`font-bold text-base ${selectedStock.points >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedStock.points >= 0 ? `+${selectedStock.points} Pts` : `${selectedStock.points} Pts`}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">INDEX WEIGHT</span>
                <div className="text-sky-400 font-bold text-base">{selectedStock.weight}%</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {onSelectSignal && (
                <button
                  onClick={() => {
                    onSelectSignal({
                      symbol: selectedStock.symbol,
                      entry: selectedStock.price,
                      signal: selectedStock.points >= 0 ? 'BUY' : 'SELL'
                    });
                    setSelectedStock(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl font-mono font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  <Activity className="w-4 h-4" />
                  <span>Trade in TradeX</span>
                </button>
              )}

              {onNavigate && (
                <button
                  onClick={() => {
                    onNavigate('optionclock');
                    setSelectedStock(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl font-mono font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2 border border-slate-700 transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-sky-400" />
                  <span>Option Chain</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
