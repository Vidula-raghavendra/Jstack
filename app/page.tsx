"use client";

import Link from "next/link";
import { useRef, useEffect, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";
import SmoothScroll from "./components/SmoothScroll";

/* ─── tokens ─── */
const C = {
  bg:      "#09080A",
  surface: "#0F0D10",
  border:  "#1C1A22",
  text:    "#EDE8DF",
  muted:   "#5C5668",
  dim:     "#2E2B38",
  amber:   "#E8A020",
  indigo:  "#7C83E8",
  green:   "#34C48A",
  red:     "#F87171",
};
const E = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ─────────────────────── CURSOR ─────────────────────── */
function Cursor() {
  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);
  const rx = useMotionValue(-200);
  const ry = useMotionValue(-200);
  const sx = useSpring(mx, { stiffness: 500, damping: 45 });
  const sy = useSpring(my, { stiffness: 500, damping: 45 });
  const lagX = useSpring(rx, { stiffness: 90, damping: 22 });
  const lagY = useSpring(ry, { stiffness: 90, damping: 22 });
  const [big, setBig] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); rx.set(e.clientX); ry.set(e.clientY); };
    const on   = (e: MouseEvent) => { if ((e.target as Element).closest("a,button")) setBig(true); };
    const off  = (e: MouseEvent) => { if ((e.target as Element).closest("a,button")) setBig(false); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", on);
    window.addEventListener("mouseout", off);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseover", on); window.removeEventListener("mouseout", off); };
  }, [mx, my, rx, ry]);

  return (
    <>
      <motion.div className="fixed top-0 left-0 pointer-events-none z-[500] mix-blend-difference rounded-full bg-[#EDE8DF]"
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
        animate={{ width: big ? 48 : 9, height: big ? 48 : 9 }}
        transition={{ duration: 0.22, ease: E }}
      />
      <motion.div className="fixed top-0 left-0 pointer-events-none z-[499] rounded-full"
        style={{ x: lagX, y: lagY, translateX: "-50%", translateY: "-50%", width: 38, height: 38, border: `1px solid ${C.amber}50` }}
      />
    </>
  );
}

/* ─────────────────────── GRAIN ─────────────────────── */
function Grain() {
  return (
    <div className="fixed inset-0 z-[150] pointer-events-none" style={{ opacity: 0.04 }}>
      <svg width="100%" height="100%">
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </div>
  );
}

/* ─────────────────────── SCRAMBLE TEXT ─────────────────────── */
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$▓░▒";
function ScrambleText({ text, trigger, className, style }: { text: string; trigger: boolean; className?: string; style?: React.CSSProperties }) {
  const [disp, setDisp] = useState(() => text.replace(/[^ ]/g, "█"));
  useEffect(() => {
    if (!trigger) return;
    let iter = 0;
    const iv = setInterval(() => {
      setDisp(text.split("").map((ch, i) => {
        if (ch === " ") return " ";
        if (i < iter) return text[i];
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join(""));
      iter += 0.55;
      if (iter > text.length) { setDisp(text); clearInterval(iv); }
    }, 32);
    return () => clearInterval(iv);
  }, [trigger, text]);
  return <span className={className} style={style}>{disp}</span>;
}

/* ─────────────────────── MAGNETIC BUTTON ─────────────────────── */
function MagneticCTA({ href, children, dark = false }: { href: string; children: React.ReactNode; dark?: boolean }) {
  const bx = useMotionValue(0);
  const by = useMotionValue(0);
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const sbx = useSpring(bx, { stiffness: 200, damping: 18 });
  const sby = useSpring(by, { stiffness: 200, damping: 18 });
  const stx = useSpring(tx, { stiffness: 200, damping: 18 });
  const sty = useSpring(ty, { stiffness: 200, damping: 18 });

  const onMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    bx.set(dx * 0.35); by.set(dy * 0.35);
    tx.set(dx * 0.14); ty.set(dy * 0.14);
  }, [bx, by, tx, ty]);
  const onLeave = useCallback(() => { bx.set(0); by.set(0); tx.set(0); ty.set(0); }, [bx, by, tx, ty]);

  return (
    <motion.a
      href={href}
      style={{ x: sbx, y: sby, display: "inline-block" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={{ scale: 0.96 }}
      className="rounded-xl overflow-hidden"
    >
      <motion.span
        style={{
          x: stx, y: sty, display: "block",
          background: dark ? "transparent" : C.amber,
          color: dark ? C.muted : "#09080A",
          fontFamily: "'Satoshi', sans-serif", fontWeight: 800,
          fontSize: 14, letterSpacing: "-0.01em",
          padding: "14px 36px", borderRadius: 12,
          border: dark ? `1px solid ${C.border}` : "none",
          transition: "box-shadow 0.3s",
        }}
        whileHover={dark ? { color: C.text } : { boxShadow: `0 28px 72px rgba(232,160,32,0.55)` }}
      >
        {children}
      </motion.span>
    </motion.a>
  );
}

/* ─────────────────────── TILT CARD ─────────────────────── */
function TiltCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotX = useTransform(py, [0, 1], [10, -10]);
  const rotY = useTransform(px, [0, 1], [-10, 10]);
  const glowX = useTransform(px, [0, 1], ["0%", "100%"]);
  const glowY = useTransform(py, [0, 1], ["0%", "100%"]);
  const sRotX = useSpring(rotX, { stiffness: 150, damping: 20 });
  const sRotY = useSpring(rotY, { stiffness: 150, damping: 20 });
  const [hov, setHov] = useState(false);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }, [px, py]);
  const onLeave = useCallback(() => { px.set(0.5); py.set(0.5); setHov(false); }, [px, py]);

  return (
    <motion.div
      className={className}
      style={{ rotateX: sRotX, rotateY: sRotY, transformPerspective: 900, ...style }}
      onMouseMove={onMove}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={onLeave}
    >
      {/* glow spot */}
      {hov && (
        <motion.div className="absolute inset-0 rounded-2xl pointer-events-none z-10 opacity-20"
          style={{ background: `radial-gradient(circle at ${glowX.get()} ${glowY.get()}, ${C.amber}, transparent 60%)` }}
        />
      )}
      {children}
    </motion.div>
  );
}

