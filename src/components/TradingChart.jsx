import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  CandlestickChart, Shield, Search, ChevronDown, Target,
  TrendingUp, Wifi
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { fyersService } from '../services/fyersService';

const STOCK_CATALOG = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', basePrice: 1310.00, sector: 'ENERGY' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', basePrice: 2266.00, sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', basePrice: 729.90, sector: 'BANK' },
  { symbol: 'INFY', name: 'Infosys Ltd', basePrice: 1121.60, sector: 'IT' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', basePrice: 1215.80, sector: 'BANK' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', basePrice: 1065.00, sector: 'AUTO' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', basePrice: 164.20, sector: 'METAL' },
  { symbol: 'SBIN', name: 'State Bank of India', basePrice: 835.40, sector: 'BANK' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', basePrice: 1540.00, sector: 'TELECOM' },
  { symbol: 'ITC', name: 'ITC Limited', basePrice: 495.60, sector: 'FMCG' },
  { symbol: 'LT', name: 'Larsen & Toubro', basePrice: 3620.00, sector: 'INFRA' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', basePrice: 1180.00, sector: 'BANK' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', basePrice: 12450.00, sector: 'AUTO' },
  { symbol: 'TITAN', name: 'Titan Company Ltd', basePrice: 3450.00, sector: 'CONSUMER' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', basePrice: 6850.00, sector: 'FINANCE' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', basePrice: 1720.00, sector: 'PHARMA' },
  { symbol: 'NTPC', name: 'NTPC Limited', basePrice: 412.00, sector: 'ENERGY' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', basePrice: 335.00, sector: 'ENERGY' },
];

// Chart plot geometry. Shared by the renderer and the mouse hit-testing so the
// two can never disagree about where the price axis starts.
const RIGHT_MARGIN = 78;
const BOTTOM_MARGIN = 30;
const CHART_HEIGHT = 370;

function generateSimulatedCandles(basePrice, count = 55, tf = '5m') {
  const candles = [];
  const now = new Date();
  const stepMinutes = tf === '1m' ? 1 : tf === '5m' ? 5 : tf === '15m' ? 15 : tf === '1h' ? 60 : 1440;
  
  let currentPrice = basePrice * (1 - (count * 0.0012) + (Math.random() * 0.01));
  const volatility = basePrice * (tf === '1D' ? 0.015 : tf === '1h' ? 0.008 : 0.0035);

  for (let i = 0; i < count; i++) {
    const candleTime = new Date(now.getTime() - (count - i) * stepMinutes * 60 * 1000);
    const timeStr = tf === '1D' 
      ? `${candleTime.getDate()} ${candleTime.toLocaleString('default', { month: 'short' })}`
      : candleTime.toTimeString().substring(0, 5);

    const open = currentPrice;
    const delta = (Math.random() - 0.485) * volatility;
    const close = Math.round((open + delta) * 100) / 100;
    const high = Math.round((Math.max(open, close) + Math.random() * volatility * 0.8) * 100) / 100;
    const low = Math.round((Math.min(open, close) - Math.random() * volatility * 0.8) * 100) / 100;
    const volume = Math.floor(Math.random() * 25000 + 4000);

    candles.push({ time: timeStr, open, high, low, close, volume });
    currentPrice = close;
  }

  // Anchor the walk so the final close IS basePrice. Without this the series
  // drifts away from the quoted price and the header LTP / order ticket
  // disagree with the last candle on screen.
  const drift = basePrice - candles[candles.length - 1].close;
  return candles.map((c) => ({
    ...c,
    open: Math.round((c.open + drift) * 100) / 100,
    high: Math.round((c.high + drift) * 100) / 100,
    low: Math.round((c.low + drift) * 100) / 100,
    close: Math.round((c.close + drift) * 100) / 100,
  }));
}

export default function TradingChart({ selectedSignal }) {
  const [symbol, setSymbol] = useState(selectedSignal ? selectedSignal.symbol : 'RELIANCE');
  const [symbolInput, setSymbolInput] = useState('');
  const [showSymbolSearch, setShowSymbolSearch] = useState(false);
  const [timeframe, setTimeframe] = useState('5m');
  const [tradeAction, setTradeAction] = useState(selectedSignal?.signal?.includes('SELL') ? 'SELL' : 'BUY');
  
  // Indicator toggles
  const [showEma9, setShowEma9] = useState(true);
  const [showEma21, setShowEma21] = useState(true);
  const [showSupertrend, setShowSupertrend] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  const [isFyersLive, setIsFyersLive] = useState(false);

  // Initial stock lookup
  const activeStock = useMemo(() => {
    return STOCK_CATALOG.find(s => s.symbol === symbol) || {
      symbol,
      name: symbol,
      basePrice: selectedSignal?.entry || 1310.00,
      sector: 'EQUITY'
    };
  }, [symbol, selectedSignal]);

  const [price, setPrice] = useState(selectedSignal ? selectedSignal.entry : activeStock.basePrice);
  const [qty, setQty] = useState(100);
  const [stopLoss, setStopLoss] = useState(selectedSignal ? selectedSignal.sl : Math.round(activeStock.basePrice * 0.985 * 10) / 10);
  const [target, setTarget] = useState(selectedSignal ? selectedSignal.target1 : Math.round(activeStock.basePrice * 1.025 * 10) / 10);
  const [toast, setToast] = useState(null);

  const [candles, setCandles] = useState(() => generateSimulatedCandles(activeStock.basePrice, 55, '5m'));
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [mousePos, setMousePos] = useState(null);

  const [positions, setPositions] = useState([
    { id: 'pos-1', symbol: 'INFY', side: 'BUY', qty: 200, avgPrice: 1120.0, currentPrice: 1121.6, pnl: 320.0 },
    { id: 'pos-2', symbol: 'TATASTEEL', side: 'BUY', qty: 500, avgPrice: 162.0, currentPrice: 164.2, pnl: 1100.0 },
  ]);
  const [walletBalance, setWalletBalance] = useState(500000);

  const canvasRef = useRef(null);
  const plotRef = useRef(null);
  const dropdownRef = useRef(null);
  // Mirrors `candles` so the tick interval can read the latest series without
  // depending on it (which would tear down and recreate the interval each tick).
  const candlesRef = useRef(candles);

  // Close symbol dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSymbolSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real Fyers historical candles if connected, otherwise generate simulated
  useEffect(() => {
    let isMounted = true;

    async function loadCandles() {
      const fyersState = fyersService.getState();
      setIsFyersLive(!!fyersState.connected);

      if (fyersState.connected) {
        try {
          const fyersCandles = await fyersService.getHistoricalCandles(symbol, timeframe);
          if (isMounted && fyersCandles && fyersCandles.length > 0) {
            const formatted = fyersCandles.slice(-60);
            setCandles(formatted);
            const lastClose = formatted[formatted.length - 1].close;
            setPrice(lastClose);
            setStopLoss(Math.round(lastClose * 0.985 * 10) / 10);
            setTarget(Math.round(lastClose * 1.025 * 10) / 10);
            return;
          }
        } catch {}
      }

      // Fallback to high-accuracy model
      const base = selectedSignal && selectedSignal.symbol === symbol ? selectedSignal.entry : activeStock.basePrice;
      if (isMounted) {
        setPrice(base);
        setStopLoss(selectedSignal && selectedSignal.symbol === symbol ? selectedSignal.sl : Math.round(base * 0.985 * 10) / 10);
        setTarget(selectedSignal && selectedSignal.symbol === symbol ? selectedSignal.target1 : Math.round(base * 1.025 * 10) / 10);
        setCandles(generateSimulatedCandles(base, 55, timeframe));
      }
    }

    loadCandles();
    return () => { isMounted = false; };
  }, [symbol, timeframe, activeStock, selectedSignal]);

  // Subscribe to live Fyers quotes stream for instant LTP & candle sync
  useEffect(() => {
    const unsubscribe = fyersService.subscribe((state) => {
      setIsFyersLive(!!state.connected);
      if (state.connected && state.liveQuotes) {
        const liveQuote = state.liveQuotes[symbol] || state.liveQuotes[`NSE:${symbol}-EQ`];
        if (liveQuote && liveQuote.price > 0) {
          const newPrice = liveQuote.price;
          setPrice(newPrice);

          setCandles(prev => {
            if (!prev || prev.length === 0) return prev;
            const lastIdx = prev.length - 1;
            const last = prev[lastIdx];
            const updatedLast = {
              ...last,
              close: newPrice,
              high: Math.max(last.high, newPrice),
              low: Math.min(last.low, newPrice),
            };
            const copy = [...prev];
            copy[lastIdx] = updatedLast;
            return copy;
          });
        }
      }
    });

    return () => unsubscribe();
  }, [symbol]);

  useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);

  // LIVE TICK SIMULATION: Breathe life into the chart every 1.4s.
  //
  // The tick value is drawn ONCE here, outside every updater, and the three
  // states that depend on it are then set from that single value. Drawing it
  // inside a setState updater desynchronises them: updaters must be pure, and
  // StrictMode deliberately double-invokes them in development, so a
  // Math.random() call inside would yield a different close on each invocation
  // — leaving the header LTP showing one draw and the chart's last candle
  // another.
  useEffect(() => {
    if (!isFyersLive) {
      // Only use simulated ticks when Fyers is NOT connected
      const interval = setInterval(() => {
        const prev = candlesRef.current;
        if (!prev || prev.length === 0) return;

        const last = prev[prev.length - 1];
        const tickDelta = (Math.random() - 0.485) * (last.close * 0.0008);
        const newClose = Math.round((last.close + tickDelta) * 100) / 100;
        const volumeAdd = Math.floor(Math.random() * 120 + 15);

        setCandles(cur => {
          if (!cur || cur.length === 0) return cur;
          const i = cur.length - 1;
          const c = cur[i];
          const copy = [...cur];
          copy[i] = {
            ...c,
            close: newClose,
            high: Math.round(Math.max(c.high, newClose) * 100) / 100,
            low: Math.round(Math.min(c.low, newClose) * 100) / 100,
            volume: c.volume + volumeAdd,
          };
          return copy;
        });

        setPrice(newClose);

        setPositions(cur => cur.map(pos => {
          if (pos.symbol !== symbol) return pos;
          const diff = pos.side === 'BUY' ? newClose - pos.avgPrice : pos.avgPrice - newClose;
          return { ...pos, currentPrice: newClose, pnl: Math.round(diff * pos.qty * 10) / 10 };
        }));
      }, 1400);

      return () => clearInterval(interval);
    }
  }, [symbol, isFyersLive]);

  // Risk / Reward calculations
  const riskPoints = Math.max(0.1, Math.abs(Number(price) - Number(stopLoss)));
  const rewardPoints = Math.max(0.1, Math.abs(Number(target) - Number(price)));
  const rrRatio = (rewardPoints / riskPoints).toFixed(2);
  const marginRequired = Number(qty) * Number(price);

  // Render Canvas Chart Engine
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !candles || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    // Measure the plot wrapper, NOT the card: the card carries p-4, and
    // clientWidth includes padding, which would size the canvas 32px wider
    // than its content box and clip the right-hand price axis.
    const plot = plotRef.current;
    if (!plot) return;

    const width = plot.clientWidth || 800;
    const height = CHART_HEIGHT;
    const dpr = window.devicePixelRatio || 1;

    // Only the backing store is set here; the CSS width stays `w-full` so the
    // element can still shrink on resize.
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Dark terminal background
    ctx.fillStyle = '#040710';
    ctx.fillRect(0, 0, width, height);

    const rightMargin = RIGHT_MARGIN;
    const bottomMargin = BOTTOM_MARGIN;
    const chartWidth = width - rightMargin;
    const chartHeight = height - bottomMargin;

    // Price scaling
    let minP = Infinity;
    let maxP = -Infinity;
    candles.forEach(c => {
      if (c.low < minP) minP = c.low;
      if (c.high > maxP) maxP = c.high;
    });
    const padding = (maxP - minP) * 0.08 || 2;
    minP -= padding;
    maxP += padding;
    const priceRange = maxP - minP;

    const getY = (p) => chartHeight - ((p - minP) / priceRange) * chartHeight;

    // Grid lines (Horizontal & Vertical)
    ctx.strokeStyle = 'rgba(28, 42, 70, 0.45)';
    ctx.lineWidth = 0.5;

    const ySteps = 6;
    for (let i = 0; i <= ySteps; i++) {
      const p = minP + (priceRange * i) / ySteps;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Right axis price text — clamped so the top/bottom labels are not
      // sliced by the canvas edge.
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.toFixed(1), chartWidth + 8, Math.min(chartHeight - 6, Math.max(7, y)));
    }

    const candleCount = candles.length;
    const candleWidth = chartWidth / candleCount;

    // Vertical time grid lines
    const timeStep = Math.max(1, Math.floor(candleCount / 7));
    for (let i = 0; i < candleCount; i += timeStep) {
      const x = i * candleWidth + candleWidth / 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chartHeight);
      ctx.stroke();

      // Bottom axis time text — nudged inward at the edges so the first and
      // last stamps read in full instead of being half-cut.
      ctx.fillStyle = '#475569';
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(candles[i].time, Math.min(chartWidth - 16, Math.max(16, x)), height - 9);
    }

    // Volume bars at bottom
    if (showVolume) {
      const maxVol = Math.max(...candles.map(c => c.volume)) || 1;
      const maxVolHeight = chartHeight * 0.22;
      candles.forEach((c, idx) => {
        const x = idx * candleWidth + candleWidth * 0.15;
        const w = candleWidth * 0.7;
        const volH = (c.volume / maxVol) * maxVolHeight;
        const isUp = c.close >= c.open;
        ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.22)' : 'rgba(244, 63, 94, 0.22)';
        ctx.fillRect(x, chartHeight - volH, w, volH);
      });
    }

    // Render Candlesticks
    candles.forEach((c, idx) => {
      const x = idx * candleWidth;
      const cx = x + candleWidth / 2;
      const isGreen = c.close >= c.open;

      const yHigh = getY(c.high);
      const yLow = getY(c.low);
      const yOpen = getY(c.open);
      const yClose = getY(c.close);

      // Wick
      ctx.strokeStyle = isGreen ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, yHigh);
      ctx.lineTo(cx, yLow);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
      const bodyWidth = Math.max(2, candleWidth * 0.72);
      const bodyX = cx - bodyWidth / 2;

      ctx.fillStyle = isGreen ? '#10b981' : '#f43f5e';
      ctx.fillRect(bodyX, bodyTop, bodyWidth, bodyHeight);

      // Border for clarity
      ctx.strokeStyle = isGreen ? '#34d399' : '#fb7185';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(bodyX, bodyTop, bodyWidth, bodyHeight);
    });

    // Indicator: EMA 9 (Sky Blue)
    if (showEma9) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let ema = candles[0].close;
      const k = 2 / (9 + 1);
      candles.forEach((c, idx) => {
        ema = c.close * k + ema * (1 - k);
        const x = idx * candleWidth + candleWidth / 2;
        const y = getY(ema);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Indicator: EMA 21 (Amber)
    if (showEma21) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let ema21 = candles[0].close;
      const k21 = 2 / (21 + 1);
      candles.forEach((c, idx) => {
        ema21 = c.close * k21 + ema21 * (1 - k21);
        const x = idx * candleWidth + candleWidth / 2;
        const y = getY(ema21);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Indicator: Supertrend Band
    if (showSupertrend) {
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      candles.forEach((c, idx) => {
        const x = idx * candleWidth + candleWidth / 2;
        const stPrice = c.low - (maxP - minP) * 0.035;
        const y = getY(stPrice);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Live Current Price Horizontal Line & Tag (Pulsing)
    const latestCandle = candles[candles.length - 1];
    const liveY = getY(latestCandle.close);
    const isLiveUp = latestCandle.close >= latestCandle.open;

    ctx.strokeStyle = isLiveUp ? 'rgba(16, 185, 129, 0.85)' : 'rgba(244, 63, 94, 0.85)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, liveY);
    ctx.lineTo(chartWidth, liveY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live price pill on right axis
    ctx.fillStyle = isLiveUp ? '#059669' : '#e11d48';
    ctx.fillRect(chartWidth + 2, liveY - 9, rightMargin - 4, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(latestCandle.close.toFixed(1), chartWidth + (rightMargin / 2), liveY + 3.5);

    // Interactive Mouse Crosshair & Tooltip
    if (mousePos && mousePos.x >= 0 && mousePos.x <= chartWidth && mousePos.y >= 0 && mousePos.y <= chartHeight) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, chartHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(chartWidth, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const hoveredPrice = minP + ((chartHeight - mousePos.y) / chartHeight) * priceRange;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(chartWidth + 2, mousePos.y - 8, rightMargin - 4, 16);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(chartWidth + 2, mousePos.y - 8, rightMargin - 4, 16);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(hoveredPrice.toFixed(1), chartWidth + (rightMargin / 2), mousePos.y + 3);

      const hoveredIdx = Math.min(candleCount - 1, Math.max(0, Math.floor(mousePos.x / candleWidth)));
      if (candles[hoveredIdx]) {
        const timeText = candles[hoveredIdx].time;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(mousePos.x - 30, chartHeight + 2, 60, 16);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(mousePos.x - 30, chartHeight + 2, 60, 16);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px "IBM Plex Mono", monospace';
        ctx.fillText(timeText, mousePos.x, chartHeight + 13);
      }
    }
  }, [candles, showEma9, showEma21, showSupertrend, showVolume, mousePos]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Track the plot box itself — the sidebar collapsing or the card reflowing
  // resizes the canvas without firing a window resize event.
  useEffect(() => {
    const plot = plotRef.current;
    if (!plot || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => drawChart());
    ro.observe(plot);
    return () => ro.disconnect();
  }, [drawChart]);

  const handleMouseMove = (e) => {
    const plot = plotRef.current;
    if (!plot) return;
    const rect = plot.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    const chartWidth = rect.width - RIGHT_MARGIN;
    const candleWidth = chartWidth / candles.length;
    const idx = Math.min(candles.length - 1, Math.max(0, Math.floor(x / candleWidth)));
    setHoveredCandle(x >= 0 && x <= chartWidth ? candles[idx] || null : null);
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoveredCandle(null);
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExecuteTrade = () => {
    if (marginRequired > walletBalance && tradeAction === 'BUY') {
      showToast('Insufficient funds in Paper Wallet!', 'error');
      return;
    }
    const newPos = {
      id: `pos-${Date.now()}`,
      symbol,
      side: tradeAction,
      qty: Number(qty),
      avgPrice: Number(price),
      currentPrice: Number(price),
      pnl: 0.0,
    };
    setPositions(prev => [newPos, ...prev]);
    setWalletBalance(prev => tradeAction === 'BUY' ? prev - marginRequired : prev + marginRequired);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    showToast(`${tradeAction} ${qty} × ${symbol} @ ₹${price.toFixed(2)} executed!`, 'success');
  };

  const handleClosePosition = (id) => {
    const pos = positions.find(p => p.id === id);
    setPositions(prev => prev.filter(p => p.id !== id));
    showToast(`Position ${pos?.symbol} closed`, 'info');
  };

  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  const filteredSymbols = STOCK_CATALOG.filter(s =>
    s.symbol.includes(symbolInput.toUpperCase()) || s.name.toLowerCase().includes(symbolInput.toLowerCase())
  );

  const displayCandle = hoveredCandle || candles[candles.length - 1] || { open: price, high: price, low: price, close: price, volume: 15000 };
  const candleChange = displayCandle.close - displayCandle.open;
  const candlePChange = displayCandle.open > 0 ? (candleChange / displayCandle.open) * 100 : 0;
  const isCandleGreen = candleChange >= 0;

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl font-mono text-sm font-bold shadow-2xl border transition-all ${
          toast.type === 'success' ? 'bg-emerald-950 border-emerald-500/60 text-emerald-300' :
          toast.type === 'error'   ? 'bg-rose-950 border-rose-500/60 text-rose-300' :
                                     'bg-slate-900 border-slate-600 text-slate-200'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4 relative z-30 overflow-visible">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30">
            <CandlestickChart className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 relative overflow-visible">
              {/* Symbol Search Dropdown */}
              <div className="relative overflow-visible" ref={dropdownRef}>
                <button
                  onClick={() => setShowSymbolSearch(v => !v)}
                  className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-bold font-mono text-sm hover:border-sky-500 transition-all shadow-inner cursor-pointer"
                >
                  <span className="text-sky-400 font-extrabold">{symbol}</span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">({activeStock.name})</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showSymbolSearch && (
                  <div className="absolute top-full mt-2 left-0 z-50 bg-slate-950 border-2 border-sky-500/60 rounded-xl shadow-2xl w-80 overflow-hidden backdrop-blur-2xl">
                    <div className="p-2.5 border-b border-slate-800 bg-slate-900/90">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-sky-400" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search NSE stock / symbol..."
                          value={symbolInput}
                          onChange={e => setSymbolInput(e.target.value)}
                          className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full font-mono font-bold"
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto scrollbar-thin divide-y divide-slate-900">
                      {filteredSymbols.map(s => (
                        <button
                          key={s.symbol}
                          onClick={() => {
                            setSymbol(s.symbol);
                            setShowSymbolSearch(false);
                            setSymbolInput('');
                          }}
                          className="w-full text-left px-3.5 py-2.5 text-xs font-mono text-slate-300 hover:bg-sky-500/20 hover:text-white transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <span className="font-extrabold text-white block">{s.symbol}</span>
                            <span className="text-[10px] text-slate-400">{s.name}</span>
                          </div>
                          <span className="text-emerald-400 font-bold">₹{s.basePrice.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* LTP badge */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                <span className="live-dot"></span>
                <span className="text-[10px] text-slate-400 font-mono">LTP:</span>
                <span className="font-mono font-black text-white">₹{price.toFixed(2)}</span>
              </div>

              {/* Fyers Live Feed Badge */}
              {isFyersLive && (
                <span className="badge-bull font-mono text-[9px] uppercase font-bold tracking-wider flex items-center gap-1">
                  <Wifi style={{ width: 10, height: 10 }} /> FYERS LIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live Interactive Candlestick Chart Engine &amp; Precision Execution Station
            </p>
          </div>
        </div>

        {/* Indicators & Timeframe Controls */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          {/* Indicator toggles */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setShowEma9(v => !v)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                showEma9 ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              EMA 9
            </button>
            <button
              onClick={() => setShowEma21(v => !v)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                showEma21 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              EMA 21
            </button>
            <button
              onClick={() => setShowSupertrend(v => !v)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                showSupertrend ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              ST (10,3)
            </button>
            <button
              onClick={() => setShowVolume(v => !v)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                showVolume ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              VOL
            </button>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 gap-0.5">
            {['1m', '5m', '15m', '1h', '1D'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-sky-500 text-slate-950 font-extrabold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Paper Wallet */}
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400 text-[10px]">WALLET: </span>
            <span className="text-emerald-400 font-bold">₹{walletBalance.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Main Chart Area + Order Execution Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Interactive Chart (2 Columns) */}
        <div className="lg:col-span-2 glass-card p-4 space-y-2.5 flex flex-col justify-between">
          {/* Live Telemetry Bar */}
          <div className="flex flex-wrap items-center justify-between text-xs font-mono border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-[11px]">
                {hoveredCandle ? `Candle: ${hoveredCandle.time}` : `Live ${timeframe} Feed`}
              </span>
              <span className="text-slate-500">|</span>
              <span>O: <strong className="text-slate-200">{displayCandle.open.toFixed(2)}</strong></span>
              <span>H: <strong className="text-slate-200">{displayCandle.high.toFixed(2)}</strong></span>
              <span>L: <strong className="text-slate-200">{displayCandle.low.toFixed(2)}</strong></span>
              <span>C: <strong className={isCandleGreen ? 'text-emerald-400' : 'text-rose-400'}>{displayCandle.close.toFixed(2)}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`font-bold ${isCandleGreen ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isCandleGreen ? '+' : ''}{candleChange.toFixed(2)} ({isCandleGreen ? '+' : ''}{candlePChange.toFixed(2)}%)
              </span>
              <span className="text-slate-500 text-[10px]">Vol: {(displayCandle.volume / 1000).toFixed(1)}k</span>
            </div>
          </div>

          {/* Canvas Element with mouse tracking */}
          <div
            ref={plotRef}
            className="relative w-full bg-[#040710] rounded-xl overflow-hidden border border-slate-900/90 cursor-crosshair"
          >
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="w-full block"
            />
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
            <div className="flex items-center gap-3">
              {showEma9 && <span className="text-sky-400">● EMA(9)</span>}
              {showEma21 && <span className="text-amber-400">● EMA(21)</span>}
              {showSupertrend && <span className="text-emerald-400">● Supertrend</span>}
              {showVolume && <span className="text-purple-400">● Volume Profile</span>}
            </div>
            <span>Hover on chart for crosshair inspection</span>
          </div>
        </div>

        {/* Order Execution Ticket */}
        <div className="glass-card p-5 space-y-4 font-mono" style={{ borderTop: '2px solid rgba(56,189,248,0.8)' }}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" /> Order Execution Window
            </h2>
            <span className="badge badge-cyan text-[9px]">{symbol}</span>
          </div>

          {/* BUY / SELL Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTradeAction('BUY')}
              className={`py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                tradeAction === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-500/60'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:border-emerald-700/50'
              }`}
            >
              BUY (LONG)
            </button>
            <button
              onClick={() => setTradeAction('SELL')}
              className={`py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                tradeAction === 'SELL'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-500/60'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:border-rose-700/50'
              }`}
            >
              SELL (SHORT)
            </button>
          </div>

          {/* Inputs */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">
                Quantity (Shares)
              </label>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-sky-500 font-bold text-sm"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">
                Execution Price (₹)
              </label>
              <input
                type="number"
                step="0.05"
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-sky-500 font-bold text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-rose-400 block mb-1 uppercase tracking-wider text-[10px]">
                  Stop Loss (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={stopLoss}
                  onChange={e => setStopLoss(Number(e.target.value))}
                  className="w-full bg-rose-950/30 border border-rose-900/70 rounded-lg px-3 py-2 text-rose-300 outline-none focus:border-rose-500 font-bold"
                />
              </div>
              <div>
                <label className="text-emerald-400 block mb-1 uppercase tracking-wider text-[10px]">
                  Target (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={target}
                  onChange={e => setTarget(Number(e.target.value))}
                  className="w-full bg-emerald-950/30 border border-emerald-900/70 rounded-lg px-3 py-2 text-emerald-300 outline-none focus:border-emerald-500 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Risk/Reward Telemetry Card */}
          <div className="bg-slate-900/70 rounded-xl p-3 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-sky-400" /> Risk / Reward Ratio:
              </span>
              <span
                className={`font-black text-xs ${
                  Number(rrRatio) >= 1.5 ? 'text-emerald-400' : Number(rrRatio) >= 1 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                1 : {rrRatio}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Margin Required:</span>
              <span className="text-white font-bold">₹{marginRequired.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            {/* Visual R:R Bar */}
            <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
              <div className="bg-rose-500" style={{ flex: 1 }}></div>
              <div className="bg-emerald-500" style={{ flex: Math.max(1, Number(rrRatio)) }}></div>
            </div>
          </div>

          {/* Execute Order Button */}
          <button
            onClick={handleExecuteTrade}
            className={`w-full py-3 rounded-xl font-extrabold text-sm uppercase tracking-wide transition-all cursor-pointer ${
              tradeAction === 'BUY'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30 font-black'
                : 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/30 font-black'
            }`}
          >
            <TrendingUp className="inline w-4 h-4 mr-1.5" />
            Execute {tradeAction} Order
          </button>
        </div>
      </div>

      {/* Positions & Paper Order Blotter */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Active Paper Positions</h2>
            <span className="badge badge-cyan font-mono">{positions.length} OPEN</span>
          </div>
          <div className="text-xs font-mono">
            Unrealized P&amp;L:{' '}
            <strong className={totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toFixed(2)}
            </strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="trade-table font-mono text-xs">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Side</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Avg Price</th>
                <th className="text-right">LTP</th>
                <th className="text-right">Unrealized P&amp;L</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-8">
                    No active positions. Execute a trade above to see it live in your blotter.
                  </td>
                </tr>
              )}
              {positions.map((pos) => (
                <tr key={pos.id} className="hover:bg-slate-800/40">
                  <td className="font-bold text-white">{pos.symbol}</td>
                  <td>
                    <span className={`badge ${pos.side === 'BUY' ? 'badge-bullish' : 'badge-bearish'}`}>{pos.side}</span>
                  </td>
                  <td className="text-right text-slate-300">{pos.qty}</td>
                  <td className="text-right text-slate-300">₹{pos.avgPrice.toFixed(2)}</td>
                  <td className="text-right text-white font-bold">₹{pos.currentPrice.toFixed(2)}</td>
                  <td className={`text-right font-bold ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pos.pnl >= 0 ? '+' : ''}₹{pos.pnl.toFixed(2)}
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => handleClosePosition(pos.id)}
                      className="btn-danger text-[10px] py-1 px-2.5"
                    >
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}