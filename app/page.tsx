"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import SmoothScroll from "./components/SmoothScroll";

/* ─── TOKENS — dark warm, sage accent, hyperbrowser-style ─── */
const C = {
  bg:         "#0A0908",
  bgHi:       "#0F0E0C",
  surface:    "#141210",
  surfaceHi:  "#1A1816",
  bevelTop:   "rgba(255,255,255,0.07)",
  bevelMid:   "rgba(255,255,255,0.02)",
  bevelBot:   "rgba(255,255,255,0.00)",
  border:     "#2A2622",
  borderHi:   "#3A352F",
  text:       "#F4EFE4",
  textHi:     "#FFFFFF",
  muted:      "#8A8174",
  dim:        "#5A5248",
  faint:      "#3A332D",
  sage:       "#7EA88A",
  sageHi:     "#94BD9E",
  sageGlow:   "rgba(126,168,138,0.18)",
  sageDim:    "rgba(126,168,138,0.10)",
  indigo:     "#8B90C8",
  indigoDim:  "rgba(139,144,200,0.10)",
  gold:       "#C9A96E",
  goldDim:    "rgba(201,169,110,0.10)",
};

const SF    = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "'Bodoni Moda', Georgia, serif";
const MONO  = "var(--font-geist-mono), 'Geist Mono', 'SF Mono', monospace";
const E     = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ─── DATA — pack accents match DESIGN.md + app page ─── */
const FEATURES = [
  {
    id: "sdr", n: "01", label: "SDR Pack",
    color: C.gold,
    icon: "▣",
    title: "Outbound that closes.",
    body: "Pricing model, decision-makers, named logos, buying intent. Cold-call context extracted from any domain in sixty seconds.",
    tags: ["</> Pricing model", "◎ Decision-makers", "✦ Named logos", "↗ Buying intent", "✉ Cold-call ready"],
    sample: "stripe.com → 8 people · sales-led · 40 markets",
  },
  {
    id: "recruiter", n: "02", label: "Recruiter Pack",
    color: C.indigo,
    icon: "◫",
    title: "Read the org.",
    body: "Open roles, tech stack inferred from job posts, hiring velocity, eng leaders by name. Know the team before the call.",
    tags: ["⌘ Open roles", "{ } Tech stack", "↑ Velocity", "◉ Eng leaders", "$ Comp signals"],
    sample: "linear.app → 12 roles · TS+Rust · CTO named",
  },
  {
    id: "vc", n: "03", label: "VC Pack",
    color: C.sage,
    icon: "◈",
    title: "Diligence in a minute.",
    body: "Funding stage, named investors, traction signals, founder backgrounds, market expansion. Investment-grade signals at speed.",
    tags: ["$ Funding", "◆ Investors", "↗ Traction", "★ Founders", "≈ Comps"],
    sample: "vercel.com → Series C · $150M · 3 founders",
  },
  {
    id: "mcp", n: "04", label: "MCP Native",
    color: C.sage,
    icon: "✦",
    title: "Lives in Claude.",
    body: "JSON-RPC 2.0 MCP server. Add the config block once, then call enrich_companies inline from Claude or Cursor. No tab-switching.",
    tags: ["◇ MCP server", "→ enrich_companies()", "→ list_packs()", "✦ Claude + Cursor", "⌁ Stdio bridge"],
    sample: "> extract stripe.com with the SDR pack",
  },
];

const STEPS = [
  { n: "01", title: "Paste up to ten domains.", body: "No signup, no API key. Comma-separated domain list, that's it." },
  { n: "02", title: "Pick a pack.", body: "SDR, Recruiter, or VC. The pack reshapes which signals surface and how the CSV exports." },
  { n: "03", title: "Watch the seam open.", body: "Real-time stream from a Hyperbrowser stealth session. Export CSV or pipe to Claude via MCP." },
];

