import React, { useState, useEffect, useCallback } from 'react';
import HeaderTicker from './components/HeaderTicker';
import Sidebar from './components/Sidebar';
import MarketPulseView from './components/MarketPulseView';
import OptionClock from './components/OptionClock';
import SectorHeatmap from './components/SectorHeatmap';
import AIScanners from './components/AIScanners';
import TradeFlow from './components/TradeFlow';
import IndexMover from './components/IndexMover';
import TradingChart from './components/TradingChart';
import BrokerSettingsModal from './components/BrokerSettingsModal';
import Landing from './components/landing/Landing';
import { NAV_ITEMS } from './navigation';
import { marketSimulator } from './services/marketSimulator';
import { fyersService } from './services/fyersService';

const SIDEBAR_KEY = 'tb.sidebar.collapsed';

const VALID_TABS = new Set(NAV_ITEMS.map((n) => n.id));

/** Read `#/app/<tab>` so a terminal view can be linked to and survives reload. */
function readHash() {
  const m = window.location.hash.match(/^#\/app(?:\/([a-z]+))?/i);
  if (!m) return { inApp: false, tab: 'pulse' };
  return { inApp: true, tab: VALID_TABS.has(m[1]) ? m[1] : 'pulse' };
}

export default function App() {
  const initial = readHash();
  const [inApp, setInApp] = useState(initial.inApp);
  const [snapshot, setSnapshot] = useState(marketSimulator.getSnapshot());
  const [activeTab, setActiveTab] = useState(initial.tab);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fyers, setFyers] = useState(fyersService.getState());

  // Desktop rail collapse (persisted) and mobile drawer (transient).
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === '1'
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  // Subscribe to real-time market simulator telemetry ticks
  useEffect(() => {
    const unsubscribe = marketSimulator.subscribe(setSnapshot);
    return () => unsubscribe();
  }, []);

  // Subscribe to the Fyers live-data service (quotes when connected)
  useEffect(() => {
    const unsubscribe = fyersService.subscribe(setFyers);
    fyersService.refreshStatus();
    return () => unsubscribe();
  }, []);

  // Handle redirect back from the Fyers OAuth login (?fyers=connected|error).
  // Land straight in the terminal — the user was mid-connect, not browsing.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('fyers')) {
      fyersService.refreshStatus();
      setInApp(true);
      setIsSettingsOpen(true);
      window.history.replaceState({}, '', `${window.location.pathname}#/app/pulse`);
    }
  }, []);

  // Keep the hash in sync both ways so Back/Forward move between the
  // marketing site and the terminal as the user expects.
  useEffect(() => {
    const onHashChange = () => {
      const h = readHash();
      setInApp(h.inApp);
      if (h.inApp) setActiveTab(h.tab);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((tab) => {
    setActiveTab(tab);
    setDrawerOpen(false);
    if (window.location.hash !== `#/app/${tab}`) {
      window.history.pushState(null, '', `#/app/${tab}`);
    }
  }, []);

  const enterApp = useCallback((tab = 'pulse') => {
    setInApp(true);
    setActiveTab(tab);
    window.history.pushState(null, '', `#/app/${tab}`);
    window.scrollTo(0, 0);
  }, []);

  const exitToSite = useCallback(() => {
    setInApp(false);
    setDrawerOpen(false);
    window.history.pushState(null, '', window.location.pathname);
    window.scrollTo(0, 0);
  }, []);

  // Terminal-style keyboard nav: 1–7 jump to a view, [ toggles the rail,
  // Esc backs out of the modal/drawer. Suppressed while typing in a field.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!inApp || e.metaKey || e.ctrlKey || e.altKey) return;

      const el = document.activeElement;
      const typing =
        el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' ||
               el.tagName === 'TEXTAREA' || el.isContentEditable);

      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setDrawerOpen(false);
        return;
      }
      if (typing) return;

      const idx = Number(e.key);
      if (Number.isInteger(idx) && idx >= 1 && idx <= NAV_ITEMS.length) {
        e.preventDefault();
        navigate(NAV_ITEMS[idx - 1].id);
        return;
      }
      if (e.key === '[') {
        e.preventDefault();
        setCollapsed((v) => !v);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate, inApp]);

  // Live Fyers quotes override the simulated indices when connected.
  // Merge `liveIndices` (index keys only) — merging the full `liveQuotes`
  // alias map would spill every equity and alias into the header ticker.
  const displayIndices = fyers.connected && fyers.liveIndices
    ? { ...snapshot.indices, ...fyers.liveIndices }
    : snapshot.indices;

  // Handle signal selection & router redirect to TradeX chart
  const handleSelectSignal = (sig) => {
    setSelectedSignal(sig);
    navigate('tradex');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'optionclock':
        return <OptionClock indices={displayIndices} optionChain={snapshot.optionChain} />;
      case 'heatmap':
        return <SectorHeatmap />;
      case 'scanners':
        return <AIScanners onSelectSignal={handleSelectSignal} />;
      case 'tradeflow':
        return <TradeFlow tradeFlowLogs={snapshot.tradeFlowLogs} />;
      case 'indexmover':
        return (
          <IndexMover
            indexMovers={snapshot.indexMovers}
            isRunning={snapshot.isRunning}
            onNavigate={setActiveTab}
            onSelectSignal={handleSelectSignal}
          />
        );
      case 'tradex':
        return <TradingChart selectedSignal={selectedSignal} liveIndices={displayIndices} />;
      case 'pulse':
      default:
        return (
          <MarketPulseView
            indices={displayIndices}
            tradeFlowLogs={snapshot.tradeFlowLogs}
            onSelectSignal={handleSelectSignal}
            onNavigate={navigate}
          />
        );
    }
  };

  if (!inApp) return <Landing onEnter={enterApp} />;

  return (
    <div className="h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white">
      <HeaderTicker
        indices={displayIndices}
        isRunning={snapshot.isRunning}
        onToggleSimulation={() => marketSimulator.toggleSimulation()}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        fyersLive={fyers.connected && !!fyers.liveQuotes}
        fyersProfile={fyers.profile}
        onOpenNav={() => setDrawerOpen(true)}
      />

      {/* min-h-0 lets the scroll container size itself from the flex parent
          instead of a hard-coded calc() that breaks when the header wraps. */}
      <div className="flex flex-1 min-h-0 w-full">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={navigate}
          onOpenSettings={() => setIsSettingsOpen(true)}
          fyers={fyers}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          drawerOpen={drawerOpen}
          onCloseDrawer={() => setDrawerOpen(false)}
          onExitToSite={exitToSite}
        />

        <main className="flex-1 min-w-0 overflow-y-auto scrollbar-thin p-4 sm:p-5 lg:p-6">
          <div key={activeTab} className="view-enter max-w-[1600px] mx-auto pb-4">
            {renderActiveView()}
          </div>
        </main>
      </div>

      <BrokerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