/* ─────────────────────── 3D WORD REVEAL ─────────────────────── */
function WordReveal3D({ text, className = "", delay = 0, style }: { text: string; className?: string; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  return (
    <div ref={ref} className={className} style={{ perspective: "900px", ...style }} aria-label={text}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.22em] last:mr-0">
          <motion.span
            className="inline-block"
            initial={{ y: "115%", rotateX: -80, opacity: 0 }}
            animate={inView ? { y: "0%", rotateX: 0, opacity: 1 } : {}}
            transition={{ duration: 0.85, delay: delay + i * 0.085, ease: E }}
            style={{ transformOrigin: "bottom center" }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </div>
  );
}

/* ─────────────────────── VELOCITY BARS ─────────────────────── */
function VelBars({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex items-end gap-[3px]">
      {[1, 2, 3, 4].map(n => (
        <motion.div key={n} className="w-[3px] rounded-sm"
          style={{ background: n <= level ? color : C.dim }}
          initial={{ height: 0 }}
          animate={{ height: 3 + n * 3 }}
          transition={{ delay: n * 0.06, duration: 0.4, ease: E }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────── STAT COUNTER ─────────────────────── */
function useCounter(to: number, duration = 2.5) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const mv = useMotionValue(0);
  const spr = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const [val, setVal] = useState("0");
  useEffect(() => { if (inView) mv.set(to); }, [inView, mv, to]);
  useEffect(() => spr.on("change", v => setVal(String(Math.round(v)))), [spr]);
  return { ref, val };
}

/* ─────────────────────── LIVE TERMINAL ─────────────────────── */
const ENRICHMENTS = [
  { domain: "stripe.com", lines: [
    { t: 300,  txt: "→ fetching careers.stripe.com...", col: C.muted },
    { t: 800,  txt: "→ stealth session initialized", col: C.muted },
    { t: 1300, txt: "→ 47 job postings extracted", col: C.muted },
    { t: 1700, txt: "→ Claude AI parsing signals...", col: C.muted },
    { t: 2100, txt: `"hiring_velocity": "aggressive" ↑↑`, col: C.amber },
    { t: 2400, txt: `"open_roles": 47`, col: C.green },
    { t: 2650, txt: `"stack": ["Go","Ruby","k8s","Postgres"]`, col: C.indigo },
    { t: 2900, txt: `"signal": "Infra expansion +340%"`, col: C.text },
    { t: 3250, txt: "✓ enriched in 1.8s", col: C.green },
  ]},
  { domain: "linear.app", lines: [
    { t: 300,  txt: "→ fetching jobs.linear.app...", col: C.muted },
    { t: 800,  txt: "→ 12 postings found", col: C.muted },
    { t: 1200, txt: "→ Claude AI parsing signals...", col: C.muted },
    { t: 1700, txt: `"hiring_velocity": "steady" →`, col: C.indigo },
    { t: 2000, txt: `"open_roles": 12`, col: C.green },
    { t: 2300, txt: `"stack": ["TypeScript","Rust","SwiftUI"]`, col: C.indigo },
    { t: 2600, txt: `"signal": "Mobile team forming"`, col: C.text },
    { t: 3000, txt: "✓ enriched in 2.1s", col: C.green },
  ]},
  { domain: "vercel.com", lines: [
    { t: 300,  txt: "→ fetching vercel.com/careers...", col: C.muted },
    { t: 750,  txt: "→ 29 postings found", col: C.muted },
    { t: 1200, txt: "→ Claude AI parsing signals...", col: C.muted },
    { t: 1700, txt: `"hiring_velocity": "aggressive" ↑↑`, col: C.amber },
    { t: 2000, txt: `"open_roles": 29`, col: C.green },
    { t: 2300, txt: `"stack": ["Next.js","Go","Rust","C++"]`, col: C.indigo },
    { t: 2600, txt: `"signal": "Enterprise push — Q2"`, col: C.text },
    { t: 3000, txt: "✓ enriched in 1.4s", col: C.green },
  ]},
];

function LiveTerminal() {
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState<number[]>([]);
  const cur = ENRICHMENTS[idx];
  useEffect(() => {
    setVis([]);
    const ts = cur.lines.map((l, i) => setTimeout(() => setVis(p => [...p, i]), l.t));
    const last = cur.lines[cur.lines.length - 1].t;
    const reset = setTimeout(() => setIdx(p => (p + 1) % ENRICHMENTS.length), last + 2400);
    return () => { ts.forEach(clearTimeout); clearTimeout(reset); };
  }, [idx]);

  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="w-full"
    >
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "#0C0B0F", border: `1px solid ${C.border}`, fontFamily: "'Geist Mono', monospace",
          boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px ${C.border}, inset 0 1px 0 rgba(255,255,255,0.04)` }}>
        {/* title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="flex gap-1.5">
            {[C.red, "#FCD34D", C.green].map((col, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: col, opacity: 0.6 }} />
            ))}
          </div>
          <span style={{ color: C.muted, fontSize: 11 }} className="ml-2">prospectiq · enrichment engine</span>
          <div className="ml-auto flex items-center gap-2">
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }}
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }} />
            <span style={{ color: C.green, fontSize: 9 }} className="uppercase tracking-[0.15em]">live</span>
          </div>
        </div>
        {/* body */}
        <div className="p-5 min-h-[256px]">
          <div className="flex items-center gap-2 mb-5">
            <span style={{ color: C.amber, fontSize: 12 }}>$</span>
            <AnimatePresence mode="wait">
              <motion.span key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ color: C.text, fontSize: 12 }}>
                prospectiq enrich {cur.domain}
              </motion.span>
            </AnimatePresence>
            <motion.span style={{ color: C.amber, fontSize: 12 }} animate={{ opacity: [1, 0] }} transition={{ duration: 0.65, repeat: Infinity }}>▋</motion.span>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence>
              {cur.lines.map((line, i) =>
                vis.includes(i) ? (
                  <motion.div key={`${idx}-${i}`}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ color: line.col, fontSize: 11, lineHeight: 1.65 }}>
                    {line.txt}
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── TICKER ─────────────────────── */
const TICKS = [
  "stripe.com · Series H · 47 roles · AGGRESSIVE ↑",
  "linear.app · Series C · 12 roles · STEADY →",
  "vercel.com · Series D · 29 roles · AGGRESSIVE ↑",
  "notion.so · Series C · 18 roles · STEADY →",
  "figma.com · Series E · 31 roles · AGGRESSIVE ↑",
  "retool.com · Series C · 22 roles · STEADY →",
  "resend.com · Series A · 8 roles · AGGRESSIVE ↑",
  "clerk.dev · Series A · 14 roles · AGGRESSIVE ↑",
  "railway.app · Seed · 5 roles · STEADY →",
];
function Ticker() {
  const d = [...TICKS, ...TICKS];
  return (
    <div className="relative overflow-hidden border-y" style={{ borderColor: C.border, background: C.surface }}>
      <div className="py-3 flex overflow-hidden">
        <motion.div className="flex gap-10 whitespace-nowrap shrink-0"
          animate={{ x: ["0%", "-50%"] }} transition={{ duration: 38, repeat: Infinity, ease: "linear" }}>
          {d.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 shrink-0">
              <span style={{ color: C.amber, fontFamily: "'Geist Mono', monospace", fontSize: 8 }}>◆</span>
              <span style={{ color: C.muted, fontFamily: "'Geist Mono', monospace", fontSize: 11 }}>{item}</span>
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────────────── COMPANY CARD (big) ─────────────────────── */
function BigCompanyCard({ company }: { company: typeof COMPANIES[0] }) {
  return (
    <div className="h-full p-6 flex flex-col" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}` }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div style={{ fontFamily: "'Satoshi', sans-serif", color: C.text, fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em" }}>{company.name}</div>
          <div style={{ fontFamily: "'Geist Mono', monospace", color: C.muted, fontSize: 11 }}>{company.domain}</div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <VelBars level={company.vel} color={company.velColor} />
          <span style={{ color: company.velColor, fontFamily: "'Geist Mono', monospace", fontSize: 9 }} className="uppercase tracking-widest">{company.velLabel}</span>
        </div>
      </div>

      {/* big stat */}
      <div className="mb-6 p-5 rounded-xl" style={{ background: `${C.amber}0A`, border: `1px solid ${C.amber}18` }}>
        <div style={{ fontFamily: "'Satoshi', sans-serif", color: C.amber, fontSize: 52, fontWeight: 900, lineHeight: 1 }}>{company.roles}</div>
        <div style={{ fontFamily: "'Geist Mono', monospace", color: C.muted, fontSize: 10 }} className="uppercase tracking-widest mt-1">open roles</div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-5">
        {company.stack.map(s => (
          <span key={s} className="px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider"
            style={{ background: `${C.indigo}15`, color: C.indigo, fontFamily: "'Geist Mono', monospace" }}>{s}</span>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t" style={{ borderColor: C.border }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: C.dim, fontFamily: "'Geist Mono', monospace", fontSize: 9 }} className="uppercase tracking-widest">Key signal</span>
          <span style={{ color: C.dim, fontFamily: "'Geist Mono', monospace", fontSize: 10 }}>{company.stage}</span>
        </div>
        <span style={{ color: C.amber, fontSize: 13, fontFamily: "'Geist Mono', monospace" }}>· {company.signal}</span>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }}
          animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2.5, repeat: Infinity }} />
        <span style={{ color: C.green, fontFamily: "'Geist Mono', monospace", fontSize: 9 }} className="uppercase tracking-widest">enriched</span>
      </div>
    </div>
  );
}

function SmallCompanyCard({ company }: { company: typeof COMPANIES[0] }) {
  return (
    <div className="p-5 flex flex-col gap-3 flex-1" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontFamily: "'Satoshi', sans-serif", color: C.text, fontWeight: 700, fontSize: 16 }}>{company.name}</div>
          <div style={{ fontFamily: "'Geist Mono', monospace", color: C.muted, fontSize: 10 }}>{company.domain}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <VelBars level={company.vel} color={company.velColor} />
          <span style={{ color: company.velColor, fontFamily: "'Geist Mono', monospace", fontSize: 8 }} className="uppercase tracking-widest">{company.velLabel}</span>
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {company.stack.slice(0, 3).map(s => (
          <span key={s} className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider"
            style={{ background: `${C.indigo}12`, color: C.indigo, fontFamily: "'Geist Mono', monospace" }}>{s}</span>
        ))}
      </div>
      <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: C.border }}>
        <span style={{ color: C.amber, fontSize: 11, fontFamily: "'Geist Mono', monospace" }}>· {company.signal}</span>
        <span style={{ color: C.green, fontFamily: "'Geist Mono', monospace', fontSize: 12", fontWeight: 600 }}>{company.roles}</span>
      </div>
    </div>
  );
}

const COMPANIES = [
  { domain: "stripe.com", name: "Stripe", stage: "Series H", vel: 4, velColor: C.amber, velLabel: "Aggressive",
    stack: ["Go", "Ruby", "React", "k8s"], roles: 47, signal: "Infra expansion +340%" },
  { domain: "linear.app", name: "Linear", stage: "Series C", vel: 3, velColor: C.indigo, velLabel: "Steady",
    stack: ["TypeScript", "Rust", "SwiftUI"], roles: 12, signal: "Mobile team forming" },
  { domain: "vercel.com", name: "Vercel", stage: "Series D", vel: 4, velColor: C.amber, velLabel: "Aggressive",
    stack: ["Next.js", "Go", "Rust"], roles: 29, signal: "Enterprise push Q2" },
];

/* ─────────────────────── FEATURES ─────────────────────── */
const FEATURES = [
  { n: "01", title: "Stealth sessions", tag: "Anti-detection", body: "Each domain gets its own fingerprint-spoofed Hyperbrowser session. Greenhouse, Lever, Workday — we get through." },
  { n: "02", title: "AI-structured output", tag: "Claude AI", body: "Not a wall of HTML. Typed fields: tech stack inferred from requirements, velocity from role count, signals from copy." },
  { n: "03", title: "Live streaming", tag: "Real-time", body: "Results stream back as each domain resolves. Watch intelligence build in real time, not after a spinner." },
  { n: "04", title: "Export & history", tag: "Portability", body: "Every run saved locally. One-click CSV for your CRM, Notion, or spreadsheet." },
];

function FeatureRow({ n, title, tag, body, index }: typeof FEATURES[0] & { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const [hov, setHov] = useState(false);

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="relative grid grid-cols-[64px_1fr_1fr] gap-8 items-start py-9 border-b overflow-hidden"
      style={{ borderColor: C.border }}>

      {/* hover reveal line */}
      <motion.div className="absolute left-0 top-0 bottom-0 w-px"
        style={{ background: C.amber }}
        initial={{ scaleY: 0, transformOrigin: "top" }}
        animate={{ scaleY: hov ? 1 : 0 }}
        transition={{ duration: 0.3, ease: E }} />

      <motion.span
        style={{ fontFamily: "'Geist Mono', monospace", color: hov ? C.amber : C.dim, fontSize: 10 }}
        className="pt-1 uppercase tracking-widest"
        animate={{ x: hov ? 6 : 0 }} transition={{ duration: 0.3, ease: E }}>
        {n}
      </motion.span>

      <motion.div animate={{ x: hov ? 6 : 0 }} transition={{ duration: 0.3, ease: E }}>
        <div style={{ fontFamily: "'Satoshi', sans-serif", color: C.text, fontWeight: 800, fontSize: "clamp(18px,2vw,26px)", letterSpacing: "-0.02em" }}>
          {title}
        </div>
        <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] uppercase tracking-[0.1em]"
          style={{ background: `${C.amber}12`, color: C.amber, fontFamily: "'Geist Mono', monospace" }}>{tag}</span>
      </motion.div>

      <div style={{ color: C.muted }} className="text-[13px] leading-[1.75] pt-1">{body}</div>
    </motion.div>
  );
}

