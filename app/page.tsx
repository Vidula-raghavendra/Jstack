"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useMotionValue,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import SmoothScroll from "./components/SmoothScroll";

/* ─── TOKENS ─── */
const C = {
  bg:        "#F2EDE2",
  surface:   "#E8E1D4",
  surfaceHi: "#DDD5C5",
  border:    "#CEC5B4",
  borderHi:  "#B8AD9C",
  text:      "#1A1410",
  muted:     "#7A6D5C",
  dim:       "#B0A598",
  sage:      "#3D6B50",
  sageMid:   "#4F8766",
  sageLo:    "rgba(61,107,80,0.08)",
  sageGlow:  "rgba(61,107,80,0.22)",
  indigo:    "#5B62A0",
  indigoDim: "rgba(91,98,160,0.08)",
  teal:      "#3D7A6E",
  tealDim:   "rgba(61,122,110,0.08)",
  term:      "#171310",
  termSurf:  "#201C18",
  termBdr:   "#2A2520",
  termText:  "#E8E2D8",
  termDim:   "#52483E",
};

/* SF Pro system stack — renders native on Apple, Helvetica elsewhere */
const SF   = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "'Bodoni Moda', Georgia, serif";
const MONO  = "var(--font-geist-mono), 'Geist Mono', 'SF Mono', monospace";
const E     = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ─── DATA ─── */
const PACKS = [
  {
    id: "sdr", n: "01",
    label: "SDR Pack",
    tag: "outbound sales",
    color: C.sage, bg: "rgba(61,107,80,0.06)",
    headline: "Outbound signals that close.",
    signals: ["Pricing model: sales-led vs self-serve", "Decision-makers + public LinkedIn", "Named customer logos from case studies", "Recent product launches & integrations", "Buying intent signals", "Cold call context in 60s"],
  },
  {
    id: "recruiter", n: "02",
    label: "Recruiter Pack",
    tag: "talent intel",
    color: C.indigo, bg: "rgba(91,98,160,0.06)",
    headline: "Know the org before the call.",
    signals: ["All open roles with team & location", "Tech stack from job post language", "Velocity: aggressive / steady / slow", "Engineering leaders & hiring managers", "Team size trajectory", "Compensation signals"],
  },
  {
    id: "vc", n: "03",
    label: "VC Pack",
    tag: "investment screening",
    color: C.teal, bg: "rgba(61,122,110,0.06)",
    headline: "Investment-grade signals, fast.",
    signals: ["Funding stage + named investors", "Traction: logos, ARR signals, growth", "Founder backgrounds & prior exits", "Market expansion & partnership moves", "Comparable company comps", "Team caliber indicators"],
  },
];

const STEPS = [
  { n: "01", title: "Paste domains", body: "Up to 10 domains per run. No signup, no setup, no API key." },
  { n: "02", title: "Pick your pack", body: "SDR, Recruiter, or VC. The pack reshapes signals, people prioritization, and CSV schema." },
  { n: "03", title: "Signals stream back", body: "Real-time extraction from a stealth Hyperbrowser session. Export CSV or pipe to Claude via MCP." },
];

const TICKER_ITEMS = [
  "stripe.com — SDR — 6 signals — 8 people",
  "linear.app — Recruiter — 12 open roles — 44s",
  "vercel.com — VC — Series C — 3 founders",
  "notion.so — SDR — sales-led — 14 names",
  "figma.com — VC — YC S20 — $800M ARR",
  "resend.com — SDR — 100+ logos — 33 investors",
  "supabase.com — Recruiter — aggressive — Rust + Go",
];

type Line = { t: "cmd"|"status"|"key"|"val"|"sig"|"gap"|"done"; s: string };

