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
import { NAV_ITEMS } from './navigation';
import { marketSimulator } from './services/marketSimulator';
import { fyersService } from './services/fyersService';

const SIDEBAR_KEY = 'tb.sidebar.collapsed';

export default function App() {
  const [snapshot, setSnapshot] = useState(marketSimulator.getSnapshot());
  const [activeTab, setActiveTab] = useState('pulse');
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

  // Handle redirect back from the Fyers OAuth login (?fyers=connected|error)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('fyers')) {
      fyersService.refreshStatus();
      setIsSettingsOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const navigate = useCallback((tab) => {
    setActiveTab(tab);
    setDrawerOpen(false);
  }, []);

  // Terminal-style keyboard nav: 1–7 jump to a view, [ toggles the rail,
  // Esc backs out of the modal/drawer. Suppressed while typing in a field.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

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
  }, [navigate]);

  // Live Fyers quotes override the simulated indices when connected
  const displayIndices = fyers.connected && fyers.liveQuotes
    ? { ...snapshot.indices, ...fyers.liveQuotes }
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
        return <IndexMover />;
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
