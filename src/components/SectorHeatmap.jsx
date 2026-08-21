import React, { useState, useMemo } from 'react';
import { Grid, Search, ArrowUpRight, ArrowDownRight, Flame, X } from 'lucide-react';
import { SECTOR_DATA } from '../services/marketSimulator';
import { pct } from '../utils/format';

const SORTS = [
  { id: 'perf', label: 'Performance' },
  { id: 'breadth', label: 'Breadth' },
  { id: 'name', label: 'A–Z' },
];

/**
 * Tile background encodes magnitude on a single hue per direction
 * (sequential within each polarity), so intensity reads as "how much" and
 * hue reads as "which way".
 */
function tileStyle(pChange) {
  const mag = Math.min(1, Math.abs(pChange) / 2.1);
  const alpha = 0.16 + mag * 0.34;
  const rgb = pChange >= 0 ? '16, 185, 129' : '244, 63, 94';
  return {
    background: `linear-gradient(135deg, rgba(${rgb}, ${alpha}) 0%, rgba(6, 10, 22, 0.86) 100%)`,
    border: `1px solid rgba(${rgb}, ${0.28 + mag * 0.34})`,
  };
}

function BreadthMeter({ advancing, declining }) {
  const total = Math.max(1, advancing + declining);
  return (
    <div className="meter" role="img" aria-label={`${advancing} advancing, ${declining} declining`}>
      <span className="meter-adv" style={{ width: `${(advancing / total) * 100}%` }} />
      <span className="meter-dec" style={{ width: `${(declining / total) * 100}%` }} />
    </div>
  );
}

