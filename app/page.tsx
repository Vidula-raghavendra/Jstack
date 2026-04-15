"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
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

/* ────────────────────────────────── tokens */

const C = {
  bg:      "#09080A",
  surface: "#0F0D10",
  border:  "#1C1A22",
  text:    "#EDE8DF",
  muted:   "#5C5668",
  dim:     "#2E2B38",
  amber:   "#E8A020",
  amberLo: "rgba(232,160,32,0.08)",
  amberMd: "rgba(232,160,32,0.18)",
  indigo:  "#7C83E8",
  green:   "#34C48A",
};

/* ────────────────────────────────── util */

function useCounter(to: number, duration = 2.2) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const [val, setVal] = useState("0");

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, mv, to]);

  useEffect(() => spring.on("change", (v) => setVal(String(Math.round(v)))), [spring]);

  return { ref, val };
}

/* ────────────────────────────────── ambient canvas */

function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = 0, H = 0, frame = 0;

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // floating particles
    const pts = Array.from({ length: 60 }, () => ({
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      r: 0.5 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      a: 0.1 + Math.random() * 0.4,
    }));

    let raf: number;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      frame++;
      ctx.clearRect(0, 0, W, H);

      // subtle grid
      ctx.strokeStyle = "rgba(232,160,32,0.025)";
      ctx.lineWidth = 1;
      const gs = 80;
      for (let x = 0; x < W; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // drifting particles
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x % W, p.y % H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,160,32,${p.a * (0.6 + 0.4 * Math.sin(frame * 0.015 + p.x))})`;
        ctx.fill();
      }
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

/* ────────────────────────────────── blueprint svg */

function BlueprintDiagram() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1, opacity: 1,
      transition: { pathLength: { duration: 2, delay: i * 0.15, ease: "easeInOut" }, opacity: { duration: 0.3, delay: i * 0.15 } },
    }),
  };
  const dotVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1, opacity: 1,
      transition: { duration: 0.4, delay: 0.8 + i * 0.1, ease: [0.16, 1, 0.3, 1] },
    }),
  };

  return (
    <svg ref={ref} viewBox="0 0 800 400" className="w-full max-w-3xl mx-auto" style={{ overflow: "visible" }}>
      {/* domain box */}
      <motion.rect x="20" y="160" width="140" height="80" rx="8"
        stroke={C.amber} strokeWidth="1" fill="none" strokeDasharray="4 4"
        variants={pathVariants} custom={0} initial="hidden" animate={inView ? "visible" : "hidden"}
      />
      <motion.text x="90" y="195" textAnchor="middle" fill={C.muted} fontSize="11" fontFamily="Geist Mono, monospace"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}>
        domains.txt
      </motion.text>
      <motion.text x="90" y="213" textAnchor="middle" fill={C.amber} fontSize="10" fontFamily="Geist Mono, monospace"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.6 }}>
        stripe.com
      </motion.text>
      <motion.text x="90" y="228" textAnchor="middle" fill={C.amber} fontSize="10" fontFamily="Geist Mono, monospace"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.65 }}>
        linear.app
      </motion.text>

      {/* arrow 1 */}
      <motion.path d="M 160 200 L 230 200" stroke={C.amber} strokeWidth="1.5" fill="none" markerEnd="url(#arr)"
        variants={pathVariants} custom={1} initial="hidden" animate={inView ? "visible" : "hidden"}
      />

      {/* browser circle */}
      <motion.circle cx="290" cy="200" r="55"
        stroke={C.amber} strokeWidth="1" fill="none"
        variants={pathVariants} custom={2} initial="hidden" animate={inView ? "visible" : "hidden"}
      />
      <motion.text x="290" y="195" textAnchor="middle" fill={C.text} fontSize="11" fontFamily="Geist Mono, monospace" fontWeight="500"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.9 }}>
        Stealth
      </motion.text>
      <motion.text x="290" y="212" textAnchor="middle" fill={C.amber} fontSize="10" fontFamily="Geist Mono, monospace"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.95 }}>
        Browser
      </motion.text>
      {/* orbit dots */}
      {[0,60,120,180,240,300].map((deg, i) => (
        <motion.circle key={i}
          cx={290 + 55 * Math.cos((deg * Math.PI) / 180)}
          cy={200 + 55 * Math.sin((deg * Math.PI) / 180)}
          r="3" fill={C.amber}
          variants={dotVariants} custom={i} initial="hidden" animate={inView ? "visible" : "hidden"}
        />
      ))}

      {/* arrow 2 */}
      <motion.path d="M 345 200 L 415 200" stroke={C.amber} strokeWidth="1.5" fill="none" markerEnd="url(#arr)"
        variants={pathVariants} custom={5} initial="hidden" animate={inView ? "visible" : "hidden"}
      />

      {/* AI box */}
      <motion.rect x="415" y="155" width="120" height="90" rx="12"
        stroke={C.indigo} strokeWidth="1" fill={`${C.indigo}0A`}
        variants={pathVariants} custom={6} initial="hidden" animate={inView ? "visible" : "hidden"}
      />
      <motion.text x="475" y="197" textAnchor="middle" fill={C.text} fontSize="11" fontFamily="Geist Mono, monospace" fontWeight="500"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1.4 }}>
        Claude AI
      </motion.text>
      <motion.text x="475" y="215" textAnchor="middle" fill={C.indigo} fontSize="9" fontFamily="Geist Mono, monospace"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1.5 }}>
        extraction
      </motion.text>
      {[0,1,2].map((i) => (
        <motion.circle key={i} cx={430 + i * 22} cy={230} r="2.5" fill={C.indigo}
          variants={dotVariants} custom={i + 6} initial="hidden" animate={inView ? "visible" : "hidden"}
        />
      ))}

      {/* arrow 3 */}
      <motion.path d="M 535 200 L 605 200" stroke={C.amber} strokeWidth="1.5" fill="none" markerEnd="url(#arr)"
        variants={pathVariants} custom={9} initial="hidden" animate={inView ? "visible" : "hidden"}
      />

      {/* output box */}
      <motion.rect x="605" y="140" width="180" height="120" rx="8"
        stroke={C.green} strokeWidth="1" fill={`${C.green}08`}
        variants={pathVariants} custom={10} initial="hidden" animate={inView ? "visible" : "hidden"}
      />
      {["tech stack", "open roles", "velocity", "signals", "funding"].map((label, i) => (
        <motion.text key={label} x="620" y={165 + i * 18} fill={i === 0 ? C.text : C.muted}
          fontSize="10" fontFamily="Geist Mono, monospace"
          initial={{ opacity: 0, x: -10 }} animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 1.8 + i * 0.08 }}>
          {`› ${label}`}
        </motion.text>
      ))}

      {/* labels */}
      <motion.text x="90" y="258" textAnchor="middle" fill={C.dim} fontSize="9" fontFamily="Geist Mono, monospace" letterSpacing="1"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.4 }}>
        INPUT
      </motion.text>
      <motion.text x="290" y="268" textAnchor="middle" fill={C.dim} fontSize="9" fontFamily="Geist Mono, monospace" letterSpacing="1"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1.0 }}>
        HYPERBROWSER
      </motion.text>
      <motion.text x="475" y="260" textAnchor="middle" fill={C.dim} fontSize="9" fontFamily="Geist Mono, monospace" letterSpacing="1"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1.6 }}>
        EXTRACTION
      </motion.text>
      <motion.text x="695" y="275" textAnchor="middle" fill={C.dim} fontSize="9" fontFamily="Geist Mono, monospace" letterSpacing="1"
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 2.0 }}>
        STRUCTURED OUTPUT
      </motion.text>

      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 Z" fill={C.amber} />
        </marker>
      </defs>
    </svg>
  );
}

/* ────────────────────────────────── stat counter */

function Stat({ to, suffix, label, delay }: { to: number; suffix: string; label: string; delay: number }) {
  const { ref, val } = useCounter(to);
  const inView = useInView(ref as React.RefObject<Element>, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-start"
    >
      <div style={{ fontFamily: "'Satoshi', sans-serif", color: C.text }} className="text-[clamp(44px,5vw,72px)] font-extrabold leading-none tracking-tight">
        {val}<span style={{ color: C.amber }}>{suffix}</span>
      </div>
      <div style={{ fontFamily: "'Geist Mono', monospace", color: C.muted }} className="text-[11px] mt-2 uppercase tracking-widest leading-snug max-w-[160px]">{label}</div>
    </motion.div>
  );
}

/* ────────────────────────────────── word reveal */

function WordReveal({ text, className = "", delay = 0, as: Tag = "div" }: {
  text: string; className?: string; delay?: number; as?: keyof JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-8% 0px" });

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.2em] last:mr-0">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", rotate: 2 }}
            animate={inView ? { y: "0%", rotate: 0 } : {}}
            transition={{ duration: 0.8, delay: delay + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/* ────────────────────────────────── feature row */

const FEATURES = [
  { n: "01", title: "Stealth sessions", body: "Each domain gets its own fingerprint-spoofed Hyperbrowser session. Greenhouse, Lever, Workday — we get through anyway." },
  { n: "02", title: "AI-structured output", body: "Not a wall of HTML. Typed fields: tech stack inferred from job requirements, velocity from role count, signals from copy." },
  { n: "03", title: "Live streaming", body: "Results stream back as each domain resolves. Watch intelligence build in real time." },
  { n: "04", title: "Export & history", body: "Every run saved to localStorage. One-click CSV for your CRM, Notion, or spreadsheet." },
];

function FeatureRow({ n, title, body, index }: { n: string; title: string; body: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-5% 0px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="grid grid-cols-[64px_1fr_1fr] gap-8 items-start py-8 border-b cursor-default"
      style={{ borderColor: C.border }}
    >
      <motion.span
        style={{ fontFamily: "'Geist Mono', monospace", color: hovered ? C.amber : C.dim }}
        className="text-[11px] pt-1 transition-colors duration-300"
        animate={{ x: hovered ? 4 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {n}
      </motion.span>
      <motion.div
        style={{ fontFamily: "'Satoshi', sans-serif", color: C.text }}
        className="font-bold text-[18px] leading-snug tracking-tight"
        animate={{ x: hovered ? 4 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {title}
      </motion.div>
      <div style={{ color: C.muted }} className="text-[14px] leading-relaxed">{body}</div>
    </motion.div>
  );
}

/* ────────────────────────────────── use case card */

const USECASES = [
  { role: "Sales", headline: "Know before you dial.", body: "Walk in knowing their stack, their growth stage, their pain — before the first call." },
  { role: "Recruiting", headline: "Find the pull, not the push.", body: "Surface companies actively hiring in your niche. Know the exact skills they need." },
  { role: "Investors", headline: "Hiring is a leading indicator.", body: "Velocity and tech stack signal trajectory better than a pitch deck." },
  { role: "Founders", headline: "Watch competition breathe.", body: "Know when they hire, what they're building — before it shows up on TechCrunch." },
];

function UsecaseCard({ role, headline, body, index }: { role: string; headline: string; body: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-5% 0px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="p-8 rounded-2xl border transition-all duration-400 cursor-default"
      style={{
        background: hovered ? `${C.amber}08` : C.surface,
        borderColor: hovered ? `${C.amber}30` : C.border,
        transform: hovered ? "translateY(-6px)" : "none",
      }}
    >
      <div style={{ fontFamily: "'Geist Mono', monospace", color: C.amber }} className="text-[10px] uppercase tracking-[0.14em] mb-5">{role}</div>
      <div style={{ fontFamily: "'Satoshi', sans-serif", color: C.text }} className="font-bold text-[20px] leading-snug tracking-tight mb-4">{headline}</div>
      <div style={{ color: C.muted }} className="text-[13px] leading-relaxed">{body}</div>
    </motion.div>
  );
}

/* ────────────────────────────────── page */

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroSP } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY   = useTransform(heroSP, [0, 1], ["0%", "18%"]);
  const heroO   = useTransform(heroSP, [0, 0.7], [1, 0]);
  const { scrollYProgress } = useScroll();
  const scaleX  = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // nav scroll state
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => scrollYProgress.on("change", (v) => setScrolled(v > 0.03)), [scrollYProgress]);

  return (
    <SmoothScroll>
      <div style={{ background: C.bg, color: C.text }} className="min-h-screen overflow-x-hidden" style={{ fontFamily: "'Geist', sans-serif", background: C.bg, color: C.text }}>

        {/* scroll bar */}
        <motion.div className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60]" style={{ scaleX, background: C.amber }} />

        {/* ── NAV ── */}
        <motion.nav
          className="fixed top-0 left-0 right-0 z-50 px-8 py-5 flex items-center justify-between"
          animate={{
            background: scrolled ? "rgba(9,8,10,0.88)" : "transparent",
            backdropFilter: scrolled ? "blur(24px)" : "blur(0px)",
            borderBottomColor: scrolled ? C.border : "transparent",
            borderBottomWidth: 1,
            borderBottomStyle: "solid",
          }}
          transition={{ duration: 0.35 }}
        >
          <motion.span
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ fontFamily: "'Satoshi', sans-serif", color: C.text }}
            className="font-extrabold text-[18px] tracking-tight"
          >
            Prospect<span style={{ color: C.amber }}>IQ</span>
          </motion.span>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden sm:flex items-center gap-8"
          >
            {["Features","Process","Use cases"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`}
                style={{ fontFamily: "'Geist Mono', monospace", color: C.muted }}
                className="text-[11px] uppercase tracking-[0.1em] hover:text-[#EDE8DF] transition-colors duration-200"
              >{l}</a>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <Link href="/app"
              style={{ fontFamily: "'Satoshi', sans-serif", background: C.amber, color: "#09080A" }}
              className="font-bold text-[13px] px-5 py-2.5 rounded-[10px] transition-all duration-200 hover:brightness-110 hover:-translate-y-px inline-block"
              style={{ fontFamily: "'Satoshi', sans-serif", background: C.amber, color: "#09080A" }}
            >
              Try free →
            </Link>
          </motion.div>
        </motion.nav>

        {/* ── HERO ── */}
        <section ref={heroRef} className="relative h-screen flex flex-col justify-end overflow-hidden">
          {/* full-bleed canvas bg */}
          <div className="absolute inset-0">
            <AmbientCanvas />
            {/* radial glow */}
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 60% 40%, rgba(232,160,32,0.07) 0%, transparent 65%)" }} />
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 50% at 20% 70%, rgba(124,131,232,0.04) 0%, transparent 60%)" }} />
            {/* vignette */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(9,8,10,0.9) 100%)" }} />
          </div>

          <motion.div style={{ y: heroY, opacity: heroO }} className="relative z-10 pb-16 px-8 lg:px-16">
            {/* small top label */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mb-6"
            >
              <span style={{ fontFamily: "'Geist Mono', monospace", color: C.muted }} className="text-[11px] uppercase tracking-[0.14em]">
                Stealth scraping · AI extraction · Live streaming
              </span>
            </motion.div>

            {/* massive headline */}
            <div style={{ fontFamily: "'Satoshi', sans-serif" }} className="font-extrabold leading-[0.88] tracking-[-0.04em]">
              <div className="overflow-hidden">
                <motion.div
                  className="text-[clamp(64px,12vw,160px)]"
                  style={{ color: C.text }}
                  initial={{ y: "110%" }} animate={{ y: "0%" }}
                  transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  COMPANY
                </motion.div>
              </div>
              <div className="overflow-hidden">
                <motion.div
                  className="text-[clamp(64px,12vw,160px)]"
                  style={{ color: C.text }}
                  initial={{ y: "110%" }} animate={{ y: "0%" }}
                  transition={{ duration: 0.9, delay: 0.72, ease: [0.16, 1, 0.3, 1] }}
                >
                  INTELLIGENCE
                </motion.div>
              </div>
              <div className="overflow-hidden">
                <motion.div
                  className="text-[clamp(64px,12vw,160px)]"
                  initial={{ y: "110%" }} animate={{ y: "0%" }}
                  transition={{ duration: 0.9, delay: 0.84, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    background: `linear-gradient(110deg, ${C.amber} 0%, #F5C842 45%, ${C.indigo} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  AT SCALE.
                </motion.div>
              </div>
            </div>

            {/* floating right-aligned sub text */}
            <motion.div
              className="absolute right-8 lg:right-16 bottom-20 max-w-[260px] text-right"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <p style={{ color: C.muted }} className="text-[13px] leading-relaxed">
                Paste any list of company domains. Stream back structured intelligence — instantly.
              </p>
              <Link href="/app"
                style={{ fontFamily: "'Satoshi', sans-serif", color: C.amber }}
                className="text-[13px] font-semibold mt-3 inline-block hover:opacity-70 transition-opacity"
              >
                Start enriching →
              </Link>
            </motion.div>
          </motion.div>

          {/* scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1 }}
          >
            <span style={{ fontFamily: "'Geist Mono', monospace", color: C.dim }} className="text-[9px] uppercase tracking-[0.18em]">Scroll</span>
            <motion.div
              className="w-px h-10"
              style={{ background: `linear-gradient(to bottom, ${C.amber}, transparent)` }}
              animate={{ scaleY: [0, 1, 0], transformOrigin: "top" }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* bottom right badge */}
          <motion.div
            className="absolute bottom-8 right-8 lg:right-16 z-10"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-16 h-16 rounded-full border flex items-center justify-center"
              style={{ borderColor: `${C.amber}40`, background: `${C.amber}10` }}>
              <span style={{ fontFamily: "'Satoshi', sans-serif", color: C.amber, fontSize: 11, fontWeight: 800 }}>IQ</span>
            </div>
          </motion.div>
        </section>

        {/* ── STATS ── */}
        <section className="border-y py-24" style={{ borderColor: C.border, background: C.surface }}>
          <div className="max-w-[1280px] mx-auto px-8 lg:px-16 grid grid-cols-2 lg:grid-cols-4 gap-16">
            <Stat to={10}  suffix="×" label="faster than manual research" delay={0}    />
            <Stat to={98}  suffix="%" label="data extraction accuracy"    delay={0.12} />
            <Stat to={50}  suffix="+" label="ATS platforms bypassed"      delay={0.24} />
            <Stat to={2}   suffix="s" label="median enrichment time"      delay={0.36} />
          </div>
        </section>

        {/* ── BLUEPRINT ── */}
        <section className="py-32 relative overflow-hidden" id="process">
          {/* amber glow like oryzo section 2 */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
              style={{ background: `radial-gradient(circle, ${C.amber}0F 0%, transparent 65%)` }} />
          </div>

          <div className="max-w-[1280px] mx-auto px-8 lg:px-16">
            <div className="mb-16">
              <motion.div
                style={{ fontFamily: "'Geist Mono', monospace", color: C.amber }}
                className="text-[10px] uppercase tracking-[0.16em] mb-4"
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.6 }}
              >
                Architecture
              </motion.div>
              <WordReveal
                text="How the intelligence pipeline works"
                className="text-[clamp(28px,3.5vw,48px)] font-extrabold tracking-tight leading-[1.1] max-w-lg"
                as="h2"
              />
            </div>
            <BlueprintDiagram />
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-24 border-t" id="features" style={{ borderColor: C.border }}>
          <div className="max-w-[1280px] mx-auto px-8 lg:px-16">
            <div className="mb-12">
              <motion.div
                style={{ fontFamily: "'Geist Mono', monospace", color: C.amber }}
                className="text-[10px] uppercase tracking-[0.16em] mb-4"
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.6 }}
              >
                Capabilities
              </motion.div>
              <WordReveal
                text="Everything you need to know about a company"
                className="text-[clamp(28px,3.5vw,48px)] font-extrabold tracking-tight leading-[1.1] max-w-2xl"
                as="h2"
              />
            </div>
            <div className="border-t" style={{ borderColor: C.border }}>
              {FEATURES.map((f, i) => <FeatureRow key={f.n} {...f} index={i} />)}
            </div>
          </div>
        </section>

        {/* ── LARGE CALLOUT ── */}
        <section className="py-40 border-y relative overflow-hidden" style={{ borderColor: C.border, background: C.surface }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
              style={{ background: `radial-gradient(circle, ${C.amber}06 0%, transparent 70%)` }} />
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
              style={{ background: `radial-gradient(circle, ${C.indigo}05 0%, transparent 70%)` }} />
          </div>
          <div className="max-w-[1280px] mx-auto px-8 lg:px-16 text-center relative z-10">
            <WordReveal
              text="Stop guessing. Start knowing."
              className="text-[clamp(40px,7vw,96px)] font-extrabold tracking-[-0.04em] leading-[1] mb-8 block"
              as="h2"
              delay={0}
            />
            <motion.p
              style={{ color: C.muted }}
              className="text-[clamp(15px,1.5vw,18px)] max-w-[480px] mx-auto leading-[1.75] mb-12"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }}
            >
              Every sales rep, recruiter, and investor who uses ProspectIQ walks in more prepared than the competition.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.55 }}
            >
              <Link href="/app"
                style={{ fontFamily: "'Satoshi', sans-serif", background: C.amber, color: "#09080A" }}
                className="font-bold text-[16px] px-10 py-4 rounded-[12px] inline-block transition-all duration-200 hover:brightness-110 hover:-translate-y-px hover:shadow-[0_16px_48px_rgba(232,160,32,0.4)]"
              >
                Enrich your first company →
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── USE CASES ── */}
        <section className="py-32" id="use-cases">
          <div className="max-w-[1280px] mx-auto px-8 lg:px-16">
            <div className="mb-16">
              <motion.div
                style={{ fontFamily: "'Geist Mono', monospace", color: C.amber }}
                className="text-[10px] uppercase tracking-[0.16em] mb-4"
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.6 }}
              >
                Who uses this
              </motion.div>
              <WordReveal
                text="Built for people who need an edge"
                className="text-[clamp(28px,3.5vw,48px)] font-extrabold tracking-tight leading-[1.1] max-w-lg"
                as="h2"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {USECASES.map((u, i) => <UsecaseCard key={u.role} {...u} index={i} />)}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t py-10 px-8 lg:px-16 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: C.border }}>
          <span style={{ fontFamily: "'Satoshi', sans-serif", color: C.text }} className="font-extrabold text-[16px] tracking-tight">
            Prospect<span style={{ color: C.amber }}>IQ</span>
          </span>
          <span style={{ fontFamily: "'Geist Mono', monospace", color: C.dim }} className="text-[11px]">
            Built with{" "}
            <a href="https://www.hyperbrowser.ai" target="_blank" rel="noopener noreferrer"
              style={{ color: C.muted }} className="hover:text-[#EDE8DF] transition-colors">
              Hyperbrowser
            </a>
          </span>
        </footer>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Satoshi:wght@400;500;600;700;800;900&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');
          html { scroll-behavior: smooth; }
          * { -webkit-font-smoothing: antialiased; }
        `}</style>
      </div>
    </SmoothScroll>
  );
}
