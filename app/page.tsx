"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
  type MotionValue,
} from "framer-motion";
import SmoothScroll from "./components/SmoothScroll";

/* ─── design tokens ─── */
const C = {
  bg:        "#F7F4ED",
  surface:   "#EDE9DF",
  card:      "#FDFBF6",
  border:    "#DDD7CC",
  text:      "#1A1714",
  muted:     "#7A7163",
  dim:       "#B8B0A5",
  sage:      "#6A9970",
  sageLo:    "rgba(106,153,112,0.10)",
  sageMid:   "rgba(106,153,112,0.22)",
  butter:    "#C9A83C",
  butterLo:  "rgba(201,168,60,0.12)",
  rose:      "#B87E70",
  roseLo:    "rgba(184,126,112,0.10)",
  indigo:    "#7279B8",
  green:     "#3A8A52",
};

const E  = [0.16, 1, 0.3, 1] as [number, number, number, number];
const SP = { type: "spring" as const, stiffness: 65, damping: 14 };

/* ─────────────── CURSOR ─────────────── */
function Cursor() {
  const mx = useMotionValue(-200); const my = useMotionValue(-200);
  const rx = useMotionValue(-200); const ry = useMotionValue(-200);
  const sx = useSpring(mx, { stiffness: 500, damping: 45 });
  const sy = useSpring(my, { stiffness: 500, damping: 45 });
  const lx = useSpring(rx, { stiffness: 80, damping: 22 });
  const ly = useSpring(ry, { stiffness: 80, damping: 22 });
  const [big, setBig] = useState(false);
  useEffect(() => {
    const m = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); rx.set(e.clientX); ry.set(e.clientY); };
    const i = (e: MouseEvent) => { if ((e.target as Element).closest("a,button")) setBig(true); };
    const o = (e: MouseEvent) => { if ((e.target as Element).closest("a,button")) setBig(false); };
    window.addEventListener("mousemove", m);
    window.addEventListener("mouseover", i);
    window.addEventListener("mouseout", o);
    return () => { window.removeEventListener("mousemove", m); window.removeEventListener("mouseover", i); window.removeEventListener("mouseout", o); };
  }, [mx, my, rx, ry]);
  return (
    <>
      <motion.div className="fixed top-0 left-0 pointer-events-none z-[500] rounded-full"
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%", background: C.text, mixBlendMode: "multiply" }}
        animate={{ width: big ? 44 : 8, height: big ? 44 : 8 }}
        transition={{ duration: 0.2, ease: E }} />
      <motion.div className="fixed top-0 left-0 pointer-events-none z-[499] rounded-full"
        style={{ x: lx, y: ly, translateX: "-50%", translateY: "-50%", width: 34, height: 34, border: `1.5px solid ${C.sage}70` }} />
    </>
  );
}

/* ─────────────── GRAIN ─────────────── */
function Grain() {
  return (
    <div className="fixed inset-0 z-[150] pointer-events-none" style={{ opacity: 0.028 }}>
      <svg width="100%" height="100%">
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </div>
  );
}

/* ─────────────── MAGNETIC CTA ─────────────── */
function MagneticBtn({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost" }) {
  const bx = useMotionValue(0); const by = useMotionValue(0);
  const tx = useMotionValue(0); const ty = useMotionValue(0);
  const sbx = useSpring(bx, { stiffness: 180, damping: 16 });
  const sby = useSpring(by, { stiffness: 180, damping: 16 });
  const stx = useSpring(tx, { stiffness: 180, damping: 16 });
  const sty = useSpring(ty, { stiffness: 180, damping: 16 });
  const onMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    bx.set(dx * 0.3); by.set(dy * 0.3); tx.set(dx * 0.12); ty.set(dy * 0.12);
  }, [bx, by, tx, ty]);
  const onLeave = useCallback(() => { bx.set(0); by.set(0); tx.set(0); ty.set(0); }, [bx, by, tx, ty]);
  const isPrimary = variant === "primary";
  return (
    <motion.a href={href} style={{ x: sbx, y: sby, display: "inline-block" }}
      onMouseMove={onMove} onMouseLeave={onLeave} whileTap={{ scale: 0.97 }}>
      <motion.span style={{ x: stx, y: sty, display: "block",
        fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14,
        padding: "13px 32px", borderRadius: 100,
        background: isPrimary ? C.sage : "transparent",
        color: isPrimary ? "#fff" : C.muted,
        border: isPrimary ? "none" : `1.5px solid ${C.border}`,
        letterSpacing: "0.01em",
      }}
        whileHover={{ boxShadow: isPrimary ? `0 20px 50px ${C.sageMid}` : "none", color: isPrimary ? "#fff" : C.text }}>
        {children}
      </motion.span>
    </motion.a>
  );
}

/* ─────────────── VEL BARS ─────────────── */
function VelBars({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex items-end gap-[3px]">
      {[1, 2, 3, 4].map(n => (
        <motion.div key={n} className="w-[3px] rounded-sm"
          style={{ background: n <= level ? color : C.border }}
          initial={{ height: 0 }} animate={{ height: 3 + n * 3 }}
          transition={{ delay: n * 0.07, duration: 0.5, ease: E }} />
      ))}
    </div>
  );
}

/* ─────────────── COUNTER HOOK ─────────────── */
function useCounter(to: number, dur = 2.5) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const mv = useMotionValue(0);
  const sp = useSpring(mv, { duration: dur * 1000, bounce: 0 });
  const [val, setVal] = useState("0");
  useEffect(() => { if (inView) mv.set(to); }, [inView, mv, to]);
  useEffect(() => sp.on("change", v => setVal(String(Math.round(v)))), [sp]);
  return { ref, val };
}

/* ─────────────── 3D HERO CARDS ─────────────── */
const PREVIEW = [
  { name: "Stripe",  domain: "stripe.com", stage: "Series H", roles: 47, vel: 4, color: C.sage,   velLabel: "Aggressive", stack: ["Go", "Ruby", "k8s"],       signal: "Infra expansion +340%" },
  { name: "Linear",  domain: "linear.app",  stage: "Series C", roles: 12, vel: 3, color: C.indigo, velLabel: "Steady",     stack: ["TypeScript", "Rust"],       signal: "Mobile team forming"   },
  { name: "Vercel",  domain: "vercel.com",  stage: "Series D", roles: 29, vel: 4, color: C.butter, velLabel: "Aggressive", stack: ["Next.js", "Rust"],          signal: "Enterprise push Q2"    },
];

