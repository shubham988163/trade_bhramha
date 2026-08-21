import React from 'react';
import {
  LayoutDashboard, Compass, Grid, Zap, Activity, BarChart2,
  CandlestickChart, Settings, Wifi, WifiOff
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenSettings, fyers }) {
  const menuItems = [
    { id: 'pulse',      label: 'Market Pulse',   icon: LayoutDashboard, badge: 'LIVE' },
    { id: 'optionclock',label: 'Option Chain',    icon: Compass,         badge: 'HOT' },
    { id: 'heatmap',    label: 'Sector Heatmap',  icon: Grid },
    { id: 'scanners',   label: 'AI Scanners',     icon: Zap,             badge: '5 Signals' },
    { id: 'tradeflow',  label: 'Trade Flow',      icon: Activity },
    { id: 'indexmover', label: 'Index Movers',    icon: BarChart2 },
    { id: 'tradex',     label: 'TradeX Chart',    icon: CandlestickChart, highlight: true },
  ];

  const isLive = fyers?.connected;
  const profile = fyers?.profile;

  return (
    <aside className="app-sidebar w-56 shrink-0 flex flex-col justify-between p-3 min-h-[calc(100vh-88px)] select-none">
      <div className="space-y-1.5">
        <div className="px-2 py-2 text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">
          ANALYTICS &amp; MODULES
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-item w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'active-nav'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500'}`}
                        style={{ width: 15, height: 15 }} />
                  <span className="truncate font-semibold">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                    item.badge === 'LIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : item.badge === 'HOT'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-sky-500/15 text-sky-300 border border-sky-500/25'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer — Broker & Connection Status */}
      <div className="pt-3 space-y-2 border-t border-slate-800/70">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all"
        >
          <Settings className="text-sky-400" style={{ width: 14, height: 14 }} />
          <span>Broker API Config</span>
        </button>

        {/* Live connection status widget */}
        <div className={`p-2.5 rounded-xl text-[10px] font-mono border transition-all ${
          isLive
            ? 'bg-emerald-950/50 border-emerald-500/30'
            : 'bg-slate-950/70 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-[10px]">Broker Feed:</span>
            {isLive ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Wifi style={{ width: 11, height: 11 }} />
                FYERS LIVE
              </span>
            ) : (
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <WifiOff style={{ width: 11, height: 11 }} />
                SIMULATED
              </span>
            )}
          </div>
          {isLive && profile ? (
            <div className="text-emerald-300 text-[10px] truncate">
              {profile.name ? profile.name.split(' ')[0] : profile.fy_id} · {profile.fy_id}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Latency:</span>
              <span className="text-sky-500 font-semibold">12 ms</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
