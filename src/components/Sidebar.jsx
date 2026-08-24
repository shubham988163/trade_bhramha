import React from 'react';
import { Settings, Wifi, WifiOff, PanelLeftClose, PanelLeftOpen, X, ArrowLeft } from 'lucide-react';
import { NAV_ITEMS } from '../navigation';

function NavList({ activeTab, setActiveTab, collapsed }) {
  return (
    <nav className="space-y-1" aria-label="Analytics modules">
      {NAV_ITEMS.map((item, i) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            aria-current={isActive ? 'page' : undefined}
            title={collapsed ? `${item.label}  (${i + 1})` : undefined}
            className={`nav-item w-full flex items-center rounded-xl text-xs font-medium transition-all duration-200 focus-ring ${
              collapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2.5'
            } ${isActive ? 'active-nav' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <span className={`flex items-center ${collapsed ? '' : 'gap-2.5'} min-w-0`}>
              <Icon
                className={`shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500'}`}
                style={{ width: 15, height: 15 }}
              />
              {!collapsed && <span className="truncate font-semibold">{item.label}</span>}
            </span>

            {!collapsed && (
              <span className="flex items-center gap-1.5 shrink-0">
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      item.badge === 'LIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : item.badge === 'HOT'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-sky-500/15 text-sky-300 border border-sky-500/25'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {/* Keyboard affordance — the shortcut is discoverable, not hidden. */}
                <kbd className="hidden xl:inline text-[9px] font-mono text-slate-600 group-hover:text-slate-400">
                  {i + 1}
                </kbd>
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function FeedStatus({ fyers, collapsed }) {
  const isLive = fyers?.connected;
  const profile = fyers?.profile;

  if (collapsed) {
    return (
      <div
        className="flex justify-center py-2"
        title={isLive ? 'Fyers live feed' : 'Simulated feed'}
      >
        {isLive
          ? <Wifi style={{ width: 15, height: 15 }} className="text-emerald-400" />
          : <WifiOff style={{ width: 15, height: 15 }} className="text-slate-500" />}
      </div>
    );
  }

  return (
    <div
      className={`p-2.5 rounded-xl text-[10px] font-mono border transition-all ${
        isLive ? 'bg-emerald-950/50 border-emerald-500/30' : 'bg-slate-950/70 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-slate-400">Broker Feed:</span>
        {isLive ? (
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Wifi style={{ width: 11, height: 11 }} /> FYERS LIVE
          </span>
        ) : (
          <span className="text-slate-500 font-bold flex items-center gap-1">
            <WifiOff style={{ width: 11, height: 11 }} /> SIMULATED
          </span>
        )}
      </div>
      {isLive && profile ? (
        <div className="text-emerald-300 truncate">
          {profile.name ? profile.name.split(' ')[0] : profile.fy_id} · {profile.fy_id}
        </div>
      ) : (
        <div className="text-slate-500">Connect a broker for live quotes</div>
      )}
    </div>
  );
}

function SidebarBody({ activeTab, setActiveTab, onOpenSettings, fyers, collapsed, onToggleCollapse, isDrawer, onExitToSite }) {
  return (
    <>
      <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        <button
          onClick={onExitToSite}
          title="Back to the public site"
          className={`w-full flex items-center gap-2 py-2 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-sky-400 hover:bg-white/5 transition-colors focus-ring ${
            collapsed ? 'justify-center px-0' : 'px-2'
          }`}
        >
          <ArrowLeft style={{ width: 13, height: 13 }} className="shrink-0" />
          {!collapsed && <span>Back to site</span>}
        </button>

        <div className={`flex items-center gap-2 py-2 ${collapsed ? 'justify-center' : 'px-2 justify-between'}`}>
          {!collapsed && (
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">
              Modules
            </span>
          )}
          {!isDrawer && (
            <button
              onClick={onToggleCollapse}
              title={`${collapsed ? 'Expand' : 'Collapse'} sidebar  ([)`}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-white/5 transition-colors focus-ring"
            >
              {collapsed
                ? <PanelLeftOpen style={{ width: 14, height: 14 }} />
                : <PanelLeftClose style={{ width: 14, height: 14 }} />}
            </button>
          )}
        </div>

        <NavList activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} />
      </div>

      <div className="pt-3 space-y-2 border-t border-slate-800/70 shrink-0">
        <button
          onClick={onOpenSettings}
          title="Broker API Config"
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all focus-ring ${
            collapsed ? 'px-0' : 'px-3'
          }`}
        >
          <Settings className="text-sky-400 shrink-0" style={{ width: 14, height: 14 }} />
          {!collapsed && <span>Broker API Config</span>}
        </button>

        <FeedStatus fyers={fyers} collapsed={collapsed} />
      </div>
    </>
  );
}

export default function Sidebar({
  activeTab, setActiveTab, onOpenSettings, fyers,
  collapsed, onToggleCollapse, drawerOpen, onCloseDrawer, onExitToSite,
}) {
  return (
    <>
      {/* Desktop rail — hidden below md, where the drawer takes over. */}
      <aside
        className={`app-sidebar hidden md:flex shrink-0 flex-col justify-between p-3 select-none transition-[width] duration-200 ${
          collapsed ? 'w-[68px]' : 'w-56'
        }`}
      >
        <SidebarBody
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSettings={onOpenSettings}
          fyers={fyers}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          onExitToSite={onExitToSite}
        />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <button
            aria-label="Close navigation"
            onClick={onCloseDrawer}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <aside className="app-sidebar relative w-64 max-w-[80vw] flex flex-col justify-between p-3 select-none shadow-2xl drawer-enter">
            <button
              onClick={onCloseDrawer}
              aria-label="Close navigation"
              className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus-ring"
            >
              <X style={{ width: 15, height: 15 }} />
            </button>
            <SidebarBody
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onOpenSettings={onOpenSettings}
              fyers={fyers}
              collapsed={false}
              isDrawer
              onExitToSite={onExitToSite}
            />
          </aside>
        </div>
      )}
    </>
  );
}
