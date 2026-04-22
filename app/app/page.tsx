"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { CompanyProfile, EnrichResult, Pack } from "../api/enrich/route";

/* ─── Seam app tokens — warm light bg + gold/green accents ─── */
const SERIF = "'Bodoni Moda', Georgia, serif";
const SANS  = "'Figtree', system-ui, sans-serif";
const MONO  = "'Geist Mono', monospace";

const C = {
  bg:       "#0C0B09",   // same as landing
  surface:  "#141210",
  card:     "#1C1A16",
  border:   "#242118",
  borderHi: "#302D26",
  text:     "#F0EDE6",
  muted:    "#7A7168",
  dim:      "#3D3A32",
  gold:     "#C9A96E",
  goldLo:   "rgba(201,169,110,0.10)",
  green:    "#7EA88A",   // sage from DESIGN.md — VC
  greenLo:  "rgba(126,168,138,0.10)",
  sage:     "#7EA88A",
  sageLo:   "rgba(126,168,138,0.10)",
  indigo:   "#8B90C8",
  rose:     "#C87070",
};

type RowState = "pending" | "loading" | "ok" | "error";

interface Row {
  domain: string;
  state: RowState;
  profile?: CompanyProfile;
  error?: string;
  scrapedAt?: string;
  currentStep?: string;
  stepIndex?: number;
  stepTotal?: number;
  startedAt?: number;
}

interface HistoryEntry {
  id: string;
  domains: string[];
  results: Row[];
  runAt: string;
  pack: Pack;
}

const PACKS: { id: Pack; label: string; sub: string; accent: string; accentLo: string; tag: string }[] = [
  { id: "sdr",       label: "SDR Pack",       sub: "Buying signals + decision-makers",     accent: C.gold,   accentLo: C.goldLo,  tag: "outbound sales" },
  { id: "recruiter", label: "Recruiter Pack", sub: "Hiring trajectory + tech stack",        accent: C.indigo, accentLo: "rgba(139,144,200,0.10)", tag: "talent intel" },
  { id: "vc",        label: "VC Pack",        sub: "Funding + traction + team caliber",     accent: C.sage,   accentLo: C.sageLo,  tag: "investment screening" },
];

const PACK_PRESETS: Record<Pack, string[]> = {
  sdr:       ["stripe.com", "linear.app", "vercel.com", "clerk.com", "resend.com", "hyperbrowser.ai"],
  recruiter: ["openai.com", "anthropic.com", "perplexity.ai", "cursor.com", "supabase.com", "modal.com"],
  vc:        ["browserbase.com", "hyperbrowser.ai", "browser-use.com", "elevenlabs.io", "windsurf.com", "rerun.io"],
};

const VELOCITY_CONFIG: Record<string, { label: string; bars: number }> = {
  none:       { label: "Not hiring",     bars: 0 },
  slow:       { label: "Slow ↗",         bars: 2 },
  steady:     { label: "Steady ↑",       bars: 3 },
  aggressive: { label: "Aggressive ↑↑", bars: 4 },
};

const VEL_COLORS: Record<string, string> = {
  none:       C.dim,
  slow:       C.gold,
  steady:     C.sage,
  aggressive: C.green,
};

function LiveProgress({ row }: { row: Row }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!row.startedAt) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - row.startedAt!) / 1000)), 500);
    return () => clearInterval(id);
  }, [row.startedAt]);

  const progress = row.stepTotal && row.stepIndex != null
    ? Math.round(((row.stepIndex + 1) / row.stepTotal) * 100)
    : 0;

  return (
    <div style={{ fontFamily: MONO, fontSize: 11 }} className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center gap-2">
        <motion.span className="w-[5px] h-[5px] rounded-full shrink-0"
          style={{ background: C.gold }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
        <span style={{ color: C.gold, fontSize: 11 }} className="truncate">{row.currentStep ?? "Opening session..."}</span>
        <span style={{ color: C.dim, fontSize: 10, marginLeft: "auto", flexShrink: 0 }}>{elapsed}s</span>
      </div>
      {progress > 0 && (
        <div style={{ height: 2, background: C.border, borderRadius: 1, overflow: "hidden" }}>
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ height: "100%", background: C.gold, borderRadius: 1 }} />
        </div>
      )}
    </div>
  );
}

