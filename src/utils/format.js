/**
 * Shared number formatting for the terminal.
 *
 * Every price, delta and percentage on screen goes through here so that a
 * value never renders as `2985.5` in one view and `2,985.50` in another, and
 * so live-ticking digits keep a fixed width (paired with `.font-mono`, which
 * enables tabular numerals).
 */

const inr = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrWhole = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** `24582.4` → `24,582.40`. Indian digit grouping. */
export function num(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return decimals === 2
    ? inr.format(n)
    : n.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
}

/** `2985.5` → `₹2,985.50`. */
export function inrPrice(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `₹${num(n, decimals)}`;
}

/** `500000` → `₹5,00,000` — whole rupees, for wallet/margin figures. */
export function inrWholeRupees(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `₹${inrWhole.format(n)}`;
}

/** Always signed: `1.42` → `+1.42%`, `-0.35` → `-0.35%`. */
export function pct(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n >= 0 ? '+' : ''}${num(n, decimals)}%`;
}

/** Always signed absolute change: `146.5` → `+146.50`. */
export function signed(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n >= 0 ? '+' : ''}${num(n, decimals)}`;
}

/** Signed rupee P&L: `-320` → `-₹320.00` (sign outside the symbol). */
export function signedInr(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n >= 0 ? '+' : '-'}₹${num(Math.abs(n), decimals)}`;
}

/**
 * Open-interest / volume in Indian market shorthand:
 * `1_42_00_000` → `1.42 Cr`, `115300` → `1.15 L`, `12300` → `12.3k`.
 */
export function compact(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}${(abs / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${sign}${(abs / 1e5).toFixed(2)} L`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}k`;
  return `${sign}${abs}`;
}

/** Tailwind text class for a directional value. */
export function toneClass(value, neutral = 'text-slate-300') {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return neutral;
  return n > 0 ? 'text-emerald-400' : 'text-rose-400';
}