const DEMOS: { domain: string; pack: string; color: string; lines: Line[] }[] = [
  {
    domain: "stripe.com", pack: "SDR", color: C.sage,
    lines: [
      { t:"cmd",    s:"$ seam enrich stripe.com --pack sdr" },
      { t:"status", s:"opening stealth session..." },
      { t:"gap",    s:"" },
      { t:"key",    s:"COMPANY" },
      { t:"val",    s:"Stripe — payments infrastructure for the internet" },
      { t:"key",    s:"PRICING MODEL" },
      { t:"val",    s:"sales-led · enterprise contracts · self-serve SMB" },
      { t:"gap",    s:"" },
      { t:"key",    s:"BUYING SIGNALS" },
      { t:"sig",    s:"· 'Talk to sales' on all enterprise tiers" },
      { t:"sig",    s:"· Launched 40+ new markets Q3 → expansion signal" },
      { t:"sig",    s:"· API-first → dev champion at every account" },
      { t:"gap",    s:"" },
      { t:"key",    s:"PEOPLE" },
      { t:"val",    s:"8 found — Patrick Collison, Eileen Donahoe +6" },
      { t:"done",   s:"✓  extracted in 58s" },
    ],
  },
  {
    domain: "linear.app", pack: "Recruiter", color: C.indigo,
    lines: [
      { t:"cmd",    s:"$ seam enrich linear.app --pack recruiter" },
      { t:"status", s:"opening stealth session..." },
      { t:"gap",    s:"" },
      { t:"key",    s:"HIRING VELOCITY" },
      { t:"val",    s:"aggressive · 12 open roles" },
      { t:"key",    s:"TECH STACK" },
      { t:"val",    s:"TypeScript, Rust, PostgreSQL, Kubernetes" },
      { t:"gap",    s:"" },
      { t:"key",    s:"HIRING SIGNALS" },
      { t:"sig",    s:"· 8 senior eng roles → rapid team expansion" },
      { t:"sig",    s:"· Hiring Rust infra → platform rewrite in motion" },
      { t:"sig",    s:"· Berlin + SF both actively hiring simultaneously" },
      { t:"gap",    s:"" },
      { t:"key",    s:"ENG LEADERS" },
      { t:"val",    s:"4 found — Tuomas Artman (CTO), Nan Yu +2" },
      { t:"done",   s:"✓  extracted in 44s" },
    ],
  },
  {
    domain: "vercel.com", pack: "VC", color: C.teal,
    lines: [
      { t:"cmd",    s:"$ seam enrich vercel.com --pack vc" },
      { t:"status", s:"opening stealth session..." },
      { t:"gap",    s:"" },
      { t:"key",    s:"FUNDING" },
      { t:"val",    s:"Series C · $150M · Tiger Global, Bedrock, GV" },
      { t:"key",    s:"TRACTION" },
      { t:"val",    s:"10,000+ paying teams · 10× YoY revenue growth" },
      { t:"gap",    s:"" },
      { t:"key",    s:"INVESTMENT SIGNALS" },
      { t:"sig",    s:"· Ex-Google/Meta founders · strong angel syndicate" },
      { t:"sig",    s:"· ARR $100M+ implied by Series C valuation" },
      { t:"sig",    s:"· Shopify + Loom partnerships → enterprise push" },
      { t:"gap",    s:"" },
      { t:"key",    s:"FOUNDERS" },
      { t:"val",    s:"3 found — Guillermo Rauch (CEO), Matheus Fernandes" },
      { t:"done",   s:"✓  extracted in 62s" },
    ],
  },
];

const MCP_CONFIG = `{
  "mcpServers": {
    "seam": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://jstack-omega.vercel.app/api/mcp"
      ]
    }
  }
}`;

/* ─── COMPONENTS ─── */

function Grain() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 150, opacity: 0.025 }}>
      <svg width="100%" height="100%">
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.70" numOctaves="4" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", color: copied ? C.sage : C.termDim, border: `1px solid ${copied ? C.sage : C.termBdr}`, borderRadius: 2, padding: "4px 10px", background: copied ? C.sageLo : "transparent", cursor: "pointer", transition: "all 0.2s" }}>
      {copied ? "COPIED" : "COPY"}
    </button>
  );
}