function SignalBars({ velocity }: { velocity: string }) {
  const bars = VELOCITY_CONFIG[velocity]?.bars ?? 0;
  const color = VEL_COLORS[velocity] ?? C.dim;
  return (
    <span className="inline-flex gap-[2px] items-end">
      {[5, 8, 11, 14].map((h, i) => (
        <span key={i} style={{ width: 3, height: h, borderRadius: 2, background: i < bars ? color : C.border, display: "inline-block", flexShrink: 0 }} />
      ))}
    </span>
  );
}

const PACK_CSV: Record<Pack, { headers: string[]; row: (r: Row) => string[] }> = {
  sdr: {
    headers: ["Domain","Name","Category","Pricing Model","Named Customers","Recent Launches","People (name | role | linkedin | email)","Buying Signals","Scraped At"],
    row: (r) => {
      const p = r.profile!;
      const people = (p.people ?? []).map(x => `${x.name} | ${x.role ?? ""} | ${x.linkedin ?? ""} | ${x.email ?? ""}`).join("; ");
      return [r.domain, p.name, p.productCategory, p.pricingModel ?? "", (p.namedCustomers ?? []).join("; "), (p.recentLaunches ?? []).join("; "), people, (p.signals?.buying ?? []).join("; "), r.scrapedAt ?? ""];
    },
  },
  recruiter: {
    headers: ["Domain","Name","Category","Hiring Velocity","Open Roles Count","Open Roles (title @ location)","Tech Stack","Engineering Leaders","Hiring Signals","Scraped At"],
    row: (r) => {
      const p = r.profile!;
      const roles = (p.openRoles ?? []).map(j => `${j.title}${j.location ? ` @ ${j.location}` : ""}`).join("; ");
      const engLeads = (p.people ?? []).filter(x => /eng|cto|tech|head|vp|director|founding/i.test(x.role ?? "")).map(x => `${x.name} | ${x.role ?? ""} | ${x.linkedin ?? ""}`).join("; ");
      return [r.domain, p.name, p.productCategory, p.hiringVelocity, String(p.openRoles?.length ?? 0), roles, (p.techStack ?? []).join("; "), engLeads, (p.signals?.hiring ?? []).join("; "), r.scrapedAt ?? ""];
    },
  },
  vc: {
    headers: ["Domain","Name","Category","Funding Stage","Investors","Team Size","Founded","Founders/Execs (name | role | linkedin)","Named Customers","Recent Launches","Investment Signals","Scraped At"],
    row: (r) => {
      const p = r.profile!;
      const execs = (p.people ?? []).filter(x => /ceo|cto|coo|cfo|founder|president/i.test(x.role ?? "")).map(x => `${x.name} | ${x.role ?? ""} | ${x.linkedin ?? ""}`).join("; ");
      return [r.domain, p.name, p.productCategory, p.fundingStage ?? "", (p.investors ?? []).join("; "), p.teamSizeEstimate ?? "", p.foundedYear ?? "", execs, (p.namedCustomers ?? []).join("; "), (p.recentLaunches ?? []).join("; "), (p.signals?.investment ?? []).join("; "), r.scrapedAt ?? ""];
    },
  },
};

