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
  bg:        "#0B0A0E",
  surface:   "#111018",
  surfaceHi: "#18161F",
  border:    "#1F1D28",
  borderHi:  "#2A2740",
  text:      "#F4F3FF",
  muted:     "#6B6880",
  dim:       "#3D3B4E",
  amber:     "#F59E0B",
  amberDim:  "rgba(245,158,11,0.12)",
  amberGlow: "rgba(245,158,11,0.20)",
  indigo:    "#818CF8",
  indigoDim: "rgba(129,140,248,0.12)",
  green:     "#34D399",
  greenDim:  "rgba(52,211,153,0.12)",
};

const SAT = "'Satoshi', system-ui, sans-serif";
const MONO = "var(--font-geist-mono), 'Geist Mono', monospace";
const E = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ─── DATA ─── */
const PACKS = [
  {
    id: "sdr",
    label: "SDR Pack",
    badge: "Sales",
    color: C.amber,
    dim: C.amberDim,
    headline: "Outbound signals that close deals.",
    sub: "Buying intent, decision-makers with LinkedIn, pricing model, recent launches, named customer logos.",
    signals: [
      "Pricing model: sales-led vs self-serve",
      "Decision-makers + public LinkedIn",
      "Named customer logos from case studies",
      "Recent product launches & integrations",
    ],
  },
  {
    id: "recruiter",
    label: "Recruiter Pack",
    badge: "Talent",
    color: C.indigo,
    dim: C.indigoDim,
    headline: "Hiring intel before the cold call.",
    sub: "Every open role, languages from job posts, engineering leaders, team growth velocity.",
    signals: [
      "All open roles with team & location",
      "Tech stack inferred from job posts",
      "Velocity: aggressive / steady / slow",
      "Engineering leaders & hiring managers",
    ],
  },
  {
    id: "vc",
    label: "VC Pack",
    badge: "Invest",
    color: C.green,
    dim: C.greenDim,
    headline: "Investment-grade signals, fast.",
    sub: "Funding stage, named investors, ARR signals, founder backgrounds, expansion moves.",
    signals: [
      "Funding stage + named investors",
      "Traction: logos, ARR signals, growth",
      "Founder backgrounds & prior exits",
      "Market expansion & partnership moves",
    ],
  },
];

const FEATURES = [
  { n: "01", title: "Stealth crawl", body: "Hyperbrowser's anti-detection sessions bypass bot protection. No CAPTCHAs, no blocks — consistent extraction across any site." },
  { n: "02", title: "Pack-aware extraction", body: "One crawl, three lenses. The pack reshapes prompt, URL fan-out, and schema — role-specific intelligence without redundant scraping." },
  { n: "03", title: "MCP server included", body: "JSON-RPC 2.0 at /api/mcp. Wire ProspectIQ into Cursor or Claude Desktop and call enrich_companies inline — no context switch." },
  { n: "04", title: "Pack-shaped CSV export", body: "Export with pack-specific columns. SDR gets people + buying signals. Recruiter gets roles + stack. VC gets funding + founders." },
];

const TICKER_ITEMS = [
  "stripe.com · SDR · 6 signals · 8 people · 2m ago",
  "linear.app · Recruiter · 12 open roles · 44s",
  "vercel.com · VC · Series C · 3 founders · 1m ago",
  "notion.so · SDR · sales-led · 14 decision-makers · 3m",
  "figma.com · VC · YC S20 · $800M ARR · 2m ago",
  "resend.com · SDR · 100+ logos · 33 investors · 58s",
  "supabase.com · Recruiter · aggressive · Rust + Go · 1m",
  "planetscale.com · VC · Series C · Tiger Global · 2m",
];

type DemoLine = { type: "cmd" | "status" | "key" | "val" | "sig" | "gap" | "done"; text: string };

