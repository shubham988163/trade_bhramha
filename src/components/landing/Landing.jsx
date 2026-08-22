import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap, Send, ArrowRight, CheckCircle2, ChevronDown, Mail, ExternalLink,
  Orbit, Grid, Activity, Waves, CandlestickChart, Compass, BarChart2,
  ShieldCheck, FileText, MessageCircle, Sparkles,
} from 'lucide-react';
import PhoneMockup from './PhoneMockup';
import {
  HERO_BULLETS, FEATURE_SECTIONS, MODULES, FAQS, LEGAL_DOCS, CONTACT_EMAIL,
} from '../../landingContent';
import { SECTOR_DATA, INITIAL_AI_SIGNALS, marketSimulator } from '../../services/marketSimulator';

const ICONS = { Orbit, Grid, Activity, Zap, Waves, CandlestickChart, Compass, BarChart2 };

/* Symbols shown ticking in the hero device. */
const ROCKERS = [
  { symbol: 'ACMESOLAR', base: 230.92 },
  { symbol: 'JSL', base: 800.10 },
  { symbol: 'ENGINERSIN', base: 194.15 },
  { symbol: 'SJVN', base: 72.54 },
  { symbol: 'PTCIL', base: 17534.0 },
  { symbol: 'TATASTEEL', base: 164.20 },
];

function useLiveRockers() {
  const [rows, setRows] = useState(() =>
    ROCKERS.map((r) => ({ ...r, price: r.base, pChange: 0.15 }))
  );

  useEffect(() => {
    // Piggy-back the existing simulator clock so the landing page and the
    // terminal tick from one source instead of a second competing timer.
    const unsub = marketSimulator.subscribe(() => {
      setRows((prev) =>
        prev.map((r) => {
          const drift = (Math.random() - 0.48) * r.base * 0.0015;
          const price = Math.round((r.price + drift) * 100) / 100;
          return { ...r, price, pChange: Math.round(((price - r.base) / r.base) * 10000) / 100 };
        })
      );
    });
    return () => unsub();
  }, []);

  return rows;
}

