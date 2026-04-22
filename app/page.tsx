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

/* ─── DESIGN TOKENS — crème + sage ─── */
const C = {
  bg:        "#F5F0E6",
  surface:   "#ECE6D8",
  surfaceHi: "#E2DAC8",
  border:    "#D2C8B8",
  borderHi:  "#BEB4A4",
  text:      "#1C1510",
  muted:     "#7A6D5E",
  dim:       "#B8AFA4",
  sage:      "#4A7A5E",
  sageLo:    "rgba(74,122,94,0.10)",
  sageGlow:  "rgba(74,122,94,0.18)",
  indigo:    "#6B72A8",
  indigoDim: "rgba(107,114,168,0.10)",
  teal:      "#4A8A7A",
  tealDim:   "rgba(74,138,122,0.10)",
  /* terminal stays warm dark */
  term:      "#1A1510",
  termSurf:  "#231F1A",
  termBdr:   "#2E2922",
  termText:  "#E8E2D8",
  termDim:   "#5A5248",
};

const SERIF = "'Bodoni Moda', Georgia, serif";
const SANS  = "'Figtree', system-ui, sans-serif";
const MONO  = "var(--font-geist-mono), 'Geist Mono', monospace";
const E     = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ─── DATA ─── */
const PACKS = [
  {
    id: "sdr", n: "I",
    label: "SDR Pack",
    color: C.sage, dim: C.sageLo,
    headline: "Outbound signals that close deals.",
    body: "Buying intent, decision-makers with public LinkedIn, pricing model, recent launches, named customer logos — everything a rep needs before the cold call.",
    signals: ["Pricing model: sales-led vs self-serve", "Decision-makers + public LinkedIn", "Named customer logos from case studies", "Recent product launches & integrations"],
  },
  {
    id: "recruiter", n: "II",
    label: "Recruiter Pack",
    color: C.indigo, dim: C.indigoDim,
    headline: "Hiring intel before the intro call.",
    body: "Every open role, tech stack inferred from job posts, engineering leaders, and team growth velocity — so you know the shape of the org before you reach out.",
    signals: ["All open roles with team & location", "Tech stack from job post language", "Velocity: aggressive / steady / slow", "Engineering leaders & hiring managers"],
  },
  {
    id: "vc", n: "III",
    label: "VC Pack",
    color: C.teal, dim: C.tealDim,
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

const STATS = [
  { value: 60,  suffix: "s",  label: "avg extraction" },
  { value: 3,   suffix: "",   label: "intelligence packs" },
  { value: 10,  suffix: "",   label: "domains per run" },
  { value: 25,  suffix: "+",  label: "signal categories" },
];

/* ─── COMPONENTS ─── */

function CountUp({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const steps = 60;
    const inc = to / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= to) { setCount(to); clearInterval(t); }
      else setCount(Math.round(cur));
    }, duration / steps);
    return () => clearInterval(t);
  }, [inView, to]);
  return <span ref={ref}>{count}{suffix}</span>;
}