function exportToCSV(rows: Row[], pack: Pack) {
  const ok = rows.filter(r => r.state === "ok" && r.profile);
  const cfg = PACK_CSV[pack];
  const lines = ok.map(r => cfg.row(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
  const blob = new Blob([[cfg.headers.join(","), ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `seam-${pack}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function AppPage() {
  const [input, setInput]               = useState("");
  const [rows, setRows]                 = useState<Row[]>([]);
  const [running, setRunning]           = useState(false);
  const [filter, setFilter]             = useState("");
  const [sortKey, setSortKey]           = useState<"domain"|"velocity"|"roles">("domain");
  const [expanded, setExpanded]         = useState<Set<string>>(new Set());
  const [history, setHistory]           = useState<HistoryEntry[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string|null>(null);
  const [pack, setPack]                 = useState<Pack>("sdr");
  const abortRef = useRef<AbortController|null>(null);

  const packCfg = PACKS.find(p => p.id === pack)!;

  useEffect(() => {
    try { const s = localStorage.getItem("seam-history"); if (s) setHistory(JSON.parse(s)); } catch { /* ignore */ }
  }, []);

  function saveHistory(newRows: Row[], domains: string[], runPack: Pack) {
    const entry: HistoryEntry = { id: crypto.randomUUID(), domains, results: newRows, runAt: new Date().toISOString(), pack: runPack };
    setHistory(prev => { const updated = [entry, ...prev].slice(0, 20); localStorage.setItem("seam-history", JSON.stringify(updated)); return updated; });
    setActiveHistoryId(entry.id);
  }

  function parseDomains(text: string): string[] {
    return text.split(/[\n,]+/).map(s => s.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "")).filter(s => s.includes(".") && s.length > 3);
  }

  function toggleExpand(domain: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(domain) ? n.delete(domain) : n.add(domain); return n; });
  }

  async function run(domains: string[]) {
    if (!domains.length || running) return;
    const runPack = pack;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setRunning(true); setActiveHistoryId(null);
    const initial: Row[] = domains.map(d => ({ domain: d, state: "pending" }));
    setRows(initial);
    try {
      const res = await fetch("/api/enrich", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domains, pack: runPack }), signal: abortRef.current.signal });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ""; let finalRows: Row[] = [...initial];
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true }); const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6)) as EnrichResult & { event: string };
          if (payload.event === "started") {
            finalRows = finalRows.map(r => r.domain === payload.domain ? { ...r, state: "loading", startedAt: Date.now() } : r);
            setRows([...finalRows]);
          } else if (payload.event === "step") {
            finalRows = finalRows.map(r => r.domain === payload.domain ? { ...r, currentStep: payload.step, stepIndex: payload.stepIndex, stepTotal: payload.total } : r);
            setRows([...finalRows]);
          } else if (payload.event === "result") {
            finalRows = finalRows.map(r => r.domain === payload.domain ? { ...r, state: payload.status === "ok" ? "ok" : "error", profile: payload.profile, error: payload.error, scrapedAt: payload.scrapedAt, currentStep: undefined } : r);
            setRows([...finalRows]);
          } else if (payload.event === "done") { saveHistory(finalRows, domains, runPack); }
        }
      }
    } catch (e) { if ((e as Error).name !== "AbortError") console.error(e); }
    finally { setRunning(false); }
  }

  const velOrder = { aggressive: 0, steady: 1, slow: 2, none: 3 };
  const filteredRows = rows
    .filter(r => { if (!filter) return true; const q = filter.toLowerCase(); return r.domain.includes(q) || r.profile?.name?.toLowerCase().includes(q) || r.profile?.productCategory?.toLowerCase().includes(q) || r.profile?.techStack?.some(t => t.toLowerCase().includes(q)) || r.profile?.customers?.toLowerCase().includes(q); })
    .sort((a, b) => { if (sortKey === "velocity") return (velOrder[a.profile?.hiringVelocity ?? "none"] ?? 3) - (velOrder[b.profile?.hiringVelocity ?? "none"] ?? 3); if (sortKey === "roles") return (b.profile?.openRoles?.length ?? 0) - (a.profile?.openRoles?.length ?? 0); return a.domain.localeCompare(b.domain); });

  const doneCount = rows.filter(r => r.state === "ok" || r.state === "error").length;
  const okCount   = rows.filter(r => r.state === "ok").length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg, color: C.text, fontFamily: SANS, WebkitFontSmoothing: "antialiased" }}>

      {/* Nav */}
      <nav className="border-b px-6 py-3.5 flex items-center justify-between shrink-0 sticky top-0 z-10 backdrop-blur-sm"
        style={{ borderColor: C.border, background: "rgba(12,11,9,0.94)" }}>
        <Link href="/"
          style={{ fontFamily: SERIF, color: C.text, fontWeight: 400, fontSize: 20, letterSpacing: "-0.02em", fontStyle: "italic" }}
          className="hover:opacity-70 transition-opacity flex items-center gap-1">
          Seam<span style={{ color: C.gold, fontSize: 8, marginLeft: 1, marginBottom: 2 }}>●</span>
        </Link>
        <div className="flex items-center gap-3">
          {rows.some(r => r.state === "ok") && (
            <button onClick={() => exportToCSV(rows, pack)}
              style={{ fontFamily: MONO, fontSize: 11, color: C.muted, border: `1px solid ${C.border}` }}
              className="px-3 py-1.5 rounded-lg hover:border-[#C8C2B8] hover:text-[#1A1714] transition-all">
              Export {pack.toUpperCase()} CSV ↓
            </button>
          )}
          {running && (
            <span style={{ fontFamily: MONO, fontSize: 11, color: C.gold }} className="flex items-center gap-1.5">
              <motion.span className="w-[5px] h-[5px] rounded-full inline-block" style={{ background: C.gold }}
                animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />
              {doneCount}/{rows.length} done
            </span>
          )}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {history.length > 0 && (
          <aside className="w-[190px] border-r p-3 overflow-y-auto hidden lg:block shrink-0"
            style={{ borderColor: C.border, background: C.surface }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim }} className="uppercase tracking-[0.1em]">History</span>
              <button onClick={() => { setHistory([]); localStorage.removeItem("seam-history"); setActiveHistoryId(null); }}
                style={{ fontFamily: MONO, fontSize: 10, color: C.dim }}
                className="hover:text-[#B87E70] transition-colors">clear</button>
            </div>
            <div className="space-y-0.5">
              {history.map(entry => {
                const ep = PACKS.find(p => p.id === entry.pack) ?? PACKS[0];
                return (
                  <button key={entry.id}
                    onClick={() => { setRows(entry.results); setActiveHistoryId(entry.id); setInput(entry.domains.join("\n")); if (entry.pack) setPack(entry.pack); }}
                    className="w-full text-left px-2.5 py-2 rounded-lg transition-colors"
                    style={{ background: activeHistoryId === entry.id ? C.card : "transparent", color: activeHistoryId === entry.id ? C.text : C.muted }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }} className="truncate">
                      {entry.domains.slice(0, 2).join(", ")}{entry.domains.length > 2 ? ` +${entry.domains.length - 2}` : ""}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim }}>
                        {new Date(entry.runAt).toLocaleDateString()}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 8, color: ep.accent, background: `${ep.accent}14`, border: `1px solid ${ep.accent}30` }}
                        className="px-1.5 py-0.5 rounded uppercase tracking-widest">{entry.pack ?? "sdr"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Pack picker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PACKS.map(p => {
              const active = p.id === pack;
              return (
                <button key={p.id} disabled={running} onClick={() => setPack(p.id)}
                  className="text-left rounded-xl px-4 py-3 transition-all relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: active ? C.card : "transparent",
                    border: `1px solid ${active ? p.accent : C.border}`,
                    boxShadow: active ? `0 0 0 3px ${p.accentLo}, 0 4px 20px ${p.accentLo}` : "none",
                  }}>
                  {active && (
                    <motion.div layoutId="pack-accent" className="absolute left-0 top-0 bottom-0 w-[3px]"
                      style={{ background: p.accent }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                  )}
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, color: active ? C.text : C.muted, letterSpacing: "-0.02em" }}>{p.label}</span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: active ? p.accent : C.dim }} className="uppercase tracking-[0.12em]">{p.tag}</span>
                  </div>
                  <p style={{ fontSize: 12, color: active ? C.muted : C.dim, marginTop: 3, fontFamily: SANS }}>{p.sub}</p>
                </button>
              );
            })}
          </div>

          {/* Input */}
          <div className="space-y-3">
            <form onSubmit={e => { e.preventDefault(); run(parseDomains(input)); }}>
              <div className="flex gap-2.5">
                <textarea
                  value={input} onChange={e => setInput(e.target.value)}
                  placeholder={"stripe.com\nlinear.app\nvercel.com\n..."} rows={3} disabled={running}
                  style={{ fontFamily: MONO, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 12 }}
                  className="flex-1 focus:outline-none focus:border-[#C9A96E] focus:shadow-[0_0_0_3px_rgba(201,169,110,0.10)] rounded-xl px-4 py-3 placeholder-[#3D3A32] transition-all resize-none"
                />
                <button type="submit" disabled={running || !input.trim()}
                  style={{ background: packCfg.accent, color: packCfg.id === "sdr" ? "#1A1714" : "#F0EDE6", fontFamily: SANS, fontWeight: 600, fontSize: 13, letterSpacing: "-0.01em" }}
                  className="px-6 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                  {running ? "Running..." : `Run ${packCfg.label} →`}
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim }}>Quick add:</span>
                {PACK_PRESETS[pack].map(d => (
                  <button key={d} type="button"
                    style={{ fontFamily: MONO, fontSize: 11, color: C.muted, background: C.card, border: `1px solid ${C.border}` }}
                    onClick={() => setInput(p => { const ex = parseDomains(p); if (ex.includes(d)) return p; return p ? `${p.trim()}\n${d}` : d; })}
                    className="px-3 py-1 rounded-full transition-all"
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = packCfg.accent; (e.currentTarget as HTMLElement).style.color = packCfg.accent; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.muted; }}>
                    + {d}
                  </button>
                ))}
              </div>
              <a href="https://hyperbrowser.ai" target="_blank" rel="noopener"
                style={{ fontFamily: MONO, fontSize: 10, color: C.dim, textDecoration: "none", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 5 }}
                onMouseEnter={e => (e.currentTarget.style.color = C.sage)}
                onMouseLeave={e => (e.currentTarget.style.color = C.dim)}>
                <span style={{ color: C.sage, fontSize: 8 }}>◆</span> POWERED BY HYPERBROWSER
              </a>
            </div>
          </div>{/* end space-y-3 */}

          {/* Filter/sort */}
          {rows.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
                {okCount} enriched · {rows.length - okCount} pending/failed
              </span>
              <div className="ml-auto flex items-center gap-2">
                <input type="text" value={filter} onChange={e => setFilter(e.target.value)}
                  placeholder="Filter by domain, category, tech..."
                  style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted, fontSize: 11 }}
                  className="focus:outline-none rounded-lg px-3 py-1.5 placeholder-[#3D3A32] w-56 transition-colors focus:border-[#C9A96E]" />
                <select value={sortKey} onChange={e => setSortKey(e.target.value as typeof sortKey)}
                  style={{ fontFamily: MONO, background: C.card, border: `1px solid ${C.border}`, color: C.muted, fontSize: 11 }}
                  className="rounded-lg px-2 py-1.5 outline-none">
                  <option value="domain">Sort: Domain</option>
                  <option value="velocity">Sort: Hiring velocity</option>
                  <option value="roles">Sort: Open roles</option>
                </select>
              </div>
            </div>
          )}

          {/* Results */}
          <AnimatePresence initial={false}>
            <div className="space-y-2">
              {filteredRows.map((row, i) => (
                <CompanyCard key={row.domain} row={row} index={i} expanded={expanded.has(row.domain)} onToggle={() => toggleExpand(row.domain)} pack={pack} />
              ))}
            </div>
          </AnimatePresence>

          {rows.length === 0 && (
            <div className="text-center py-24">
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim }} className="uppercase tracking-[0.1em]">
                Enter domains above to start enriching
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        * { -webkit-font-smoothing: antialiased; }
      `}</style>
    </div>
  );
}

function CompanyCard({ row, expanded, onToggle, index = 0, pack }: { row: Row; expanded: boolean; onToggle: () => void; index?: number; pack: Pack }) {
  const { domain, state, profile, error } = row;
  const vel = profile ? VELOCITY_CONFIG[profile.hiringVelocity] ?? VELOCITY_CONFIG.none : null;
  const velColor = profile ? VEL_COLORS[profile.hiringVelocity] ?? C.dim : C.dim;
  const packCfg = PACKS.find(p => p.id === pack)!;
  const signalKey = pack === "sdr" ? "buying" : pack === "recruiter" ? "hiring" : "investment";
  const packSignals = profile?.signals?.[signalKey] ?? [];

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl overflow-hidden relative"
      style={{ background: C.card, border: `1px solid ${state === "loading" ? `${C.gold}60` : C.border}`, transition: "border-color 200ms" }}>

      {state === "loading" && (
        <motion.div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
          style={{ background: C.gold }}
          animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
      )}

      <button onClick={onToggle} disabled={state === "pending" || state === "loading"}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors disabled:cursor-default"
        style={{ background: "transparent" }}
        onMouseEnter={e => { if (state === "ok") (e.currentTarget as HTMLElement).style.background = C.surface; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>

        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="w-[18px] h-[18px] rounded shrink-0 opacity-70" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, color: C.text }}>{profile?.name ?? domain}</span>
            {profile?.name && <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim }}>{domain}</span>}
            {profile?.productCategory && (
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted, background: C.surface, border: `1px solid ${C.border}` }} className="px-2 py-0.5 rounded-full">{profile.productCategory}</span>
            )}
          </div>
          {profile?.oneLiner && <p style={{ fontSize: 11, color: C.muted }} className="mt-0.5 truncate">{profile.oneLiner}</p>}
        </div>

        <div className="hidden md:flex gap-1 shrink-0">
          {profile?.techStack?.slice(0, 3).map(t => (
            <span key={t} style={{ fontFamily: MONO, fontSize: 9, color: C.muted, background: C.surface, border: `1px solid ${C.border}` }} className="px-1.5 py-0.5 rounded">{t}</span>
          ))}
          {(profile?.techStack?.length ?? 0) > 3 && <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim }}>+{profile!.techStack.length - 3}</span>}
        </div>

        {profile && <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted }} className="shrink-0 hidden sm:block">{profile.openRoles.length} role{profile.openRoles.length !== 1 ? "s" : ""}</span>}

        <div className={`flex justify-end ${state === "loading" ? "flex-1 min-w-0 ml-2" : "shrink-0 w-36"}`}>
          {state === "loading" && <LiveProgress row={row} />}
          {state === "pending" && <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim }}>queued</span>}
          {state === "error"   && <span style={{ fontFamily: MONO, fontSize: 10, color: C.rose }}>failed</span>}
          {state === "ok" && vel && (
            <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-medium"
              style={{ color: velColor, background: `${velColor}14`, borderColor: `${velColor}30` }}>
              <SignalBars velocity={profile!.hiringVelocity} />
              {vel.label}
            </span>
          )}
        </div>

        {state === "ok" && <span style={{ color: C.dim, fontSize: 10 }} className="shrink-0">{expanded ? "▲" : "▼"}</span>}
      </button>

      {expanded && state === "ok" && profile && (
        <div className="border-t px-4 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-[12px]"
          style={{ borderColor: C.border }}>
          {/* Pack hero — the answer this pack exists to deliver */}
          {packSignals.length > 0 && (
            <div className="lg:col-span-3 rounded-xl px-4 py-3.5 relative overflow-hidden"
              style={{ background: `${packCfg.accent}0A`, border: `1px solid ${packCfg.accent}30` }}>
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: packCfg.accent }} />
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontFamily: MONO, fontSize: 9, color: packCfg.accent }} className="uppercase tracking-[0.15em]">
                  {packCfg.label} · {signalKey} signals
                </span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim }}>{packSignals.length} found</span>
              </div>
              <ul className="space-y-1.5">
                {packSignals.map((s, i) => (
                  <motion.li key={i}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-start gap-2" style={{ color: C.text }}>
                    <span style={{ color: packCfg.accent, fontSize: 14, lineHeight: 1.2 }} className="shrink-0">›</span>
                    <span style={{ fontSize: 12, lineHeight: 1.5 }}>{s}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Pack-specific top-strip: SDR shows pricing+customers, Recruiter shows roles count, VC shows funding+investors */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            {pack === "sdr" && profile.pricingModel && profile.pricingModel !== "unknown" && <DetailCell label="Pricing model" value={profile.pricingModel} />}
            {pack === "sdr" && profile.namedCustomers && profile.namedCustomers.length > 0 && <DetailCell label="Named customers" value={`${profile.namedCustomers.length} (${profile.namedCustomers.slice(0,3).join(", ")}${profile.namedCustomers.length>3?"…":""})`} />}
            {pack === "recruiter" && <DetailCell label="Open roles" value={String(profile.openRoles?.length ?? 0)} />}
            {pack === "recruiter" && <DetailCell label="Velocity" value={profile.hiringVelocity} />}
            {pack === "vc" && profile.fundingStage && <DetailCell label="Stage" value={profile.fundingStage} />}
            {pack === "vc" && profile.investors && profile.investors.length > 0 && <DetailCell label="Investors" value={profile.investors.slice(0,3).join(", ")} />}
            {profile.customers      && <DetailCell label="Customers"  value={profile.customers}      />}
            {profile.teamSizeEstimate && <DetailCell label="Team size" value={profile.teamSizeEstimate} />}
            {profile.foundedYear    && <DetailCell label="Founded"    value={profile.foundedYear}    />}
          </div>

          {/* Recent launches — relevant for SDR + VC */}
          {(pack === "sdr" || pack === "vc") && profile.recentLaunches && profile.recentLaunches.length > 0 && (
            <div className="lg:col-span-3">
              <p style={{ fontFamily: MONO, fontSize: 9, color: C.dim }} className="uppercase tracking-[0.1em] mb-2">Recent launches</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.recentLaunches.map((l, i) => (
                  <span key={i} style={{ fontSize: 11, color: C.text, background: C.surface, border: `1px solid ${C.border}` }} className="px-2.5 py-1 rounded-lg">{l}</span>
                ))}
              </div>
            </div>
          )}
          {profile.techStack.length > 0 && (
            <div>
              <p style={{ fontFamily: MONO, fontSize: 9, color: C.dim }} className="uppercase tracking-[0.1em] mb-2">Full Tech Stack</p>
              <div className="flex flex-wrap gap-1">
                {profile.techStack.map(t => (
                  <span key={t} style={{ fontFamily: MONO, fontSize: 10, color: C.muted, background: C.surface, border: `1px solid ${C.border}` }} className="px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            </div>
          )}
          {profile.openRoles.length > 0 && (
            <div>
              <p style={{ fontFamily: MONO, fontSize: 9, color: C.dim }} className="uppercase tracking-[0.1em] mb-2">Open Roles ({profile.openRoles.length})</p>
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                {profile.openRoles.map((r, i) => (
                  <div key={i} className="flex items-baseline gap-2" style={{ color: C.muted }}>
                    <span style={{ color: C.green }} className="shrink-0 text-[10px]">›</span>
                    <span style={{ fontSize: 11 }}>{r.title}</span>
                    {r.team && <span style={{ color: C.dim, fontSize: 10 }}>{r.team}</span>}
                    {r.location && <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim }} className="ml-auto shrink-0">{r.location}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {profile.keySignals.length > 0 && (
            <div>
              <p style={{ fontFamily: MONO, fontSize: 9, color: C.dim }} className="uppercase tracking-[0.1em] mb-2">Key Signals</p>
              <div className="space-y-2">
                {profile.keySignals.map((s, i) => (
                  <div key={i} className="flex items-start gap-2" style={{ color: C.muted }}>
                    <span style={{ color: C.sage, fontSize: 14, lineHeight: 1 }} className="shrink-0 mt-0.5">·</span>
                    <span style={{ fontSize: 11, lineHeight: 1.6 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {profile.people && profile.people.length > 0 && (
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <p style={{ fontFamily: MONO, fontSize: 9, color: C.dim }} className="uppercase tracking-[0.1em]">
                  People at {profile.name} ({profile.people.length})
                </p>
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim }} className="uppercase tracking-[0.1em]">
                  Public sources only
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {profile.people.map((p, i) => (
                  <motion.div key={`${p.name}-${i}`}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-lg p-3 flex flex-col gap-1"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 12, color: C.text }} className="truncate">{p.name}</span>
                      {p.linkedin && (
                        <a href={p.linkedin} target="_blank" rel="noopener noreferrer"
                          style={{ fontFamily: MONO, fontSize: 9, color: C.indigo }}
                          className="hover:underline shrink-0 uppercase tracking-widest">in →</a>
                      )}
                    </div>
                    {p.role && (
                      <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }} className="truncate">{p.role}</span>
                    )}
                    {(p.email || p.twitter) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                        {p.email && (
                          <a href={`mailto:${p.email}`}
                            style={{ fontFamily: MONO, fontSize: 10, color: C.green }}
                            className="hover:underline truncate max-w-full">{p.email}</a>
                        )}
                        {p.twitter && (
                          <a href={p.twitter} target="_blank" rel="noopener noreferrer"
                            style={{ fontFamily: MONO, fontSize: 9, color: C.dim }}
                            className="hover:text-[#7279B8] uppercase tracking-widest">x →</a>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
            <div className="lg:col-span-3 flex gap-4 pt-3 border-t" style={{ borderColor: C.border }}>
              {profile.socialLinks.twitter  && <a href={profile.socialLinks.twitter}  target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.dim }} className="hover:text-[#7279B8] transition-colors">Twitter/X →</a>}
              {profile.socialLinks.linkedin && <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.dim }} className="hover:text-[#7279B8] transition-colors">LinkedIn →</a>}
              {profile.socialLinks.github   && <a href={profile.socialLinks.github}   target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.dim }} className="hover:text-[#1A1714] transition-colors">GitHub →</a>}
            </div>
          )}
        </div>
      )}

      {state === "error" && (
        <div className="border-t px-4 py-3" style={{ borderColor: C.border }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.rose }}>{error}</span>
        </div>
      )}
    </motion.div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: MONO, fontSize: 9, color: C.dim }} className="uppercase tracking-[0.1em] mb-1">{label}</p>
      <p style={{ fontSize: 12, color: C.muted }}>{value}</p>
    </div>
  );
}
