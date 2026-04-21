"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";
import SmoothScroll from "./components/SmoothScroll";

/* ─── DESIGN TOKENS ─── */
const C = {
  bg:         "#0C0B09",
  surface:    "#141210",
  surfaceHi:  "#1C1A16",
  border:     "#242118",
  borderHi:   "#302D26",
  text:       "#F0EDE6",
  muted:      "#7A7168",
  dim:        "#3D3A32",
  gold:       "#C9A96E",
  goldDim:    "rgba(201,169,110,0.10)",
  goldGlow:   "rgba(201,169,110,0.15)",
  indigo:     "#8B90C8",
  indigoDim:  "rgba(139,144,200,0.10)",
  sage:       "#7EA88A",
  sageDim:    "rgba(126,168,138,0.10)",
};

const SERIF = "'Bodoni Moda', Georgia, serif";
const SANS  = "'Figtree', system-ui, sans-serif";
const MONO  = "var(--font-geist-mono), 'Geist Mono', monospace";
const E     = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ─── DATA ─── */
const PACKS = [
  {
    id: "sdr", n: "01",
    label: "SDR Pack",
    color: C.gold, dim: C.goldDim,
    headline: "Outbound signals that close deals.",
    body: "Buying intent, decision-makers with public LinkedIn, pricing model, recent launches, named customer logos — everything a rep needs before the cold call.",
    signals: ["Pricing model: sales-led vs self-serve", "Decision-makers + public LinkedIn", "Named customer logos from case studies", "Recent product launches & integrations"],
  },
  {
    id: "recruiter", n: "02",
    label: "Recruiter Pack",
    color: C.indigo, dim: C.indigoDim,
    headline: "Hiring intel before the intro call.",
    body: "Every open role, tech stack inferred from job posts, engineering leaders, and team growth velocity — so you know the shape of the org before you reach out.",
    signals: ["All open roles with team & location", "Tech stack from job post language", "Velocity: aggressive / steady / slow", "Engineering leaders & hiring managers"],
  },
  {
    id: "vc", n: "03",
    label: "VC Pack",
    color: C.sage, dim: C.sageDim,
    headline: "Investment-grade signals, fast.",
    body: "Funding stage, named investors, ARR signals, founder backgrounds, and market expansion moves — the provenance of any company, extracted in 60 seconds.",
    signals: ["Funding stage + named investors", "Traction: logos, ARR signals, growth", "Founder backgrounds & prior exits", "Market expansion & partnership moves"],
  },
];