function Terminal() {
  const [idx, setIdx] = useState(0);
  const [count, setCount] = useState(0);
  const demo = DEMOS[idx];
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (count < demo.lines.length) {
      const d = count === 0 ? 600 : demo.lines[count - 1]?.t === "gap" ? 60 : 150;
      t = setTimeout(() => setCount(c => c + 1), d);
    } else {
      t = setTimeout(() => { setIdx(i => (i + 1) % DEMOS.length); setCount(0); }, 3200);
    }
    return () => clearTimeout(t);
  }, [count, demo.lines.length]);

  const lc = (l: Line) => l.t === "sig" ? demo.color : l.t === "done" ? C.sage : l.t === "val" ? C.termText : C.termDim;

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: C.term, border: `1px solid ${C.termBdr}`, boxShadow: `0 24px 48px rgba(23,19,16,0.22), 0 2px 8px rgba(23,19,16,0.14)` }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.termBdr }}>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: "#342E28" }} />)}
        </div>
        <div className="flex items-center gap-2">
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: C.sage }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          <span style={{ fontFamily: MONO, fontSize: 9, color: C.termDim, letterSpacing: "0.1em" }}>SEAM · LIVE</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.span key={demo.pack} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}
            style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", color: demo.color, background: `${demo.color}18`, border: `1px solid ${demo.color}30`, borderRadius: 2, padding: "2px 8px" }}>
            {demo.pack.toUpperCase()}
          </motion.span>
        </AnimatePresence>
      </div>
      <div style={{ minHeight: 280, padding: "18px 22px", fontFamily: MONO, fontSize: 11, lineHeight: 1.7 }}>
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {demo.lines.slice(0, count).map((line, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -3 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.12 }}
                style={{ color: lc(line), fontSize: line.t === "key" ? 9 : 11, letterSpacing: line.t === "key" ? "0.14em" : "0.01em", marginTop: line.t === "key" ? 10 : 0, height: line.t === "gap" ? 4 : "auto", fontWeight: line.t === "done" ? 500 : 400 }}>
                {line.t !== "gap" && line.s}
                {i === count - 1 && count < demo.lines.length && line.t !== "gap" && (
                  <motion.span style={{ color: C.sage }} animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>▋</motion.span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="px-4 py-2.5 border-t flex items-center justify-between" style={{ borderColor: C.termBdr }}>
        <AnimatePresence mode="wait">
          <motion.span key={demo.domain} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ fontFamily: MONO, fontSize: 9, color: C.termDim, letterSpacing: "0.06em" }}>{demo.domain}</motion.span>
        </AnimatePresence>
        {count > 0 && count < demo.lines.length ? (
          <motion.div className="flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.span className="w-1 h-1 rounded-full" style={{ background: C.sage }} animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.sage, letterSpacing: "0.1em" }}>EXTRACTING</span>
          </motion.div>
        ) : count >= demo.lines.length ? (
          <span style={{ fontFamily: MONO, fontSize: 9, color: C.sage, letterSpacing: "0.08em" }}>COMPLETE</span>
        ) : null}
      </div>
    </div>
  );
}

