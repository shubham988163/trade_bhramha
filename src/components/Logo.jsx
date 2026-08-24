import React, { useId } from 'react';
import { BRAND } from '../brand';

/**
 * Brand mark: an `SP` monogram sitting on a rising candlestick pair.
 *
 * Replaces the previous lightning-bolt tile. Drawn as inline SVG rather than
 * an icon-font glyph so it stays crisp at any size and carries the brand
 * gradient with it.
 */
export function LogoMark({ size = 32, rounded = 11, className = '' }) {
  // Gradient ids must be unique per instance or several marks on one page
  // all resolve to whichever definition rendered last.
  const gid = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label={`${BRAND.name} logo`}
    >
      <defs>
        <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={BRAND.gradFrom} />
          <stop offset="100%" stopColor={BRAND.gradTo} />
        </linearGradient>
      </defs>

      <rect width="48" height="48" rx={rounded * (48 / size)} fill={`url(#${gid}-bg)`} />
      {/* inner bevel */}
      <rect
        x="0.75" y="0.75" width="46.5" height="46.5"
        rx={rounded * (48 / size) - 0.75}
        fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5"
      />

      {/* Rising candlesticks behind the monogram. */}
      <g opacity="0.4" stroke="#fff" strokeLinecap="round">
        <path d="M13 32.5v-13" strokeWidth="2" />
        <path d="M35 28.5v-13" strokeWidth="2" />
      </g>

      {/* SP monogram */}
      <text
        x="24" y="24"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="21"
        fontWeight="800"
        letterSpacing="-0.5"
        fill="#fff"
      >
        {BRAND.monogram}
      </text>
    </svg>
  );
}

/** Mark + wordmark lock-up used in the header, sidebar and footer. */
export default function Logo({ size = 32, textClass = 'text-lg', showText = true }) {
  return (
    <span className="flex items-center gap-2.5 min-w-0">
      <span className="shrink-0 rounded-xl overflow-hidden shadow-lg shadow-violet-500/25 leading-none">
        <LogoMark size={size} />
      </span>
      {showText && (
        <span className={`font-extrabold tracking-tight truncate ${textClass}`}>
          {BRAND.namePrefix}
          <span className="text-cyan-400">{BRAND.nameAccent}</span>
        </span>
      )}
    </span>
  );
}
