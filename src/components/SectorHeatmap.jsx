import React, { useState } from 'react';
import { Grid, Search, ArrowUpRight, ArrowDownRight, Flame } from 'lucide-react';
import { SECTOR_DATA } from '../services/marketSimulator';

export default function SectorHeatmap() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState(null);

  const filteredSectors = SECTOR_DATA.filter((sec) =>
    sec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sec.leader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getHeatmapBg = (pChange) => {
    if (pChange >= 1.5) return 'linear-gradient(135deg, rgba(6, 78, 59, 0.9) 0%, rgba(16, 185, 129, 0.25) 100%)';
    if (pChange > 0) return 'linear-gradient(135deg, rgba(6, 78, 59, 0.5) 0%, rgba(16, 185, 129, 0.12) 100%)';
    if (pChange <= -1.0) return 'linear-gradient(135deg, rgba(136, 19, 55, 0.9) 0%, rgba(244, 63, 94, 0.25) 100%)';
    return 'linear-gradient(135deg, rgba(136, 19, 55, 0.5) 0%, rgba(244, 63, 94, 0.12) 100%)';
  };

  const getHeatmapBorder = (pChange) => {
    if (pChange > 0) return '1px solid rgba(16, 185, 129, 0.4)';
    return '1px solid rgba(244, 63, 94, 0.4)';
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30">
            <Grid className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white uppercase tracking-wide">Complete Sectoral Heatmap</h1>
            <p className="text-xs text-slate-400">Live sector breath, advancers vs decliners, and constituent leaders</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Sector or Stock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 outline-none font-mono"
          />
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filteredSectors.map((sec) => {
          const isPositive = sec.pChange >= 0;

          return (
            <div
              key={sec.id}
              onClick={() => setSelectedSector(sec)}
              style={{ background: getHeatmapBg(sec.pChange), border: getHeatmapBorder(sec.pChange) }}
              className="heatmap-tile h-36 flex flex-col justify-between p-4 rounded-xl cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-white tracking-wide">{sec.name}</h3>
                  <span className="text-[11px] text-slate-300 font-mono block mt-0.5">{sec.stocks} Stocks</span>
                </div>
                {isPositive ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-rose-400" />
                )}
              </div>

              <div>
                <div className="flex items-baseline justify-between font-mono my-1">
                  <span className={`text-xl font-black ${isPositive ? 'text-emerald-300 glow-green' : 'text-rose-300 glow-red'}`}>
                    {isPositive ? '+' : ''}{sec.pChange}%
                  </span>
                  <span className="text-[10px] text-slate-300">
                    {sec.advancing} Adv / {sec.declining} Dec
                  </span>
                </div>

                <div className="w-full bg-slate-900/60 h-1.5 rounded-full overflow-hidden flex">
                  <div style={{ width: `${(sec.advancing / sec.stocks) * 100}%` }} className="bg-emerald-500"></div>
                  <div style={{ width: `${(sec.declining / sec.stocks) * 100}%` }} className="bg-rose-500"></div>
                </div>

                <span className="text-[10px] text-slate-200 block truncate mt-1.5">
                  ⭐ Leader: <span className="font-semibold text-white">{sec.leader}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Sector Modal / Detail Bar */}
      {selectedSector && (
        <div className="glass-card p-5 border-sky-500/40 relative">
          <button
            onClick={() => setSelectedSector(null)}
            className="absolute top-4 right-4 text-xs text-slate-400 hover:text-white"
          >
            ✕ Close
          </button>
          <div className="flex items-center gap-3 mb-3">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm">{selectedSector.name} Constituent Breakdown</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">SECTOR RETURN</span>
              <span className={`text-sm font-bold ${selectedSector.pChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedSector.pChange}%
              </span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">ADVANCE DECLINE RATIO</span>
              <span className="text-sm font-bold text-sky-400">{selectedSector.advancing} : {selectedSector.declining}</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">TOP GAINER</span>
              <span className="text-sm font-bold text-emerald-400">{selectedSector.leader}</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">MOMENTUM RANK</span>
              <span className="text-sm font-bold text-amber-400">#2 in Market</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
