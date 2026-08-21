import React, { useState, useEffect } from 'react';
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
import { marketSimulator } from './services/marketSimulator';
import { fyersService } from './services/fyersService';

export default function App() {
  const [snapshot, setSnapshot] = useState(marketSimulator.getSnapshot());
  const [activeTab, setActiveTab] = useState('pulse');
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fyers, setFyers] = useState(fyersService.getState());

  // Subscribe to real-time market simulator telemetry ticks
  useEffect(() => {
    const unsubscribe = marketSimulator.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
    });
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

  // Live Fyers quotes override the simulated indices when connected
  const displayIndices = fyers.connected && fyers.liveQuotes
    ? { ...snapshot.indices, ...fyers.liveQuotes }
    : snapshot.indices;

  // Handle signal selection & router redirect to TradeX chart
  const handleSelectSignal = (sig) => {
    setSelectedSignal(sig);
    setActiveTab('tradex');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'pulse':
        return (
          <MarketPulseView
            indices={displayIndices}
            tradeFlowLogs={snapshot.tradeFlowLogs}
            onSelectSignal={handleSelectSignal}
            onNavigate={setActiveTab}
          />
        );
      case 'optionclock':
        return (
          <OptionClock
            indices={displayIndices}
            optionChain={snapshot.optionChain}
          />
        );
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
      default:
        return (
          <MarketPulseView
            indices={displayIndices}
            tradeFlowLogs={snapshot.tradeFlowLogs}
            onSelectSignal={handleSelectSignal}
            onNavigate={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white">
      {/* Top Header Ticker Bar */}
      <HeaderTicker
        indices={displayIndices}
        isRunning={snapshot.isRunning}
        onToggleSimulation={() => marketSimulator.toggleSimulation()}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        fyersLive={fyers.connected && !!fyers.liveQuotes}
        fyersProfile={fyers.profile}
      />

      {/* Main Content Area with Sidebar Navigation */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          fyers={fyers}
        />

        {/* Dynamic View Area */}
        <main className="flex-1 p-5 lg:p-6 overflow-y-auto max-h-[calc(100vh-90px)] scrollbar-thin">
          <div key={activeTab} className="view-enter max-w-[1600px] mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Broker API Modal */}
      <BrokerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