function Grain() {
  return (
    <div className="fixed inset-0 z-[150] pointer-events-none" style={{ opacity: 0.022 }}>
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
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%", background: C.sage }}
        animate={{ width: big ? 36 : 5, height: big ? 36 : 5, opacity: big ? 0.15 : 0.85 }}
        transition={{ duration: 0.15 }} />
      <motion.div className="fixed top-0 left-0 pointer-events-none z-[499] rounded-full"
        style={{ x: lx, y: ly, translateX: "-50%", translateY: "-50%", width: 24, height: 24, border: `1px solid ${C.borderHi}` }} />
    </>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", color: copied ? C.sage : C.termDim, border: `1px solid ${copied ? C.sage : C.termBdr}`, borderRadius: 3, padding: "4px 10px", background: copied ? C.sageLo : "transparent", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>
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
    if (l.t === "cmd")    return C.termDim;
    if (l.t === "status") return C.termDim;
    if (l.t === "key")    return C.termDim;
    if (l.t === "val")    return C.termText;
    if (l.t === "sig")    return demo.color;
    if (l.t === "done")   return C.sage;
    return "transparent";
  };

  return (
    <div className="relative rounded-lg overflow-hidden"
      style={{ background: C.term, border: `1px solid ${C.termBdr}`, boxShadow: `0 32px 64px rgba(28,21,16,0.18), 0 2px 8px rgba(28,21,16,0.12)` }}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: C.termBdr }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3A3530" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3A3530" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3A3530" }} />
        </div>
        <div className="flex items-center gap-2">
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: C.sage }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          <span style={{ fontFamily: MONO, fontSize: 9, color: C.termDim, letterSpacing: "0.12em" }}>SEAM · LIVE</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.span key={demo.pack}
            initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}
            style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", color: demo.color, background: `${demo.color}18`, border: `1px solid ${demo.color}35`, borderRadius: 2, padding: "2px 8px" }}>
            {demo.pack.toUpperCase()}
          </motion.span>
        </AnimatePresence>
      </div>

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
                  <motion.span style={{ color: C.sage }} animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>▋</motion.span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: C.termBdr }}>
        <AnimatePresence mode="wait">
          <motion.span key={demo.domain} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ fontFamily: MONO, fontSize: 9, color: C.termDim, letterSpacing: "0.08em" }}>
            {demo.domain}
          </motion.span>
        </AnimatePresence>
        {count > 0 && count < demo.lines.length ? (
          <motion.div className="flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.span className="w-1 h-1 rounded-full" style={{ background: C.sage }} animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.sage, letterSpacing: "0.1em" }}>EXTRACTING</span>
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

  /* editorial break parallax */
  const breakRef = useRef<HTMLElement>(null);
  const { scrollYProgress: breakProgress } = useScroll({ target: breakRef, offset: ["start end", "end start"] });
  const breakImgY = useTransform(breakProgress, [0, 1], ["-8%", "8%"]);

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
          style={{ scaleX, background: C.sage }} />

        {/* ── NAV ── */}
        <motion.nav
          className="fixed top-0 left-0 right-0 z-50 px-8 lg:px-14 py-5 flex items-center justify-between"
          animate={{
            y: navVisible ? 0 : -70,
            background: scrolled ? "rgba(245,240,230,0.94)" : "rgba(245,240,230,0)",
            backdropFilter: scrolled ? "blur(20px)" : "blur(0px)",
          }}
          transition={{ duration: 0.3, ease: E }}>

          <motion.a href="/" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 22, color: C.text, textDecoration: "none", display: "flex", alignItems: "center", gap: 3, letterSpacing: "-0.01em" }}>
            Seam<span style={{ color: C.sage, fontSize: 9, lineHeight: 1, marginBottom: -4 }}>·</span>
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
            style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, color: "#F5F0E6", background: C.sage, padding: "9px 22px", borderRadius: 4, textDecoration: "none", letterSpacing: "0.01em", display: "inline-block", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${C.sageGlow}`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
            Open app
          </motion.a>
        </motion.nav>

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: C.bg }}>
          {/* subtle paper texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "200px" }} />

          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-8 lg:px-14 pt-32 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-center">
            {/* left — editorial headline */}
            <div>
              <motion.p
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                style={{ fontFamily: MONO, fontSize: 9, color: C.muted, letterSpacing: "0.18em", marginBottom: 40 }}
                className="uppercase flex items-center gap-2">
                <motion.span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: C.sage }}
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2.4, repeat: Infinity }} />
                MCP-native · stealth crawler · 60s
              </motion.p>

              {/* Jacket Circle-style mixed typography */}
              <div className="overflow-hidden mb-1">
                <motion.p
                  initial={{ y: "104%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.38, ease: E }}
                  style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(18px,2.2vw,28px)", letterSpacing: "-0.01em", lineHeight: 1, color: C.muted }}>
                  Find the
                </motion.p>
              </div>
              <div className="overflow-hidden mb-1">
                <motion.h1
                  initial={{ y: "104%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 1.0, delay: 0.48, ease: E }}
                  style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(72px,10vw,140px)", letterSpacing: "-0.025em", lineHeight: 0.88, color: C.text }}>
                  seam
                </motion.h1>
              </div>
              <div className="overflow-hidden mb-1">
                <motion.h1
                  initial={{ y: "104%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }}
                  transition={{ duration: 1.0, delay: 0.56, ease: E }}
                  style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(36px,5vw,72px)", letterSpacing: "-0.02em", lineHeight: 0.95, color: C.sage, textTransform: "uppercase" }}>
                  in any company.
                </motion.h1>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.85 }}
                style={{ fontFamily: SANS, fontWeight: 300, fontSize: 17, color: C.muted, lineHeight: 1.85, maxWidth: 400, marginTop: 28, marginBottom: 36 }}>
                Paste domains. Pick a pack. Get{" "}
                <span style={{ color: C.sage, fontWeight: 500 }}>SDR</span>,{" "}
                <span style={{ color: C.indigo, fontWeight: 500 }}>Recruiter</span>, or{" "}
                <span style={{ color: C.teal, fontWeight: 500 }}>VC</span>{" "}
                signals extracted in 60 seconds by stealth crawler.
              </motion.p>

              <motion.div className="flex items-center gap-3 flex-wrap"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.0 }}>
                <a href="/app"
                  style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: "#F5F0E6", background: C.sage, padding: "13px 28px", borderRadius: 4, textDecoration: "none", display: "inline-block", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${C.sageGlow}`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                  Start extracting
                </a>
                <a href="#packs"
                  style={{ fontFamily: SANS, fontWeight: 400, fontSize: 14, color: C.muted, padding: "13px 20px", borderRadius: 4, textDecoration: "none", border: `1px solid ${C.border}`, display: "inline-block", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.text; (e.currentTarget as HTMLElement).style.borderColor = C.borderHi; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.muted; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
                  See the packs →
                </a>
              </motion.div>
            </div>

            {/* right — terminal on warm dark bg */}
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
            animate={{ x: ["0%", "-50%"] }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-5 shrink-0">
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim, letterSpacing: "0.08em" }}>{item}</span>
                <span style={{ color: C.sage, fontSize: 5, opacity: 0.5 }}>◆</span>
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── STATS ── */}
        <section className="border-b" style={{ borderColor: C.border }}>
          <div className="max-w-[1200px] mx-auto px-8 lg:px-14">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0" style={{ borderColor: C.border }}>
              {STATS.map(({ value, suffix, label }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.09, ease: E }}
                  className="flex flex-col gap-1.5 py-8 px-6">
                  <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(36px,4vw,52px)", color: C.text, letterSpacing: "-0.03em", lineHeight: 1 }}>
                    <CountUp to={value} suffix={suffix} />
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>{label.toUpperCase()}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PACKS ── */}
        <section className="py-28 lg:py-36" id="packs">
          <div className="max-w-[1200px] mx-auto px-8 lg:px-14">

            <div className="mb-16 lg:mb-20">
              <div className="overflow-hidden mb-3">
                <motion.h2
                  initial={{ y: "104%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.9, ease: E }}
                  style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(38px,5.5vw,76px)", letterSpacing: "-0.02em", lineHeight: 1.0, color: C.text }}>
                  Same crawl.
                </motion.h2>
              </div>
              <div className="overflow-hidden">
                <motion.h2
                  initial={{ y: "104%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.08, ease: E }}
                  style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(38px,5.5vw,76px)", letterSpacing: "-0.025em", lineHeight: 1.0, color: C.sage, textTransform: "uppercase" }}>
                  Three lenses.
                </motion.h2>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
                style={{ fontFamily: SANS, fontWeight: 300, fontSize: 17, color: C.muted, lineHeight: 1.85, maxWidth: 480, marginTop: 14 }}>
                One stealth scrape per company. The pack determines which signals surface, which people get prioritised, and how the CSV exports.
              </motion.p>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}` }}>
              {PACKS.map((pack, i) => (
                <motion.div key={pack.id}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1, ease: E }}
                  className="grid grid-cols-1 lg:grid-cols-[100px_1fr_1fr] gap-8 lg:gap-12 py-12 border-b group"
                  style={{ borderColor: C.border }}>

                  <div className="flex flex-col justify-between gap-6">
                    <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 56, color: C.border, lineHeight: 1, letterSpacing: "-0.02em", transition: "color 0.3s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = `${pack.color}60`)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.border)}>
                      {pack.n}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: pack.color, letterSpacing: "0.14em" }}
                      className="uppercase">{pack.label}</span>
                  </div>

                  <div>
                    <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, color: C.text, letterSpacing: "-0.02em", marginBottom: 10, lineHeight: 1.2 }}>
                      {pack.headline}
                    </h3>
                    <p style={{ fontFamily: SANS, fontWeight: 300, fontSize: 15, color: C.muted, lineHeight: 1.85 }}>
                      {pack.body}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {pack.signals.map((sig, j) => (
                      <div key={j} className="flex items-start gap-3 pb-4" style={{ borderBottom: j < pack.signals.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>{sig}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EDITORIAL BREAK ── */}
        <section ref={breakRef} className="relative overflow-hidden" style={{ height: "60vh", minHeight: 360 }}>
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            whileInView={{ clipPath: "inset(0 0 0% 0)" }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0">
            <motion.img
              src="https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?w=2400&q=75&auto=format&fit=crop"
              alt=""
              style={{ y: breakImgY, width: "100%", height: "115%", objectFit: "cover", display: "block", top: "-7.5%", position: "absolute" }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(245,240,230,0.40) 0%, rgba(28,21,16,0.30) 50%, rgba(28,21,16,0.72) 100%)" }} />
          </motion.div>

          <div className="relative z-10 h-full flex flex-col justify-end px-8 lg:px-14 pb-14 lg:pb-18">
            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "104%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 1.0, delay: 0.6, ease: E }}
                style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(44px,6.5vw,88px)", letterSpacing: "-0.025em", lineHeight: 0.95, color: "#F5F0E6", maxWidth: 700 }}>
                Find the seam in any company.
              </motion.h2>
            </div>
          </div>
        </section>

        {/* ── PROCESS ── */}
        <section className="py-28 lg:py-36 border-t" id="process" style={{ borderColor: C.border }}>
          <div className="max-w-[1200px] mx-auto px-8 lg:px-14">
            <div className="mb-20 lg:mb-24">
              <div className="overflow-hidden">
                <motion.h2
                  initial={{ y: "104%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.9, ease: E }}
                  style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(38px,5.5vw,76px)", letterSpacing: "-0.025em", lineHeight: 1.0, color: C.text, textTransform: "uppercase" }}>
                  Three steps.
                </motion.h2>
              </div>
              <div className="overflow-hidden">
                <motion.h2
                  initial={{ y: "104%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.07, ease: E }}
                  style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(38px,5.5vw,76px)", letterSpacing: "-0.025em", lineHeight: 1.0, color: C.sage }}>
                  Sixty seconds.
                </motion.h2>
              </div>
            </div>

            {/* editorial list — NOT identical cards */}
            <div style={{ borderTop: `1px solid ${C.border}` }}>
              {STEPS.map(({ n, title, body }, i) => (
                <motion.div key={n}
                  initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1, ease: E }}
                  className="grid grid-cols-[80px_1fr] lg:grid-cols-[200px_1fr] gap-6 lg:gap-16 py-10 border-b items-baseline"
                  style={{ borderColor: C.border }}>
                  <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(44px,5vw,72px)", color: C.border, lineHeight: 1, letterSpacing: "-0.02em" }}>{n}</span>
                  <div>
                    <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(20px,2.5vw,28px)", color: C.text, letterSpacing: "-0.02em", marginBottom: 10, lineHeight: 1.2 }}>{title}</h3>
                    <p style={{ fontFamily: SANS, fontWeight: 300, fontSize: 15, color: C.muted, lineHeight: 1.85, maxWidth: "65ch" }}>{body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MCP ── */}
        <section className="py-28 lg:py-36 border-t" id="mcp" style={{ borderColor: C.border, background: C.surface }}>
          <div className="max-w-[1200px] mx-auto px-8 lg:px-14 grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-16 lg:gap-24 items-start">
            <div>
              <div className="overflow-hidden mb-6">
                <motion.h2
                  initial={{ y: "104%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.9, ease: E }}
                  style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(32px,4.5vw,60px)", letterSpacing: "-0.025em", lineHeight: 1.0, color: C.text, textTransform: "uppercase" }}>
                  Runs inside
                </motion.h2>
              </div>
              <div className="overflow-hidden mb-8">
                <motion.h2
                  initial={{ y: "104%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.07, ease: E }}
                  style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(32px,4.5vw,60px)", letterSpacing: "-0.025em", lineHeight: 1.0, color: C.indigo }}>
                  Claude + Cursor.
                </motion.h2>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
                style={{ fontFamily: SANS, fontWeight: 300, fontSize: 16, color: C.muted, lineHeight: 1.85, marginBottom: 28 }}>
                Seam ships as a JSON-RPC 2.0 MCP server at{" "}
                <code style={{ fontFamily: MONO, fontSize: 11.5, color: C.text, background: C.surfaceHi, padding: "2px 6px", borderRadius: 3, border: `1px solid ${C.border}` }}>/api/mcp</code>.
                Add one config block. Call{" "}
                <code style={{ fontFamily: MONO, fontSize: 11.5, color: C.text, background: C.surfaceHi, padding: "2px 6px", borderRadius: 3, border: `1px solid ${C.border}` }}>enrich_companies</code>{" "}
                inline — same stealth crawler, three packs, no context switch.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.25 }}
                className="space-y-3">
                {[
                  { name: "enrich_companies(domains[], pack)" },
                  { name: "list_packs()" },
                ].map(({ name }) => (
                  <div key={name} className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <code style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>{name}</code>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1, ease: E }}
              className="rounded-lg overflow-hidden"
              style={{ background: C.term, border: `1px solid ${C.termBdr}`, boxShadow: `0 32px 64px rgba(28,21,16,0.14)` }}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: C.termBdr }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3A3530" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3A3530" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3A3530" }} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.termDim, letterSpacing: "0.12em" }}>CLAUDE_DESKTOP_CONFIG.JSON</span>
                <CopyButton text={MCP_CONFIG} />
              </div>
              <pre style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.8, color: "#BDB8AA", padding: "22px 26px", margin: 0, overflow: "auto" }}>
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
              <div className="px-6 py-4 border-t" style={{ borderColor: C.termBdr }}>
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.termDim, letterSpacing: "0.12em" }}>THEN IN CLAUDE</span>
                <div style={{ fontFamily: MONO, fontSize: 12, color: C.sage, marginTop: 6 }}>
                  &gt; extract stripe.com and linear.app with the SDR pack
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-32 lg:py-44 border-t" style={{ borderColor: C.border }}>
          <div className="max-w-[1200px] mx-auto px-8 lg:px-14">
            <div className="overflow-hidden mb-2">
              <motion.h2
                initial={{ y: "104%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 1.0, ease: E }}
                style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(56px,9vw,128px)", letterSpacing: "-0.025em", lineHeight: 0.9, color: C.text }}>
                Stop guessing.
              </motion.h2>
            </div>
            <div className="overflow-hidden mb-14">
              <motion.h2
                initial={{ y: "104%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 1.0, delay: 0.08, ease: E }}
                style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(56px,9vw,128px)", letterSpacing: "-0.03em", lineHeight: 0.9, color: C.sage, textTransform: "uppercase" }}>
                Start knowing.
              </motion.h2>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
              className="flex items-center gap-5 flex-wrap">
              <a href="/app"
                style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: "#F5F0E6", background: C.sage, padding: "15px 36px", borderRadius: 4, textDecoration: "none", display: "inline-block", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 44px ${C.sageGlow}`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                Open Seam — free
              </a>
              <span style={{ fontFamily: SANS, fontWeight: 300, fontSize: 15, color: C.dim }}>Three packs. Sixty seconds. Every company.</span>
            </motion.div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="py-10 border-t" style={{ borderColor: C.border, background: C.surface }}>
          <div className="max-w-[1200px] mx-auto px-8 lg:px-14 flex flex-col md:flex-row items-center justify-between gap-4">
            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 18, color: C.text, letterSpacing: "-0.01em" }}>
              Seam<span style={{ color: C.sage }}>·</span>
            </span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.12em" }}>STEALTH-POWERED BY HYPERBROWSER</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }}>© 2026 SEAM</span>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}