const DEMOS: { domain: string; pack: string; color: string; lines: DemoLine[] }[] = [
  {
    domain: "stripe.com", pack: "SDR", color: C.amber,
    lines: [
      { type: "cmd",    text: "$ enrich stripe.com --pack sdr" },
      { type: "status", text: "scraping 10 pages via stealth session..." },
      { type: "gap",    text: "" },
      { type: "key",    text: "COMPANY" },
      { type: "val",    text: "Stripe — payments infrastructure for the internet" },
      { type: "key",    text: "PRICING" },
      { type: "val",    text: "sales-led · enterprise contracts · self-serve SMB" },
      { type: "gap",    text: "" },
      { type: "key",    text: "BUYING SIGNALS" },
      { type: "sig",    text: "· 'Talk to sales' on all enterprise tiers" },
      { type: "sig",    text: "· Launched 40+ markets in Q3 → expansion signal" },
      { type: "sig",    text: "· API-first → dev champion at every account" },
      { type: "gap",    text: "" },
      { type: "key",    text: "PEOPLE" },
      { type: "val",    text: "8 found · Patrick Collison, Eileen Donahoe +6" },
      { type: "done",   text: "✓  enriched in 58s" },
    ],
  },
  {
    domain: "linear.app", pack: "Recruiter", color: C.indigo,
    lines: [
      { type: "cmd",    text: "$ enrich linear.app --pack recruiter" },
      { type: "status", text: "scraping 8 pages via stealth session..." },
      { type: "gap",    text: "" },
      { type: "key",    text: "HIRING VELOCITY" },
      { type: "val",    text: "aggressive · 12 open roles" },
      { type: "key",    text: "TECH STACK" },
      { type: "val",    text: "TypeScript, Rust, PostgreSQL, Kubernetes" },
      { type: "gap",    text: "" },
      { type: "key",    text: "HIRING SIGNALS" },
      { type: "sig",    text: "· 8 senior eng roles → rapid team expansion" },
      { type: "sig",    text: "· Hiring Rust infra → platform rewrite in progress" },
      { type: "sig",    text: "· Berlin + SF both actively hiring simultaneously" },
      { type: "gap",    text: "" },
      { type: "key",    text: "ENG LEADERS" },
      { type: "val",    text: "4 found · Tuomas Artman (CTO), Nan Yu +2" },
      { type: "done",   text: "✓  enriched in 44s" },
    ],
  },
  {
    domain: "vercel.com", pack: "VC", color: C.green,
    lines: [
      { type: "cmd",    text: "$ enrich vercel.com --pack vc" },
      { type: "status", text: "scraping 9 pages via stealth session..." },
      { type: "gap",    text: "" },
      { type: "key",    text: "FUNDING" },
      { type: "val",    text: "Series C · $150M · Tiger Global, Bedrock, GV" },
      { type: "key",    text: "TRACTION" },
      { type: "val",    text: "10,000+ paying teams · 10× YoY revenue growth" },
      { type: "gap",    text: "" },
      { type: "key",    text: "INVESTMENT SIGNALS" },
      { type: "sig",    text: "· Ex-Google/Meta founders · strong angel syndicate" },
      { type: "sig",    text: "· ARR $100M+ implied by Series C valuation terms" },
      { type: "sig",    text: "· Shopify + Loom partnerships → enterprise push" },
      { type: "gap",    text: "" },
      { type: "key",    text: "FOUNDERS" },
      { type: "val",    text: "3 found · Guillermo Rauch (CEO), Matheus Fernandes" },
      { type: "done",   text: "✓  enriched in 62s" },
    ],
  },
];

/* ─── COMPONENTS ─── */