function HeroCard3D({ co, delay, rotate, zIndex, offsetX, offsetY, depth, mx, my }: {
  co: typeof PREVIEW[0]; delay: number; rotate: number; zIndex: number;
  offsetX: number; offsetY: number; depth: number;
  mx: MotionValue<number>; my: MotionValue<number>;
}) {
  /* Per-card 3D rotation from global mouse — deeper cards react more */
  const rotY = useSpring(useTransform(mx, [-1, 1], [-depth * 9, depth * 9]), { stiffness: 90, damping: 28 });
  const rotX = useSpring(useTransform(my, [-1, 1], [depth * 6, -depth * 6]), { stiffness: 90, damping: 28 });
  /* Parallax translation — deeper cards move more */
  const px = useSpring(useTransform(mx, [-1, 1], [-depth * 14, depth * 14]), { stiffness: 70, damping: 22 });
  const py = useSpring(useTransform(my, [-1, 1], [-depth * 10, depth * 10]), { stiffness: 70, damping: 22 });

  return (
    <motion.div
      className="absolute w-[280px]"
      style={{ left: offsetX, top: offsetY, zIndex, x: px, y: py }}
      initial={{ opacity: 0, y: -130, rotate: rotate - 14 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ ...SP, delay, stiffness: 50, damping: 12 }}
    >
      <motion.div
        style={{ rotateY: rotY, rotateX: rotX, transformStyle: "preserve-3d", background: C.card, border: `1px solid ${C.border}` }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5 + depth, repeat: Infinity, ease: "easeInOut", delay: delay * 0.3 }}
        className="rounded-2xl p-5 shadow-[0_24px_80px_rgba(0,0,0,0.10),0_4px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.6)]"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", color: C.text, fontWeight: 600, fontSize: 15 }}>{co.name}</div>
            <div style={{ fontFamily: "'Geist Mono', monospace", color: C.muted, fontSize: 10 }}>{co.domain}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <VelBars level={co.vel} color={co.color} />
            <span style={{ color: co.color, fontFamily: "'Geist Mono', monospace", fontSize: 8 }} className="uppercase tracking-widest">{co.velLabel}</span>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {co.stack.map(s => (
            <span key={s} className="px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider"
              style={{ background: `${co.color}15`, color: co.color, fontFamily: "'Geist Mono', monospace" }}>{s}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: C.border }}>
          <span style={{ color: C.muted, fontSize: 11, fontFamily: "'Geist Mono', monospace" }}>
            <span style={{ color: co.color, fontWeight: 600 }}>{co.roles}</span> open roles
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px]"
            style={{ background: `${co.color}12`, color: co.color, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{co.stage}</span>
        </div>
        <div className="mt-3 text-[11px]" style={{ color: C.muted, fontFamily: "'Geist Mono', monospace" }}>· {co.signal}</div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────── TICKER ─────────────── */
const TICKS = [
  "stripe.com · Series H · 47 open roles · AGGRESSIVE",
  "linear.app · Series C · 12 roles · STEADY",
  "vercel.com · Series D · 29 roles · AGGRESSIVE",
  "notion.so · Series C · 18 roles · STEADY",
  "figma.com · Series E · 31 roles · AGGRESSIVE",
  "retool.com · Series C · 22 roles · STEADY",
  "resend.com · Series A · 8 roles · AGGRESSIVE",
  "clerk.dev · Series A · 14 roles · AGGRESSIVE",
];
function Ticker() {
  const d = [...TICKS, ...TICKS];
  return (
    <div className="overflow-hidden border-y py-3" style={{ borderColor: C.border, background: C.surface }}>
      <motion.div className="flex gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
        {d.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 shrink-0">
            <span style={{ color: C.sage, fontFamily: "'Geist Mono', monospace", fontSize: 8 }}>◆</span>
            <span style={{ color: C.muted, fontFamily: "'Geist Mono', monospace", fontSize: 11 }}>{item}</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─────────────── STATS SECTION ─────────────── */
function StatsSection() {
  const stats = [
    { to: 10, suffix: "×", label: "faster than manual research", desc: "What takes an SDR 45 minutes, ProspectIQ returns in under 3." },
    { to: 98, suffix: "%", label: "extraction accuracy", desc: "Structured signals, not raw HTML dumps." },
    { to: 50, suffix: "+", label: "ATS platforms bypassed", desc: "Greenhouse, Lever, Workday, Rippling — all transparent." },
    { to: 2,  suffix: "s", label: "median enrichment time", desc: "Per company, with full signal extraction." },
  ];
  return (
    <section className="relative overflow-hidden py-20" style={{ background: C.text }}>
      {/* Background texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ background: `radial-gradient(circle at 20% 50%, ${C.sage} 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${C.butter} 0%, transparent 50%)` }} />
      <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
          {stats.map(({ to, suffix, label, desc }, i) => {
            const { ref, val } = useCounter(to); // eslint-disable-line react-hooks/rules-of-hooks
            return (
              <motion.div key={label} ref={ref}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.1, ease: E }}
                className="relative px-10 py-10 group overflow-hidden"
                style={{ background: C.text }}>
                {/* Hover fill */}
                <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 40% 60%, ${C.sageLo}, transparent 70%)` }} />
                {/* Giant number */}
                <div style={{
                  fontFamily: "'Cormorant Garant', serif",
                  color: "#F7F4ED",
                  lineHeight: 0.9,
                  fontSize: "clamp(64px,7vw,96px)",
                  fontWeight: 300,
                  letterSpacing: "-0.03em",
                }}>
                  {val}<span style={{ color: C.sage }}>{suffix}</span>
                </div>
                <div style={{ fontFamily: "'Geist Mono', monospace", color: "rgba(247,244,237,0.35)", fontSize: 9 }}
                  className="uppercase tracking-[0.14em] mt-4 mb-2">{label}</div>
                <p style={{ color: "rgba(247,244,237,0.25)", fontSize: 12, lineHeight: 1.6 }}>{desc}</p>
                {/* bottom accent line */}
                <motion.div className="absolute bottom-0 left-10 right-10 h-px origin-left"
                  style={{ background: C.sage }}
                  initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.3 + i * 0.15, ease: E }} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── STICKY STORY SECTION ─────────────── */
function StorySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  const act1o = useTransform(scrollYProgress, [0, 0.15, 0.28, 0.38], [0, 1, 1, 0]);
  const act1y = useTransform(scrollYProgress, [0, 0.15], [50, 0]);
  const act2o = useTransform(scrollYProgress, [0.33, 0.46, 0.58, 0.66], [0, 1, 1, 0]);
  const act2y = useTransform(scrollYProgress, [0.33, 0.46], [50, 0]);
  const act3o = useTransform(scrollYProgress, [0.66, 0.78, 1.0], [0, 1, 1]);
  const act3y = useTransform(scrollYProgress, [0.66, 0.78], [50, 0]);

  const card1y = useTransform(scrollYProgress, [0, 0.18], [-120, 0]);
  const card1o = useTransform(scrollYProgress, [0, 0.18, 0.36], [0, 1, 0]);
  const card2y = useTransform(scrollYProgress, [0.33, 0.48], [-120, 0]);
  const card2o = useTransform(scrollYProgress, [0.33, 0.48, 0.64], [0, 1, 0]);
  const card3y = useTransform(scrollYProgress, [0.66, 0.80], [-120, 0]);
  const card3o = useTransform(scrollYProgress, [0.66, 0.80], [0, 1]);

  const progressLine = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={containerRef} style={{ height: "200vh", position: "relative" }} id="process">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        {/* Progress line */}
        <div className="absolute left-6 lg:left-12 top-1/2 -translate-y-1/2 w-px bg-[rgba(0,0,0,0.06)]" style={{ height: 200 }}>
          <motion.div className="absolute top-0 w-full origin-top" style={{ background: C.sage, height: progressLine }} />
        </div>

        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className="relative" style={{ minHeight: 360 }}>
            <div style={{ fontFamily: "'Geist Mono', monospace", color: C.dim, fontSize: 9 }}
              className="uppercase tracking-[0.2em] mb-12">/ How it works</div>

            {[
              { o: act1o, y: act1y, step: "Step 01", accent: C.sage,   title: <>Paste a list of<br /><em style={{ color: C.sage }}>any company domains.</em></>, body: "Drop in a .csv, a plain list, or type them one by one. ProspectIQ accepts anything — no formatting required." },
              { o: act2o, y: act2y, step: "Step 02", accent: C.butter, title: <>Stealth browsers fetch<br /><em style={{ color: C.butter }}>every job posting.</em></>, body: "Each domain gets its own fingerprint-spoofed Hyperbrowser session. ATS walls like Greenhouse, Lever, and Workday are bypassed automatically." },
              { o: act3o, y: act3y, step: "Step 03", accent: C.rose,   title: <>Claude AI extracts<br /><em style={{ color: C.rose }}>structured signals.</em></>, body: "Not raw HTML. Typed fields: hiring velocity, tech stack, funding stage, key signals — streamed back live as each domain resolves." },
            ].map(({ o, y, step, accent, title, body }) => (
              <motion.div key={step} style={{ opacity: o, y }} className="absolute top-16 left-0 right-0">
                <div style={{ fontFamily: "'Geist Mono', monospace", color: accent, fontSize: 9 }}
                  className="uppercase tracking-[0.18em] mb-4">{step}</div>
                <div style={{ fontFamily: "'Cormorant Garant', serif", color: C.text, fontSize: "clamp(30px,3.5vw,50px)", fontWeight: 400, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
                  {title}
                </div>
                <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.8, marginTop: 20 }}>{body}</p>
              </motion.div>
            ))}
          </div>

          {/* Right — card drops */}
          <div className="relative h-80 lg:h-[420px] hidden lg:block" style={{ perspective: "1000px" }}>
            {/* Act 1 */}
            <motion.div style={{ opacity: card1o, y: card1y }} className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-sm rounded-2xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)]"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: "'Geist Mono', monospace", color: C.dim, fontSize: 9 }} className="uppercase tracking-widest mb-3">domains.txt</div>
                {["stripe.com", "linear.app", "vercel.com", "notion.so", "figma.com"].map((d, i) => (
                  <motion.div key={d} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                    className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: C.border }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.sage }} />
                    <span style={{ fontFamily: "'Geist Mono', monospace", color: C.text, fontSize: 13 }}>{d}</span>
                  </motion.div>
                ))}
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full" style={{ background: C.surface }}>
                    <motion.div className="h-full rounded-full" style={{ background: C.sage }}
                      animate={{ width: ["0%", "100%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
                  </div>
                  <span style={{ color: C.muted, fontSize: 10, fontFamily: "'Geist Mono', monospace" }}>queuing...</span>
                </div>
              </div>
            </motion.div>

            {/* Act 2 */}
            <motion.div style={{ opacity: card2o, y: card2y }} className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.08)]"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: C.border }}>
                  {[C.rose, "#E8C84040", C.sage].map((col, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: col }} />
                  ))}
                  <div className="flex-1 mx-3 rounded-lg px-3 py-1.5 text-[11px] truncate"
                    style={{ background: C.surface, color: C.muted, fontFamily: "'Geist Mono', monospace" }}>careers.stripe.com</div>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: "Session initialized",     color: C.sage,   done: true  },
                    { label: "Bypassing Greenhouse ATS", color: C.butter, done: true  },
                    { label: "Parsing 47 job postings",  color: C.butter, done: true  },
                    { label: "Extracting signals...",    color: C.rose,   done: false },
                  ].map((step, i) => (
                    <motion.div key={step.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.15 }} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: step.color }} />
                      <span style={{ color: step.done ? C.text : C.muted, fontFamily: "'Geist Mono', monospace", fontSize: 12 }}>{step.label}</span>
                      {!step.done && (
                        <motion.span style={{ color: step.color, fontSize: 12 }}
                          animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>▋</motion.span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Act 3 */}
            <motion.div style={{ opacity: card3o, y: card3y }} className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-sm rounded-2xl p-5 shadow-[0_24px_80px_rgba(0,0,0,0.08)]"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", color: C.text, fontWeight: 600, fontSize: 18 }}>Stripe</div>
                    <div style={{ fontFamily: "'Geist Mono', monospace", color: C.muted, fontSize: 10 }}>stripe.com</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <VelBars level={4} color={C.sage} />
                    <span style={{ color: C.sage, fontSize: 8, fontFamily: "'Geist Mono', monospace" }} className="uppercase tracking-widest">Aggressive</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Open roles", value: "47",       color: C.sage   },
                    { label: "Stage",      value: "Series H", color: C.butter },
                    { label: "Velocity",   value: "↑↑ +340%", color: C.rose   },
                    { label: "Stack",      value: "Go · Ruby", color: C.indigo },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl" style={{ background: C.surface }}>
                      <div style={{ color: C.dim, fontFamily: "'Geist Mono', monospace", fontSize: 9 }} className="uppercase tracking-widest mb-1">{item.label}</div>
                      <div style={{ color: item.color, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: C.border }}>
                  <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }}
                    animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                  <span style={{ color: C.green, fontFamily: "'Geist Mono', monospace", fontSize: 10 }} className="uppercase tracking-widest">enriched in 1.8s</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── 3D PRISM SCROLL — video-like rotating intelligence cube ─────────────── */
const PRISM_FACES = [
  {
    label: "Hiring",
    accent: C.sage,
    headline: "Velocity, decoded.",
    body: "Every open role, every team, every location — parsed from raw ATS pages into a single signal you can sort by.",
    metric: "47",
    metricLabel: "open roles",
    chips: ["Engineering ×18", "GTM ×11", "Product ×6"],
  },
  {
    label: "Tech",
    accent: C.butter,
    headline: "Stack, inferred.",
    body: "We read the job requirements. Languages, frameworks, infra choices — surfaced from what they actually need to hire for.",
    metric: "Go · Rust",
    metricLabel: "primary stack",
    chips: ["Kubernetes", "Postgres", "Temporal"],
  },
  {
    label: "Funding",
    accent: C.rose,
    headline: "Stage, sourced.",
    body: "Latest round, lead investors, post-money — extracted from press, careers boilerplate, and footer copy.",
    metric: "Series H",
    metricLabel: "$6.5B post",
    chips: ["Sequoia", "a16z", "Founders Fund"],
  },
  {
    label: "People",
    accent: C.indigo,
    headline: "Humans, found.",
    body: "Founders, executives, founding engineers — with public LinkedIns and emails when listed on the team page.",
    metric: "12",
    metricLabel: "key people",
    chips: ["CEO", "CTO", "Head of Eng"],
  },
];

function PrismScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.8 });

  /* Cube rotates a full 360 across the scroll, plus tilts and zooms cinematically */
  const cubeRotY = useTransform(smooth, [0, 1], [-15, 345]);
  const cubeRotX = useTransform(smooth, [0, 0.5, 1], [12, -8, 12]);
  const cubeScale = useTransform(smooth, [0, 0.5, 1], [0.85, 1.05, 0.85]);
  const cubeY = useTransform(smooth, [0, 1], [40, -40]);

  /* Background mood */
  const bgHueShift = useTransform(smooth, [0, 0.33, 0.66, 1],
    [`radial-gradient(ellipse 60% 60% at 50% 40%, ${C.sageLo} 0%, transparent 70%)`,
     `radial-gradient(ellipse 60% 60% at 50% 40%, ${C.butterLo} 0%, transparent 70%)`,
     `radial-gradient(ellipse 60% 60% at 50% 40%, ${C.roseLo} 0%, transparent 70%)`,
     `radial-gradient(ellipse 60% 60% at 50% 40%, ${C.sageLo} 0%, transparent 70%)`]);

  const progress = useTransform(smooth, [0, 1], ["0%", "100%"]);

  /* Per-face active opacity for the side text — discrete reveal aligned with rotation */
  const stops = [0, 0.25, 0.5, 0.75, 1];
  const faceActive = PRISM_FACES.map((_, i) => {
    const c = (i + 0.5) / PRISM_FACES.length;
    return useTransform(smooth, [Math.max(0, c - 0.18), c, Math.min(1, c + 0.18)], [0, 1, 0]); // eslint-disable-line react-hooks/rules-of-hooks
  });
  void stops;

  return (
    <section ref={containerRef} style={{ height: "300vh", position: "relative" }}>
      <div className="sticky top-0 h-screen overflow-hidden flex items-center" style={{ background: C.bg }}>
        {/* Atmospheric color wash that shifts per face */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{ background: bgHueShift }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.022] pointer-events-none"
          style={{ backgroundImage: `linear-gradient(${C.text} 1px, transparent 1px), linear-gradient(90deg, ${C.text} 1px, transparent 1px)`, backgroundSize: "100px 100px" }} />

        {/* Floating orbs that drift with scroll */}
        <FloatOrb mx="10%" my="20%" size={260} color={C.sageLo} sp={smooth} dir={1} />
        <FloatOrb mx="80%" my="70%" size={320} color={C.butterLo} sp={smooth} dir={-1} />
        <FloatOrb mx="20%" my="80%" size={200} color={C.roseLo} sp={smooth} dir={1} />

        {/* Eyebrow */}
        <div className="absolute top-10 left-6 lg:left-12 right-6 lg:right-12 flex items-center justify-between">
          <div style={{ fontFamily: "'Geist Mono', monospace", color: C.dim, fontSize: 9 }}
            className="uppercase tracking-[0.2em]">/ Intelligence model</div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block w-40 h-px" style={{ background: C.border }}>
              <motion.div className="h-full origin-left" style={{ background: C.text, scaleX: smooth }} />
            </div>
            <motion.div style={{ fontFamily: "'Geist Mono', monospace", color: C.text, fontSize: 9 }}
              className="uppercase tracking-[0.2em]">
              <motion.span>{progress}</motion.span>
            </motion.div>
          </div>
        </div>

        {/* Main stage */}
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 items-center">

          {/* Left: text panels stacked, fade in/out per face */}
          <div className="relative" style={{ minHeight: 360 }}>
            {PRISM_FACES.map((f, i) => (
              <motion.div key={f.label} style={{ opacity: faceActive[i] }}
                className="absolute inset-0 flex flex-col justify-center">
                <div style={{ fontFamily: "'Geist Mono', monospace", color: f.accent, fontSize: 10 }}
                  className="uppercase tracking-[0.22em] mb-5 flex items-center gap-3">
                  <span className="w-6 h-px" style={{ background: f.accent }} />
                  {`0${i + 1} · ${f.label}`}
                </div>
                <div style={{ fontFamily: "'Cormorant Garant', serif", color: C.text, fontWeight: 400, fontSize: "clamp(36px,4.4vw,64px)", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
                  {f.headline.split(",").map((seg, k) => (
                    <span key={k}>
                      {k === 0 ? seg + "," : <em style={{ color: f.accent, fontStyle: "italic" }}>{seg}</em>}
                      {k === 0 && <br />}
                    </span>
                  ))}
                </div>
                <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.8, maxWidth: 440 }} className="mt-6">{f.body}</p>
                <div className="flex flex-wrap gap-2 mt-8">
                  {f.chips.map(c => (
                    <span key={c} className="px-3 py-1 rounded-full"
                      style={{ background: `${f.accent}14`, color: f.accent, fontFamily: "'Geist Mono', monospace", fontSize: 10, letterSpacing: "0.04em", border: `1px solid ${f.accent}26` }}>
                      {c}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right: the 3D rotating prism */}
          <div className="relative h-[460px] lg:h-[520px] flex items-center justify-center"
            style={{ perspective: "1600px", perspectiveOrigin: "center center" }}>
            <motion.div
              style={{
                position: "relative",
                width: 320,
                height: 380,
                transformStyle: "preserve-3d",
                rotateY: cubeRotY,
                rotateX: cubeRotX,
                scale: cubeScale,
                y: cubeY,
              }}>
              {PRISM_FACES.map((f, i) => (
                <PrismFace key={f.label} face={f} index={i} total={PRISM_FACES.length} active={faceActive[i]} />
              ))}
              {/* Top + bottom caps for a complete solid */}
              <div style={{
                position: "absolute", inset: 0, transformOrigin: "center",
                transform: "rotateX(90deg) translateZ(190px)",
                width: 320, height: 320,
                background: `linear-gradient(135deg, ${C.card}, ${C.surface})`,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                opacity: 0.55,
              }} />
              <div style={{
                position: "absolute", inset: 0, transformOrigin: "center",
                transform: "rotateX(-90deg) translateZ(190px)",
                width: 320, height: 320,
                background: `linear-gradient(135deg, ${C.surface}, ${C.card})`,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                opacity: 0.55,
              }} />
            </motion.div>

            {/* Floor reflection */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-[340px] h-12 rounded-[50%] pointer-events-none"
              style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0.18), transparent 70%)`, filter: "blur(8px)" }} />
          </div>
        </div>

        {/* Face indicator pills */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
          {PRISM_FACES.map((f, i) => (
            <motion.div key={f.label} style={{ opacity: faceActive[i] }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              animate={{}}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: f.accent }} />
              <span style={{ fontFamily: "'Geist Mono', monospace", color: f.accent, fontSize: 9 }}
                className="uppercase tracking-[0.2em]">{f.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrismFace({ face, index, total, active }: {
  face: typeof PRISM_FACES[0]; index: number; total: number; active: MotionValue<number>;
}) {
  const angle = (360 / total) * index;
  /* Slight glow when this face is the active front-facing one */
  const glow = useTransform(active, [0, 1], [0, 0.4]);
  const boxShadow = useTransform(glow, g => `0 30px 80px rgba(0,0,0,${0.10 + g * 0.08}), 0 0 0 1px ${face.accent}${Math.round(20 + g * 60).toString(16).padStart(2,"0")}`);

  return (
    <motion.div
      style={{
        position: "absolute",
        width: 320,
        height: 380,
        left: 0,
        top: 0,
        transformStyle: "preserve-3d",
        transform: `rotateY(${angle}deg) translateZ(190px)`,
        background: C.card,
        border: `1px solid ${face.accent}30`,
        borderRadius: 14,
        boxShadow,
        backfaceVisibility: "hidden",
        overflow: "hidden",
      }}>
      {/* Inner gradient overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(165deg, ${face.accent}08 0%, transparent 55%)` }} />
      {/* Header */}
      <div className="px-6 pt-6 flex items-start justify-between">
        <div>
          <div style={{ fontFamily: "'Geist Mono', monospace", color: face.accent, fontSize: 9 }}
            className="uppercase tracking-[0.22em] mb-2">/ {face.label}</div>
          <div style={{ fontFamily: "'Cormorant Garant', serif", color: C.text, fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
            {face.headline}
          </div>
        </div>
        <div className="text-right">
          <div style={{ fontFamily: "'Geist Mono', monospace", color: C.dim, fontSize: 8 }}
            className="uppercase tracking-[0.2em]">0{index + 1}</div>
        </div>
      </div>
      {/* Big metric */}
      <div className="px-6 mt-8">
        <div style={{ fontFamily: "'Cormorant Garant', serif", color: face.accent, fontWeight: 400, fontSize: 72, letterSpacing: "-0.04em", lineHeight: 0.9 }}>
          {face.metric}
        </div>
        <div style={{ fontFamily: "'Geist Mono', monospace", color: C.muted, fontSize: 10 }}
          className="uppercase tracking-[0.2em] mt-2">{face.metricLabel}</div>
      </div>
      {/* Chips */}
      <div className="absolute left-6 right-6 bottom-6 flex flex-wrap gap-1.5">
        {face.chips.map(c => (
          <span key={c} className="px-2 py-1 rounded-md"
            style={{ background: C.surface, color: C.muted, fontFamily: "'Geist Mono', monospace", fontSize: 9, border: `1px solid ${C.border}` }}>
            {c}
          </span>
        ))}
      </div>
      {/* Decorative scan line */}
      <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(to right, transparent, ${face.accent}80, transparent)` }}
        animate={{ top: ["10%", "92%", "10%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: index * 0.6 }} />
    </motion.div>
  );
}

function FloatOrb({ mx, my, size, color, sp, dir }: { mx: string; my: string; size: number; color: string; sp: MotionValue<number>; dir: number }) {
  const x = useTransform(sp, [0, 1], [0, dir * 80]);
  const y = useTransform(sp, [0, 1], [0, dir * -60]);
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{
        left: mx, top: my, width: size, height: size,
        background: color, filter: "blur(60px)",
        x, y,
      }} />
  );
}

/* ─────────────── MORPH SCENE — sticky scroll with image-morph + 3D atmosphere ─────────────── */
const MORPH_FRAMES = [
  {
    label: "Raw web",
    title: "It starts as raw HTML.",
    body: "Career pages, ATS walls, founder blogs — chaotic, inconsistent, locked behind bot detection.",
    accent: C.rose,
    img: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&q=80&auto=format&fit=crop",
    radius: "50% 50% 50% 50%",
    rotate: -6,
    scale: 0.72,
  },
  {
    label: "Stealth fetch",
    title: "Stealth browsers crawl every URL.",
    body: "Hyperbrowser sessions spin up, fingerprint-spoof, render JavaScript, bypass Greenhouse — the page is yours.",
    accent: C.butter,
    img: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1400&q=80&auto=format&fit=crop",
    radius: "32% 68% 28% 72% / 50% 28% 72% 50%",
    rotate: 3,
    scale: 0.95,
  },
  {
    label: "AI extraction",
    title: "Claude reshapes it into structure.",
    body: "Typed fields. Tech stack. Hiring velocity. Every signal pulled from messy text into a single profile object.",
    accent: C.sage,
    img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1400&q=80&auto=format&fit=crop",
    radius: "20px 20px 20px 20px",
    rotate: 0,
    scale: 1.05,
  },
  {
    label: "Your edge",
    title: "And you walk in already knowing.",
    body: "Founders, investors, recruiters, sales — every conversation starts five steps ahead.",
    accent: C.indigo,
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80&auto=format&fit=crop",
    radius: "120px 24px 120px 24px",
    rotate: -2,
    scale: 1.1,
  },
];

function ParticleDot({ p, color, sp }: { p: { x: number; y: number; size: number; depth: number; drift: number; delay: number }; color: string; sp: MotionValue<number> }) {
  const y = useTransform(sp, [0, 1], [p.depth * 80, -p.depth * 80]);
  const x = useTransform(sp, [0, 1], [-p.depth * 40, p.depth * 40]);
  return (
    <motion.div className="absolute rounded-full"
      style={{
        left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
        background: color, opacity: 0.5, x, y,
        filter: `blur(${p.depth < 0.7 ? 1.5 : 0}px)`,
        boxShadow: `0 0 ${p.size * 4}px ${color}`,
      }}
      animate={{ y: [0, -p.drift * 4, 0] }}
      transition={{ duration: p.drift, repeat: Infinity, ease: "easeInOut", delay: p.delay }} />
  );
}

function Particles({ count = 28, sp }: { count?: number; sp: MotionValue<number> }) {
  /* Generate on mount only — Math.random() during SSR causes hydration mismatch. */
  const [items, setItems] = useState<Array<{ id: number; x: number; y: number; size: number; depth: number; hue: number; drift: number; delay: number }>>([]);
  useEffect(() => {
    setItems(Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 5,
      depth: 0.3 + Math.random() * 1.4,
      hue: i % 4,
      drift: 4 + Math.random() * 6,
      delay: Math.random() * 4,
    })));
  }, [count]);
  const colors = [C.sage, C.butter, C.rose, C.indigo];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map(p => (
        <ParticleDot key={p.id} p={p} color={colors[p.hue]} sp={sp} />
      ))}
    </div>
  );
}

function MorphScene() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const sp = useSpring(scrollYProgress, { stiffness: 70, damping: 24, mass: 0.7 });

  const N = MORPH_FRAMES.length;

  /* Per-frame opacity windows — overlapping crossfades */
  const frameOpacities = MORPH_FRAMES.map((_, i) => {
    const c = (i + 0.5) / N;
    const w = 0.5 / N;
    return useTransform(sp, [Math.max(0, c - w), c, Math.min(1, c + w)], [0, 1, 0]); // eslint-disable-line react-hooks/rules-of-hooks
  });

  const stops = MORPH_FRAMES.map((_, i) => i / (N - 1));
  const radius = useTransform(sp, stops, MORPH_FRAMES.map(f => f.radius));
  const rotate = useTransform(sp, stops, MORPH_FRAMES.map(f => f.rotate));
  const scale  = useTransform(sp, stops, MORPH_FRAMES.map(f => f.scale));

  const tiltX = useTransform(sp, [0, 0.5, 1], [10, -6, 8]);
  const tiltY = useTransform(sp, [0, 0.5, 1], [-12, 4, -8]);

  const bgWash = useTransform(sp, stops,
    MORPH_FRAMES.map(f => `radial-gradient(ellipse 70% 60% at 50% 45%, ${f.accent}1A 0%, transparent 70%)`));

  const fogX1 = useTransform(sp, [0, 1], [0, -120]);
  const fogX2 = useTransform(sp, [0, 1], [0, 140]);
  const fogY  = useTransform(sp, [0, 1], [0, -60]);

  const tagAOpacity = useTransform(sp, [0.5, 0.7, 1], [0, 1, 1]);
  const tagAY       = useTransform(sp, [0.5, 1], [20, -10]);
  const tagBOpacity = useTransform(sp, [0.6, 0.8, 1], [0, 1, 1]);
  const tagBY       = useTransform(sp, [0.6, 1], [-20, 10]);

  const [idx, setIdx] = useState(0);
  useEffect(() => sp.on("change", v => setIdx(Math.min(N - 1, Math.max(0, Math.floor(v * N))))), [sp, N]);

  return (
    <section ref={ref} style={{ height: "300vh", position: "relative" }}>
      <div className="sticky top-0 h-screen overflow-hidden flex items-center" style={{ background: C.bg }}>

        {/* ── Atmospheric environment ── */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{ background: bgWash }} />

        {/* Fog layers */}
        <motion.div className="absolute -left-1/4 top-0 w-[60%] h-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 50% 50% at 30% 50%, ${C.surface} 0%, transparent 70%)`,
            filter: "blur(20px)", x: fogX1, y: fogY, opacity: 0.7,
          }} />
        <motion.div className="absolute -right-1/4 top-0 w-[60%] h-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 50% 50% at 70% 50%, ${C.surface} 0%, transparent 70%)`,
            filter: "blur(20px)", x: fogX2, y: fogY, opacity: 0.7,
          }} />

        {/* Mesh grid */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: `linear-gradient(${C.text} 1px, transparent 1px), linear-gradient(90deg, ${C.text} 1px, transparent 1px)`, backgroundSize: "120px 120px" }} />

        {/* Floating particles */}
        <Particles count={36} sp={sp} />

        {/* Eyebrow + progress dots */}
        <div className="absolute top-8 left-6 lg:left-12 right-6 lg:right-12 flex items-center justify-between z-20">
          <div style={{ fontFamily: "'Geist Mono', monospace", color: C.dim, fontSize: 9 }}
            className="uppercase tracking-[0.22em]">/ How a domain becomes a profile</div>
          <div className="hidden sm:flex items-center gap-2.5">
            {MORPH_FRAMES.map((f, i) => (
              <div key={f.label} className="h-px transition-all duration-500"
                style={{ width: i === idx ? 36 : 14, background: i === idx ? f.accent : C.border }} />
            ))}
          </div>
        </div>

        {/* ── Stage ── */}
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">

          {/* Left text crossfades */}
          <div className="relative" style={{ minHeight: 320 }}>
            {MORPH_FRAMES.map((f, i) => (
              <motion.div key={f.label} style={{ opacity: frameOpacities[i] }}
                className="absolute inset-0 flex flex-col justify-center">
                <div style={{ fontFamily: "'Geist Mono', monospace", color: f.accent, fontSize: 10 }}
                  className="uppercase tracking-[0.22em] mb-5 flex items-center gap-3">
                  <span className="w-6 h-px" style={{ background: f.accent }} />
                  {`Phase 0${i + 1} · ${f.label}`}
                </div>
                <div style={{ fontFamily: "'Cormorant Garant', serif", color: C.text, fontWeight: 400, fontSize: "clamp(34px,4vw,58px)", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
                  {f.title}
                </div>
                <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.75, maxWidth: 460 }} className="mt-5">{f.body}</p>
              </motion.div>
            ))}
          </div>

          {/* Right: morphing image */}
          <div className="relative h-[420px] lg:h-[520px] flex items-center justify-center"
            style={{ perspective: "1400px", perspectiveOrigin: "center" }}>

            {/* Outer halo */}
            <motion.div className="absolute pointer-events-none rounded-full"
              style={{
                width: 460, height: 460,
                background: `radial-gradient(circle, ${MORPH_FRAMES[idx].accent}30 0%, transparent 60%)`,
                filter: "blur(40px)",
                transition: "background 800ms ease",
              }}
              animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />

            {/* Morph element */}
            <motion.div
              className="relative shadow-[0_40px_100px_rgba(0,0,0,0.18),0_8px_30px_rgba(0,0,0,0.10)]"
              style={{
                width: "min(420px, 85%)",
                height: "min(420px, 85%)",
                borderRadius: radius,
                rotate,
                scale,
                rotateX: tiltX,
                rotateY: tiltY,
                transformStyle: "preserve-3d",
                overflow: "hidden",
                background: C.surface,
                border: `1px solid ${C.border}`,
              }}>
              {MORPH_FRAMES.map((f, i) => (
                <motion.div key={f.label}
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${f.img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: frameOpacities[i],
                    filter: "saturate(0.9)",
                  }} />
              ))}
              {MORPH_FRAMES.map((f, i) => (
                <motion.div key={`tint-${f.label}`}
                  className="absolute inset-0 mix-blend-multiply pointer-events-none"
                  style={{
                    background: `linear-gradient(160deg, ${f.accent}55 0%, transparent 60%)`,
                    opacity: frameOpacities[i],
                  }} />
              ))}
              <div className="absolute inset-3 pointer-events-none"
                style={{ borderRadius: "inherit", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)" }} />
              <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
                style={{ background: `linear-gradient(to right, transparent, rgba(255,255,255,0.45), transparent)` }}
                animate={{ top: ["10%", "92%", "10%"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
            </motion.div>

            {/* Floating data tags */}
            <motion.div className="absolute"
              style={{ top: "12%", right: "-2%", opacity: tagAOpacity, y: tagAY }}>
              <div className="px-3 py-2 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.10)]"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: "'Geist Mono', monospace", color: C.dim, fontSize: 9 }} className="uppercase tracking-widest">velocity</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", color: C.sage, fontWeight: 600, fontSize: 14 }}>↑↑ Aggressive</div>
              </div>
            </motion.div>
            <motion.div className="absolute"
              style={{ bottom: "12%", left: "-2%", opacity: tagBOpacity, y: tagBY }}>
              <div className="px-3 py-2 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.10)]"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: "'Geist Mono', monospace", color: C.dim, fontSize: 9 }} className="uppercase tracking-widest">stack</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", color: C.indigo, fontWeight: 600, fontSize: 14 }}>Go · Rust · k8s</div>
              </div>
            </motion.div>

            {/* Floor reflection */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 w-[360px] h-12 rounded-[50%] pointer-events-none"
              style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0.16), transparent 70%)`, filter: "blur(10px)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── FEATURES ─────────────── */
const FEATURES = [
  { n: "01", title: "Stealth sessions",     body: "Each domain gets its own fingerprint-spoofed Hyperbrowser session. Greenhouse, Lever, Workday — bypassed automatically." },
  { n: "02", title: "AI-structured output", body: "Not raw HTML. Typed fields: tech stack inferred from job requirements, velocity from role count, signals from copy." },
  { n: "03", title: "Live streaming",       body: "Results stream back as each domain resolves. Watch intelligence build in real time, not after a spinner finishes." },
  { n: "04", title: "Export & history",     body: "Every run saved locally. One-click CSV for your CRM, Notion, or spreadsheet — whenever you need it." },
];

function FeatureRow({ n, title, body, index }: typeof FEATURES[0] & { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const [hov, setHov] = useState(false);
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.08, ease: E }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="grid grid-cols-[56px_1fr_1fr] gap-8 items-start py-9 border-b relative overflow-hidden"
      style={{ borderColor: C.border }}>
      <motion.div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: C.sage }}
        initial={{ scaleY: 0, transformOrigin: "top" }}
        animate={{ scaleY: hov ? 1 : 0 }}
        transition={{ duration: 0.35, ease: E }} />
      <motion.span animate={{ x: hov ? 5 : 0 }} transition={{ duration: 0.3, ease: E }}
        style={{ fontFamily: "'Geist Mono', monospace", color: hov ? C.sage : C.dim, fontSize: 10 }}
        className="uppercase tracking-widest pt-1">{n}</motion.span>
      <motion.div animate={{ x: hov ? 5 : 0 }} transition={{ duration: 0.3, ease: E }}
        style={{ fontFamily: "'Cormorant Garant', serif", color: C.text, fontWeight: 500, fontSize: "clamp(20px,2.2vw,28px)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
        {title}
      </motion.div>
      <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.75 }}>{body}</p>
    </motion.div>
  );
}

/* ─────────────── USE CASES — 3D TILT ─────────────── */
const USECASES = [
  { role: "Sales",      headline: "Know before you dial.",          body: "Walk in knowing their stack, growth stage, and pain — before the first call.", color: C.sage   },
  { role: "Recruiting", headline: "Find the pull, not the push.",   body: "Surface companies actively hiring in your niche. Know what they need before you reach out.", color: C.butter },
  { role: "Investors",  headline: "Hiring is a leading indicator.", body: "Velocity and stack signal trajectory better than a pitch deck ever will.", color: C.rose   },
  { role: "Founders",   headline: "Watch competition breathe.",     body: "Know when they hire and what they're building — before it shows up on TechCrunch.", color: C.indigo },
];

function UsecaseCard({ role, headline, body, color, index }: typeof USECASES[0] & { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const cardRef = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const sRotX = useSpring(rotX, { stiffness: 200, damping: 30 });
  const sRotY = useSpring(rotY, { stiffness: 200, damping: 30 });
  const isLeft = index % 2 === 0;

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    rotX.set(-dy * 14);
    rotY.set(dx * 14);
  }, [rotX, rotY]);

  const onLeave = useCallback(() => { rotX.set(0); rotY.set(0); }, [rotX, rotY]);

  return (
    <div ref={ref} style={{ perspective: "900px" }}>
      <motion.div ref={cardRef}
        style={{ rotateX: sRotX, rotateY: sRotY, transformStyle: "preserve-3d", background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 8px 40px rgba(0,0,0,0.04)" }}
        initial={{ opacity: 0, x: isLeft ? -40 : 40, rotate: isLeft ? -2 : 2 }}
        animate={inView ? { opacity: 1, x: 0, rotate: 0 } : {}}
        transition={{ ...SP, delay: index * 0.07 }}
        onMouseMove={onMove} onMouseLeave={onLeave}
        className="p-8 rounded-2xl cursor-none relative">
        {/* Floating depth layer */}
        <div className="w-8 h-8 rounded-full mb-6 flex items-center justify-center"
          style={{ background: `${color}18` }}>
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        </div>
        <div style={{ fontFamily: "'Geist Mono', monospace", color, fontSize: 9 }} className="uppercase tracking-[0.18em] mb-3">{role}</div>
        <div style={{ fontFamily: "'Cormorant Garant', serif", color: C.text, fontWeight: 500, fontSize: "clamp(22px,2.2vw,28px)", letterSpacing: "-0.01em", lineHeight: 1.2 }} className="mb-4">{headline}</div>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.75 }}>{body}</p>
        {/* Shine overlay */}
        <motion.div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100"
          style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)` }} />
      </motion.div>
    </div>
  );
}

/* ─────────────── PAGE ─────────────── */
export default function LandingPage() {
  /* Global mouse for 3D hero */
  const globalMX = useMotionValue(0);
  const globalMY = useMotionValue(0);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      globalMX.set((e.clientX / window.innerWidth - 0.5) * 2);
      globalMY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, [globalMX, globalMY]);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroSP } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroSP, [0, 1], ["0%", "18%"]);
  const heroO = useTransform(heroSP, [0, 0.7], [1, 0]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const [scrolled, setScrolled] = useState(false);
  const [navVis, setNavVis] = useState(true);
  const lastY = useRef(0);
  useEffect(() => {
    const u = scrollYProgress.on("change", () => {
      const cur = window.scrollY;
      setScrolled(cur > 60);
      if (cur < 80) { setNavVis(true); lastY.current = cur; return; }
      if (cur > lastY.current + 8) setNavVis(false);
      else if (cur < lastY.current - 8) setNavVis(true);
      lastY.current = cur;
    });
    return u;
  }, [scrollYProgress]);

  return (
    <SmoothScroll>
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, color: C.text, cursor: "none" }}
        className="min-h-screen overflow-x-hidden">
        <Cursor />
        <Grain />

        {/* scroll progress */}
        <motion.div className="fixed top-0 left-0 right-0 h-px origin-left z-[60]"
          style={{ scaleX, background: C.sage }} />

        {/* ══ NAV ══ */}
        <motion.nav
          className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-5 flex items-center justify-between"
          animate={{
            y: navVis ? 0 : -80,
            background: scrolled ? "rgba(247,244,237,0.92)" : "rgba(247,244,237,0)",
            backdropFilter: scrolled ? "blur(20px)" : "blur(0px)",
            borderBottomColor: scrolled ? C.border : "rgba(221,215,204,0)",
            borderBottomWidth: 1,
            borderBottomStyle: "solid" as const,
          }}
          transition={{ duration: 0.4, ease: E }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: E }}
            style={{ fontFamily: "'Cormorant Garant', serif", color: C.text, fontWeight: 600, fontSize: 20, letterSpacing: "-0.02em" }}>
            Prospect<span style={{ color: C.sage }}>IQ</span>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }} className="hidden md:flex items-center gap-3">
            <span className="w-1 h-1 rounded-full" style={{ background: C.sage }} />
            <span style={{ fontFamily: "'Geist Mono', monospace", color: C.dim, fontSize: 10 }}
              className="uppercase tracking-[0.22em]">v1 · live</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: E }}>
            <MagneticBtn href="/app">Open app →</MagneticBtn>
          </motion.div>
        </motion.nav>

        {/* ══ HERO ══ */}
        <section ref={heroRef} className="relative min-h-screen flex overflow-hidden">
          {/* Atmospheric bg */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0"
              style={{ background: `radial-gradient(ellipse 75% 65% at 25% 55%, ${C.sageLo} 0%, transparent 60%)` }} />
            <div className="absolute top-0 right-0 w-[700px] h-[700px]"
              style={{ background: `radial-gradient(circle at 75% 20%, ${C.butterLo} 0%, transparent 55%)` }} />
            {/* subtle grid */}
            <div className="absolute inset-0 opacity-[0.015]"
              style={{ backgroundImage: `linear-gradient(${C.text} 1px, transparent 1px), linear-gradient(90deg, ${C.text} 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
            {/* Atmospheric particles */}
            <Particles count={26} sp={heroSP} />
          </div>

          <motion.div style={{ y: heroY, opacity: heroO }}
            className="relative z-10 w-full flex flex-col lg:flex-row items-center pt-24 pb-10 px-6 lg:px-12 gap-12 lg:gap-0">

            {/* Left — text */}
            <div className="flex-1 flex flex-col">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.55, ease: E }}
                className="inline-flex items-center gap-2.5 self-start px-4 py-2 rounded-full mb-12"
                style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }}
                  animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                <span style={{ fontFamily: "'Geist Mono', monospace", color: C.muted, fontSize: 10 }}
                  className="uppercase tracking-[0.12em]">Live enrichment · No signup required</span>
              </motion.div>

              {[
                { text: "Company intelligence,", delay: 0.6,  italic: false, color: C.text },
                { text: "on demand.",             delay: 0.75, italic: true,  color: C.sage },
              ].map(({ text, delay, italic, color }) => (
                <div key={text} className="overflow-hidden">
                  <motion.div
                    initial={{ y: "110%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    transition={{ duration: 0.95, delay, ease: E }}
                    style={{
                      fontFamily: "'Cormorant Garant', serif",
                      fontStyle: italic ? "italic" : "normal",
                      color,
                      fontSize: "clamp(50px,7.5vw,104px)",
                      fontWeight: 300,
                      lineHeight: 1.0,
                      letterSpacing: "-0.025em",
                    }}>{text}</motion.div>
                </div>
              ))}

              <motion.p
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 1.0, ease: E }}
                style={{ color: C.muted, fontSize: 17, lineHeight: 1.75, maxWidth: 400, fontWeight: 300 }}
                className="mt-8 mb-10">
                Paste any list of company domains. Stream back structured intelligence
                — hiring signals, tech stack, funding stage — instantly.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 1.15, ease: E }}
                className="flex items-center gap-4">
                <MagneticBtn href="/app">Start enriching →</MagneticBtn>
              </motion.div>

              {/* scroll cue */}
              <motion.div className="flex items-center gap-3 mt-10"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
                <motion.div className="w-10 h-px"
                  style={{ background: `linear-gradient(to right, ${C.sage}, transparent)` }}
                  animate={{ scaleX: [0, 1, 0], transformOrigin: "left" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                <span style={{ fontFamily: "'Geist Mono', monospace", color: C.dim, fontSize: 9 }}
                  className="uppercase tracking-[0.2em]">Scroll</span>
              </motion.div>
            </div>

            {/* Right — 3D floating card stack */}
            <div className="relative w-full lg:w-[480px] lg:flex-shrink-0 h-[480px] hidden lg:block"
              style={{ perspective: "1400px", perspectiveOrigin: "center 40%" }}>

              {/* Glowing orbs behind cards */}
              <motion.div className="absolute rounded-full blur-3xl pointer-events-none"
                style={{ width: 280, height: 280, top: "10%", left: "15%", background: `${C.sageLo}`, opacity: 0.7 }}
                animate={{ scale: [1, 1.15, 1], x: [0, 15, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
              <motion.div className="absolute rounded-full blur-3xl pointer-events-none"
                style={{ width: 200, height: 200, bottom: "10%", right: "5%", background: `${C.butterLo}`, opacity: 0.6 }}
                animate={{ scale: [1, 1.2, 1], x: [0, -10, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }} />

              <HeroCard3D co={PREVIEW[0]} delay={0.9}  rotate={-5} zIndex={30} offsetX={40}  offsetY={20}  depth={1.2} mx={globalMX} my={globalMY} />
              <HeroCard3D co={PREVIEW[1]} delay={1.15} rotate={4}  zIndex={20} offsetX={80}  offsetY={130} depth={1.8} mx={globalMX} my={globalMY} />
              <HeroCard3D co={PREVIEW[2]} delay={1.4}  rotate={-2} zIndex={10} offsetX={120} offsetY={240} depth={2.4} mx={globalMX} my={globalMY} />
            </div>
          </motion.div>
        </section>

        {/* ══ TICKER ══ */}
        <Ticker />

        {/* ══ STATS ══ */}
        <StatsSection />

        {/* ══ STORY SCROLL ══ */}
        <StorySection />

        {/* ══ 3D PRISM SCROLL — the video-like rotating intelligence cube ══ */}
        <PrismScroll />

        {/* ══ FEATURES ══ */}
        <section className="py-20 border-t" id="features" style={{ borderColor: C.border }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
            <div className="mb-10">
              <motion.div style={{ fontFamily: "'Geist Mono', monospace", color: C.sage, fontSize: 10 }}
                className="uppercase tracking-[0.16em] mb-5"
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                / Capabilities
              </motion.div>
              <div className="overflow-hidden">
                <motion.div
                  style={{ fontFamily: "'Cormorant Garant', serif", color: C.text, fontWeight: 400, fontSize: "clamp(30px,4vw,52px)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
                  initial={{ y: "110%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.9, ease: E }}>
                  Everything you need to know<br /><em style={{ color: C.sage }}>about any company.</em>
                </motion.div>
              </div>
            </div>
            <div className="border-t" style={{ borderColor: C.border }}>
              {FEATURES.map((f, i) => <FeatureRow key={f.n} {...f} index={i} />)}
            </div>
          </div>
        </section>

        {/* ══ MARQUEE ══ */}
        <div className="relative overflow-hidden py-9 border-y" style={{ borderColor: C.border, background: C.surface }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(to right, ${C.surface}, transparent 6%, transparent 94%, ${C.surface})` }} />
          <motion.div className="flex gap-14 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }}>
            {[...Array(10)].map((_, i) => (
              <span key={i} className="inline-flex items-center gap-10 shrink-0">
                <span style={{ fontFamily: "'Cormorant Garant', serif", color: `${C.text}22`, fontWeight: 300, letterSpacing: "-0.02em", fontSize: "clamp(36px,5vw,60px)", fontStyle: "italic" }}>enrich</span>
                <span style={{ color: C.sage, fontSize: "clamp(16px,2vw,24px)" }}>◆</span>
                <span style={{ fontFamily: "'Cormorant Garant', serif", color: `${C.text}22`, fontWeight: 300, letterSpacing: "-0.02em", fontSize: "clamp(36px,5vw,60px)" }}>signal</span>
                <span style={{ color: `${C.butter}60`, fontSize: "clamp(16px,2vw,24px)" }}>◆</span>
              </span>
            ))}
          </motion.div>
        </div>

        {/* ══ USE CASES ══ */}
        <section className="py-20" id="usecases">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
            <div className="mb-10">
              <motion.div style={{ fontFamily: "'Geist Mono', monospace", color: C.sage, fontSize: 10 }}
                className="uppercase tracking-[0.16em] mb-5"
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                / Who uses this
              </motion.div>
              <div className="overflow-hidden">
                <motion.div
                  style={{ fontFamily: "'Cormorant Garant', serif", color: C.text, fontWeight: 400, fontSize: "clamp(30px,4vw,52px)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
                  initial={{ y: "110%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.9, ease: E }}>
                  Built for people<br /><em style={{ color: C.butter }}>who need an edge.</em>
                </motion.div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {USECASES.map((u, i) => <UsecaseCard key={u.role} {...u} index={i} />)}
            </div>
          </div>
        </section>

        {/* ══ MORPH SCENE — image morph + 3D atmosphere ══ */}
        <MorphScene />

        {/* ══ CTA ══ */}
        <section className="relative py-24 overflow-hidden border-t" style={{ borderColor: C.border, background: C.card }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 60% 70% at 50% 50%, ${C.sageLo} 0%, transparent 70%)` }} />
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12 text-center relative z-10">
            <div className="overflow-hidden mb-4">
              <motion.div
                style={{ fontFamily: "'Cormorant Garant', serif", color: C.text, fontWeight: 300, letterSpacing: "-0.03em", lineHeight: 0.95, fontSize: "clamp(48px,9vw,120px)" }}
                initial={{ y: "110%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 1.0, ease: E }}>
                Stop guessing.
              </motion.div>
            </div>
            <div className="overflow-hidden mb-12">
              <motion.div
                style={{ fontFamily: "'Cormorant Garant', serif", color: C.sage, fontWeight: 300, fontStyle: "italic", letterSpacing: "-0.03em", lineHeight: 0.95, fontSize: "clamp(48px,9vw,120px)" }}
                initial={{ y: "110%", opacity: 0 }} whileInView={{ y: "0%", opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 1.0, delay: 0.1, ease: E }}>
                Start knowing.
              </motion.div>
            </div>
            <motion.p style={{ color: C.muted, fontSize: 17, lineHeight: 1.8, fontWeight: 300, maxWidth: 420, margin: "0 auto 48px" }}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }}>
              Every sales rep, recruiter, and investor who uses ProspectIQ walks in more prepared than the competition.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.5 }}
              className="flex items-center justify-center gap-4">
              <MagneticBtn href="/app">Enrich your first company →</MagneticBtn>
            </motion.div>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer className="border-t py-10 px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: C.border }}>
          <span style={{ fontFamily: "'Cormorant Garant', serif", color: C.text, fontWeight: 600, fontSize: 18, letterSpacing: "-0.02em" }}>
            Prospect<span style={{ color: C.sage }}>IQ</span>
          </span>
          <span style={{ fontFamily: "'Geist Mono', monospace", color: C.dim, fontSize: 10 }} className="uppercase tracking-widest">
            Built with{" "}
            <a href="https://www.hyperbrowser.ai" target="_blank" rel="noopener noreferrer"
              style={{ color: C.muted }} className="hover:text-[#1A1714] transition-colors">Hyperbrowser</a>
            {" "}+ Claude AI
          </span>
        </footer>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=DM+Sans:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');
          html { scroll-behavior: smooth; }
          * { -webkit-font-smoothing: antialiased; box-sizing: border-box; }
          ::selection { background: ${C.sageLo}; color: ${C.text}; }
        `}</style>
      </div>
    </SmoothScroll>
  );
}