export default function SectorHeatmap() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('perf');
  const [selectedSector, setSelectedSector] = useState(null);

  const filteredSectors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = SECTOR_DATA.filter(
      (s) => s.name.toLowerCase().includes(q) || s.leader.toLowerCase().includes(q)
    );
    const sorted = [...list];
    if (sort === 'perf') sorted.sort((a, b) => b.pChange - a.pChange);
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'breadth') {
      const ratio = (s) => s.advancing / Math.max(1, s.advancing + s.declining);
      sorted.sort((a, b) => ratio(b) - ratio(a));
    }
    return sorted;
  }, [searchTerm, sort]);

  // Every headline below is derived from SECTOR_DATA, so the summary can never
  // contradict the tiles it sits above.
  const stats = useMemo(() => {
    const ranked = [...SECTOR_DATA].sort((a, b) => b.pChange - a.pChange);
    return {
      up: SECTOR_DATA.filter((s) => s.pChange > 0).length,
      down: SECTOR_DATA.filter((s) => s.pChange <= 0).length,
      adv: SECTOR_DATA.reduce((n, s) => n + s.advancing, 0),
      dec: SECTOR_DATA.reduce((n, s) => n + s.declining, 0),
      best: ranked[0],
      worst: ranked[ranked.length - 1],
      avg: SECTOR_DATA.reduce((n, s) => n + s.pChange, 0) / SECTOR_DATA.length,
    };
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 shrink-0">
            <Grid style={{ width: 22, height: 22 }} className="text-sky-400" />
          </div>
          <div className="min-w-0">
            <h1 className="section-title text-base">Complete Sectoral Heatmap</h1>
            <p className="section-sub">Live sector breadth, advancers vs decliners, and constituent leaders</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sort control — one row, above the grid it governs. */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 font-mono text-[11px]">
            {SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                aria-pressed={sort === s.id}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all focus-ring ${
                  sort === s.id
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search style={{ width: 15, height: 15 }} className="text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search sector or stock…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Market-wide summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="pro-card card-cyan-accent p-4">
          <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider block mb-2">
            Sectors Up / Down
          </span>
          <div className="text-2xl font-black text-white">
            {stats.up}<span className="text-slate-600 text-base"> / </span>{stats.down}
          </div>
          <div className="mt-2"><BreadthMeter advancing={stats.up} declining={stats.down} /></div>
        </div>

        <div className="pro-card card-purple-accent p-4">
          <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider block mb-2">
            Constituent Breadth
          </span>
          <div className="text-2xl font-black text-sky-400">
            {stats.adv}<span className="text-slate-600 text-base"> / </span>{stats.dec}
          </div>
          <div className="mt-2"><BreadthMeter advancing={stats.adv} declining={stats.dec} /></div>
        </div>

        <div className="pro-card card-green-accent p-4">
          <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider block mb-2">
            Strongest Sector
          </span>
          <div className="text-lg font-black text-emerald-400 glow-green truncate">{stats.best.name}</div>
          <div className="text-sm font-bold text-emerald-400">{pct(stats.best.pChange)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-sans truncate">{stats.best.leader}</div>
        </div>

        <div className="pro-card card-red-accent p-4">
          <span className="text-[10px] text-slate-500 font-sans font-semibold uppercase tracking-wider block mb-2">
            Weakest Sector
          </span>
          <div className="text-lg font-black text-rose-400 glow-red truncate">{stats.worst.name}</div>
          <div className="text-sm font-bold text-rose-400">{pct(stats.worst.pChange)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-sans truncate">{stats.worst.leader}</div>
        </div>
      </div>

      {/* Heatmap grid */}
      {filteredSectors.length === 0 ? (
        <div className="pro-card p-10 text-center">
          <p className="text-sm text-slate-400 font-semibold">No sector matches “{searchTerm}”.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="btn-sec-pro text-xs mt-3 mx-auto focus-ring"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
          {filteredSectors.map((sec) => {
            const isPositive = sec.pChange >= 0;
            const isSelected = selectedSector?.id === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSector(isSelected ? null : sec)}
                aria-pressed={isSelected}
                style={tileStyle(sec.pChange)}
                className={`heatmap-tile text-left h-full min-h-[9rem] flex flex-col justify-between p-4 rounded-xl focus-ring ${
                  isSelected ? 'ring-2 ring-sky-400/70' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-white tracking-wide truncate">{sec.name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{sec.stocks} stocks</span>
                  </div>
                  {isPositive
                    ? <ArrowUpRight style={{ width: 18, height: 18 }} className="text-emerald-400 shrink-0" />
                    : <ArrowDownRight style={{ width: 18, height: 18 }} className="text-rose-400 shrink-0" />}
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline justify-between font-mono gap-2 mb-1.5">
                    <span className={`text-xl font-black ${isPositive ? 'text-emerald-300 glow-green' : 'text-rose-300 glow-red'}`}>
                      {pct(sec.pChange)}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {sec.advancing}A · {sec.declining}D
                    </span>
                  </div>

                  <BreadthMeter advancing={sec.advancing} declining={sec.declining} />

                  <span className="text-[10px] text-slate-300 block truncate mt-1.5">
                    Leader <span className="font-semibold text-white">{sec.leader}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected sector detail */}
      {selectedSector && (
        <div className="glass-card p-5 border-sky-500/40 relative">
          <button
            onClick={() => setSelectedSector(null)}
            aria-label="Close sector detail"
            className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus-ring"
          >
            <X style={{ width: 15, height: 15 }} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <Flame style={{ width: 18, height: 18 }} className="text-amber-400" />
            <h3 className="section-title">{selectedSector.name} — Constituent Breakdown</h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            {[
              {
                k: 'Sector return',
                v: pct(selectedSector.pChange),
                c: selectedSector.pChange >= 0 ? 'text-emerald-400' : 'text-rose-400',
              },
              {
                k: 'Advance : decline',
                v: `${selectedSector.advancing} : ${selectedSector.declining}`,
                c: 'text-sky-400',
              },
              { k: 'Top gainer', v: selectedSector.leader, c: 'text-emerald-400' },
              {
                k: 'Performance rank',
                v: `#${[...SECTOR_DATA].sort((a, b) => b.pChange - a.pChange)
                  .findIndex((s) => s.id === selectedSector.id) + 1} of ${SECTOR_DATA.length}`,
                c: 'text-amber-400',
              },
            ].map((cell) => (
              <div key={cell.k} className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-sans mb-1">
                  {cell.k}
                </span>
                <span className={`text-sm font-bold truncate block ${cell.c}`}>{cell.v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