function Grain() {
  return (
    <div className="fixed inset-0 z-[150] pointer-events-none" style={{ opacity: 0.022 }}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}

function Cursor() {
  const mx = useMotionValue(-200); const my = useMotionValue(-200);
  const sx = useSpring(mx, { stiffness: 500, damping: 45 });
  const sy = useSpring(my, { stiffness: 500, damping: 45 });
  const lx = useSpring(mx, { stiffness: 80, damping: 22 });
  const ly = useSpring(my, { stiffness: 80, damping: 22 });
  const [big, setBig] = useState(false);
  useEffect(() => {
    const move = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    const over = (e: MouseEvent) => { if ((e.target as Element).closest("a,button")) setBig(true); };
    const out  = (e: MouseEvent) => { if ((e.target as Element).closest("a,button")) setBig(false); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mouseout", out);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mouseout", out);
    };
  }, [mx, my]);
  return (
    <>
      <motion.div className="fixed top-0 left-0 pointer-events-none z-[500] rounded-full"
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%", background: C.amber }}
        animate={{ width: big ? 40 : 6, height: big ? 40 : 6, opacity: big ? 0.2 : 1 }}
        transition={{ duration: 0.15, ease: E }} />
      <motion.div className="fixed top-0 left-0 pointer-events-none z-[499] rounded-full"
        style={{ x: lx, y: ly, translateX: "-50%", translateY: "-50%", width: 28, height: 28, border: `1px solid ${C.dim}` }} />
    </>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ fontFamily: MONO, fontSize: 10, color: copied ? C.amber : C.muted, border: `1px solid ${copied ? C.amber : C.border}`, borderRadius: 6, padding: "5px 12px", background: copied ? C.amberDim : "transparent", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap", letterSpacing: "0.06em" }}>
      {copied ? "COPIED ✓" : "COPY CONFIG"}
    </button>
  );
}

function EnrichmentDemo() {
  const [demoIdx, setDemoIdx] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const demo = DEMOS[demoIdx];

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (lineCount < demo.lines.length) {
      const delay = lineCount === 0 ? 500 : demo.lines[lineCount - 1]?.type === "gap" ? 80 : 180;
      t = setTimeout(() => setLineCount(c => c + 1), delay);
    } else {
      t = setTimeout(() => { setDemoIdx(d => (d + 1) % DEMOS.length); setLineCount(0); }, 3200);
    }
    return () => clearTimeout(t);
  }, [lineCount, demo.lines.length]);

  const lineColor = (line: DemoLine, packColor: string) => {
    if (line.type === "cmd")    return C.muted;
    if (line.type === "status") return C.dim;
    if (line.type === "key")    return C.dim;
    if (line.type === "val")    return C.text;
    if (line.type === "sig")    return packColor;
    if (line.type === "done")   return C.green;
    return "transparent";
  };

  return (
    <div className="relative rounded-xl overflow-hidden"
      style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: `0 0 60px -10px ${demo.color}30` }}>
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F56" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#27C93F" }} />
        </div>
        <div className="flex items-center gap-2">
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: "0.1em" }}>
            LIVE · ProspectIQ
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.span key={demo.pack}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ fontFamily: MONO, fontSize: 10, color: demo.color, background: `${demo.color}18`, border: `1px solid ${demo.color}40`, borderRadius: 4, padding: "2px 8px", letterSpacing: "0.1em" }}>
            {demo.pack.toUpperCase()}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Terminal body */}
      <div className="p-4 overflow-hidden" style={{ minHeight: 320, fontFamily: MONO, fontSize: 12, lineHeight: 1.65 }}>
        <AnimatePresence mode="wait">
          <motion.div key={demoIdx}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}>
            {demo.lines.slice(0, lineCount).map((line, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{
                  color: lineColor(line, demo.color),
                  fontSize: line.type === "key" ? 9 : 12,
                  letterSpacing: line.type === "key" ? "0.12em" : "0",
                  marginTop: line.type === "gap" ? 0 : line.type === "key" ? 10 : 0,
                  height: line.type === "gap" ? 6 : "auto",
                  fontWeight: line.type === "done" ? 600 : 400,
                  paddingLeft: line.type === "sig" ? 4 : 0,
                }}>
                {line.type !== "gap" && line.text}
                {i === lineCount - 1 && lineCount < demo.lines.length && line.type !== "gap" && (
                  <motion.span style={{ color: C.amber }}
                    animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>▋</motion.span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2.5 border-t flex items-center justify-between" style={{ borderColor: C.border }}>
        <AnimatePresence mode="wait">
          <motion.span key={demo.domain}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: "0.06em" }}>
            {demo.domain}
          </motion.span>
        </AnimatePresence>
        {lineCount > 0 && lineCount < demo.lines.length && (
          <motion.div className="flex items-center gap-1.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className="w-1 h-1 rounded-full" style={{ background: C.amber }}
              animate={{ scale: [1, 1.8, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.amber, letterSpacing: "0.06em" }}>SCRAPING</span>
          </motion.div>
        )}
        {lineCount >= demo.lines.length && (
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.green, letterSpacing: "0.06em" }}>ENRICHED</span>
        )}
      </div>
    </div>
  );
}