function PackCard({ pack, index }: { pack: typeof PACKS[0]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.55, delay: index * 0.08, ease: E }}
      className="rounded-xl overflow-hidden"
      style={{ background: C.bg, border: `1px solid ${C.border}` }}>

      {/* header row */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-7 pt-7 pb-5">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: pack.color }}>{pack.n}</span>
            <span style={{ fontFamily: SF, fontSize: 11, fontWeight: 500, color: pack.color, background: pack.bg, borderRadius: 20, padding: "3px 10px", letterSpacing: "0.04em" }}>{pack.label}</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }}>{pack.tag}</span>
          </div>
          <h3 style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(26px,3vw,38px)", color: C.text, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {pack.headline}
          </h3>
        </div>
        <button onClick={() => setOpen(o => !o)}
          style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${C.border}`, background: open ? pack.color : "transparent", color: open ? "#F2EDE2" : C.muted, fontFamily: SF, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}>
          {open ? "−" : "+"}
        </button>
      </div>

      {/* signal grid — always visible */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px mx-7 mb-6" style={{ background: C.border }}>
        {pack.signals.slice(0, open ? 6 : 3).map((sig, i) => (
          <motion.div key={i}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            style={{ background: C.bg, padding: "10px 14px" }}>
            <span style={{ fontFamily: SF, fontSize: 12, color: C.muted, lineHeight: 1.5, display: "block" }}>{sig}</span>
          </motion.div>
        ))}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between px-7 py-4 border-t" style={{ borderColor: C.border, background: C.surface }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.12em" }}>
          {pack.signals.length} SIGNAL CATEGORIES
        </span>
        <a href="/app"
          style={{ fontFamily: SF, fontWeight: 600, fontSize: 12, color: "#F2EDE2", background: pack.color, padding: "7px 18px", borderRadius: 20, textDecoration: "none", letterSpacing: "0.02em", transition: "all 0.15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}>
          Try {pack.label} →
        </a>
      </div>
    </motion.div>
  );
}

/* ─── PAGE ─── */
export default function Page() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastY = useRef(0);

  const breakRef = useRef<HTMLElement>(null);
  const { scrollYProgress: bp } = useScroll({ target: breakRef, offset: ["start end", "end start"] });
  const breakY = useTransform(bp, [0, 1], ["-8%", "8%"]);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (y < 60) { setNavVisible(true); lastY.current = y; return; }
      setNavVisible(y < lastY.current + 12);
      lastY.current = y;
    });
    return unsub;
  }, [scrollYProgress]);

  return (
    <SmoothScroll>
      <div style={{ fontFamily: SF, background: C.bg, color: C.text }} className="min-h-screen overflow-x-hidden">
        <Grain />

        {/* progress */}
        <motion.div className="fixed top-0 left-0 right-0 h-[2px] origin-left" style={{ zIndex: 60, scaleX, background: C.sage }} />

        {/* ── NAV ── */}
        <motion.nav className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 flex items-center justify-between"
          style={{ height: 56 }}
          animate={{
            background: scrolled ? "rgba(242,237,226,0.96)" : "rgba(242,237,226,0)",
            backdropFilter: scrolled ? "blur(20px)" : "blur(0px)",
            borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
            y: navVisible ? 0 : -60,
          }}
          transition={{ duration: 0.25, ease: E }}>

          <a href="/" style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 21, color: C.text, textDecoration: "none", display: "flex", alignItems: "baseline", gap: 2, letterSpacing: "-0.01em", fontWeight: 400 }}>
            Seam<span style={{ color: C.sage, fontSize: 10 }}>·</span>
          </a>

          <div className="hidden md:flex items-center gap-6">
            {["Packs", "Process", "MCP"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                style={{ fontFamily: SF, fontSize: 13, fontWeight: 450, color: C.muted, textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>{item}</a>
            ))}
          </div>

          <a href="/app"
            style={{ fontFamily: SF, fontWeight: 600, fontSize: 13, color: "#F2EDE2", background: C.sage, padding: "8px 20px", borderRadius: 20, textDecoration: "none", letterSpacing: "0.01em", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.sageMid; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.sage; }}>
            Open app
          </a>
        </motion.nav>

        {/* ── HERO ── */}
        <section className="relative pt-28 pb-16 overflow-hidden" style={{ background: C.bg }}>
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12">

            {/* eyebrow */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-8">
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.sage }} />
              <span style={{ fontFamily: MONO, fontSize: 9, color: C.muted, letterSpacing: "0.18em" }}>MCP-NATIVE · STEALTH CRAWLER · 60s</span>
              <div style={{ flex: 1, height: 1, background: C.border, maxWidth: 120 }} />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-start">
              {/* headline block */}
              <div>
                <div className="overflow-hidden mb-1">
                  <motion.p initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ duration: 0.8, delay: 0.3, ease: E }}
                    style={{ fontFamily: SF, fontSize: "clamp(14px,1.4vw,17px)", fontWeight: 400, color: C.muted, letterSpacing: "0.02em" }}>
                    Find the
                  </motion.p>
                </div>
                <div className="overflow-hidden">
                  <motion.h1 initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ duration: 0.9, delay: 0.38, ease: E }}
                    style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(64px,9vw,124px)", letterSpacing: "-0.025em", lineHeight: 0.88, color: C.text, marginBottom: 4 }}>
                    seam
                  </motion.h1>
                </div>
                <div className="overflow-hidden mb-8">
                  <motion.h1 initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ duration: 0.9, delay: 0.46, ease: E }}
                    style={{ fontFamily: SF, fontWeight: 700, fontSize: "clamp(28px,3.8vw,54px)", letterSpacing: "-0.03em", lineHeight: 1.0, color: C.sage }}>
                    IN ANY COMPANY.
                  </motion.h1>
                </div>

                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
                  style={{ fontFamily: SF, fontWeight: 400, fontSize: 16, color: C.muted, lineHeight: 1.7, maxWidth: "52ch", marginBottom: 28 }}>
                  Paste domains. Pick a pack —{" "}
                  <span style={{ color: C.sage, fontWeight: 600 }}>SDR</span>,{" "}
                  <span style={{ color: C.indigo, fontWeight: 600 }}>Recruiter</span>, or{" "}
                  <span style={{ color: C.teal, fontWeight: 600 }}>VC</span>.
                  Get pack-specific signals extracted in 60 seconds by stealth crawler.
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
                  className="flex items-center gap-3 flex-wrap">
                  <a href="/app"
                    style={{ fontFamily: SF, fontWeight: 600, fontSize: 14, color: "#F2EDE2", background: C.sage, padding: "11px 28px", borderRadius: 20, textDecoration: "none", transition: "all 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.sageMid; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.sage; (e.currentTarget as HTMLElement).style.transform = ""; }}>
                    Start extracting
                  </a>
                  <a href="#packs"
                    style={{ fontFamily: SF, fontWeight: 500, fontSize: 14, color: C.muted, padding: "11px 20px", borderRadius: 20, textDecoration: "none", border: `1px solid ${C.border}`, transition: "all 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.text; (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.muted; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
                    See the packs →
                  </a>
                </motion.div>

                {/* inline stat strip */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
                  className="flex items-center gap-6 mt-10 pt-8 border-t" style={{ borderColor: C.border }}>
                  {[{ v: "60s", l: "avg extract" }, { v: "3", l: "packs" }, { v: "10", l: "domains/run" }, { v: "25+", l: "signals" }].map(({ v, l }) => (
                    <div key={l}>
                      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 26, color: C.text, lineHeight: 1, letterSpacing: "-0.02em" }}>{v}</div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.12em", marginTop: 2 }}>{l.toUpperCase()}</div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* terminal */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.55, ease: E }}>
                <Terminal />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── TICKER ── */}
        <div className="relative overflow-hidden border-y py-2.5" style={{ borderColor: C.border, background: C.surface }}>
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{ background: `linear-gradient(to right, ${C.surface} 0%, transparent 6%, transparent 94%, ${C.surface} 100%)` }} />
          <motion.div className="flex gap-12 whitespace-nowrap" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-4 shrink-0">
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim, letterSpacing: "0.06em" }}>{item}</span>
                <span style={{ color: C.sage, fontSize: 4 }}>◆</span>
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── PACKS ── */}
        <section className="py-20 lg:py-24" id="packs">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
            <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
              <div>
                <div className="overflow-hidden">
                  <motion.h2 initial={{ y: "100%" }} whileInView={{ y: "0%" }} viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: E }}
                    style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(32px,4.5vw,60px)", letterSpacing: "-0.02em", lineHeight: 1.0, color: C.text }}>
                    Same crawl.
                  </motion.h2>
                </div>
                <div className="overflow-hidden">
                  <motion.h2 initial={{ y: "100%" }} whileInView={{ y: "0%" }} viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.07, ease: E }}
                    style={{ fontFamily: SF, fontWeight: 700, fontSize: "clamp(32px,4.5vw,60px)", letterSpacing: "-0.03em", lineHeight: 1.0, color: C.sage }}>
                    THREE LENSES.
                  </motion.h2>
                </div>
              </div>
              <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                style={{ fontFamily: SF, fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: "42ch", textAlign: "right" }}>
                One stealth scrape. The pack determines which signals surface, which people get prioritised, and how the CSV exports.
              </motion.p>
            </div>

            <div className="space-y-4">
              {PACKS.map((pack, i) => <PackCard key={pack.id} pack={pack} index={i} />)}
            </div>
          </div>
        </section>

        {/* ── EDITORIAL BREAK ── */}
        <section ref={breakRef} className="relative overflow-hidden" style={{ height: "55vh", minHeight: 320 }}>
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            whileInView={{ clipPath: "inset(0 0 0% 0)" }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0">
            <motion.img
              src="https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?w=2400&q=75&auto=format&fit=crop"
              alt=""
              style={{ y: breakY, width: "100%", height: "115%", objectFit: "cover", display: "block", top: "-7.5%", position: "absolute" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(26,20,16,0.1) 0%, rgba(26,20,16,0.6) 100%)" }} />
          </motion.div>
          <div className="relative z-10 h-full flex flex-col justify-end px-6 lg:px-12 pb-12">
            <div className="overflow-hidden">
              <motion.h2 initial={{ y: "100%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 1.0, delay: 0.5, ease: E }}
                style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(40px,6vw,80px)", letterSpacing: "-0.025em", lineHeight: 0.95, color: "#F2EDE2", maxWidth: 700 }}>
                Find the seam in any company.
              </motion.h2>
            </div>
          </div>
        </section>

        {/* ── PROCESS ── */}
        <section className="py-20 lg:py-24 border-t" id="process" style={{ borderColor: C.border }}>
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
            <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
              <div>
                <div className="overflow-hidden">
                  <motion.h2 initial={{ y: "100%" }} whileInView={{ y: "0%" }} viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: E }}
                    style={{ fontFamily: SF, fontWeight: 700, fontSize: "clamp(32px,4.5vw,60px)", letterSpacing: "-0.03em", lineHeight: 1.0, color: C.text }}>
                    THREE STEPS.
                  </motion.h2>
                </div>
                <div className="overflow-hidden">
                  <motion.h2 initial={{ y: "100%" }} whileInView={{ y: "0%" }} viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.07, ease: E }}
                    style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(32px,4.5vw,60px)", letterSpacing: "-0.02em", lineHeight: 1.0, color: C.sage }}>
                    Sixty seconds.
                  </motion.h2>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {STEPS.map(({ n, title, body }, i) => (
                <motion.div key={n}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.09, ease: E }}
                  className="rounded-xl p-6"
                  style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div className="flex items-start justify-between mb-4">
                    <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.14em" }}>{n}</span>
                    <span style={{ fontFamily: SF, fontWeight: 600, fontSize: 11, color: C.sage, background: C.sageLo, borderRadius: 12, padding: "3px 10px" }}>step {n}</span>
                  </div>
                  <h3 style={{ fontFamily: SF, fontWeight: 700, fontSize: 18, color: C.text, letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.2 }}>{title}</h3>
                  <p style={{ fontFamily: SF, fontWeight: 400, fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MCP ── */}
        <section className="py-20 lg:py-24 border-t" id="mcp" style={{ borderColor: C.border, background: C.surface }}>
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-start">
            <div>
              <div className="overflow-hidden mb-2">
                <motion.h2 initial={{ y: "100%" }} whileInView={{ y: "0%" }} viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: E }}
                  style={{ fontFamily: SF, fontWeight: 700, fontSize: "clamp(28px,4vw,52px)", letterSpacing: "-0.03em", lineHeight: 1.0, color: C.text }}>
                  RUNS INSIDE
                </motion.h2>
              </div>
              <div className="overflow-hidden mb-8">
                <motion.h2 initial={{ y: "100%" }} whileInView={{ y: "0%" }} viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.07, ease: E }}
                  style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(28px,4vw,52px)", letterSpacing: "-0.02em", lineHeight: 1.0, color: C.indigo }}>
                  Claude + Cursor.
                </motion.h2>
              </div>
              <p style={{ fontFamily: SF, fontSize: 15, color: C.muted, lineHeight: 1.75, marginBottom: 20 }}>
                Seam ships as a JSON-RPC 2.0 MCP server. Add one config block and call{" "}
                <code style={{ fontFamily: MONO, fontSize: 11, color: C.text, background: C.surfaceHi, padding: "2px 5px", borderRadius: 3, border: `1px solid ${C.border}` }}>enrich_companies</code>{" "}
                inline — no context switch.
              </p>
              <div className="space-y-0" style={{ borderTop: `1px solid ${C.border}` }}>
                {["enrich_companies(domains[], pack)", "list_packs()"].map(name => (
                  <div key={name} className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", color: C.indigo, background: C.indigoDim, borderRadius: 2, padding: "3px 8px" }}>TOOL</span>
                    <code style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{name}</code>
                  </div>
                ))}
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease: E }}
              className="rounded-xl overflow-hidden"
              style={{ background: C.term, border: `1px solid ${C.termBdr}`, boxShadow: `0 24px 48px rgba(23,19,16,0.18)` }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.termBdr }}>
                <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: "#342E28" }} />)}</div>
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.termDim, letterSpacing: "0.1em" }}>CLAUDE_DESKTOP_CONFIG.JSON</span>
                <CopyButton text={MCP_CONFIG} />
              </div>
              <pre style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.85, color: "#BDB8AA", padding: "20px 24px", margin: 0 }}>
                <span style={{ color: C.termDim }}>{"{"}</span>{"\n"}
                {"  "}<span style={{ color: C.indigo }}>&quot;mcpServers&quot;</span><span style={{ color: C.termDim }}>: {"{"}</span>{"\n"}
                {"    "}<span style={{ color: C.indigo }}>&quot;seam&quot;</span><span style={{ color: C.termDim }}>: {"{"}</span>{"\n"}
                {"      "}<span style={{ color: "#7A9C6A" }}>&quot;command&quot;</span><span style={{ color: C.termDim }}>:</span>{" "}<span style={{ color: C.sage }}>&quot;npx&quot;</span><span style={{ color: C.termDim }}>,</span>{"\n"}
                {"      "}<span style={{ color: "#7A9C6A" }}>&quot;args&quot;</span><span style={{ color: C.termDim }}>: [</span>{"\n"}
                {"        "}<span style={{ color: C.sage }}>&quot;mcp-remote&quot;</span><span style={{ color: C.termDim }}>,</span>{"\n"}
                {"        "}<span style={{ color: C.sage }}>&quot;https://jstack-omega.vercel.app/api/mcp&quot;</span>{"\n"}
                {"      "}<span style={{ color: C.termDim }}>]</span>{"\n"}
                {"    "}<span style={{ color: C.termDim }}>{"}"}</span>{"\n"}
                {"  "}<span style={{ color: C.termDim }}>{"}"}</span>{"\n"}
                <span style={{ color: C.termDim }}>{"}"}</span>
              </pre>
              <div className="px-5 py-3.5 border-t" style={{ borderColor: C.termBdr }}>
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.termDim, letterSpacing: "0.1em" }}>THEN IN CLAUDE</span>
                <div style={{ fontFamily: MONO, fontSize: 12, color: C.sage, marginTop: 5 }}>&gt; extract stripe.com and linear.app with the SDR pack</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 lg:py-32 border-t" style={{ borderColor: C.border }}>
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
            <div className="overflow-hidden mb-1">
              <motion.h2 initial={{ y: "100%" }} whileInView={{ y: "0%" }} viewport={{ once: true }}
                transition={{ duration: 0.9, ease: E }}
                style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(52px,8vw,112px)", letterSpacing: "-0.025em", lineHeight: 0.9, color: C.text }}>
                Stop guessing.
              </motion.h2>
            </div>
            <div className="overflow-hidden mb-12">
              <motion.h2 initial={{ y: "100%" }} whileInView={{ y: "0%" }} viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.08, ease: E }}
                style={{ fontFamily: SF, fontWeight: 700, fontSize: "clamp(52px,8vw,112px)", letterSpacing: "-0.04em", lineHeight: 0.9, color: C.sage }}>
                START KNOWING.
              </motion.h2>
            </div>
            <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-4 flex-wrap">
              <a href="/app"
                style={{ fontFamily: SF, fontWeight: 700, fontSize: 15, color: "#F2EDE2", background: C.sage, padding: "14px 36px", borderRadius: 20, textDecoration: "none", letterSpacing: "0.01em", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.sageMid; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.sage; (e.currentTarget as HTMLElement).style.transform = ""; }}>
                Open Seam — free
              </a>
              <span style={{ fontFamily: SF, fontSize: 14, color: C.dim }}>Three packs. Sixty seconds. Every company.</span>
            </motion.div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="py-8 border-t" style={{ borderColor: C.border, background: C.surface }}>
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-3">
            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 18, color: C.text, letterSpacing: "-0.01em" }}>
              Seam<span style={{ color: C.sage }}>·</span>
            </span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }}>STEALTH-POWERED BY HYPERBROWSER</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.08em" }}>© 2026 SEAM</span>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}