const STEPS = [
  { n: "01", title: "Paste domains.", body: "Enter one domain per line — up to 10 per run. No signup required. No setup." },
  { n: "02", title: "Pick your pack.", body: "SDR, Recruiter, or VC. The pack reshapes the entire extraction — signals, people, schema, CSV." },
  { n: "03", title: "Signals stream back.", body: "Watch intelligence arrive in real time from a stealth Hyperbrowser session. Export or route to Claude via MCP." },
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
    domain: "stripe.com", pack: "SDR", color: C.gold,
    lines: [
      { t:"cmd",    s:"$ lode enrich stripe.com --pack sdr" },
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
      { t:"cmd",    s:"$ lode enrich linear.app --pack recruiter" },
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
    domain: "vercel.com", pack: "VC", color: C.sage,
    lines: [
      { t:"cmd",    s:"$ lode enrich vercel.com --pack vc" },
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
    "lode": {
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
    <div className="fixed inset-0 z-[150] pointer-events-none" style={{ opacity: 0.018 }}>
      <svg width="100%" height="100%">
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.70" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </div>
  );
}

function Cursor() {
  const mx = useMotionValue(-200); const my = useMotionValue(-200);
  const sx = useSpring(mx, { stiffness: 500, damping: 45 });
  const sy = useSpring(my, { stiffness: 500, damping: 45 });
  const lx = useSpring(mx, { stiffness: 70, damping: 20 });
  const ly = useSpring(my, { stiffness: 70, damping: 20 });
  const [big, setBig] = useState(false);
  useEffect(() => {
    const m = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    const i = (e: MouseEvent) => { if ((e.target as Element).closest("a,button")) setBig(true); };
    const o = (e: MouseEvent) => { if ((e.target as Element).closest("a,button")) setBig(false); };
    window.addEventListener("mousemove", m);
    window.addEventListener("mouseover", i);
    window.addEventListener("mouseout", o);
    return () => { window.removeEventListener("mousemove", m); window.removeEventListener("mouseover", i); window.removeEventListener("mouseout", o); };
  }, [mx, my]);
  return (
    <>
      <motion.div className="fixed top-0 left-0 pointer-events-none z-[500] rounded-full"
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%", background: C.gold }}
        animate={{ width: big ? 36 : 5, height: big ? 36 : 5, opacity: big ? 0.18 : 0.9 }}
        transition={{ duration: 0.15 }} />
      <motion.div className="fixed top-0 left-0 pointer-events-none z-[499] rounded-full"
        style={{ x: lx, y: ly, translateX: "-50%", translateY: "-50%", width: 24, height: 24, border: `1px solid ${C.dim}` }} />
    </>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", color: copied ? C.gold : C.muted, border: `1px solid ${copied ? C.gold : C.border}`, borderRadius: 3, padding: "4px 10px", background: copied ? C.goldDim : "transparent", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>
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
      const d = count === 0 ? 600 : demo.lines[count - 1]?.t === "gap" ? 60 : 160;
      t = setTimeout(() => setCount(c => c + 1), d);
    } else {
      t = setTimeout(() => { setIdx(i => (i + 1) % DEMOS.length); setCount(0); }, 3500);
    }
    return () => clearTimeout(t);
  }, [count, demo.lines.length]);

  const lineColor = (l: Line) => {
    if (l.t === "cmd")    return C.dim;
    if (l.t === "status") return C.dim;
    if (l.t === "key")    return C.dim;
    if (l.t === "val")    return C.text;
    if (l.t === "sig")    return demo.color;
    if (l.t === "done")   return C.sage;
    return "transparent";
  };

  return (
    <div className="relative rounded-lg overflow-hidden"
      style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: `0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}` }}>
      {/* header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: C.border }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3A3530" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3A3530" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3A3530" }} />
        </div>
        <div className="flex items-center gap-2">
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: C.sage }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          <span style={{ fontFamily: MONO, fontSize: 9, color: C.muted, letterSpacing: "0.12em" }}>LODE · LIVE</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.span key={demo.pack}
            initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}
            style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", color: demo.color, background: `${demo.color}18`, border: `1px solid ${demo.color}35`, borderRadius: 2, padding: "2px 8px" }}>
            {demo.pack.toUpperCase()}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* body */}
      <div style={{ minHeight: 300, padding: "20px 24px", fontFamily: MONO, fontSize: 11.5, lineHeight: 1.7 }}>
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {demo.lines.slice(0, count).map((line, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                style={{
                  color: lineColor(line),
                  fontSize: line.t === "key" ? 9 : 11.5,
                  letterSpacing: line.t === "key" ? "0.14em" : "0.01em",
                  marginTop: line.t === "key" ? 10 : 0,
                  height: line.t === "gap" ? 5 : "auto",
                  fontWeight: line.t === "done" ? 500 : 400,
                }}>
                {line.t !== "gap" && line.s}
                {i === count - 1 && count < demo.lines.length && line.t !== "gap" && (
                  <motion.span style={{ color: C.gold }} animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>▋</motion.span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* footer */}
      <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: C.border }}>
        <AnimatePresence mode="wait">
          <motion.span key={demo.domain} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.08em" }}>
            {demo.domain}
          </motion.span>
        </AnimatePresence>
        {count > 0 && count < demo.lines.length ? (
          <motion.div className="flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.span className="w-1 h-1 rounded-full" style={{ background: C.gold }} animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.gold, letterSpacing: "0.1em" }}>EXTRACTING</span>
          </motion.div>
        ) : count >= demo.lines.length ? (
          <span style={{ fontFamily: MONO, fontSize: 9, color: C.sage, letterSpacing: "0.1em" }}>COMPLETE</span>
        ) : null}
      </div>
    </div>
  );
}