/* ─────────────────────── USE CASES ─────────────────────── */
const USECASES = [
  { role: "Sales", headline: "Know before you dial.", body: "Walk in knowing their stack, growth stage, and pain — before the first call.", idx: 0 },
  { role: "Recruiting", headline: "Find the pull.", body: "Surface companies actively hiring in your niche. Know what they need before reaching out.", idx: 1 },
  { role: "Investors", headline: "Hiring is a leading indicator.", body: "Velocity and stack signal trajectory better than a pitch deck ever will.", idx: 2 },
  { role: "Founders", headline: "Watch competition breathe.", body: "Know when they hire and what they're building — before it's on TechCrunch.", idx: 3 },
];

function UsecaseRow({ role, headline, body, idx }: typeof USECASES[0]) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const isEven = idx % 2 === 0;
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.1, ease: E }}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-8 py-16 border-b items-center ${isEven ? "" : "lg:grid-flow-dense"}`}
      style={{ borderColor: C.border }}>
      <div className={isEven ? "" : "lg:col-start-2"}>
        <div style={{ fontFamily: "'Geist Mono', monospace", color: C.amber, fontSize: 9 }} className="uppercase tracking-[0.18em] mb-4">{role}</div>
        <div style={{ fontFamily: "'Satoshi', sans-serif", color: C.text, fontWeight: 800, fontSize: "clamp(26px,3vw,42px)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>{headline}</div>
      </div>
      <div className={isEven ? "" : "lg:col-start-1 lg:row-start-1"}>
        <p style={{ color: C.muted }} className="text-[15px] leading-[1.8]">{body}</p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── PAGE ─────────────────────── */
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroSP } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroSP, [0, 1], ["0%", "18%"]);
  const heroO = useTransform(heroSP, [0, 0.75], [1, 0]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // scroll-direction nav
  const [scrolled, setScrolled] = useState(false);
  const [navVis, setNavVis] = useState(true);
  const lastY = useRef(0);
  useEffect(() => {
    const unsub = scrollYProgress.on("change", () => {
      const cur = window.scrollY;
      setScrolled(cur > 60);
      if (cur < 80) { setNavVis(true); lastY.current = cur; return; }
      if (cur > lastY.current + 8) setNavVis(false);
      else if (cur < lastY.current - 8) setNavVis(true);
      lastY.current = cur;
    });
    return unsub;
  }, [scrollYProgress]);

  // trigger scramble after hero loads
  const [scramble, setScramble] = useState(false);
  useEffect(() => { const t = setTimeout(() => setScramble(true), 1050); return () => clearTimeout(t); }, []);

  return (
    <SmoothScroll>
      <div style={{ fontFamily: "'Geist', sans-serif", background: C.bg, color: C.text, cursor: "none" }}
        className="min-h-screen overflow-x-hidden">
        <Cursor />
        <Grain />

        {/* scroll bar */}
        <motion.div className="fixed top-0 left-0 right-0 h-px origin-left z-[60]"
          style={{ scaleX, background: C.amber }} />

        {/* ══════════ NAV ══════════ */}
        <motion.nav
          className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-5 flex items-center justify-between"
          animate={{
            y: navVis ? 0 : -80,
            background: scrolled ? "rgba(9,8,10,0.94)" : "transparent",
            backdropFilter: scrolled ? "blur(24px)" : "blur(0px)",
            borderBottomColor: scrolled ? C.border : "transparent",
            borderBottomWidth: 1,
            borderBottomStyle: "solid",
          }}
          transition={{ duration: 0.4, ease: E }}
        >
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: E }}
            style={{ fontFamily: "'Satoshi', sans-serif", color: C.text, fontWeight: 900, fontSize: 17, letterSpacing: "-0.03em" }}>
            Prospect<span style={{ color: C.amber }}>IQ</span>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="hidden md:flex items-center gap-10">
            {["Features", "Process", "Usecases"].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`}
                style={{ fontFamily: "'Geist Mono', monospace", color: C.muted }}
                className="text-[10px] uppercase tracking-[0.12em] hover:text-[#EDE8DF] transition-colors duration-200">{l}</a>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: E }}>
            <MagneticCTA href="/app">Open app →</MagneticCTA>
          </motion.div>
        </motion.nav>

        {/* ══════════ HERO ══════════ */}
        <section ref={heroRef} className="relative min-h-screen flex flex-col overflow-hidden">
          {/* bg */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(${C.border}60 1px, transparent 1px), linear-gradient(90deg, ${C.border}60 1px, transparent 1px)`,
              backgroundSize: "80px 80px",
              maskImage: "radial-gradient(ellipse 90% 90% at 50% 40%, black 0%, transparent 80%)",
            }} />
            <div className="absolute -top-40 right-0 w-[700px] h-[700px]"
              style={{ background: `radial-gradient(circle at 70% 20%, ${C.amber}12, transparent 60%)` }} />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px]"
              style={{ background: `radial-gradient(circle at 20% 80%, ${C.indigo}09, transparent 65%)` }} />
            <div className="absolute inset-0"
              style={{ background: `linear-gradient(to bottom, transparent 55%, ${C.bg} 100%)` }} />
          </div>

          <motion.div style={{ y: heroY, opacity: heroO }} className="relative z-10 flex-1 flex flex-col pt-28">
            <div className="px-6 lg:px-12 mb-8">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.55, ease: E }}
                className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full"
                style={{ background: `${C.amber}10`, border: `1px solid ${C.amber}22` }}>
                <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }}
                  animate={{ scale: [1, 1.7, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
                <span style={{ fontFamily: "'Geist Mono', monospace", color: C.amber, fontSize: 10 }}
                  className="uppercase tracking-[0.14em]">Stealth scraping · AI extraction · Live streaming</span>
              </motion.div>
            </div>

            {/* headline — 3D word flip */}
            <div className="px-6 lg:px-12 flex-1">
              <div style={{ fontFamily: "'Satoshi', sans-serif", perspective: "1000px" }}
                className="font-black leading-[0.84] tracking-[-0.045em] mb-12">
                {["COMPANY", "INTEL-", "LIGENCE"].map((word, wi) => (
                  <div key={word} className="overflow-hidden">
                    <motion.div
                      className="text-[clamp(64px,12vw,168px)]"
                      style={{ color: C.text, lineHeight: 0.88, transformOrigin: "bottom" }}
                      initial={{ y: "110%", rotateX: -75, opacity: 0 }}
                      animate={{ y: "0%", rotateX: 0, opacity: 1 }}
                      transition={{ duration: 1.1, delay: 0.6 + wi * 0.12, ease: E }}
                    >{word}</motion.div>
                  </div>
                ))}

                {/* scramble line */}
                <div className="overflow-hidden">
                  <motion.div
                    className="text-[clamp(64px,12vw,168px)]"
                    style={{
                      background: `linear-gradient(105deg, ${C.amber} 0%, #F5C540 50%, ${C.amber}BB 100%)`,
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                      lineHeight: 0.92, transformOrigin: "bottom",
                    }}
                    initial={{ y: "110%", rotateX: -75, opacity: 0 }}
                    animate={{ y: "0%", rotateX: 0, opacity: 1 }}
                    transition={{ duration: 1.1, delay: 0.96, ease: E }}
                  >
                    <ScrambleText text="AT SCALE." trigger={scramble} />
                  </motion.div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-14">
                <motion.p
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 1.35, ease: E }}
                  style={{ color: C.muted }} className="text-[15px] leading-[1.8] max-w-[360px]">
                  Paste any list of company domains. Stream back structured intelligence
                  — hiring signals, tech stack, funding stage — instantly.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 1.5, ease: E }}
                  className="flex flex-col gap-3">
                  <MagneticCTA href="/app">Start enriching →</MagneticCTA>
                  <span style={{ color: C.dim, fontFamily: "'Geist Mono', monospace", fontSize: 10 }}
                    className="text-center uppercase tracking-widest">Free · No signup</span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* floating terminal */}
          <motion.div
            className="absolute right-6 lg:right-12 top-1/2 w-[350px] hidden xl:block z-20"
            style={{ translateY: "-46%" }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, delay: 1.4, ease: E }}
          >
            <LiveTerminal />
          </motion.div>

          {/* scroll cue */}
          <motion.div
            className="absolute bottom-10 left-6 lg:left-12 flex items-center gap-4 z-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.3, duration: 1 }}>
            <motion.div className="w-12 h-px"
              style={{ background: `linear-gradient(to right, ${C.amber}, transparent)` }}
              animate={{ scaleX: [0, 1, 0], transformOrigin: "left" }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} />
            <span style={{ fontFamily: "'Geist Mono', monospace", color: C.dim, fontSize: 9 }}
              className="uppercase tracking-[0.22em]">Scroll</span>
          </motion.div>
        </section>

        {/* ══════════ TICKER ══════════ */}
        <Ticker />

        {/* ══════════ STATS ══════════ */}
        <section className="border-b" style={{ borderColor: C.border, background: C.surface }}>
          <div className="max-w-[1280px] mx-auto grid grid-cols-2 lg:grid-cols-4">
            {[
              { to: 10, suf: "×", label: "faster than manual" },
              { to: 98, suf: "%", label: "data accuracy" },
              { to: 50, suf: "+", label: "ATS platforms bypassed" },
              { to: 2,  suf: "s", label: "median enrichment" },
            ].map((s, i) => {
              return <StatCell key={s.label} to={s.to} suffix={s.suf} label={s.label} delay={i * 0.1} last={i === 3} />;
            })}
          </div>
        </section>

        {/* ══════════ PRODUCT PREVIEW (asymmetric) ══════════ */}
        <section className="py-32 relative overflow-hidden" id="process">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${C.amber}06, transparent)` }} />
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
            <div className="mb-14">
              <motion.div style={{ fontFamily: "'Geist Mono', monospace", color: C.amber }}
                className="text-[10px] uppercase tracking-[0.18em] mb-5"
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                / Output
              </motion.div>
              <WordReveal3D text="What your intelligence looks like"
                className="text-[clamp(28px,3.8vw,52px)] font-extrabold tracking-[-0.03em] leading-[1.06] max-w-xl"
                style={{ fontFamily: "'Satoshi', sans-serif" }} />
            </div>

            {/* asymmetric: 3+2 cols — NO equal 3-col */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-auto lg:h-[480px]">
              <TiltCard className="lg:col-span-3 relative h-full" style={{ borderRadius: 20, transformStyle: "preserve-3d" }}>
                <motion.div className="h-full"
                  initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.9, ease: E }}>
                  <BigCompanyCard company={COMPANIES[0]} />
                </motion.div>
              </TiltCard>

              <div className="lg:col-span-2 flex flex-col gap-4">
                {COMPANIES.slice(1).map((c, i) => (
                  <TiltCard key={c.domain} className="relative flex-1" style={{ borderRadius: 20, transformStyle: "preserve-3d" }}>
                    <motion.div className="h-full"
                      initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.12 + i * 0.1, ease: E }}>
                      <SmallCompanyCard company={c} />
                    </motion.div>
                  </TiltCard>
                ))}
              </div>
            </div>

            {/* blueprint process */}
            <div className="mt-24">
              <motion.div style={{ fontFamily: "'Geist Mono', monospace", color: C.amber }}
                className="text-[10px] uppercase tracking-[0.18em] mb-5"
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                / Pipeline
              </motion.div>
              <WordReveal3D text="How intelligence is extracted"
                className="text-[clamp(28px,3.8vw,52px)] font-extrabold tracking-[-0.03em] leading-[1.06] max-w-xl mb-16"
                style={{ fontFamily: "'Satoshi', sans-serif" }} />
              <BlueprintDiagram />
            </div>
          </div>
        </section>

        {/* ══════════ FEATURES ══════════ */}
        <section className="py-24 border-t" id="features" style={{ borderColor: C.border }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
            <div className="mb-14">
              <motion.div style={{ fontFamily: "'Geist Mono', monospace", color: C.amber }}
                className="text-[10px] uppercase tracking-[0.18em] mb-5"
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                / Capabilities
              </motion.div>
              <WordReveal3D text="Everything you need to know about a company"
                className="text-[clamp(28px,3.8vw,52px)] font-extrabold tracking-[-0.03em] leading-[1.06] max-w-2xl"
                style={{ fontFamily: "'Satoshi', sans-serif" }} />
            </div>
            <div className="border-t" style={{ borderColor: C.border }}>
              {FEATURES.map((f, i) => <FeatureRow key={f.n} {...f} index={i} />)}
            </div>
          </div>
        </section>

        {/* ══════════ KINETIC MARQUEE ══════════ */}
        <div className="relative overflow-hidden py-16 border-y" style={{ borderColor: C.border }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(to right, ${C.bg}, transparent 8%, transparent 92%, ${C.bg})` }} />
          <motion.div className="flex gap-16 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}>
            {[...Array(8)].map((_, i) => (
              <span key={i} className="inline-flex items-center gap-12 shrink-0">
                <span style={{ fontFamily: "'Satoshi', sans-serif", color: `${C.text}18`, fontWeight: 900, letterSpacing: "-0.04em", fontSize: "clamp(40px,6vw,72px)" }}>ENRICH</span>
                <span style={{ color: C.amber, fontSize: "clamp(20px,3vw,36px)" }}>◆</span>
                <span style={{ fontFamily: "'Satoshi', sans-serif", color: `${C.text}18`, fontWeight: 900, letterSpacing: "-0.04em", fontSize: "clamp(40px,6vw,72px)" }}>SIGNAL</span>
                <span style={{ color: `${C.indigo}55`, fontSize: "clamp(20px,3vw,36px)" }}>◆</span>
              </span>
            ))}
          </motion.div>
        </div>

        {/* ══════════ CTA ══════════ */}
        <section className="relative py-44 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(${C.border}45 1px, transparent 1px), linear-gradient(90deg, ${C.border}45 1px, transparent 1px)`,
              backgroundSize: "64px 64px",
            }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px]"
              style={{ background: `radial-gradient(ellipse, ${C.amber}0E 0%, transparent 65%)` }} />
          </div>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12 text-center relative z-10">
            <WordReveal3D text="Stop guessing. Start knowing."
              className="text-[clamp(44px,8.5vw,120px)] font-black tracking-[-0.05em] leading-[0.88] mb-10"
              style={{ fontFamily: "'Satoshi', sans-serif" }} />
            <motion.p style={{ color: C.muted }}
              className="text-[clamp(15px,1.4vw,18px)] max-w-[420px] mx-auto leading-[1.8] mb-14"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }}>
              Every sales rep, recruiter, and investor who uses ProspectIQ walks in more prepared than the competition.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center justify-center gap-4">
              <MagneticCTA href="/app">Enrich your first company →</MagneticCTA>
              <MagneticCTA href="/app" dark>See live demo</MagneticCTA>
            </motion.div>
          </div>
        </section>

        {/* ══════════ USE CASES ══════════ */}
        <section className="py-24 border-t" id="usecases" style={{ borderColor: C.border, background: C.surface }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
            <div className="mb-14">
              <motion.div style={{ fontFamily: "'Geist Mono', monospace", color: C.amber }}
                className="text-[10px] uppercase tracking-[0.18em] mb-5"
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                / Who uses this
              </motion.div>
              <WordReveal3D text="Built for people who need an edge"
                className="text-[clamp(28px,3.8vw,52px)] font-extrabold tracking-[-0.03em] leading-[1.06] max-w-lg"
                style={{ fontFamily: "'Satoshi', sans-serif" }} />
            </div>
            <div className="border-t" style={{ borderColor: C.border }}>
              {USECASES.map(u => <UsecaseRow key={u.role} {...u} />)}
            </div>
          </div>
        </section>

        {/* ══════════ FOOTER ══════════ */}
        <footer className="border-t py-10 px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: C.border }}>
          <span style={{ fontFamily: "'Satoshi', sans-serif", color: C.text, fontWeight: 900, fontSize: 16, letterSpacing: "-0.03em" }}>
            Prospect<span style={{ color: C.amber }}>IQ</span>
          </span>
          <span style={{ fontFamily: "'Geist Mono', monospace", color: C.dim, fontSize: 10 }} className="uppercase tracking-widest">
            Built with{" "}
            <a href="https://www.hyperbrowser.ai" target="_blank" rel="noopener noreferrer"
              style={{ color: C.muted }} className="hover:text-[#EDE8DF] transition-colors">Hyperbrowser</a>
            {" "}+ Claude AI
          </span>
        </footer>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Satoshi:wght@400;500;600;700;800;900&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');
          html { scroll-behavior: smooth; }
          * { -webkit-font-smoothing: antialiased; box-sizing: border-box; }
          ::selection { background: rgba(232,160,32,0.28); color: #EDE8DF; }
        `}</style>
      </div>
    </SmoothScroll>
  );
}

/* ─────────────────────── STAT CELL ─────────────────────── */
function StatCell({ to, suffix, label, delay, last }: { to: number; suffix: string; label: string; delay: number; last: boolean }) {
  const { ref, val } = useCounter(to);
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.8, delay, ease: E }}
      className={`px-8 lg:px-12 py-16 ${!last ? "border-r" : ""}`}
      style={{ borderColor: C.border }}>
      <div style={{ fontFamily: "'Satoshi', sans-serif", color: C.text, lineHeight: 1 }}
        className="text-[clamp(44px,5vw,72px)] font-black tracking-[-0.04em]">
        {val}<span style={{ color: C.amber }}>{suffix}</span>
      </div>
      <div style={{ fontFamily: "'Geist Mono', monospace", color: C.muted }}
        className="text-[10px] mt-3 uppercase tracking-[0.12em] leading-snug max-w-[130px]">{label}</div>
    </motion.div>
  );
}

/* ─────────────────────── BLUEPRINT DIAGRAM ─────────────────────── */
function BlueprintDiagram() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  const pV: import("framer-motion").Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1, opacity: 1,
      transition: { pathLength: { duration: 2, delay: i * 0.15, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }, opacity: { duration: 0.3, delay: i * 0.15 } },
    }),
  };
  const dV: import("framer-motion").Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1, opacity: 1,
      transition: { duration: 0.4, delay: 0.8 + i * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    }),
  };

  return (
    <svg ref={ref} viewBox="0 0 800 400" className="w-full max-w-3xl mx-auto" style={{ overflow: "visible" }}>
      <motion.rect x="20" y="160" width="140" height="80" rx="8" stroke={C.amber} strokeWidth="1" fill="none" strokeDasharray="4 4"
        variants={pV} custom={0} initial="hidden" animate={inView ? "visible" : "hidden"} />
      <motion.text x="90" y="195" textAnchor="middle" fill={C.muted} fontSize="11" fontFamily="Geist Mono, monospace"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}>domains.txt</motion.text>
      <motion.text x="90" y="213" textAnchor="middle" fill={C.amber} fontSize="10" fontFamily="Geist Mono, monospace"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.6 }}>stripe.com</motion.text>
      <motion.text x="90" y="228" textAnchor="middle" fill={C.amber} fontSize="10" fontFamily="Geist Mono, monospace"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.65 }}>linear.app</motion.text>
      <motion.path d="M 160 200 L 230 200" stroke={C.amber} strokeWidth="1.5" fill="none" markerEnd="url(#arr)"
        variants={pV} custom={1} initial="hidden" animate={inView ? "visible" : "hidden"} />
      <motion.circle cx="290" cy="200" r="55" stroke={C.amber} strokeWidth="1" fill="none"
        variants={pV} custom={2} initial="hidden" animate={inView ? "visible" : "hidden"} />
      <motion.text x="290" y="195" textAnchor="middle" fill={C.text} fontSize="11" fontFamily="Geist Mono, monospace" fontWeight="500"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.9 }}>Stealth</motion.text>
      <motion.text x="290" y="212" textAnchor="middle" fill={C.amber} fontSize="10" fontFamily="Geist Mono, monospace"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.95 }}>Browser</motion.text>
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <motion.circle key={i} cx={290 + 55 * Math.cos((deg * Math.PI) / 180)} cy={200 + 55 * Math.sin((deg * Math.PI) / 180)} r="3" fill={C.amber}
          variants={dV} custom={i} initial="hidden" animate={inView ? "visible" : "hidden"} />
      ))}
      <motion.path d="M 345 200 L 415 200" stroke={C.amber} strokeWidth="1.5" fill="none" markerEnd="url(#arr)"
        variants={pV} custom={5} initial="hidden" animate={inView ? "visible" : "hidden"} />
      <motion.rect x="415" y="155" width="120" height="90" rx="12" stroke={C.indigo} strokeWidth="1" fill={`${C.indigo}0A`}
        variants={pV} custom={6} initial="hidden" animate={inView ? "visible" : "hidden"} />
      <motion.text x="475" y="197" textAnchor="middle" fill={C.text} fontSize="11" fontFamily="Geist Mono, monospace" fontWeight="500"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1.4 }}>Claude AI</motion.text>
      <motion.text x="475" y="215" textAnchor="middle" fill={C.indigo} fontSize="9" fontFamily="Geist Mono, monospace"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1.5 }}>extraction</motion.text>
      {[0, 1, 2].map(i => (
        <motion.circle key={i} cx={430 + i * 22} cy={230} r="2.5" fill={C.indigo}
          variants={dV} custom={i + 6} initial="hidden" animate={inView ? "visible" : "hidden"} />
      ))}
      <motion.path d="M 535 200 L 605 200" stroke={C.amber} strokeWidth="1.5" fill="none" markerEnd="url(#arr)"
        variants={pV} custom={9} initial="hidden" animate={inView ? "visible" : "hidden"} />
      <motion.rect x="605" y="140" width="180" height="120" rx="8" stroke={C.green} strokeWidth="1" fill={`${C.green}08`}
        variants={pV} custom={10} initial="hidden" animate={inView ? "visible" : "hidden"} />
      {["tech stack", "open roles", "velocity", "signals", "funding"].map((label, i) => (
        <motion.text key={label} x="620" y={165 + i * 18} fill={i === 0 ? C.text : C.muted} fontSize="10" fontFamily="Geist Mono, monospace"
          initial={{ opacity: 0, x: -10 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1.8 + i * 0.08 }}>
          {`› ${label}`}
        </motion.text>
      ))}
      {[{ x: 90, y: 258, l: "INPUT", d: 0.4 }, { x: 290, y: 268, l: "HYPERBROWSER", d: 1.0 }, { x: 475, y: 260, l: "EXTRACTION", d: 1.6 }, { x: 695, y: 275, l: "STRUCTURED OUTPUT", d: 2.0 }].map(({ x, y, l, d }) => (
        <motion.text key={l} x={x} y={y} textAnchor="middle" fill={C.dim} fontSize="9" fontFamily="Geist Mono, monospace" letterSpacing="1"
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: d }}>{l}</motion.text>
      ))}
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 Z" fill={C.amber} />
        </marker>
      </defs>
    </svg>
  );
}