function SectionHeading({ eyebrow, title, sub, center = true }) {
  return (
    <div className={center ? 'text-center max-w-2xl mx-auto' : ''}>
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300/90 mb-3">
          <Sparkles style={{ width: 13, height: 13 }} /> {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{title}</h2>
      {sub && <p className="mt-3 text-slate-400 text-sm leading-relaxed">{sub}</p>}
    </div>
  );
}

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-white/10">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 text-left py-4 group focus-ring rounded"
      >
        <span className={`text-sm font-semibold transition-colors ${open ? 'text-sky-300' : 'text-slate-200 group-hover:text-white'}`}>
          {q}
        </span>
        <ChevronDown
          style={{ width: 17, height: 17 }}
          className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-sky-400' : 'text-slate-500'}`}
        />
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="text-[13px] leading-relaxed text-slate-400 pb-4 pr-8">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Landing({ onEnter }) {
  const [openFaq, setOpenFaq] = useState(0);
  const rockers = useLiveRockers();
  const sectors = useMemo(() => [...SECTOR_DATA].sort((a, b) => b.pChange - a.pChange), []);

  // Live order log for the TradeFlow mockup, from the same simulator.
  const [logs, setLogs] = useState(() => marketSimulator.getSnapshot().tradeFlowLogs);
  useEffect(() => {
    const unsub = marketSimulator.subscribe((s) => setLogs(s.tradeFlowLogs));
    return () => unsub();
  }, []);

  const enter = (tab) => onEnter(tab || 'pulse');

  return (
    <div className="landing min-h-screen text-slate-100">
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="landing-nav sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-2.5 shrink-0 focus-ring rounded">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30 border border-sky-400/30"
              style={{ background: 'linear-gradient(135deg,#3b82f6 0%,#64c8ff 100%)' }}
            >
              <Zap style={{ width: 19, height: 19 }} className="text-white" />
            </span>
            <span className="font-extrabold text-lg tracking-tight">
              Trade<span className="text-sky-400">Brahma</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-[13px] font-semibold text-slate-300">
            <a href="#modules" className="hover:text-white transition-colors">Modules</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#legal" className="hover:text-white transition-colors">Legal</a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://t.me/tradebrahma"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg text-white transition-transform hover:-translate-y-px focus-ring"
              style={{ background: '#0088cc' }}
            >
              <Send style={{ width: 14, height: 14 }} /> Telegram
            </a>
            <button onClick={() => enter()} className="cta-green text-[13px] px-4 py-1.5 focus-ring">
              Login
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section id="top" className="relative overflow-hidden">
        <div className="grid-overlay" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center relative">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
              India&apos;s <span className="text-gradient-cyan">AI Market Pulse Scanner</span>
            </h1>
            <p className="mt-4 text-slate-400 text-base">
              Find precision signals. Trade smarter. Grow faster.
            </p>

            <ul className="mt-7 space-y-3">
              {HERO_BULLETS.map((b) => (
                <li key={b.text} className="flex items-center gap-3 text-sm text-slate-200">
                  <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[13px] shrink-0">
                    {b.icon}
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={() => enter()} className="cta-green-outline px-5 py-2.5 text-sm focus-ring">
                🎉 Avail <strong className="ml-1">Free Trial</strong>
              </button>
              <button onClick={() => enter()} className="cta-green px-5 py-2.5 text-sm focus-ring">
                ⚡ Sign Up &amp; Avail Free Trial
              </button>
            </div>

            <button
              onClick={() => enter()}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-sky-400 hover:text-sky-300 transition-colors focus-ring rounded"
            >
              Launch the live terminal <ArrowRight style={{ width: 15, height: 15 }} />
            </button>
          </div>

          {/* Two overlapping devices, as on the reference hero. */}
          <div className="relative flex justify-center lg:justify-end items-center min-h-[420px]">
            <div className="absolute left-2 sm:left-10 top-10 rotate-[-8deg] scale-90 opacity-90 hidden sm:block">
              <PhoneMockup screen="optionclock" glow="#8b5ef6" />
            </div>
            <div className="relative rotate-[4deg] z-10">
              <PhoneMockup screen="rockers" rows={rockers} glow="#64c8ff" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Alternating feature sections ─────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-4 sm:px-6 py-12 space-y-24">
        {FEATURE_SECTIONS.map((f, i) => {
          const flip = i % 2 === 1;
          return (
            <div key={f.id} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className={`flex justify-center ${flip ? 'lg:order-2' : ''}`}>
                <PhoneMockup
                  screen={f.screen}
                  glow={f.accent}
                  rows={rockers}
                  sectors={sectors}
                  logs={logs}
                  signals={INITIAL_AI_SIGNALS}
                  className={flip ? 'rotate-[5deg]' : 'rotate-[-5deg]'}
                />
              </div>

              <div className={flip ? 'lg:order-1' : ''}>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{f.title}</h3>
                <ul className="mt-5 space-y-3">
                  {f.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2
                        style={{ width: 17, height: 17, color: f.accent }}
                        className="shrink-0 mt-px"
                      />
                      {pt}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => enter(f.tab)}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold transition-colors focus-ring rounded"
                  style={{ color: f.accent }}
                >
                  Open in terminal <ArrowRight style={{ width: 15, height: 15 }} />
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Modules ──────────────────────────────────────────────────────── */}
      <section id="modules" className="relative py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="The complete suite"
            title="Why Choose TradeBrahma?"
            sub="Eight purpose-built modules covering discovery, confirmation and execution — every one of them live in the terminal."
          />

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULES.map((m) => {
              const Icon = ICONS[m.icon] || Zap;
              return (
                <button
                  key={m.name}
                  onClick={() => enter(m.tab)}
                  className="module-card text-left p-5 rounded-2xl focus-ring group"
                  style={{ '--accent': m.accent }}
                >
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 border transition-transform group-hover:scale-105"
                    style={{ background: `${m.accent}1f`, borderColor: `${m.accent}4d` }}
                  >
                    <Icon style={{ width: 20, height: 20, color: m.accent }} />
                  </span>
                  <h4 className="font-extrabold text-[15px] text-white">{m.name}</h4>
                  <p className="mt-1.5 text-[12.5px] text-slate-400 leading-relaxed">{m.desc}</p>
                  <span
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: m.accent }}
                  >
                    Open <ArrowRight style={{ width: 12, height: 12 }} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading title="Frequently Asked Questions" sub="Everything traders usually ask before starting." />
          <div className="mt-10">
            {FAQS.map(([q, a], i) => (
              <FaqItem
                key={q}
                q={q}
                a={a}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="cta-band rounded-3xl p-10 text-center relative overflow-hidden">
            <div className="grid-overlay opacity-40" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Start reading the market, not the noise.
              </h2>
              <p className="mt-3 text-slate-300 text-sm max-w-xl mx-auto">
                Open the full terminal — every module, live data and a paper wallet to rehearse with.
              </p>
              <button onClick={() => enter()} className="cta-green mt-7 px-7 py-3 text-sm mx-auto focus-ring">
                Launch Terminal <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Legal ────────────────────────────────────────────────────────── */}
      <section id="legal" className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h3 className="text-xl font-extrabold text-white">Legal Documents</h3>
            <p className="mt-2 text-[13px] text-slate-400 max-w-lg mx-auto">
              Access our comprehensive legal documentation for complete transparency and compliance
            </p>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LEGAL_DOCS.map((d) => (
              <div key={d.title} className="legal-card p-5 rounded-2xl flex flex-col">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 border"
                  style={{ background: `${d.accent}1f`, borderColor: `${d.accent}4d` }}
                >
                  <FileText style={{ width: 18, height: 18, color: d.accent }} />
                </span>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  {d.title}
                  <ExternalLink style={{ width: 12, height: 12 }} className="text-slate-500" />
                </h4>
                <p className="mt-1.5 text-[11.5px] text-slate-400 leading-relaxed flex-1">{d.desc}</p>
                <button
                  className="mt-4 w-full py-2 rounded-lg text-[12px] font-bold text-white transition-transform hover:-translate-y-px focus-ring"
                  style={{ background: `linear-gradient(135deg, ${d.accent} 0%, ${d.accent}bb 100%)` }}
                >
                  View Document
                </button>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-[11px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Please read all legal documents carefully before using our services. These documents contain
            important information about your rights, obligations, and the risks involved.
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 grid sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#3b82f6 0%,#64c8ff 100%)' }}
              >
                <Zap style={{ width: 17, height: 17 }} className="text-white" />
              </span>
              <span className="font-extrabold tracking-tight">
                Trade<span className="text-sky-400">Brahma</span>
              </span>
            </div>
            <p className="mt-3 text-[12px] text-slate-400 leading-relaxed">
              India&apos;s AI market pulse scanner — precision signals across equities, options and sectors.
            </p>
          </div>

          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-slate-300">Modules</h4>
            <ul className="mt-3 space-y-1.5">
              {MODULES.slice(0, 5).map((m) => (
                <li key={m.name}>
                  <button
                    onClick={() => enter(m.tab)}
                    className="text-[12.5px] text-slate-400 hover:text-sky-400 transition-colors focus-ring rounded"
                  >
                    {m.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-slate-300">Connect With Us</h4>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href="https://t.me/tradebrahma"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[12.5px] text-slate-400 hover:text-sky-400 transition-colors"
              >
                <Send style={{ width: 14, height: 14 }} /> Telegram
              </a>
              <a
                href="https://wa.me/919000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[12.5px] text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <MessageCircle style={{ width: 14, height: 14 }} /> WhatsApp
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 text-[12.5px] text-slate-400 hover:text-sky-400 transition-colors break-all"
              >
                <Mail style={{ width: 14, height: 14 }} /> {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-10 pt-6 border-t border-white/5">
          <p className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
            <ShieldCheck style={{ width: 14, height: 14 }} className="shrink-0 mt-px text-slate-600" />
            Trading in securities carries risk of loss. TradeBrahma provides analytical tools and
            information only — not investment advice. Signals shown in this build are simulated.
          </p>
          <p className="mt-3 text-[11px] text-slate-600">
            © {new Date().getFullYear()} TradeBrahma. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