function PackCard({ pack, index }: { pack: typeof PACKS[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: E }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.surfaceHi : C.surface,
        border: `1px solid ${hovered ? pack.color + "60" : C.border}`,
        borderRadius: 12,
        padding: "28px 28px 24px",
        transition: "all 0.2s ease",
        boxShadow: hovered ? `0 0 40px -8px ${pack.color}25` : "none",
      }}>
      <div className="flex items-center justify-between mb-5">
        <span style={{ fontFamily: MONO, fontSize: 9, color: pack.color, background: pack.dim, border: `1px solid ${pack.color}40`, borderRadius: 4, padding: "3px 8px", letterSpacing: "0.12em" }}>
          {pack.badge.toUpperCase()}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.08em" }}>
          {pack.id === "sdr" ? "/ 01" : pack.id === "recruiter" ? "/ 02" : "/ 03"}
        </span>
      </div>

      <h3 style={{ fontFamily: SAT, fontWeight: 700, fontSize: 18, color: C.text, letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.3 }}>
        {pack.label}
      </h3>
      <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>
        {pack.sub}
      </p>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 7 }}>
        {pack.signals.map((sig, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span style={{ color: pack.color, marginTop: 3, flexShrink: 0, fontSize: 8 }}>◆</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted, lineHeight: 1.55, letterSpacing: "0.02em" }}>{sig}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function FeatureRow({ n, title, body, index }: typeof FEATURES[0] & { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: E }}
      className="grid grid-cols-[56px_1fr] gap-6 py-6 border-b"
      style={{ borderColor: C.border }}>
      <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim, letterSpacing: "0.1em", paddingTop: 3 }}>{n}</span>
      <div>
        <h4 style={{ fontFamily: SAT, fontWeight: 700, fontSize: 16, color: C.text, letterSpacing: "-0.01em", marginBottom: 6 }}>{title}</h4>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 560 }}>{body}</p>
      </div>
    </motion.div>
  );
}

const MCP_CONFIG = `{
  "mcpServers": {
    "prospectiq": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://jstack-omega.vercel.app/api/mcp"
      ]
    }
  }
}`;

