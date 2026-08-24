/**
 * Derived market analytics.
 *
 * Everything here is computed from data already on screen — the option chain,
 * sector breadth, index quotes and signal outcomes — rather than hardcoded.
 * When a broker is connected these inputs are live, so the outputs are too.
 *
 * All functions are pure so they can be unit-checked and memoised.
 */

/* ── Option chain ──────────────────────────────────────────────────────── */

/**
 * Put/call ratio, max-pain strike and ATM implied volatility.
 *
 * Max pain is the expiry level at which option writers lose the least:
 *   loss(S) = Σ callOI(k)·max(0, S−k) + Σ putOI(k)·max(0, k−S)
 * evaluated at every listed strike, taking the argmin.
 */
export function computeOptionMetrics(optionChain, spot) {
  if (!Array.isArray(optionChain) || optionChain.length === 0) return null;

  let callOi = 0;
  let putOi = 0;
  let callVol = 0;
  let putVol = 0;

  for (const row of optionChain) {
    callOi += Number(row.call?.oi) || 0;
    putOi += Number(row.put?.oi) || 0;
    callVol += Number(row.call?.volume) || 0;
    putVol += Number(row.put?.volume) || 0;
  }

  const pcr = callOi > 0 ? putOi / callOi : null;

  let maxPain = null;
  let lowestLoss = Infinity;
  for (const candidate of optionChain) {
    const s = candidate.strike;
    let loss = 0;
    for (const row of optionChain) {
      const k = row.strike;
      if (k < s) loss += (Number(row.call?.oi) || 0) * (s - k);
      if (k > s) loss += (Number(row.put?.oi) || 0) * (k - s);
    }
    if (loss < lowestLoss) {
      lowestLoss = loss;
      maxPain = s;
    }
  }

  // ATM = listed strike closest to spot; average its call and put IV.
  const reference = Number(spot) || optionChain[Math.floor(optionChain.length / 2)].strike;
  const atmRow = optionChain.reduce((best, row) =>
    Math.abs(row.strike - reference) < Math.abs(best.strike - reference) ? row : best
  );
  const ivs = [Number(atmRow.call?.iv), Number(atmRow.put?.iv)].filter(Number.isFinite);
  const atmIv = ivs.length ? ivs.reduce((a, b) => a + b, 0) / ivs.length : null;

  return {
    pcr,
    maxPain,
    atmIv,
    atmStrike: atmRow.strike,
    callOi,
    putOi,
    callVol,
    putVol,
    // PCR above ~1.05 leans bullish (put writing), below ~0.85 bearish.
    bias: pcr == null ? 'NEUTRAL' : pcr >= 1.05 ? 'BULLISH' : pcr <= 0.85 ? 'BEARISH' : 'NEUTRAL',
  };
}

/* ── Signal outcomes ───────────────────────────────────────────────────── */

const WIN_STATUSES = ['TARGET 1 MET', 'TARGET 2 MET', 'TARGET MET', 'CLOSED WIN'];
const LOSS_STATUSES = ['SL HIT', 'STOPPED OUT', 'CLOSED LOSS'];

/**
 * Signal performance.
 *
 * Two separate figures, because conflating them is what made the old
 * hardcoded "79.4%" meaningless:
 *
 *  - `realizedWinRate` — outcomes of signals that actually closed. Honest but
 *    small-sample, so `closed` is returned alongside it for display.
 *  - `expectedWinRate` — confidence-weighted mean of each active strategy's
 *    historical hit rate. This is a forward-looking estimate, not a result.
 */
export function computeSignalStats(signals) {
  if (!Array.isArray(signals) || signals.length === 0) return null;

  let wins = 0;
  let losses = 0;
  let active = 0;

  for (const s of signals) {
    const status = String(s.status || '').toUpperCase();
    if (WIN_STATUSES.includes(status)) wins += 1;
    else if (LOSS_STATUSES.includes(status)) losses += 1;
    else active += 1;
  }

  const closed = wins + losses;
  const realizedWinRate = closed > 0 ? (wins / closed) * 100 : null;

  // Weight each strategy's historical rate by the signal's confidence, so a
  // high-conviction setup counts for more than a marginal one.
  let weighted = 0;
  let weight = 0;
  for (const s of signals) {
    const rate = parseFloat(String(s.winRate).replace('%', ''));
    const conf = Number(s.confidence);
    if (!Number.isFinite(rate)) continue;
    const w = Number.isFinite(conf) && conf > 0 ? conf : 1;
    weighted += rate * w;
    weight += w;
  }
  const expectedWinRate = weight > 0 ? weighted / weight : null;

  const avgConfidence = signals.reduce((n, s) => n + (Number(s.confidence) || 0), 0) / signals.length;

  // Mean reward:risk across signals, parsed from the "1 : 2.2" display form.
  const rrs = signals
    .map((s) => parseFloat(String(s.rrRatio).split(':')[1]))
    .filter(Number.isFinite);
  const avgRr = rrs.length ? rrs.reduce((a, b) => a + b, 0) / rrs.length : null;

  // Expectancy per unit risked: p·R − (1−p) with p from the expected rate.
  const p = expectedWinRate != null ? expectedWinRate / 100 : null;
  const expectancy = p != null && avgRr != null ? p * avgRr - (1 - p) : null;

  return {
    total: signals.length,
    wins,
    losses,
    active,
    closed,
    realizedWinRate,
    expectedWinRate,
    avgConfidence,
    avgRr,
    expectancy,
    buys: signals.filter((s) => String(s.signal).includes('BUY')).length,
    sells: signals.filter((s) => String(s.signal).includes('SELL')).length,
  };
}

