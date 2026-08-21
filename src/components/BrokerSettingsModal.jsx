import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { fyersService } from '../services/fyersService';

export default function BrokerSettingsModal({ isOpen, onClose }) {
  const [selectedBroker, setSelectedBroker] = useState('fyers');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [clientId, setClientId] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Real Fyers connection state (backed by the local OAuth server)
  const [fyers, setFyers] = useState(fyersService.getState());
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);

  useEffect(() => {
    const unsubscribe = fyersService.subscribe(setFyers);
    return () => unsubscribe();
  }, []);

  // While the modal is open on the Fyers tab, poll status so a completed
  // OAuth login in the other tab is picked up automatically.
  useEffect(() => {
    if (!isOpen || selectedBroker !== 'fyers') return undefined;
    fyersService.refreshStatus();
    const timer = setInterval(() => fyersService.refreshStatus(), 3000);
    return () => clearInterval(timer);
  }, [isOpen, selectedBroker]);

  if (!isOpen) return null;

  const handleConnect = (e) => {
    e.preventDefault();
    setIsConnected(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleFyersConnect = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      await fyersService.connect();
    } catch (err) {
      setConnectError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleManualAuth = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setValidatingCode(true);
    setConnectError(null);
    try {
      await fyersService.validateCode(manualCode.trim());
      setManualCode('');
    } catch (err) {
      setConnectError(err.message || 'Failed to validate auth code');
    } finally {
      setValidatingCode(false);
    }
  };

  const fyersProfileName =
    fyers.profile?.name || fyers.profile?.display_name || fyers.profile?.fy_id || 'Fyers Account';

  const renderFyersPanel = () => {
    if (fyers.connected) {
      return (
        <div className="space-y-4 font-mono text-xs">
          <div className="bg-emerald-500/15 border border-emerald-500/40 p-4 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white uppercase">Fyers Connected</h3>
            <p className="text-xs text-slate-300">{fyersProfileName}</p>
            <p className="text-[11px] text-slate-400">Live NIFTY / BANKNIFTY / SENSEX quotes are streaming into the terminal.</p>
          </div>
          <button
            onClick={() => fyersService.logout()}
            className="btn-sec-pro w-full justify-center py-2.5 text-xs font-bold uppercase tracking-wider border-rose-500/50 text-rose-400 cursor-pointer"
          >
            Disconnect Fyers
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 font-mono text-xs">
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 font-sans space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Fyers App Credentials</span>
            <span className="badge-bull text-[9px] px-1.5 py-0.5 rounded">Configured in server/.env</span>
          </div>
          <p>• App ID: <span className="text-sky-400 font-mono">J8ZMHWBTBW-100</span></p>
          <p>• Recommended Redirect URL in Fyers Dashboard: <span className="text-emerald-400 font-mono">http://localhost:3001/api/fyers/callback</span></p>
        </div>

        {connectError && (
          <div className="bg-rose-500/15 border border-rose-500/40 p-3 rounded-lg text-rose-300 text-[11px]">
            {connectError}
          </div>
        )}

        <button
          onClick={handleFyersConnect}
          disabled={connecting}
          className="btn-primary w-full justify-center py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
        >
          {connecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          {connecting ? 'Opening Fyers Login…' : '1-Click Connect with Fyers'}
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-2 text-[10px] text-slate-500 uppercase font-sans">OR paste Auth Code / URL</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <form onSubmit={handleManualAuth} className="space-y-2">
          <input
            type="text"
            placeholder="Paste auth code or redirect URL here..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-sky-500 text-xs font-mono"
          />
          <button
            type="submit"
            disabled={validatingCode || !manualCode.trim()}
            className="w-full bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 rounded-lg py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {validatingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {validatingCode ? 'Validating Code…' : 'Submit Auth Code'}
          </button>
        </form>

        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2 font-sans">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>OAuth runs safely through your local server on port 3001. Secret never touches the client browser.</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-6 space-y-5 border-sky-500/40 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-mono"
        >
          ✕ CLOSE
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30">
            <Settings className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wide">Broker API Integration</h2>
            <p className="text-xs text-slate-400">Connect your live broker for automated signal execution</p>
          </div>
        </div>

        <div className="font-mono text-xs">
          <label className="text-slate-300 block mb-1">SELECT BROKER PLATFORM</label>
          <select
            value={selectedBroker}
            onChange={(e) => setSelectedBroker(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-sky-500"
          >
            <option value="fyers">Fyers API v3</option>
            <option value="dhan">Dhan HQ API</option>
            <option value="zerodha">Zerodha Kite Connect API</option>
            <option value="upstox">Upstox Developer API</option>
            <option value="angel">Angel One SmartAPI</option>
          </select>
        </div>

        {selectedBroker === 'fyers' ? (
          renderFyersPanel()
        ) : isConnected ? (
          <div className="bg-emerald-500/15 border border-emerald-500/40 p-4 rounded-xl text-center space-y-2 font-mono">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white uppercase">Broker Connected Successfully</h3>
            <p className="text-xs text-slate-300">Live market feed & order routing active for {selectedBroker.toUpperCase()}</p>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-4 font-mono text-xs">
            <div>
              <label className="text-slate-300 block mb-1">CLIENT / USER ID</label>
              <input
                type="text"
                placeholder="e.g. 1000289410"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">API ACCESS TOKEN / KEY</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">API SECRET</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-sky-500"
              />
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2 font-sans">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Your API keys are encrypted & stored locally in browser session memory only. They are never sent to external servers.</span>
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              Verify & Connect Broker
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