/* ─── PAGE ─── */
export default function Page() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastY = useRef(0);

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
      <div style={{ fontFamily: SANS, background: C.bg, color: C.text, cursor: "none" }} className="min-h-screen overflow-x-hidden">
        <Cursor />
        <Grain />

        {/* progress bar */}
        <motion.div className="fixed top-0 left-0 right-0 h-px origin-left z-[60]"
          style={{ scaleX, background: C.gold }} />

        {/* ── NAV ── */}
        <motion.nav
          className="fixed top-0 left-0 right-0 z-50 px-8 lg:px-14 py-5 flex items-center justify-between"
          animate={{
            y: navVisible ? 0 : -70,
            background: scrolled ? "rgba(12,11,9,0.90)" : "rgba(12,11,9,0)",
            backdropFilter: scrolled ? "blur(24px)" : "blur(0px)",
          }}
          transition={{ duration: 0.3, ease: E }}>

          <motion.a href="/" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 22, color: C.text, textDecoration: "none", display: "flex", alignItems: "center", gap: 2, letterSpacing: "-0.01em" }}>
            Lode<span style={{ color: C.gold, fontSize: 10, lineHeight: 1, marginBottom: -6 }}>·</span>
          </motion.a>

          <motion.div className="hidden md:flex items-center gap-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            {["Packs", "Process", "MCP"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                style={{ fontFamily: SANS, fontSize: 13, fontWeight: 400, color: C.muted, textDecoration: "none", letterSpacing: "0.01em", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
                {item}
              </a>
            ))}
          </motion.div>

          <motion.a href="/app"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, color: C.bg, background: C.gold, padding: "9px 22px", borderRadius: 4, textDecoration: "none", letterSpacing: "0.01em", display: "inline-block", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${C.goldGlow}`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
            Open app
          </motion.a>
        </motion.nav>

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          {/* very subtle warm glow, top-left */}
          <div className="absolute top-0 left-0 pointer-events-none"
            style={{ width: 900, height: 900, background: `radial-gradient(ellipse at 15% 25%, ${C.goldDim} 0%, transparent 60%)`, opacity: 0.5 }} />

          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-8 lg:px-14 pt-28 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-20 items-center">
            {/* left */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center gap-2 mb-10">
                <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: C.sage }}
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2.4, repeat: Infinity }} />
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.muted, letterSpacing: "0.16em" }}>LIVE · MCP-NATIVE · HYPERBROWSER</span>
              </motion.div>

              <div className="overflow-hidden">
                <motion.h1
                  initial={{ y: "106%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 1.0, delay: 0.4, ease: E }}
                  style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(56px,8vw,108px)", letterSpacing: "-0.02em", lineHeight: 0.9, color: C.text, marginBottom: 8 }}>
                  Intelligence
                </motion.h1>
              </div>
              <div className="overflow-hidden mb-10">
                <motion.h1
                  initial={{ y: "106%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 1.0, delay: 0.55, ease: E }}
                  style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(56px,8vw,108px)", letterSpacing: "-0.03em", lineHeight: 0.9, color: C.gold }}>
                  runs deep.
                </motion.h1>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.85 }}
                style={{ fontFamily: SANS, fontWeight: 300, fontSize: 18, color: C.muted, lineHeight: 1.85, maxWidth: 400, marginBottom: 36 }}>
                Paste domains. Pick a pack —{" "}
                <span style={{ color: C.gold }}>SDR</span>,{" "}
                <span style={{ color: C.indigo }}>Recruiter</span>, or{" "}
                <span style={{ color: C.sage }}>VC</span>. Get pack-specific signals
                extracted in 60 seconds by stealth crawler.
              </motion.p>

              <motion.div className="flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.0 }}>
                <a href="/app"
                  style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: C.bg, background: C.gold, padding: "13px 30px", borderRadius: 4, textDecoration: "none", display: "inline-block", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 36px ${C.goldGlow}`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                  Start extracting
                </a>
                <a href="#packs"
                  style={{ fontFamily: SANS, fontWeight: 400, fontSize: 15, color: C.muted, padding: "13px 22px", borderRadius: 4, textDecoration: "none", border: `1px solid ${C.border}`, display: "inline-block", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.text; (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.muted; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
                  See the packs →
                </a>
              </motion.div>
            </div>

            {/* right — terminal */}
            <motion.div
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.65, ease: E }}>
              <Terminal />
            </motion.div>
          </div>
        </section>

        {/* ── TICKER ── */}
        <div className="relative overflow-hidden border-y py-3" style={{ borderColor: C.border, background: C.surface }}>
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{ background: `linear-gradient(to right, ${C.surface} 0%, transparent 8%, transparent 92%, ${C.surface} 100%)` }} />
          <motion.div className="flex gap-14 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-5 shrink-0">
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim, letterSpacing: "0.08em" }}>{item}</span>
                <span style={{ color: C.gold, fontSize: 5, opacity: 0.5 }}>◆</span>
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── PACKS ── */}
        <section className="py-28 lg:py-36" id="packs">
          <div className="max-w-[1200px] mx-auto px-8 lg:px-14">

            <div className="mb-16 lg:mb-20">
              <motion.p
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                style={{ fontFamily: MONO, fontSize: 9, color: C.gold, letterSpacing: "0.18em" }}
                className="uppercase mb-5">
                / Three packs
              </motion.p>
              <div className="overflow-hidden">
                <motion.h2
                  initial={{ y: "104%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.9, ease: E }}
                  style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(38px,5.5vw,76px)", letterSpacing: "-0.02em", lineHeight: 1.0, color: C.text }}>
                  Same crawl.{" "}
                  <span style={{ fontStyle: "normal", fontWeight: 700 }}>Three lenses.</span>
                </motion.h2>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
                style={{ fontFamily: SANS, fontWeight: 300, fontSize: 17, color: C.muted, lineHeight: 1.85, maxWidth: 480, marginTop: 14 }}>
                One stealth scrape per company. The pack you pick determines which signals surface, which people get prioritised, and how the CSV exports.
              </motion.p>
            </div>

            <div className="space-y-px" style={{ borderTop: `1px solid ${C.border}` }}>
              {PACKS.map((pack, i) => (
                <motion.div key={pack.id}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1, ease: E }}
                  className="grid grid-cols-1 lg:grid-cols-[120px_1fr_1fr] gap-8 lg:gap-12 py-10 border-b group"
                  style={{ borderColor: C.border }}>

                  <div className="flex flex-col gap-2">
                    <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 52, color: C.border, lineHeight: 1, letterSpacing: "-0.02em", transition: "color 0.3s" }}
                      className="group-hover:text-current"
                      onMouseEnter={e => (e.currentTarget.style.color = pack.color + "50")}
                      onMouseLeave={e => (e.currentTarget.style.color = C.border)}>
                      {pack.n}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: pack.color, background: `${pack.color}15`, border: `1px solid ${pack.color}30`, borderRadius: 2, padding: "3px 8px", letterSpacing: "0.12em", alignSelf: "flex-start" }}>
                      {pack.label.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, color: C.text, letterSpacing: "-0.02em", marginBottom: 10, lineHeight: 1.2 }}>
                      {pack.headline}
                    </h3>
                    <p style={{ fontFamily: SANS, fontWeight: 300, fontSize: 15, color: C.muted, lineHeight: 1.8 }}>
                      {pack.body}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {pack.signals.map((sig, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <span style={{ color: pack.color, fontSize: 7, marginTop: 5, flexShrink: 0 }}>◆</span>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted, lineHeight: 1.6, letterSpacing: "0.02em" }}>{sig}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROCESS ── */}
        <section className="py-28 lg:py-36 border-t" id="process" style={{ borderColor: C.border, background: C.surface }}>
          <div className="max-w-[1200px] mx-auto px-8 lg:px-14">
            <div className="mb-16 lg:mb-20">
              <motion.p
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                style={{ fontFamily: MONO, fontSize: 9, color: C.gold, letterSpacing: "0.18em" }}
                className="uppercase mb-5">
                / How it works
              </motion.p>
              <div className="overflow-hidden">
                <motion.h2
                  initial={{ y: "104%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.9, ease: E }}
                  style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(38px,5.5vw,76px)", letterSpacing: "-0.025em", lineHeight: 1.0, color: C.text }}>
                  Three steps.{" "}
                  <em style={{ fontWeight: 400, color: C.gold }}>Sixty seconds.</em>
                </motion.h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: C.border }}>
              {STEPS.map(({ n, title, body }, i) => (
                <motion.div key={n}
                  initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.12, ease: E }}
                  style={{ background: C.surface, padding: "36px 32px" }}>
                  <div className="mb-8">
                    <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 64, color: C.border, lineHeight: 1, letterSpacing: "-0.02em" }}>{n}</span>
                  </div>
                  <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, color: C.text, letterSpacing: "-0.02em", marginBottom: 10, lineHeight: 1.2 }}>{title}</h3>
                  <p style={{ fontFamily: SANS, fontWeight: 300, fontSize: 14, color: C.muted, lineHeight: 1.8 }}>{body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MCP ── */}
        <section className="py-28 lg:py-36 border-t" id="mcp" style={{ borderColor: C.border }}>
          <div className="max-w-[1200px] mx-auto px-8 lg:px-14 grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-16 lg:gap-24 items-start">
            <div>
              <motion.p
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                style={{ fontFamily: MONO, fontSize: 9, color: C.indigo, letterSpacing: "0.18em" }}
                className="uppercase mb-5">
                / MCP-native
              </motion.p>
              <div className="overflow-hidden mb-6">
                <motion.h2
                  initial={{ y: "104%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.9, ease: E }}
                  style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(32px,4.5vw,60px)", letterSpacing: "-0.025em", lineHeight: 1.0, color: C.text }}>
                  Runs inside<br />
                  <em style={{ fontWeight: 400, color: C.indigo }}>Claude + Cursor.</em>
                </motion.h2>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
                style={{ fontFamily: SANS, fontWeight: 300, fontSize: 16, color: C.muted, lineHeight: 1.85, marginBottom: 24 }}>
                Lode ships as a JSON-RPC 2.0 MCP server at{" "}
                <code style={{ fontFamily: MONO, fontSize: 11.5, color: C.text, background: C.surfaceHi, padding: "2px 6px", borderRadius: 3, border: `1px solid ${C.border}` }}>/api/mcp</code>.
                Add one config block. Call{" "}
                <code style={{ fontFamily: MONO, fontSize: 11.5, color: C.text, background: C.surfaceHi, padding: "2px 6px", borderRadius: 3, border: `1px solid ${C.border}` }}>enrich_companies</code>{" "}
                inline — same stealth crawler, three packs, no context switch.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.25 }}
                className="space-y-2.5">
                {[
                  { label: "TOOL", name: "enrich_companies(domains[], pack)" },
                  { label: "TOOL", name: "list_packs()" },
                ].map(({ label, name }) => (
                  <div key={name} className="flex items-center gap-3">
                    <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.12em", color: C.indigo, background: C.indigoDim, border: `1px solid ${C.indigo}35`, borderRadius: 2, padding: "3px 7px" }}>{label}</span>
                    <code style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{name}</code>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1, ease: E }}
              className="rounded-lg overflow-hidden"
              style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: `0 40px 80px rgba(0,0,0,0.4)` }}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: C.border }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3A3530" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3A3530" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3A3530" }} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.12em" }}>CLAUDE_DESKTOP_CONFIG.JSON</span>
                <CopyButton text={MCP_CONFIG} />
              </div>
              <pre style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.8, color: "#BDB8AA", padding: "22px 26px", margin: 0, overflow: "auto" }}>
                <span style={{ color: C.dim }}>{"{"}</span>{"\n"}
                {"  "}<span style={{ color: C.indigo }}>&quot;mcpServers&quot;</span><span style={{ color: C.dim }}>: {"{"}</span>{"\n"}
                {"    "}<span style={{ color: C.indigo }}>&quot;lode&quot;</span><span style={{ color: C.dim }}>: {"{"}</span>{"\n"}
                {"      "}<span style={{ color: "#7A9C6A" }}>&quot;command&quot;</span><span style={{ color: C.dim }}>:</span>{" "}<span style={{ color: C.gold }}>&quot;npx&quot;</span><span style={{ color: C.dim }}>,</span>{"\n"}
                {"      "}<span style={{ color: "#7A9C6A" }}>&quot;args&quot;</span><span style={{ color: C.dim }}>: [</span>{"\n"}
                {"        "}<span style={{ color: C.gold }}>&quot;mcp-remote&quot;</span><span style={{ color: C.dim }}>,</span>{"\n"}
                {"        "}<span style={{ color: C.gold }}>&quot;https://jstack-omega.vercel.app/api/mcp&quot;</span>{"\n"}
                {"      "}<span style={{ color: C.dim }}>]</span>{"\n"}
                {"    "}<span style={{ color: C.dim }}>{"}"}</span>{"\n"}
                {"  "}<span style={{ color: C.dim }}>{"}"}</span>{"\n"}
                <span style={{ color: C.dim }}>{"}"}</span>
              </pre>
              <div className="px-6 py-4 border-t" style={{ borderColor: C.border }}>
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.12em" }}>THEN IN CLAUDE</span>
                <div style={{ fontFamily: MONO, fontSize: 12, color: C.sage, marginTop: 6 }}>
                  &gt; extract stripe.com and linear.app with the SDR pack
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-32 lg:py-40 border-t relative overflow-hidden" style={{ borderColor: C.border, background: C.surface }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 60% 70% at 50% 50%, ${C.goldDim} 0%, transparent 60%)` }} />
          <div className="relative z-10 max-w-[1200px] mx-auto px-8 lg:px-14 text-center">
            <motion.p
              initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ fontFamily: MONO, fontSize: 9, color: C.gold, letterSpacing: "0.18em" }}
              className="uppercase mb-6">
              / Start extracting
            </motion.p>
            <div className="overflow-hidden mb-2">
              <motion.h2
                initial={{ y: "104%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 1.0, ease: E }}
                style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(48px,8vw,112px)", letterSpacing: "-0.025em", lineHeight: 0.92, color: C.text }}>
                Stop guessing.
              </motion.h2>
            </div>
            <div className="overflow-hidden mb-12">
              <motion.h2
                initial={{ y: "104%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 1.0, delay: 0.08, ease: E }}
                style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(48px,8vw,112px)", letterSpacing: "-0.03em", lineHeight: 0.92, color: C.gold }}>
                Start knowing.
              </motion.h2>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
              style={{ fontFamily: SANS, fontWeight: 300, fontSize: 17, color: C.muted, lineHeight: 1.85, maxWidth: 380, margin: "0 auto 40px" }}>
              Three packs. Sixty seconds. Every company, extracted.
            </motion.p>
            <motion.a href="/app"
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}
              style={{ fontFamily: SANS, fontWeight: 600, fontSize: 16, color: C.bg, background: C.gold, padding: "15px 40px", borderRadius: 4, textDecoration: "none", display: "inline-block", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 48px ${C.goldGlow}`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
              Open Lode — free
            </motion.a>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="py-10 border-t" style={{ borderColor: C.border }}>
          <div className="max-w-[1200px] mx-auto px-8 lg:px-14 flex flex-col md:flex-row items-center justify-between gap-4">
            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 18, color: C.text, letterSpacing: "-0.01em" }}>
              Lode<span style={{ color: C.gold }}>·</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full" style={{ background: C.gold, opacity: 0.6 }} />
              <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.12em" }}>STEALTH-POWERED BY HYPERBROWSER</span>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }}>© 2026 LODE</span>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}