/* ─── PAGE ─── */
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", () => {
      const cur = window.scrollY;
      setScrolled(cur > 50);
      if (cur < 80) { setNavVisible(true); lastY.current = cur; return; }
      if (cur > lastY.current + 10) setNavVisible(false);
      else if (cur < lastY.current - 10) setNavVisible(true);
      lastY.current = cur;
    });
    return unsub;
  }, [scrollYProgress]);

  return (
    <SmoothScroll>
      <div style={{ fontFamily: "var(--font-geist-sans)", background: C.bg, color: C.text, cursor: "none" }}
        className="min-h-screen overflow-x-hidden">
        <Cursor />
        <Grain />

        {/* scroll progress */}
        <motion.div className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60]"
          style={{ scaleX, background: C.amber }} />

        {/* ── NAV ── */}
        <motion.nav
          className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-4 flex items-center justify-between"
          animate={{
            y: navVisible ? 0 : -72,
            background: scrolled ? "rgba(11,10,14,0.88)" : "rgba(11,10,14,0)",
            backdropFilter: scrolled ? "blur(20px)" : "blur(0px)",
          }}
          transition={{ duration: 0.35, ease: E }}>

          <motion.a href="/" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: E }}
            style={{ fontFamily: SAT, fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: "-0.03em", textDecoration: "none" }}>
            Prospect<span style={{ color: C.amber }}>IQ</span>
          </motion.a>

          <motion.div className="hidden md:flex items-center gap-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            {["Packs", "MCP", "Features"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                style={{ fontFamily: "var(--font-geist-sans)", fontSize: 13, color: C.muted, textDecoration: "none", letterSpacing: "0.01em", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
                {item}
              </a>
            ))}
          </motion.div>

          <motion.a href="/app"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: E }}
            style={{ fontFamily: SAT, fontWeight: 700, fontSize: 13, color: "#000", background: C.amber, padding: "8px 20px", borderRadius: 8, textDecoration: "none", letterSpacing: "-0.01em", transition: "all 0.15s", display: "inline-block" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${C.amberGlow}`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
            Open app →
          </motion.a>
        </motion.nav>

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
          {/* bg texture */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 opacity-[0.012]"
              style={{ backgroundImage: `linear-gradient(${C.borderHi} 1px, transparent 1px), linear-gradient(90deg, ${C.borderHi} 1px, transparent 1px)`, backgroundSize: "72px 72px" }} />
            <div className="absolute top-0 left-0 w-[800px] h-[800px] pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 20% 30%, ${C.amberDim} 0%, transparent 55%)`, opacity: 0.6 }} />
          </div>

          <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: E }}
                className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }}
                  animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: "0.1em" }}>
                  LIVE · MCP-NATIVE · HYPERBROWSER
                </span>
              </motion.div>

              <div className="overflow-hidden mb-1">
                <motion.h1
                  initial={{ y: "105%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 0.85, delay: 0.5, ease: E }}
                  style={{ fontFamily: SAT, fontWeight: 800, fontSize: "clamp(44px,6.5vw,80px)", letterSpacing: "-0.035em", lineHeight: 1.05, color: C.text }}>
                  Company intel,
                </motion.h1>
              </div>
              <div className="overflow-hidden mb-8">
                <motion.h1
                  initial={{ y: "105%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 0.85, delay: 0.65, ease: E }}
                  style={{ fontFamily: SAT, fontWeight: 800, fontSize: "clamp(44px,6.5vw,80px)", letterSpacing: "-0.035em", lineHeight: 1.05, color: C.amber }}>
                  stealth-scraped.
                </motion.h1>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.9, ease: E }}
                style={{ fontSize: 17, color: C.muted, lineHeight: 1.75, maxWidth: 420, marginBottom: 32 }}>
                Paste domains. Pick a pack —{" "}
                <span style={{ color: C.amber }}>SDR</span>,{" "}
                <span style={{ color: C.indigo }}>Recruiter</span>, or{" "}
                <span style={{ color: C.green }}>VC</span>. Get pack-specific signals
                streamed in 60 seconds from Hyperbrowser&apos;s stealth crawler.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.05, ease: E }}
                className="flex items-center gap-3">
                <a href="/app"
                  style={{ fontFamily: SAT, fontWeight: 700, fontSize: 15, color: "#000", background: C.amber, padding: "12px 28px", borderRadius: 9, textDecoration: "none", letterSpacing: "-0.01em", display: "inline-block", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${C.amberGlow}`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                  Start enriching →
                </a>
                <a href="#mcp"
                  style={{ fontFamily: SAT, fontWeight: 600, fontSize: 15, color: C.muted, padding: "12px 20px", borderRadius: 9, textDecoration: "none", letterSpacing: "-0.01em", border: `1px solid ${C.border}`, display: "inline-block", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.text; (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.muted; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
                  View MCP docs
                </a>
              </motion.div>

              <motion.div className="flex items-center gap-4 mt-10"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                {[
                  { value: "3", label: "intelligence packs" },
                  { value: "60s", label: "avg enrichment" },
                  { value: "MCP", label: "JSON-RPC 2.0" },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col">
                    <span style={{ fontFamily: SAT, fontWeight: 800, fontSize: 20, color: C.text, letterSpacing: "-0.03em" }}>{value}</span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }}>{label.toUpperCase()}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — live enrichment terminal */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.7, ease: E }}>
              <EnrichmentDemo />
            </motion.div>
          </div>
        </section>

        {/* ── TICKER ── */}
        <div className="relative overflow-hidden border-y py-3.5" style={{ borderColor: C.border, background: C.surface }}>
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{ background: `linear-gradient(to right, ${C.surface} 0%, transparent 8%, transparent 92%, ${C.surface} 100%)` }} />
          <motion.div className="flex gap-12 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-3 shrink-0">
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.dim, letterSpacing: "0.06em" }}>{item}</span>
                <span style={{ color: C.amber, fontSize: 6, opacity: 0.6 }}>◆</span>
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── PACKS ── */}
        <section className="py-24 border-b" id="packs" style={{ borderColor: C.border }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
            <div className="mb-12">
              <motion.div
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                style={{ fontFamily: MONO, fontSize: 10, color: C.amber, letterSpacing: "0.16em" }}
                className="uppercase mb-4">
                / Three packs
              </motion.div>
              <div className="overflow-hidden">
                <motion.h2
                  initial={{ y: "105%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.8, ease: E }}
                  style={{ fontFamily: SAT, fontWeight: 800, fontSize: "clamp(28px,3.8vw,52px)", letterSpacing: "-0.03em", color: C.text, lineHeight: 1.1 }}>
                  Same crawl.{" "}
                  <span style={{ color: C.muted }}>Three lenses.</span>
                </motion.h2>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
                style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, maxWidth: 520, marginTop: 12 }}>
                One stealth scrape per company. The pack you pick determines which signals
                get surfaced, which people get prioritised, and how the CSV exports.
              </motion.p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PACKS.map((pack, i) => <PackCard key={pack.id} pack={pack} index={i} />)}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-24 border-b" style={{ borderColor: C.border }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
            <div className="mb-12">
              <motion.div
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                style={{ fontFamily: MONO, fontSize: 10, color: C.amber, letterSpacing: "0.16em" }}
                className="uppercase mb-4">
                / How it works
              </motion.div>
              <div className="overflow-hidden">
                <motion.h2
                  initial={{ y: "105%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.8, ease: E }}
                  style={{ fontFamily: SAT, fontWeight: 800, fontSize: "clamp(28px,3.8vw,52px)", letterSpacing: "-0.03em", color: C.text, lineHeight: 1.1 }}>
                  Intelligence in{" "}
                  <span style={{ color: C.amber }}>60 seconds.</span>
                </motion.h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: C.border }}>
              {[
                { n: "01", title: "Paste domains", body: "Enter one domain per line — up to 10 per run. stripe.com, notion.so, linear.app. No URLs, just domains.", icon: "↗" },
                { n: "02", title: "Pick your pack", body: "Choose SDR for buying signals, Recruiter for hiring intel, or VC for investment signals. The pack reshapes the entire extraction.", icon: "◈" },
                { n: "03", title: "Signals streamed live", body: "Watch intelligence stream back in real time from a stealth Hyperbrowser session. Export to pack-shaped CSV or call via MCP.", icon: "⚡" },
              ].map(({ n, title, body, icon }, i) => (
                <motion.div key={n}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1, ease: E }}
                  style={{ background: C.surface, padding: "32px 28px" }}>
                  <div className="flex items-center justify-between mb-6">
                    <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.12em" }}>{n}</span>
                    <span style={{ fontSize: 20, color: C.amber }}>{icon}</span>
                  </div>
                  <h3 style={{ fontFamily: SAT, fontWeight: 700, fontSize: 18, color: C.text, letterSpacing: "-0.02em", marginBottom: 10 }}>{title}</h3>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MCP ── */}
        <section className="py-24 border-b" id="mcp" style={{ borderColor: C.border, background: C.surface }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                style={{ fontFamily: MONO, fontSize: 10, color: C.indigo, letterSpacing: "0.16em" }}
                className="uppercase mb-4">
                / MCP-native
              </motion.div>
              <div className="overflow-hidden mb-6">
                <motion.h2
                  initial={{ y: "105%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.8, ease: E }}
                  style={{ fontFamily: SAT, fontWeight: 800, fontSize: "clamp(28px,3.6vw,50px)", letterSpacing: "-0.03em", color: C.text, lineHeight: 1.1 }}>
                  Runs inside<br />
                  <span style={{ color: C.indigo }}>Claude + Cursor.</span>
                </motion.h2>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
                style={{ fontSize: 15, color: C.muted, lineHeight: 1.75, maxWidth: 440 }}>
                ProspectIQ ships as a JSON-RPC 2.0 MCP server at{" "}
                <code style={{ fontFamily: MONO, fontSize: 12, color: C.text, background: C.surfaceHi, padding: "2px 7px", borderRadius: 4, border: `1px solid ${C.border}` }}>/api/mcp</code>.
                Add one config block to Claude Desktop or Cursor. Call{" "}
                <code style={{ fontFamily: MONO, fontSize: 12, color: C.text, background: C.surfaceHi, padding: "2px 7px", borderRadius: 4, border: `1px solid ${C.border}` }}>enrich_companies</code>{" "}
                inline — same stealth crawler, three packs, no context switch.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-6 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.indigo, background: C.indigoDim, border: `1px solid ${C.indigo}40`, borderRadius: 4, padding: "3px 8px", letterSpacing: "0.08em" }}>TOOL</span>
                  <code style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>enrich_companies(domains, pack)</code>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.indigo, background: C.indigoDim, border: `1px solid ${C.indigo}40`, borderRadius: 4, padding: "3px 8px", letterSpacing: "0.08em" }}>TOOL</span>
                  <code style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>list_packs()</code>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1, ease: E }}
              className="rounded-xl overflow-hidden"
              style={{ background: "#0D0C11", border: `1px solid ${C.border}`, boxShadow: `0 0 60px -10px ${C.indigo}20` }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F56" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#27C93F" }} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim, letterSpacing: "0.1em" }}>CLAUDE_DESKTOP_CONFIG.JSON</span>
                <CopyButton text={MCP_CONFIG} />
              </div>
              <pre style={{ fontFamily: MONO, fontSize: 12.5, lineHeight: 1.75, color: "#C8C2D8", padding: "20px 24px", margin: 0, overflow: "auto" }}>
                <span style={{ color: C.dim }}>{"{"}</span>{"\n"}
                {"  "}<span style={{ color: C.indigo }}>&quot;mcpServers&quot;</span><span style={{ color: C.dim }}>: {"{"}</span>{"\n"}
                {"    "}<span style={{ color: C.indigo }}>&quot;prospectiq&quot;</span><span style={{ color: C.dim }}>: {"{"}</span>{"\n"}
                {"      "}<span style={{ color: "#6B9966" }}>&quot;command&quot;</span><span style={{ color: C.dim }}>:</span>{" "}<span style={{ color: C.amber }}>&quot;npx&quot;</span><span style={{ color: C.dim }}>,</span>{"\n"}
                {"      "}<span style={{ color: "#6B9966" }}>&quot;args&quot;</span><span style={{ color: C.dim }}>: [</span>{"\n"}
                {"        "}<span style={{ color: C.amber }}>&quot;mcp-remote&quot;</span><span style={{ color: C.dim }}>,</span>{"\n"}
                {"        "}<span style={{ color: C.amber }}>&quot;https://jstack-omega.vercel.app/api/mcp&quot;</span>{"\n"}
                {"      "}<span style={{ color: C.dim }}>]</span>{"\n"}
                {"    "}<span style={{ color: C.dim }}>{"}"}</span>{"\n"}
                {"  "}<span style={{ color: C.dim }}>{"}"}</span>{"\n"}
                <span style={{ color: C.dim }}>{"}"}</span>
              </pre>
              <div className="px-6 py-4 border-t" style={{ borderColor: C.border }}>
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }}>$ THEN IN CLAUDE</span>
                <div style={{ fontFamily: MONO, fontSize: 13, color: C.green, marginTop: 6 }}>
                  &gt; enrich stripe.com and linear.app with the SDR pack
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-24 border-b" id="features" style={{ borderColor: C.border }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
            <div className="mb-10">
              <motion.div
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                style={{ fontFamily: MONO, fontSize: 10, color: C.amber, letterSpacing: "0.16em" }}
                className="uppercase mb-4">
                / Capabilities
              </motion.div>
              <div className="overflow-hidden">
                <motion.h2
                  initial={{ y: "105%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.8, ease: E }}
                  style={{ fontFamily: SAT, fontWeight: 800, fontSize: "clamp(28px,3.8vw,52px)", letterSpacing: "-0.03em", color: C.text, lineHeight: 1.1 }}>
                  Stealth scrape.{" "}
                  <span style={{ color: C.muted }}>Pack-aware extract.</span>
                </motion.h2>
              </div>
            </div>
            <div className="border-t" style={{ borderColor: C.border }}>
              {FEATURES.map((f, i) => <FeatureRow key={f.n} {...f} index={i} />)}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-28 relative overflow-hidden" style={{ background: C.surface }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 70% 80% at 50% 50%, ${C.amberDim} 0%, transparent 65%)` }} />
          <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-12 text-center">
            <div className="overflow-hidden mb-2">
              <motion.h2
                initial={{ y: "105%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.9, ease: E }}
                style={{ fontFamily: SAT, fontWeight: 800, fontSize: "clamp(40px,7vw,96px)", letterSpacing: "-0.04em", lineHeight: 0.95, color: C.text }}>
                Stop guessing.
              </motion.h2>
            </div>
            <div className="overflow-hidden mb-10">
              <motion.h2
                initial={{ y: "105%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.08, ease: E }}
                style={{ fontFamily: SAT, fontWeight: 800, fontStyle: "italic", fontSize: "clamp(40px,7vw,96px)", letterSpacing: "-0.04em", lineHeight: 0.95, color: C.amber }}>
                Start knowing.
              </motion.h2>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
              style={{ fontSize: 17, color: C.muted, lineHeight: 1.75, maxWidth: 420, margin: "0 auto 36px" }}>
              SDR, Recruiter, or VC. Pick your lens. Get pack-specific signals from
              a stealth Hyperbrowser session — in the app or via MCP.
            </motion.p>
            <motion.a href="/app"
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}
              style={{ fontFamily: SAT, fontWeight: 700, fontSize: 16, color: "#000", background: C.amber, padding: "14px 36px", borderRadius: 10, textDecoration: "none", display: "inline-block", letterSpacing: "-0.01em", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px ${C.amberGlow}`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
              Start enriching → free
            </motion.a>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="py-10 border-t" style={{ borderColor: C.border, background: C.bg }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
            <span style={{ fontFamily: SAT, fontWeight: 800, fontSize: 16, color: C.text, letterSpacing: "-0.03em" }}>
              Prospect<span style={{ color: C.amber }}>IQ</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.amber, opacity: 0.7 }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim, letterSpacing: "0.1em" }}>
                STEALTH-POWERED BY HYPERBROWSER
              </span>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim, letterSpacing: "0.08em" }}>
              © 2026 PROSPECTIQ
            </span>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}