const MARQUEE = [
  "stripe.com", "linear.app", "vercel.com", "notion.so", "figma.com",
  "resend.com", "supabase.com", "posthog.com", "clerk.com", "browserbase.com",
];

type Line = { t: "cmd"|"status"|"key"|"val"|"sig"|"gap"|"done"; s: string };

const DEMOS: { domain: string; pack: string; color: string; lines: Line[] }[] = [
  {
    domain: "stripe.com", pack: "SDR", color: C.gold,
    lines: [
      { t:"cmd",    s:"$ seam enrich stripe.com --pack sdr" },
      { t:"status", s:"opening stealth session..." },
      { t:"gap",    s:"" },
      { t:"key",    s:"COMPANY" },
      { t:"val",    s:"Stripe — payments infra for the internet" },
      { t:"key",    s:"PRICING" },
      { t:"val",    s:"sales-led · enterprise · self-serve SMB" },
      { t:"gap",    s:"" },
      { t:"key",    s:"BUYING SIGNALS" },
      { t:"sig",    s:"· 'Talk to sales' on enterprise tiers" },
      { t:"sig",    s:"· Launched 40+ new markets last quarter" },
      { t:"sig",    s:"· API-first → dev champion at every account" },
      { t:"gap",    s:"" },
      { t:"key",    s:"PEOPLE" },
      { t:"val",    s:"8 found · Patrick Collison +7" },
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
      { t:"val",    s:"TypeScript, Rust, PostgreSQL, K8s" },
      { t:"gap",    s:"" },
      { t:"key",    s:"HIRING SIGNALS" },
      { t:"sig",    s:"· 8 senior eng roles → rapid expansion" },
      { t:"sig",    s:"· Hiring Rust infra → platform rewrite" },
      { t:"sig",    s:"· Berlin + SF both actively hiring" },
      { t:"gap",    s:"" },
      { t:"key",    s:"ENG LEADERS" },
      { t:"val",    s:"4 found · Tuomas Artman (CTO) +3" },
      { t:"done",   s:"✓  extracted in 44s" },
    ],
  },
  {
    domain: "vercel.com", pack: "VC", color: C.sage,
    lines: [
      { t:"cmd",    s:"$ seam enrich vercel.com --pack vc" },
      { t:"status", s:"opening stealth session..." },
      { t:"gap",    s:"" },
      { t:"key",    s:"FUNDING" },
      { t:"val",    s:"Series C · $150M · Tiger, Bedrock, GV" },
      { t:"key",    s:"TRACTION" },
      { t:"val",    s:"10,000+ paying teams · 10× YoY revenue" },
      { t:"gap",    s:"" },
      { t:"key",    s:"INVESTMENT SIGNALS" },
      { t:"sig",    s:"· Ex-Google/Meta founders" },
      { t:"sig",    s:"· ARR $100M+ implied by valuation" },
      { t:"sig",    s:"· Shopify + Loom partnerships" },
      { t:"gap",    s:"" },
      { t:"key",    s:"FOUNDERS" },
      { t:"val",    s:"3 found · Guillermo Rauch (CEO)" },
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

/* ASCII globe — used as CTA background, hyperbrowser-style */
const ASCII_GLOBE = `
                    .........
              ..::-=+*+++=:.....
          ..-=+##*+****=---:....
       ..=+##*+:-+***#=:::.::-:..
     .:=*##+:::-====+++=---::::-:.
   .-+##+::-=+****####****+=---::-:
  .=##*-:-=*###%%%%%%%%###**+=----.
 .+#*-::=*###%%%%%%%%%%%###**+=---:.
.=#*-::=*###%%%%%%%%%%%%%###**+=---:.
:#*-::=*###%%%%%%%%%%%%%%%###**+=---:
=*-::=*####%%%%%%%%%%%%%%%%###*+=----
*-::=*####%%%%@@@@@%%%%%%%%###*+=----
::-=*####%%%@@@@@@@@@%%%%%%###*+=----
::=*####%%%@@@@@@@@@@@%%%%%###**=----
:-+####%%%%@@@@@@@@@@%%%%%####*+----:
:=*###%%%%%%@@@@@@@@%%%%%%####*=----:
:=*####%%%%%%%%%%%%%%%%%%%###*+=---:.
.=*####%%%%%%%%%%%%%%%%%%###*+=----.
 :=*####%%%%%%%%%%%%%%%%###*+=---:.
  :=+####%%%%%%%%%%%%%%###*+=----.
   .-+####%%%%%%%%%%%%###*+=----.
    .-=*####%%%%%%%###**+=----.
      .-=+*####****+=====---.
         .::-=+++++===---:.
            ......::::..
`;

/* ─── COMPONENTS ─── */

function Grain() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 150, opacity: 0.045, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </div>
  );
}

/* Beveled outer frame with corner brackets — hyperbrowser aesthetic */
function BeveledCard({
  children, accent = C.sage, n, className = "",
}: { children: React.ReactNode; accent?: string; n?: string; className?: string }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        borderRadius: 14,
        padding: 12,
        background: `linear-gradient(155deg, ${C.bevelTop} 0%, ${C.bevelMid} 35%, ${C.bevelBot} 100%), ${C.bgHi}`,
        border: `1px solid ${C.border}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}>
      {/* corner brackets */}
      <Bracket pos="tl" />
      <Bracket pos="tr" />
      <Bracket pos="bl" />
      <Bracket pos="br" />
      {/* inner card */}
      <div className="relative h-full" style={{
        background: C.surface,
        borderRadius: 8,
        border: `1px solid ${C.border}`,
      }}>
        {n && (
          <span className="absolute top-3 right-4" style={{ fontFamily: MONO, fontSize: 10, color: C.dim, letterSpacing: "0.1em" }}>{n}</span>
        )}
        {children}
      </div>
    </div>
  );
}

function Bracket({ pos }: { pos: "tl"|"tr"|"bl"|"br" }) {
  const size = 9;
  const stroke = C.dim;
  const w = 1;
  const inset = 4;
  const map = {
    tl: { top: inset, left: inset, borderTop: `${w}px solid ${stroke}`, borderLeft: `${w}px solid ${stroke}` },
    tr: { top: inset, right: inset, borderTop: `${w}px solid ${stroke}`, borderRight: `${w}px solid ${stroke}` },
    bl: { bottom: inset, left: inset, borderBottom: `${w}px solid ${stroke}`, borderLeft: `${w}px solid ${stroke}` },
    br: { bottom: inset, right: inset, borderBottom: `${w}px solid ${stroke}`, borderRight: `${w}px solid ${stroke}` },
  };
  return <div className="absolute pointer-events-none" style={{ width: size, height: size, ...map[pos] }} />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: copied ? C.sage : C.dim, padding: "4px 0", background: "transparent", cursor: "pointer", transition: "color 0.2s", border: "none" }}>
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
      const d = count === 0 ? 600 : demo.lines[count - 1]?.t === "gap" ? 60 : 140;
      t = setTimeout(() => setCount(c => c + 1), d);
    } else {
      t = setTimeout(() => { setIdx(i => (i + 1) % DEMOS.length); setCount(0); }, 3200);
    }
    return () => clearTimeout(t);
  }, [count, demo.lines.length]);

  const lc = (l: Line) => l.t === "sig" ? demo.color : l.t === "done" ? C.sage : l.t === "val" ? C.text : C.dim;

  return (
    <BeveledCard>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2">
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: C.sage }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.16em" }}>SEAM · LIVE</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.span key={demo.pack} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}
            style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: demo.color }}>
            {demo.pack.toUpperCase()}
          </motion.span>
        </AnimatePresence>
      </div>
      <div style={{ minHeight: 340, padding: "20px 24px", fontFamily: MONO, fontSize: 11, lineHeight: 1.75 }}>
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {demo.lines.slice(0, count).map((line, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -3 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.12 }}
                style={{ color: lc(line), fontSize: line.t === "key" ? 9 : 11, letterSpacing: line.t === "key" ? "0.18em" : "0.01em", marginTop: line.t === "key" ? 12 : 0, height: line.t === "gap" ? 4 : "auto", fontWeight: line.t === "done" ? 500 : 400 }}>
                {line.t !== "gap" && line.s}
                {i === count - 1 && count < demo.lines.length && line.t !== "gap" && (
                  <motion.span style={{ color: C.sage }} animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>▋</motion.span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: `1px solid ${C.border}` }}>
        <AnimatePresence mode="wait">
          <motion.span key={demo.domain} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }}>{demo.domain}</motion.span>
        </AnimatePresence>
        {count > 0 && count < demo.lines.length ? (
          <motion.div className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.span className="w-1 h-1 rounded-full" style={{ background: C.sage }} animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.sage, letterSpacing: "0.16em" }}>EXTRACTING</span>
          </motion.div>
        ) : count >= demo.lines.length ? (
          <span style={{ fontFamily: MONO, fontSize: 9, color: C.sage, letterSpacing: "0.16em" }}>COMPLETE</span>
        ) : null}
      </div>
    </BeveledCard>
  );
}

/* Pill button — login/signup style from hyperbrowser ref. 44px touch target via padding. */
function PillButton({
  children, primary, href, onClick,
}: { children: React.ReactNode; primary?: boolean; href?: string; onClick?: () => void }) {
  const base = {
    fontFamily: SF, fontSize: 13, fontWeight: 600,
    padding: "13px 24px", borderRadius: 999, textDecoration: "none",
    letterSpacing: "0.02em", textTransform: "uppercase" as const,
    transition: "background 0.18s, color 0.18s, transform 0.15s",
    display: "inline-flex", alignItems: "center", gap: 8, lineHeight: 1,
    cursor: "pointer", border: "none", minHeight: 44,
  };
  const styles = primary
    ? { ...base, background: C.text, color: C.bg }
    : { ...base, background: C.surfaceHi, color: C.text, border: `1px solid ${C.border}` };
  const Comp = href ? "a" : "button";
  return (
    <Comp href={href} onClick={onClick}
      style={styles}
      onMouseEnter={e => {
        if (primary) (e.currentTarget as HTMLElement).style.background = C.sageHi;
        else { (e.currentTarget as HTMLElement).style.background = C.surface; (e.currentTarget as HTMLElement).style.color = C.textHi; }
      }}
      onMouseLeave={e => {
        if (primary) (e.currentTarget as HTMLElement).style.background = C.text;
        else { (e.currentTarget as HTMLElement).style.background = C.surfaceHi; (e.currentTarget as HTMLElement).style.color = C.text; }
      }}>
      {children}
    </Comp>
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
      <div style={{ fontFamily: SF, background: C.bg, color: C.text }} className="min-h-screen overflow-x-hidden">
        <Grain />

        <motion.div className="fixed top-0 left-0 right-0 h-[2px] origin-left" style={{ zIndex: 60, scaleX, background: C.sage }} />

        {/* ── NAV ── */}
        <motion.nav className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-10 flex items-center justify-between"
          style={{ height: 64 }}
          animate={{
            background: scrolled ? "rgba(10,9,8,0.85)" : "rgba(10,9,8,0)",
            backdropFilter: scrolled ? "blur(16px)" : "blur(0px)",
            borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
            y: navVisible ? 0 : -70,
          }}
          transition={{ duration: 0.25, ease: E }}>

          <a href="/" className="flex items-baseline gap-1" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 24, color: C.text, letterSpacing: "-0.01em", fontWeight: 400 }}>Seam</span>
            <span style={{ color: C.sage, fontSize: 12, fontWeight: 700 }}>·</span>
          </a>

          <div className="hidden md:flex items-center gap-9">
            {[["packs","Packs"],["process","Process"],["mcp","MCP"]].map(([id,label]) => (
              <a key={id} href={`#${id}`}
                style={{ fontFamily: SF, fontSize: 13, fontWeight: 500, color: C.muted, textDecoration: "none", transition: "color 0.15s", letterSpacing: "0.01em" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>{label}</a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <PillButton href="https://github.com/anthropics" >Docs</PillButton>
            <PillButton primary href="/app">Open app</PillButton>
          </div>
        </motion.nav>

        {/* ── HERO ── */}
        <section className="relative pt-32 pb-20" style={{ background: C.bg }}>
          <div className="max-w-[1320px] mx-auto px-6 lg:px-10">

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-10"
              style={{ background: C.sageDim, border: `1px solid ${C.sage}30`, borderRadius: 999, padding: "5px 12px 5px 10px" }}>
              <motion.div style={{ width: 6, height: 6, borderRadius: "50%", background: C.sage }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.sage, letterSpacing: "0.18em" }}>STEALTH SESSION ONLINE</span>
            </motion.div>

            <div className="grid grid-cols-12 gap-6 lg:gap-10 items-end">
              <div className="col-span-12 lg:col-span-7">
                <div className="overflow-hidden">
                  <motion.h1 initial={{ y: "101%" }} animate={{ y: "0%" }} transition={{ duration: 0.95, delay: 0.3, ease: E }}
                    style={{ fontFamily: SF, fontWeight: 700, fontSize: "clamp(56px,8vw,128px)", letterSpacing: "-0.045em", lineHeight: 0.92, color: C.text }}>
                    Find the
                  </motion.h1>
                </div>
                <div className="overflow-hidden">
                  <motion.h1 initial={{ y: "101%" }} animate={{ y: "0%" }} transition={{ duration: 0.95, delay: 0.4, ease: E }}
                    style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(64px,9vw,144px)", letterSpacing: "-0.035em", lineHeight: 0.92, color: C.text, marginTop: -2 }}>
                    seam<span style={{ color: C.sage, fontStyle: "normal" }}>.</span>
                  </motion.h1>
                </div>
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                  style={{ fontFamily: SF, fontSize: 18, color: C.muted, lineHeight: 1.55, maxWidth: "44ch", marginTop: 28 }}>
                  Paste domains. Pick a pack. A stealth Hyperbrowser session opens, signals stream back, and you have what you need in under a minute.
                </motion.p>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
                  className="flex items-center gap-3 mt-9">
                  <PillButton primary href="/app">Start extracting →</PillButton>
                  <PillButton href="#packs">See the packs</PillButton>
                </motion.div>
              </div>

              <div className="col-span-12 lg:col-span-5">
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.55, ease: E }}>
                  <Terminal />
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div className="overflow-hidden py-5" style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.bgHi }}>
          <motion.div className="flex gap-12 whitespace-nowrap" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }}>
            {[...MARQUEE, ...MARQUEE, ...MARQUEE].map((d, i) => (
              <span key={i} className="inline-flex items-center gap-12 shrink-0">
                <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 22, color: C.muted, letterSpacing: "-0.01em" }}>{d}</span>
                <span style={{ color: C.sage, fontSize: 5 }}>◆</span>
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── PACKS — hyperbrowser-style 2x2 beveled cards ── */}
        <section id="packs" className="pt-28 pb-24">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
            <div className="flex items-baseline justify-between mb-16 flex-wrap gap-4">
              <h2 style={{ fontFamily: SF, fontWeight: 700, fontSize: "clamp(40px,5vw,72px)", letterSpacing: "-0.035em", lineHeight: 1, color: C.text }}>
                Packs
              </h2>
              <div className="flex items-center gap-7">
                {[["gold", "SDR"], ["indigo", "Recruiter"], ["sage", "VC"], ["sage", "MCP"]].map(([k, label]) => (
                  <div key={label} className="flex items-center gap-2">
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: k === "sage" ? C.sage : k === "indigo" ? C.indigo : C.gold }} />
                    <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted, letterSpacing: "0.06em" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FEATURES.map((f, i) => (
                <motion.div key={f.id}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.6, delay: (i % 2) * 0.08, ease: E }}>
                  <BeveledCard accent={f.color} n={f.n}>
                    <div className="p-7 lg:p-8 h-full flex flex-col">
                      {/* icon square */}
                      <div className="flex items-center justify-between mb-5">
                        <div style={{ width: 40, height: 40, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surfaceHi, display: "flex", alignItems: "center", justifyContent: "center", color: f.color, fontSize: 18 }}>
                          {f.icon}
                        </div>
                        <span style={{ fontFamily: MONO, fontSize: 9, color: f.color, letterSpacing: "0.16em" }}>{f.label.toUpperCase()}</span>
                      </div>

                      <h3 style={{ fontFamily: SF, fontWeight: 700, fontSize: 30, color: C.textHi, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 14 }}>
                        {f.title}
                      </h3>
                      <p style={{ fontFamily: SF, fontSize: 15, color: C.muted, lineHeight: 1.65, marginBottom: 24 }}>
                        {f.body}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-5">
                        {f.tags.map(tag => (
                          <span key={tag} style={{
                            fontFamily: MONO, fontSize: 11, color: C.text,
                            background: C.surfaceHi, border: `1px solid ${C.border}`,
                            borderRadius: 6, padding: "5px 10px", letterSpacing: "0.02em",
                          }}>{tag}</span>
                        ))}
                      </div>

                      <div className="mt-auto pt-4" style={{ borderTop: `1px dashed ${C.border}` }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim, letterSpacing: "0.12em" }}>SAMPLE</span>
                        <div style={{ fontFamily: MONO, fontSize: 12, color: C.text, marginTop: 4 }}>{f.sample}</div>
                      </div>
                    </div>
                  </BeveledCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROCESS ── */}
        <section id="process" className="pt-12 pb-24" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="max-w-[1320px] mx-auto px-6 lg:px-10 pt-20">
            <div className="grid grid-cols-12 gap-6 mb-14">
              <div className="col-span-12 lg:col-span-5">
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: "0.22em" }}>§ PROCESS</span>
                <h2 className="mt-3" style={{ fontFamily: SF, fontWeight: 700, fontSize: "clamp(40px,5vw,72px)", letterSpacing: "-0.035em", lineHeight: 1, color: C.text }}>
                  Three steps.<br /><span style={{ color: C.sage }}>Sixty seconds.</span>
                </h2>
              </div>
              <div className="col-span-12 lg:col-span-7 lg:pt-12">
                <p style={{ fontFamily: SF, fontSize: 17, color: C.muted, lineHeight: 1.65, maxWidth: "52ch" }}>
                  No setup, no API keys, no waiting on a sales rep. Open the app, drop in a list of domains, pick a pack, and watch the seam open.
                </p>
              </div>
            </div>

            <ol className="space-y-0">
              {STEPS.map((s, i) => (
                <motion.li key={s.n}
                  initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.06, ease: E }}
                  className="grid grid-cols-12 gap-6 py-10 lg:py-12 items-baseline"
                  style={{ borderTop: `1px solid ${C.border}`, listStyle: "none" }}>
                  <div className="col-span-3 lg:col-span-2">
                    <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(48px,7vw,108px)", color: C.sage, lineHeight: 0.85, letterSpacing: "-0.03em", fontWeight: 400 }}>
                      {s.n}
                    </span>
                  </div>
                  <div className="col-span-9 lg:col-span-6">
                    <h3 style={{ fontFamily: SF, fontWeight: 700, fontSize: "clamp(24px,3vw,38px)", color: C.textHi, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
                      {s.title}
                    </h3>
                  </div>
                  <div className="col-span-12 lg:col-span-4 lg:pt-2">
                    <p style={{ fontFamily: SF, fontSize: 15, color: C.muted, lineHeight: 1.7 }}>{s.body}</p>
                  </div>
                </motion.li>
              ))}
              <li style={{ borderTop: `1px solid ${C.border}`, listStyle: "none" }} />
            </ol>
          </div>
        </section>

        {/* ── MCP ── */}
        <section id="mcp" className="py-24" style={{ borderTop: `1px solid ${C.border}`, background: C.bgHi }}>
          <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-12 gap-6 mb-14">
              <div className="col-span-12 lg:col-span-7">
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: "0.22em" }}>§ MCP NATIVE</span>
                <h2 className="mt-3" style={{ fontFamily: SF, fontWeight: 700, fontSize: "clamp(40px,5vw,72px)", letterSpacing: "-0.035em", lineHeight: 1, color: C.text }}>
                  Lives inside <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, color: C.indigo }}>Claude.</span>
                </h2>
                <p style={{ fontFamily: SF, fontSize: 17, color: C.muted, lineHeight: 1.65, maxWidth: "52ch", marginTop: 22 }}>
                  Seam ships as a JSON-RPC 2.0 MCP server. Add the config block, then ask Claude in plain English. No copy-paste from one tab to another.
                </p>
              </div>
              <div className="col-span-12 lg:col-span-5 lg:pt-12">
                <div style={{ fontFamily: MONO, fontSize: 10, color: C.dim, letterSpacing: "0.18em", marginBottom: 14 }}>EXPOSED TOOLS</div>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-3">
                    <span style={{ fontFamily: MONO, fontSize: 9, color: C.indigo, background: C.indigoDim, border: `1px solid ${C.indigo}30`, borderRadius: 4, padding: "3px 8px", letterSpacing: "0.12em" }}>TOOL</span>
                    <code style={{ fontFamily: MONO, fontSize: 13, color: C.text }}>enrich_companies(<span style={{ color: C.sage }}>domains</span>, <span style={{ color: C.sage }}>pack</span>)</code>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span style={{ fontFamily: MONO, fontSize: 9, color: C.indigo, background: C.indigoDim, border: `1px solid ${C.indigo}30`, borderRadius: 4, padding: "3px 8px", letterSpacing: "0.12em" }}>TOOL</span>
                    <code style={{ fontFamily: MONO, fontSize: 13, color: C.text }}>list_packs()</code>
                  </div>
                </div>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7, ease: E }}>
              <BeveledCard>
                <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.16em" }}>~/.config/claude/claude_desktop_config.json</span>
                  <CopyButton text={MCP_CONFIG} />
                </div>
                <pre style={{ fontFamily: MONO, fontSize: 13, lineHeight: 1.85, color: C.muted, padding: "24px 28px", margin: 0 }}>
                  <span style={{ color: C.dim }}>{"{"}</span>{"\n"}
                  {"  "}<span style={{ color: C.indigo }}>&quot;mcpServers&quot;</span><span style={{ color: C.dim }}>: {"{"}</span>{"\n"}
                  {"    "}<span style={{ color: C.indigo }}>&quot;seam&quot;</span><span style={{ color: C.dim }}>: {"{"}</span>{"\n"}
                  {"      "}<span style={{ color: C.gold }}>&quot;command&quot;</span><span style={{ color: C.dim }}>:</span>{" "}<span style={{ color: C.sage }}>&quot;npx&quot;</span><span style={{ color: C.dim }}>,</span>{"\n"}
                  {"      "}<span style={{ color: C.gold }}>&quot;args&quot;</span><span style={{ color: C.dim }}>: [</span>{"\n"}
                  {"        "}<span style={{ color: C.sage }}>&quot;mcp-remote&quot;</span><span style={{ color: C.dim }}>,</span>{"\n"}
                  {"        "}<span style={{ color: C.sage }}>&quot;https://jstack-omega.vercel.app/api/mcp&quot;</span>{"\n"}
                  {"      "}<span style={{ color: C.dim }}>]</span>{"\n"}
                  {"    "}<span style={{ color: C.dim }}>{"}"}</span>{"\n"}
                  {"  "}<span style={{ color: C.dim }}>{"}"}</span>{"\n"}
                  <span style={{ color: C.dim }}>{"}"}</span>
                </pre>
                <div className="px-5 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.16em", marginBottom: 6 }}>THEN ASK CLAUDE</div>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: C.sage }}>&gt; extract stripe.com and linear.app with the SDR pack</div>
                </div>
              </BeveledCard>
            </motion.div>
          </div>
        </section>

        {/* ── CTA — ASCII globe background ── */}
        <section className="relative overflow-hidden py-32 lg:py-40" style={{ borderTop: `1px solid ${C.border}` }}>
          {/* ASCII globe */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <pre aria-hidden style={{
              fontFamily: MONO, fontSize: "clamp(7px, 0.9vw, 11px)",
              lineHeight: 1, color: C.faint, opacity: 0.7,
              whiteSpace: "pre", textAlign: "center",
              transform: "translateY(-5%)",
            }}>{ASCII_GLOBE}</pre>
          </div>

          <div className="relative max-w-[1320px] mx-auto px-6 lg:px-10">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-8"
              style={{ background: C.sageDim, border: `1px solid ${C.sage}30`, borderRadius: 999, padding: "5px 12px 5px 10px" }}>
              <motion.div style={{ width: 6, height: 6, borderRadius: "50%", background: C.sage }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.sage, letterSpacing: "0.18em" }}>INFRASTRUCTURE ONLINE</span>
            </motion.div>

            <div className="overflow-hidden">
              <motion.h2 initial={{ y: "100%" }} whileInView={{ y: "0%" }} viewport={{ once: true }}
                transition={{ duration: 0.95, ease: E }}
                style={{ fontFamily: SF, fontWeight: 700, fontSize: "clamp(56px,9vw,140px)", letterSpacing: "-0.045em", lineHeight: 0.92, color: C.textHi }}>
                Ready to scrape?
              </motion.h2>
            </div>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              style={{ fontFamily: SF, fontSize: 18, color: C.muted, lineHeight: 1.55, maxWidth: "44ch", marginTop: 24 }}>
              Stealth-powered B2B intelligence. Three packs. Sixty seconds. No signup.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.45 }}
              className="mt-9">
              <PillButton primary href="/app">Start for free →</PillButton>
            </motion.div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="py-10" style={{ borderTop: `1px solid ${C.border}`, background: C.bgHi }}>
          <div className="max-w-[1320px] mx-auto px-6 lg:px-10 grid grid-cols-12 gap-6 items-baseline">
            <div className="col-span-6 lg:col-span-3">
              <a href="/" className="flex items-baseline gap-1" style={{ textDecoration: "none" }}>
                <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 22, color: C.text, letterSpacing: "-0.01em" }}>Seam</span>
                <span style={{ color: C.sage, fontSize: 11 }}>·</span>
              </a>
            </div>
            <div className="col-span-6 lg:col-span-3 text-right lg:text-left">
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim, letterSpacing: "0.16em" }}>STEALTH-POWERED BY HYPERBROWSER</span>
            </div>
            <div className="col-span-6 lg:col-span-3 hidden lg:block">
              <span style={{ fontFamily: SF, fontSize: 12, color: C.muted, fontStyle: "italic" }}>Intelligence runs deep.</span>
            </div>
            <div className="col-span-6 lg:col-span-3 text-right">
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim, letterSpacing: "0.14em" }}>© 2026 SEAM</span>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}