/* ── Bull score ────────────────────────────────────────────────────────── */

const clamp01 = (n) => Math.max(0, Math.min(1, n));

/**
 * Composite bull/bear score, 0–100.
 *
 * Blends five independent readings of the same market, each normalised to
 * 0–1 and weighted. A score of 50 is neutral; the label is derived from the
 * score so the two can never disagree.
 *
 *   breadth   35%  share of index constituents advancing
 *   sectors   20%  share of sectors positive
 *   momentum  20%  index % change, saturating at ±1.5%
 *   pcr       15%  put/call ratio, mapped 0.6→0 and 1.4→1
 *   vix       10%  falling volatility reads risk-on
 */
export function computeBullScore({ indices, sectors, optionMetrics }) {
  const parts = [];

  if (Array.isArray(sectors) && sectors.length) {
    const adv = sectors.reduce((n, s) => n + (Number(s.advancing) || 0), 0);
    const dec = sectors.reduce((n, s) => n + (Number(s.declining) || 0), 0);
    if (adv + dec > 0) {
      parts.push({ key: 'breadth', label: 'Constituent breadth', weight: 0.35, value: adv / (adv + dec) });
    }
    const up = sectors.filter((s) => Number(s.pChange) > 0).length;
    parts.push({ key: 'sectors', label: 'Sector participation', weight: 0.20, value: up / sectors.length });
  }

  const niftyPChange = Number(indices?.nifty?.pChange);
  if (Number.isFinite(niftyPChange)) {
    // ±1.5% saturates the reading; 0% sits at neutral.
    parts.push({
      key: 'momentum',
      label: 'Index momentum',
      weight: 0.20,
      value: clamp01(0.5 + niftyPChange / 3),
    });
  }

  if (optionMetrics?.pcr != null) {
    parts.push({
      key: 'pcr',
      label: 'Options positioning',
      weight: 0.15,
      value: clamp01((optionMetrics.pcr - 0.6) / 0.8),
    });
  }

  const vixPChange = Number(indices?.indiaVix?.pChange);
  if (Number.isFinite(vixPChange)) {
    // Falling VIX is risk-on, so the sign is inverted; ±10% saturates.
    parts.push({
      key: 'vix',
      label: 'Volatility trend',
      weight: 0.10,
      value: clamp01(0.5 - vixPChange / 20),
    });
  }

  if (parts.length === 0) return null;

  // Re-normalise weights over the readings actually available, so a missing
  // input shifts the blend rather than silently dragging the score to zero.
  const totalWeight = parts.reduce((n, p) => n + p.weight, 0);
  const score = parts.reduce((n, p) => n + p.value * p.weight, 0) / totalWeight;
  const pct = Math.round(score * 100);

  return {
    score: pct,
    label: scoreLabel(pct),
    tone: pct >= 55 ? 'bull' : pct <= 45 ? 'bear' : 'neutral',
    components: parts.map((p) => ({
      key: p.key,
      label: p.label,
      pct: Math.round(p.value * 100),
      weight: Math.round((p.weight / totalWeight) * 100),
    })),
  };
}

function scoreLabel(pct) {
  if (pct >= 75) return 'Strong Buying';
  if (pct >= 60) return 'Accumulating';
  if (pct >= 55) return 'Mildly Bullish';
  if (pct > 45) return 'Range Bound';
  if (pct > 40) return 'Mildly Bearish';
  if (pct > 25) return 'Distributing';
  return 'Strong Selling';
}

/* ── Institutional flow ────────────────────────────────────────────────── */

/** Net FII + DII flow in ₹ crore, from the institutional-flow record. */
export function computeInstitutionalFlow(flow) {
  if (!flow) return null;
  const fii = Number(flow.fiiNet) || 0;
  const dii = Number(flow.diiNet) || 0;
  const net = fii + dii;
  return {
    fii,
    dii,
    net,
    label: net >= 0 ? 'NET BUY' : 'NET SELL',
    tone: net >= 0 ? 'bull' : 'bear',
  };
}
