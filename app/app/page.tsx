"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { CompanyProfile, EnrichResult, Pack, VisualIntel } from "../api/enrich/route";

type SignalItem = { title: string; detail: string; tag?: string };

/* ─── Exact tokens from landing page ─── */
const SERIF = "'Bodoni Moda', Georgia, serif";
const SANS  = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
const MONO  = "var(--font-geist-mono), 'Geist Mono', 'SF Mono', monospace";
const E     = [0.22, 1, 0.36, 1] as [number, number, number, number];

const C = {
  bg:         "#0A0908",
  bgHi:       "#0F0E0C",
  surface:    "#141210",
  surfaceHi:  "#1A1816",
  card:       "#1A1816",
  border:     "#2A2622",
  borderHi:   "#3A352F",
  text:       "#F4EFE4",
  textHi:     "#FFFFFF",
  muted:      "#8A8174",
  dim:        "#5A5248",
  faint:      "#3A332D",
  sage:       "#7EA88A",
  sageHi:     "#94BD9E",
  sageDim:    "rgba(126,168,138,0.10)",
  sageLo:     "rgba(126,168,138,0.10)",
  sageGlow:   "rgba(126,168,138,0.18)",
  indigo:     "#8B90C8",
  indigoDim:  "rgba(139,144,200,0.10)",
  gold:       "#C9A96E",
  goldLo:     "rgba(201,169,110,0.10)",
  goldBorder: "rgba(201,169,110,0.25)",
  rose:       "#C87070",
};

type RowState = "pending" | "loading" | "ok" | "error";

interface Row {
  domain: string;
  state: RowState;
  profile?: CompanyProfile;
  visualIntel?: VisualIntel;
  agentLiveUrl?: string;
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

interface DiscoverCompany {
  domain:      string;
  name:        string;
  description: string;
  source:      string;
}

const PACKS: { id: Pack; label: string; sub: string; accent: string; accentLo: string; tag: string; n: string }[] = [
  { id: "sdr",       n: "01", label: "SDR Pack",       sub: "Buying signals + decision-makers",   accent: C.gold,   accentLo: C.goldLo,  tag: "outbound sales" },
  { id: "recruiter", n: "02", label: "Recruiter Pack",  sub: "Hiring trajectory + tech stack",      accent: C.indigo, accentLo: C.indigoDim, tag: "talent intel" },
  { id: "vc",        n: "03", label: "VC Pack",         sub: "Funding + traction + team caliber",  accent: C.sage,   accentLo: C.sageLo,  tag: "investment screening" },
  { id: "upgrade",   n: "04", label: "Growth Pack",      sub: "Qualify free users for paid plans",   accent: C.rose,   accentLo: "rgba(200,112,112,0.10)", tag: "PLG conversion" },
];

const PACK_PRESETS: Record<Pack, string[]> = {
  sdr:       ["stripe.com", "linear.app", "vercel.com", "clerk.com", "resend.com", "hyperbrowser.ai"],
  recruiter: ["openai.com", "anthropic.com", "perplexity.ai", "cursor.com", "supabase.com", "modal.com"],
  vc:        ["browserbase.com", "hyperbrowser.ai", "browser-use.com", "elevenlabs.io", "windsurf.com", "rerun.io"],
  upgrade:   ["steel-dev.com", "stagehand.dev", "apify.com", "crawlee.dev", "scrapingbee.com", "zyte.com"],
};

const DISCOVER_TABS: { id: string; label: string; query: string }[] = [
  { id: "all",         label: "All",              query: "" },
  { id: "automation",  label: "Web Automation",   query: "startups building web browser automation and headless browser tools" },
  { id: "ai-agents",   label: "AI Agents",        query: "companies building AI agents that use browsers and web scraping" },
  { id: "browser-infra", label: "Browser Infra",  query: "cloud browser infrastructure and headless browser API companies" },
  { id: "scraping",    label: "Scraping & Data",  query: "web scraping and data extraction B2B startups" },
  { id: "computer-use", label: "Computer Use",    query: "companies using computer use API and desktop automation AI" },
  { id: "rpa",         label: "RPA & Workflow",   query: "robotic process automation and workflow automation startups" },
];

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
  aggressive: C.sage,
};

function LiveProgress({ row }: { row: Row }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!row.startedAt) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - row.startedAt!) / 1000)), 500);
    return () => clearInterval(id);
  }, [row.startedAt]);

  const progress = row.stepTotal && row.stepIndex != null
    ? Math.round(((row.stepIndex + 1) / row.stepTotal) * 100) : 0;

  return (
    <div style={{ fontFamily: MONO, fontSize: 11 }} className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center gap-2">
        <motion.span className="w-[5px] h-[5px] rounded-full shrink-0"
          style={{ background: C.sage }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
        <span style={{ color: C.sage, fontSize: 11 }} className="truncate">{row.currentStep ?? "Opening session…"}</span>
        <span style={{ color: C.dim, fontSize: 10, marginLeft: "auto", flexShrink: 0 }}>{elapsed}s</span>
      </div>
      {progress > 0 && (
        <div style={{ height: 2, background: C.border, borderRadius: 1, overflow: "hidden" }}>
          <motion.div initial={{ width: "0%" }} animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ height: "100%", background: C.sage, borderRadius: 1 }} />
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

function signalCsv(items: SignalItem[]): string {
  return items.map(s => `${s.title}: ${s.detail}`).join("; ");
}

const PACK_CSV: Record<Pack, { headers: string[]; row: (r: Row) => string[] }> = {
  sdr: {
    headers: ["Domain","Name","Category","Pricing Model","Revenue Model","Est. Revenue","Funding","Named Customers","Recent Launches","People","Buying Signals","Scraped At"],
    row: (r) => {
      const p = r.profile!;
      const people = (p.people ?? []).map(x => `${x.name} | ${x.role ?? ""} | ${x.linkedin ?? ""} | ${x.email ?? ""}`).join("; ");
      return [r.domain, p.name, p.productCategory, p.pricingModel ?? "", p.revenueModel ?? "", p.estimatedRevenue ?? "", p.fundingStage ?? "", (p.namedCustomers ?? []).join("; "), (p.recentLaunches ?? []).join("; "), people, signalCsv(p.signals?.buying ?? []), r.scrapedAt ?? ""];
    },
  },
  recruiter: {
    headers: ["Domain","Name","Category","Hiring Velocity","LinkedIn Employees","Open Roles Count","Open Roles","Tech Stack","Glassdoor","Eng Leaders","Hiring Signals","Scraped At"],
    row: (r) => {
      const p = r.profile!;
      const roles = (p.openRoles ?? []).map(j => `${j.title}${j.location ? ` @ ${j.location}` : ""}`).join("; ");
      const engLeads = (p.people ?? []).filter(x => /eng|cto|tech|head|vp|director|founding/i.test(x.role ?? "")).map(x => `${x.name} | ${x.role ?? ""} | ${x.linkedin ?? ""}`).join("; ");
      return [r.domain, p.name, p.productCategory, p.hiringVelocity, p.linkedinEmployeeCount ?? "", String(p.openRoles?.length ?? 0), roles, (p.techStack ?? []).join("; "), p.glassdoorRating ?? "", engLeads, signalCsv(p.signals?.hiring ?? []), r.scrapedAt ?? ""];
    },
  },
  vc: {
    headers: ["Domain","Name","Category","Funding Stage","Funding Total","Investors","Team Size","Founded","Monthly Visitors","Founders/Execs","Named Customers","Investment Signals","Scraped At"],
    row: (r) => {
      const p = r.profile!;
      const execs = (p.people ?? []).filter(x => /ceo|cto|coo|cfo|founder|president/i.test(x.role ?? "")).map(x => `${x.name} | ${x.role ?? ""} | ${x.linkedin ?? ""}`).join("; ");
      return [r.domain, p.name, p.productCategory, p.fundingStage ?? "", p.fundingTotal ?? "", (p.investors ?? []).join("; "), p.teamSizeEstimate ?? "", p.foundedYear ?? "", p.monthlyVisitors ?? "", execs, (p.namedCustomers ?? []).join("; "), signalCsv(p.signals?.investment ?? []), r.scrapedAt ?? ""];
    },
  },
  upgrade: {
    headers: ["Domain","Name","Category","Funding Stage","Revenue Model","LinkedIn Employees","Hiring Velocity","Open Roles","Buying Signals","Scraped At"],
    row: (r) => {
      const p = r.profile!;
      return [r.domain, p.name, p.productCategory, p.fundingStage ?? "", p.revenueModel ?? "", p.linkedinEmployeeCount ?? "", p.hiringVelocity, String(p.openRoles?.length ?? 0), signalCsv(p.signals?.buying ?? []), r.scrapedAt ?? ""];
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
  const [mode, setMode]                 = useState<"enrich" | "discover">("enrich");
  const [input, setInput]               = useState("");
  const [rows, setRows]                 = useState<Row[]>([]);
  const [running, setRunning]           = useState(false);
  const [filter, setFilter]             = useState("");
  const [sortKey, setSortKey]           = useState<"domain"|"velocity"|"roles">("domain");
  const [expanded, setExpanded]         = useState<Set<string>>(new Set());
  const [history, setHistory]           = useState<HistoryEntry[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string|null>(null);
  const [pack, setPack]                 = useState<Pack>("sdr");
  // Discover state
  const [discoverQuery, setDiscoverQuery]         = useState("");
  const [discoverCompanies, setDiscoverCompanies] = useState<DiscoverCompany[]>([]);
  const [discoverSearching, setDiscoverSearching] = useState(false);
  const [discoverSources, setDiscoverSources]     = useState<string[]>([]);
  const [discoverTab, setDiscoverTab]             = useState("all");
  const [discoverHasSearched, setDiscoverHasSearched] = useState(false);
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
          type StreamEvent =
            | { event: "started"; domain: string }
            | { event: "step"; domain: string; step: string; stepIndex: number; total: number }
            | { event: "liveUrl"; domain: string; liveUrl: string }
            | (EnrichResult & { event: "result" })
            | { event: "done" };
          const payload = JSON.parse(line.slice(6)) as StreamEvent;
          if (payload.event === "started") {
            finalRows = finalRows.map(r => r.domain === payload.domain ? { ...r, state: "loading", startedAt: Date.now() } : r);
            setRows([...finalRows]);
          } else if (payload.event === "step") {
            finalRows = finalRows.map(r => r.domain === payload.domain ? { ...r, currentStep: payload.step, stepIndex: payload.stepIndex, stepTotal: payload.total } : r);
            setRows([...finalRows]);
          } else if (payload.event === "liveUrl") {
            finalRows = finalRows.map(r => r.domain === payload.domain ? { ...r, agentLiveUrl: payload.liveUrl } : r);
            setRows([...finalRows]);
          } else if (payload.event === "result") {
            finalRows = finalRows.map(r => r.domain === payload.domain ? { ...r, state: payload.status === "ok" ? "ok" : "error", profile: payload.profile, visualIntel: payload.visualIntel, agentLiveUrl: payload.agentLiveUrl ?? r.agentLiveUrl, error: payload.error, scrapedAt: payload.scrapedAt, currentStep: undefined } : r);
            setRows([...finalRows]);
          } else if (payload.event === "done") { saveHistory(finalRows, domains, runPack); }
        }
      }
    } catch (e) { if ((e as Error).name !== "AbortError") console.error(e); }
    finally { setRunning(false); }
  }

  async function runDiscoverSearch(q?: string) {
    const query = (q ?? discoverQuery).trim();
    if (!query || discoverSearching) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setDiscoverSearching(true);
    setDiscoverHasSearched(true);
    setDiscoverCompanies([]);
    setDiscoverSources([]);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: abortRef.current.signal,
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true }); const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          type DEvent =
            | { event: "searching"; source: string }
            | { event: "company"; domain: string; name: string; description: string; source: string }
            | { event: "done" };
          const payload = JSON.parse(line.slice(6)) as DEvent;
          if (payload.event === "searching") {
            setDiscoverSources(prev => [...new Set([...prev, payload.source])]);
          } else if (payload.event === "company") {
            setDiscoverCompanies(prev => [...prev, { domain: payload.domain, name: payload.name, description: payload.description, source: payload.source }]);
          }
        }
      }
    } catch (e) { if ((e as Error).name !== "AbortError") console.error(e); }
    finally { setDiscoverSearching(false); }
  }

  function enrichCompany(domain: string) {
    setMode("enrich");
    setInput(domain);
    run([domain]);
  }

  function selectDiscoverTab(tab: typeof DISCOVER_TABS[0]) {
    setDiscoverTab(tab.id);
    if (tab.query) {
      setDiscoverQuery(tab.query);
      runDiscoverSearch(tab.query);
    }
  }

  const velOrder = { aggressive: 0, steady: 1, slow: 2, none: 3 };
  const filteredRows = rows
    .filter(r => { if (!filter) return true; const q = filter.toLowerCase(); return r.domain.includes(q) || r.profile?.name?.toLowerCase().includes(q) || r.profile?.productCategory?.toLowerCase().includes(q) || r.profile?.techStack?.some(t => t.toLowerCase().includes(q)) || r.profile?.customers?.toLowerCase().includes(q); })
    .sort((a, b) => { if (sortKey === "velocity") return (velOrder[a.profile?.hiringVelocity ?? "none"] ?? 3) - (velOrder[b.profile?.hiringVelocity ?? "none"] ?? 3); if (sortKey === "roles") return (b.profile?.openRoles?.length ?? 0) - (a.profile?.openRoles?.length ?? 0); return a.domain.localeCompare(b.domain); });

  const doneCount = rows.filter(r => r.state === "ok" || r.state === "error").length;
  const okCount   = rows.filter(r => r.state === "ok").length;
  void doneCount;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg, color: C.text, fontFamily: SANS, WebkitFontSmoothing: "antialiased" }}>

      {/* ── Nav — exact landing page style ── */}
      <nav className="border-b sticky top-0 z-20"
        style={{ borderColor: C.border, background: "rgba(10,9,8,0.92)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" style={{ textDecoration: "none" }} className="flex items-baseline gap-1">
            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 24, color: C.text, fontWeight: 400, letterSpacing: "-0.01em" }}>Seam</span>
            <span style={{ color: C.sage, fontSize: 12, fontWeight: 700 }}>·</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Mode toggle */}
            <div className="flex items-center rounded-full overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              {(["enrich", "discover"] as const).map((m, i) => (
                <button key={m} onClick={() => { if (!running) setMode(m); }} disabled={running}
                  style={{
                    fontFamily: SANS, fontSize: 12, fontWeight: 600, padding: "8px 18px",
                    background: mode === m ? C.text : "transparent",
                    color: mode === m ? C.bg : C.muted,
                    borderRight: i === 0 ? `1px solid ${C.border}` : "none",
                    letterSpacing: "0.03em", textTransform: "uppercase",
                  }}
                  className="transition-colors disabled:cursor-not-allowed">
                  {m === "discover" ? "⚡ Discover" : "◎ Enrich"}
                </button>
              ))}
            </div>

            <Link href="/connect"
              style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.muted, border: `1px solid ${C.border}`, letterSpacing: "0.02em", textTransform: "uppercase", borderRadius: 999, padding: "8px 16px", textDecoration: "none" }}
              className="hidden sm:block hover:text-[#F4EFE4] transition-colors">
              MCP ↗
            </Link>

            {running && (
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.sage, letterSpacing: "0.16em" }} className="flex items-center gap-1.5 uppercase">
                <motion.span className="w-[5px] h-[5px] rounded-full inline-block" style={{ background: C.sage }}
                  animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                Running
              </span>
            )}
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar — history (enrich only) ── */}
        {mode === "enrich" && history.length > 0 && (
          <aside className="w-[180px] border-r p-3 overflow-y-auto hidden lg:block shrink-0"
            style={{ borderColor: C.border, background: C.surface }}>
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.16em" }} className="uppercase">History</span>
              <button onClick={() => { if (!confirm("Clear all history?")) return; setHistory([]); localStorage.removeItem("seam-history"); setActiveHistoryId(null); }}
                style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }}
                className="uppercase hover:text-[#C87070] transition-colors">clear</button>
            </div>
            <div className="space-y-0.5">
              {history.map(entry => {
                const ep = PACKS.find(p => p.id === entry.pack) ?? PACKS[0];
                const okCount = entry.results.filter(r => r.state === "ok").length;
                const errCount = entry.results.filter(r => r.state === "error").length;
                const statusColor = errCount === entry.results.length ? C.rose : okCount > 0 ? C.sage : C.gold;
                return (
                  <button key={entry.id}
                    onClick={() => { setRows(entry.results); setActiveHistoryId(entry.id); setInput(entry.domains.join("\n")); if (entry.pack) setPack(entry.pack); }}
                    className="w-full text-left px-2.5 py-2.5 rounded-lg transition-colors"
                    style={{ background: activeHistoryId === entry.id ? C.card : "transparent", color: activeHistoryId === entry.id ? C.text : C.muted }}>
                    <div className="flex items-start gap-2">
                      {/* Status dot */}
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0, marginTop: 4 }} />
                      <div className="min-w-0 flex-1">
                        <div style={{ fontSize: 12, fontWeight: 500 }} className="truncate">
                          {entry.domains.slice(0, 2).join(", ")}{entry.domains.length > 2 ? ` +${entry.domains.length - 2}` : ""}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim }}>
                            {entry.domains.length} domain{entry.domains.length !== 1 ? "s" : ""}
                          </span>
                          <span style={{ fontFamily: MONO, fontSize: 8, color: ep.accent, background: `${ep.accent}14`, border: `1px solid ${ep.accent}30`, borderRadius: 3, padding: "1px 5px", letterSpacing: "0.08em" }}
                            className="uppercase">{entry.pack}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* ── Main ── */}
        <main className="flex-1 overflow-hidden flex flex-col">

          {/* ══ DISCOVER MODE ══ */}
          {mode === "discover" && (
            <div className="flex-1 overflow-y-auto">
              {/* Hero header — collapses after first search */}
              <div className="border-b" style={{ borderColor: C.border, background: C.bgHi }}>
                <div className="max-w-[1320px] mx-auto px-6 lg:px-10" style={{ paddingTop: discoverHasSearched ? 20 : 48, paddingBottom: discoverHasSearched ? 16 : 36, transition: "padding 0.3s ease" }}>
                  <AnimatePresence>
                    {!discoverHasSearched && (
                      <motion.div key="hero" initial={{ opacity: 1 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.25 }}>
                        <div className="flex items-center gap-2 mb-5"
                          style={{ background: C.sageDim, border: `1px solid ${C.sage}30`, borderRadius: 999, padding: "4px 12px 4px 10px", display: "inline-flex" }}>
                          <motion.div style={{ width: 6, height: 6, borderRadius: "50%", background: C.sage }}
                            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                          <span style={{ fontFamily: MONO, fontSize: 10, color: C.sage, letterSpacing: "0.18em" }}>PROSPECT DISCOVERY</span>
                        </div>
                        <h1 style={{ fontFamily: SANS, fontWeight: 700, fontSize: "clamp(32px,4vw,56px)", letterSpacing: "-0.035em", lineHeight: 0.95, color: C.text, marginBottom: 14 }}>
                          Hunt your<br /><span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, color: C.sage }}>market.</span>
                        </h1>
                        <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.6, maxWidth: "52ch", marginBottom: 24 }}>
                          Describe the companies you&apos;re looking for. Seam mines GitHub, HackerNews, YC, ProductHunt, Crunchbase, and the open web to surface matching prospects.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Search bar — always visible */}
                  <form onSubmit={e => { e.preventDefault(); runDiscoverSearch(); }}>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={discoverQuery}
                        onChange={e => setDiscoverQuery(e.target.value)}
                        placeholder="e.g. B2B startups building AI browser agents…"
                        disabled={discoverSearching}
                        autoFocus={discoverHasSearched}
                        style={{
                          fontFamily: SANS, fontSize: 15,
                          background: C.surface, border: `1px solid ${C.borderHi}`,
                          color: C.text, borderRadius: 12, padding: "14px 20px",
                          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)",
                        }}
                        className="flex-1 focus:outline-none focus:border-[#7EA88A] focus:shadow-[0_0_0_3px_rgba(126,168,138,0.12)] transition-all placeholder-[#5A5248]"
                      />
                      <button type="submit" disabled={discoverSearching || !discoverQuery.trim()}
                        style={{
                          fontFamily: SANS, fontWeight: 600, fontSize: 13, letterSpacing: "0.03em",
                          background: C.sage, color: C.bg, borderRadius: 999, padding: "14px 28px",
                          textTransform: "uppercase", whiteSpace: "nowrap",
                        }}
                        className="disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90 hover:-translate-y-px">
                        {discoverSearching ? "Searching…" : "Discover →"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Category tabs */}
                <div className="max-w-[1320px] mx-auto px-6 lg:px-10" style={{ overflowX: "auto", scrollbarWidth: "none" }}>
                  <style>{`.discover-tabs::-webkit-scrollbar { display: none; }`}</style>
                  <div className="discover-tabs flex gap-0" style={{ borderBottom: `1px solid ${C.border}`, overflowX: "auto", scrollbarWidth: "none" }}>
                    {DISCOVER_TABS.map(tab => (
                      <button key={tab.id}
                        onClick={() => selectDiscoverTab(tab)}
                        disabled={discoverSearching}
                        style={{
                          fontFamily: SANS, fontSize: 13, fontWeight: discoverTab === tab.id ? 600 : 400,
                          padding: "10px 18px",
                          color: discoverTab === tab.id ? C.text : C.muted,
                          borderBottom: discoverTab === tab.id ? `2px solid ${C.sage}` : "2px solid transparent",
                          background: "transparent",
                          whiteSpace: "nowrap",
                          transition: "color 0.15s, border-color 0.15s",
                          flexShrink: 0,
                        }}
                        className="disabled:opacity-50 disabled:cursor-not-allowed hover:text-[#F4EFE4] transition-colors">
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-6">
                {/* Scanning status */}
                {discoverSearching && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mb-6">
                    <motion.div style={{ width: 6, height: 6, borderRadius: "50%", background: C.sage, flexShrink: 0 }}
                      animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                    <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted, letterSpacing: "0.08em" }}>
                      Scanning {discoverSources.join(" · ") || "sources"}…
                    </span>
                  </motion.div>
                )}

                {/* Results */}
                {discoverCompanies.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: C.muted, letterSpacing: "0.16em" }} className="uppercase">
                        {discoverCompanies.length} {discoverSearching ? "found so far" : "companies found"}
                      </span>
                      {!discoverSearching && (
                        <button onClick={() => {
                          const headers = ["Domain","Company","Description","Source"];
                          const csv = [headers, ...discoverCompanies.map(c => [c.domain, c.name, c.description, c.source])]
                            .map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
                          const blob = new Blob([csv], { type: "text/csv" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a"); a.href = url; a.download = "seam-discover.csv"; a.click();
                          URL.revokeObjectURL(url);
                        }}
                          style={{ fontFamily: MONO, fontSize: 10, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 999, padding: "6px 14px", letterSpacing: "0.1em" }}
                          className="uppercase hover:border-[#7EA88A] hover:text-[#7EA88A] transition-all">
                          Export CSV ↓
                        </button>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {discoverCompanies.map((company, i) => (
                        <motion.div key={company.domain}
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: i * 0.04, ease: E }}
                          className="grid grid-cols-12 gap-6 py-6 items-center"
                          style={{ borderBottom: `1px solid ${C.border}` }}>
                          <div className="col-span-1 hidden md:block">
                            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 32, color: C.faint, lineHeight: 1, fontWeight: 400 }}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                          </div>
                          <div className="col-span-12 md:col-span-7 space-y-1.5">
                            <div className="flex items-center gap-3 flex-wrap">
                              <img src={`https://www.google.com/s2/favicons?domain=${company.domain}&sz=32`} alt="" className="w-[16px] h-[16px] rounded opacity-70 shrink-0" />
                              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 18, color: C.text, letterSpacing: "-0.02em" }}>{company.name}</span>
                              <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim }}>{company.domain}</span>
                              <span style={{ fontFamily: MONO, fontSize: 9, color: C.sage, background: C.sageDim, border: `1px solid ${C.sage}30`, borderRadius: 4, padding: "2px 8px", letterSpacing: "0.1em" }}
                                className="uppercase">{company.source}</span>
                            </div>
                            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{company.description}</p>
                          </div>
                          <div className="col-span-12 md:col-span-4 flex justify-end">
                            <button onClick={() => enrichCompany(company.domain)}
                              style={{
                                fontFamily: SANS, fontWeight: 600, fontSize: 13, letterSpacing: "0.03em",
                                color: C.text, border: `1px solid ${C.border}`,
                                borderRadius: 999, padding: "10px 22px",
                                textTransform: "uppercase",
                              }}
                              className="transition-all hover:border-[#7EA88A] hover:text-[#7EA88A] hover:-translate-y-px">
                              Enrich →
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Empty state after failed search */}
                {!discoverSearching && discoverCompanies.length === 0 && discoverSources.length > 0 && (
                  <div className="py-16 text-center space-y-6">
                    <p style={{ fontFamily: MONO, fontSize: 11, color: C.dim, letterSpacing: "0.12em" }} className="uppercase">No companies found — try a different query</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {["browser automation startups", "AI agent infrastructure", "headless browser APIs", "web scraping B2B tools"].map(q => (
                        <button key={q} onClick={() => { setDiscoverQuery(q); runDiscoverSearch(q); }}
                          style={{ fontFamily: SANS, fontSize: 13, color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 999, padding: "8px 16px" }}
                          className="transition-all hover:border-[#7EA88A] hover:text-[#7EA88A]">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Initial empty state */}
                {!discoverSearching && discoverCompanies.length === 0 && discoverSources.length === 0 && !discoverHasSearched && (
                  <div className="py-16 text-center space-y-6">
                    <p style={{ fontSize: 15, color: C.muted }}>Select a category above, or describe what you&apos;re looking for.</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {["browser automation startups", "AI agent companies", "headless browser APIs", "web scraping tools", "computer use companies"].map(q => (
                        <button key={q} onClick={() => { setDiscoverQuery(q); runDiscoverSearch(q); }}
                          style={{ fontFamily: SANS, fontSize: 13, color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 999, padding: "8px 16px" }}
                          className="transition-all hover:border-[#7EA88A] hover:text-[#7EA88A]">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ENRICH MODE — split pane ══ */}
          {mode === "enrich" && (
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden" style={{ minHeight: 0 }}>

              {/* ── Left: Pack selector ── */}
              <aside className="lg:w-[300px] lg:shrink-0 border-b lg:border-b-0 lg:border-r overflow-y-auto"
                style={{ borderColor: C.border, background: C.surface }}>
                <div className="px-5 pt-6 pb-2">
                  <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.22em" }} className="uppercase">Pack</span>
                </div>
                <ol className="list-none">
                  {PACKS.map((p, i) => {
                    const active = p.id === pack;
                    return (
                      <motion.li key={p.id} layout
                        className="relative cursor-pointer"
                        style={{
                          borderTop: i === 0 ? `1px solid ${C.border}` : "none",
                          borderBottom: `1px solid ${C.border}`,
                          background: active ? `${p.accentLo}` : "transparent",
                          transition: "background 0.15s",
                        }}
                        onClick={() => { if (!running) setPack(p.id); }}
                        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = C.surfaceHi; }}
                        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        {/* Left accent bar */}
                        {active && (
                          <motion.div layoutId="pack-bar" className="absolute left-0 top-0 bottom-0 w-[3px]"
                            style={{ background: p.accent }} transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                        )}
                        <div className="flex items-center gap-4 px-5 py-4 pl-6">
                          {/* Number */}
                          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 36, color: active ? p.accent : C.faint, lineHeight: 1, fontWeight: 400, flexShrink: 0, transition: "color 0.2s", width: 40 }}>
                            {p.n}
                          </span>
                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            {/* Tag pill above name */}
                            <div className="mb-1">
                              <span style={{
                                fontFamily: MONO, fontSize: 8, letterSpacing: "0.14em",
                                color: active ? p.accent : C.dim,
                                background: active ? `${p.accent}14` : "transparent",
                                border: active ? `1px solid ${p.accent}30` : "1px solid transparent",
                                borderRadius: 3, padding: "1px 6px",
                                transition: "all 0.2s",
                              }} className="uppercase inline-block">{p.tag}</span>
                            </div>
                            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: active ? C.text : C.muted, letterSpacing: "-0.02em", display: "block", transition: "color 0.2s" }}>
                              {p.label}
                            </span>
                            <span style={{ fontSize: 12, color: active ? C.muted : C.dim, transition: "color 0.2s", display: "block", marginTop: 1 }}>{p.sub}</span>
                          </div>
                          {/* Selected badge */}
                          <div className="shrink-0">
                            {active ? (
                              <motion.div layoutId="pack-check" style={{ width: 20, height: 20, borderRadius: "50%", background: p.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ color: C.bg, fontSize: 10, fontWeight: 700, lineHeight: 1 }}>✓</span>
                              </motion.div>
                            ) : (
                              <div style={{ width: 20, height: 20, borderRadius: "50%", border: `1px solid ${C.border}` }} />
                            )}
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>

                {/* Attribution pinned to bottom of left panel */}
                <div className="px-5 py-4 mt-auto">
                  <a href="https://hyperbrowser.ai" target="_blank" rel="noopener"
                    style={{ fontFamily: MONO, fontSize: 9, color: C.dim, textDecoration: "none", letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: 5 }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.sage)}
                    onMouseLeave={e => (e.currentTarget.style.color = C.dim)}>
                    <span style={{ color: C.sage, fontSize: 7 }}>◆</span> POWERED BY HYPERBROWSER
                  </a>
                </div>
              </aside>

              {/* ── Right: Input + Results ── */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 lg:px-8 py-6 space-y-5">

                  {/* Domain input — textarea with run button below it */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontFamily: MONO, fontSize: 9, color: C.muted, letterSpacing: "0.22em" }} className="uppercase">Domains</span>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim }}>
                        {parseDomains(input).length > 0 && `${parseDomains(input).length}/10`}
                        {parseDomains(input).length > 10 && <span style={{ color: C.rose }}> — max 10</span>}
                      </span>
                    </div>
                    <form onSubmit={e => { e.preventDefault(); run(parseDomains(input).slice(0, 10)); }}>
                      <textarea
                        value={input} onChange={e => setInput(e.target.value)}
                        placeholder={"one domain per line\ne.g. stripe.com"} rows={5} disabled={running}
                        style={{
                          fontFamily: MONO, width: "100%",
                          background: C.surfaceHi, border: `1px solid ${C.borderHi}`,
                          color: C.text, fontSize: 13, borderRadius: 10, padding: "14px 16px",
                          boxShadow: "inset 0 1px 4px rgba(0,0,0,0.3)",
                          display: "block",
                        }}
                        className="focus:outline-none focus:border-[#7EA88A] focus:shadow-[0_0_0_3px_rgba(126,168,138,0.12)] placeholder-[#3D3A32] transition-all resize-none"
                      />
                      {/* Run button directly below textarea — full width at small sizes */}
                      <div className="flex items-center gap-3 mt-3">
                        <button type="submit" disabled={running || !input.trim()}
                          style={{
                            fontFamily: SANS, fontWeight: 700, fontSize: 13, letterSpacing: "0.04em",
                            background: packCfg.accent, color: C.bg,
                            borderRadius: 8, padding: "12px 24px",
                            textTransform: "uppercase", flexShrink: 0,
                          }}
                          className="disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90 hover:-translate-y-px">
                          {running ? "Running…" : `Run ${packCfg.label} →`}
                        </button>
                        {running && (
                          <span style={{ fontFamily: MONO, fontSize: 10, color: C.sage, letterSpacing: "0.12em" }} className="flex items-center gap-1.5 uppercase">
                            <motion.span className="w-[5px] h-[5px] rounded-full inline-block" style={{ background: C.sage }}
                              animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                            Processing
                          </span>
                        )}
                        {!running && rows.some(r => r.state === "ok") && (
                          <button onClick={() => exportToCSV(rows, pack)} type="button"
                            style={{ fontFamily: MONO, fontSize: 10, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", letterSpacing: "0.08em" }}
                            className="uppercase hover:text-[#F4EFE4] hover:border-[#F4EFE4] transition-all">
                            Export CSV ↓
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Quick add */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: "0.1em" }} className="uppercase mr-1">Quick add:</span>
                    {PACK_PRESETS[pack].map(d => (
                      <button key={d} type="button"
                        style={{ fontFamily: MONO, fontSize: 11, color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 999, padding: "5px 12px" }}
                        onClick={() => setInput(prev => { const ex = parseDomains(prev); if (ex.includes(d)) return prev; return prev ? `${prev.trim()}\n${d}` : d; })}
                        className="transition-all hover:border-[#7EA88A] hover:text-[#7EA88A]">
                        + {d}
                      </button>
                    ))}
                  </div>

                  {/* Filter / sort toolbar */}
                  {rows.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.text }}>
                          {okCount}
                        </span>
                        <span style={{ fontSize: 13, color: C.muted }}>enriched</span>
                        {rows.length - okCount > 0 && (
                          <>
                            <span style={{ color: C.border }}>·</span>
                            <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.gold }}>{rows.length - okCount}</span>
                            <span style={{ fontSize: 13, color: C.muted }}>pending</span>
                          </>
                        )}
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <input type="text" value={filter} onChange={e => setFilter(e.target.value)}
                          placeholder="Filter results…"
                          style={{ background: C.surfaceHi, border: `1px solid ${C.borderHi}`, color: C.muted, fontSize: 12, borderRadius: 7, padding: "7px 12px", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.25)" }}
                          className="focus:outline-none w-40 transition-all focus:border-[#7EA88A] focus:shadow-[0_0_0_2px_rgba(126,168,138,0.12)] placeholder-[#3D3A32]" />
                        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                          {(["domain", "velocity", "roles"] as const).map((k, i) => (
                            <button key={k} onClick={() => setSortKey(k)}
                              style={{
                                fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em",
                                padding: "7px 11px",
                                background: sortKey === k ? C.surfaceHi : "transparent",
                                color: sortKey === k ? C.text : C.dim,
                                borderRight: i < 2 ? `1px solid ${C.border}` : "none",
                                transition: "background 0.15s, color 0.15s",
                              }}
                              className="uppercase transition-all hover:text-[#F4EFE4]">
                              {k === "domain" ? "A–Z" : k === "velocity" ? "Velocity" : "Roles"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  <AnimatePresence initial={false}>
                    <div className="space-y-2">
                      {filteredRows.map((row, i) => (
                        <CompanyCard key={row.domain} row={row} index={i} expanded={expanded.has(row.domain)} onToggle={() => toggleExpand(row.domain)} pack={pack} visualIntel={row.visualIntel} />
                      ))}
                    </div>
                  </AnimatePresence>

                  {rows.length === 0 && (
                    <div className="py-20 text-center space-y-3">
                      <p style={{ fontSize: 15, color: C.muted }}>Paste domains and run a pack to extract intelligence.</p>
                      <p style={{ fontFamily: MONO, fontSize: 11, color: C.dim }}>Up to 10 domains per run · ~60s each</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`* { -webkit-font-smoothing: antialiased; }`}</style>
    </div>
  );
}

/* ─── Company card ─── */
function CompanyCard({ row, expanded, onToggle, index = 0, pack, visualIntel }: { row: Row; expanded: boolean; onToggle: () => void; index?: number; pack: Pack; visualIntel?: VisualIntel }) {
  const { domain, state, profile, error } = row;
  const vel = profile ? VELOCITY_CONFIG[profile.hiringVelocity] ?? VELOCITY_CONFIG.none : null;
  const velColor = profile ? VEL_COLORS[profile.hiringVelocity] ?? C.dim : C.dim;
  const packCfg = PACKS.find(p => p.id === pack)!;
  const signalKey: "buying" | "hiring" | "investment" = pack === "recruiter" ? "hiring" : pack === "vc" ? "investment" : "buying";
  const packSignals: SignalItem[] = (profile?.signals?.[signalKey] ?? []) as SignalItem[];

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl overflow-hidden relative"
      style={{ background: C.card, border: `1px solid ${state === "loading" ? `${C.sage}50` : C.border}`, transition: "border-color 200ms" }}>

      {state === "loading" && (
        <motion.div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: C.sage }}
          animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
      )}

      {state === "loading" && row.agentLiveUrl && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 220 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full overflow-hidden" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="relative w-full h-full">
            <div className="absolute top-2 left-3 z-10 flex items-center gap-2">
              <motion.span className="w-[5px] h-[5px] rounded-full" style={{ background: C.sage }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
              <span style={{ fontFamily: MONO, fontSize: 9, color: C.sage, background: "rgba(10,9,8,0.85)", padding: "2px 6px", borderRadius: 4 }}>Live Agent Feed</span>
            </div>
            <iframe src={row.agentLiveUrl} style={{ width: "100%", height: "100%", border: "none", filter: "brightness(0.95)" }}
              title="Live browser agent session" sandbox="allow-scripts allow-same-origin" />
          </div>
        </motion.div>
      )}

      <button onClick={onToggle} disabled={state === "pending" || state === "loading"}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors disabled:cursor-default"
        style={{ background: "transparent" }}
        onMouseEnter={e => { if (state === "ok") (e.currentTarget as HTMLElement).style.background = C.surface; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>

        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="w-[18px] h-[18px] rounded shrink-0 opacity-70" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: C.text, letterSpacing: "-0.01em" }}>{profile?.name ?? domain}</span>
            {profile?.name && <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim }}>{domain}</span>}
            {profile?.productCategory && (
              <span style={{ fontFamily: MONO, fontSize: 9, color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 8px", letterSpacing: "0.06em" }} className="uppercase">{profile.productCategory}</span>
            )}
          </div>
          {profile?.oneLiner && <p style={{ fontSize: 12, color: C.muted }} className="mt-0.5 truncate">{profile.oneLiner}</p>}
        </div>

        <div className="hidden md:flex gap-1 shrink-0">
          {profile?.techStack?.slice(0, 3).map(t => (
            <span key={t} style={{ fontFamily: MONO, fontSize: 9, color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 7px" }}>{t}</span>
          ))}
          {(profile?.techStack?.length ?? 0) > 3 && <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim }}>+{profile!.techStack.length - 3}</span>}
        </div>

        {profile && <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }} className="shrink-0 hidden sm:block">{profile.openRoles.length} role{profile.openRoles.length !== 1 ? "s" : ""}</span>}

        <div className={`flex justify-end ${state === "loading" ? "flex-1 min-w-0 ml-2" : "shrink-0 w-36"}`}>
          {state === "loading" && <LiveProgress row={row} />}
          {state === "pending" && <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }} className="uppercase">Queued</span>}
          {state === "error"   && <span style={{ fontFamily: MONO, fontSize: 9, color: C.rose, letterSpacing: "0.1em" }} className="uppercase">Failed</span>}
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

      {expanded && state === "ok" && row.agentLiveUrl && (
        <div className="border-t" style={{ borderColor: C.border }}>
          <div style={{ height: 260, position: "relative", overflow: "hidden" }}>
            <div className="absolute top-2 left-3 z-10 flex items-center gap-2">
              <span style={{ fontFamily: MONO, fontSize: 9, color: C.muted, background: "rgba(12,11,9,0.85)", padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.border}` }}>
                Agent replay · {domain}
              </span>
            </div>
            <iframe src={row.agentLiveUrl} style={{ width: "100%", height: "100%", border: "none", filter: "brightness(0.85) saturate(0.9)" }}
              title="Agent session replay" sandbox="allow-scripts allow-same-origin" />
          </div>
        </div>
      )}

      {expanded && state === "ok" && profile && (
        <div className="border-t px-5 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-[12px]" style={{ borderColor: C.border }}>
          {packSignals.length > 0 && (
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontFamily: MONO, fontSize: 9, color: packCfg.accent, letterSpacing: "0.15em" }} className="uppercase">
                  {packCfg.label} · {signalKey} signals ({packSignals.length})
                </span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim }}>tap each to expand</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {packSignals.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <SignalCard signal={s} accent={packCfg.accent} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {profile && <ExternalMetrics profile={profile} />}

          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            {pack === "sdr" && <>
              {profile.pricingModel && profile.pricingModel !== "unknown" && <DetailCell label="Pricing model" value={profile.pricingModel} />}
              {profile.revenueModel && <DetailCell label="Revenue model" value={profile.revenueModel} />}
              {profile.namedCustomers?.length > 0 && <DetailCell label="Named customers" value={`${profile.namedCustomers.length} logos`} />}
              {profile.teamSizeEstimate && <DetailCell label="Team size" value={profile.teamSizeEstimate} />}
            </>}
            {pack === "recruiter" && <>
              <DetailCell label="Open roles" value={String(profile.openRoles?.length ?? 0)} />
              <DetailCell label="Hiring pace" value={VELOCITY_CONFIG[profile.hiringVelocity]?.label ?? profile.hiringVelocity} />
              {profile.linkedinEmployeeCount && <DetailCell label="LinkedIn employees" value={profile.linkedinEmployeeCount} />}
              {profile.glassdoorRating && <DetailCell label="Glassdoor" value={profile.glassdoorRating} />}
            </>}
            {pack === "vc" && <>
              {profile.fundingStage && <DetailCell label="Stage" value={profile.fundingStage} />}
              {profile.fundingTotal && <DetailCell label="Total raised" value={profile.fundingTotal} />}
              {profile.investors?.length > 0 && <DetailCell label="Lead investors" value={profile.investors.slice(0,2).join(", ")} />}
              {profile.foundedYear && <DetailCell label="Founded" value={profile.foundedYear} />}
            </>}
            {pack === "upgrade" && <>
              {profile.fundingStage && <DetailCell label="Funding stage" value={profile.fundingStage} />}
              {profile.revenueModel && <DetailCell label="Revenue model" value={profile.revenueModel} />}
              <DetailCell label="Hiring pace" value={VELOCITY_CONFIG[profile.hiringVelocity]?.label ?? profile.hiringVelocity} />
              {profile.linkedinEmployeeCount && <DetailCell label="Team size" value={profile.linkedinEmployeeCount} />}
            </>}
          </div>

          {(pack === "sdr" || pack === "vc") && profile.recentLaunches && profile.recentLaunches.length > 0 && (
            <div className="lg:col-span-3">
              <p style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }} className="uppercase mb-2">Recent launches</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.recentLaunches.map((l, i) => (
                  <span key={i} style={{ fontSize: 11, color: C.text, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px" }}>{l}</span>
                ))}
              </div>
            </div>
          )}


          {profile.techStack.length > 0 && (
            <div>
              <p style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }} className="uppercase mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-1">
                {profile.techStack.map(t => (
                  <span key={t} style={{ fontFamily: MONO, fontSize: 10, color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 8px" }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {profile.openRoles.length > 0 && (
            <div>
              <p style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }} className="uppercase mb-2">Open Roles ({profile.openRoles.length})</p>
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                {profile.openRoles.map((r, i) => (
                  <div key={i} className="flex items-baseline gap-2" style={{ color: C.muted }}>
                    <span style={{ color: C.sage }} className="shrink-0 text-[10px]">›</span>
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
              <p style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }} className="uppercase mb-2">Key Signals</p>
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
              <p style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }} className="uppercase mb-3">
                People at {profile.name} ({profile.people.length}) · Public sources only
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {profile.people.map((p, i) => (
                  <motion.div key={`${p.name}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className="rounded-lg p-3 flex flex-col gap-1" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 12, color: C.text }} className="truncate">{p.name}</span>
                      {p.linkedin && (
                        <a href={p.linkedin} target="_blank" rel="noopener noreferrer"
                          style={{ fontFamily: MONO, fontSize: 9, color: C.indigo, letterSpacing: "0.1em" }}
                          className="hover:underline shrink-0 uppercase">in →</a>
                      )}
                    </div>
                    {p.role && <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }} className="truncate">{p.role}</span>}
                    {(p.email || p.twitter) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                        {p.email && <a href={`mailto:${p.email}`} style={{ fontFamily: MONO, fontSize: 10, color: C.sage }} className="hover:underline truncate max-w-full">{p.email}</a>}
                        {p.twitter && <a href={p.twitter} target="_blank" rel="noopener noreferrer" style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }} className="hover:text-[#7279B8] uppercase">x →</a>}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
            <div className="lg:col-span-3 flex gap-4 pt-4 border-t" style={{ borderColor: C.border }}>
              {profile.socialLinks.twitter  && <a href={profile.socialLinks.twitter}  target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.dim }} className="hover:text-[#7279B8] transition-colors">Twitter/X →</a>}
              {profile.socialLinks.linkedin && <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.dim }} className="hover:text-[#7279B8] transition-colors">LinkedIn →</a>}
              {profile.socialLinks.github   && <a href={profile.socialLinks.github}   target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.dim }} className="hover:text-[#F4EFE4] transition-colors">GitHub →</a>}
            </div>
          )}
        </div>
      )}

      {state === "error" && (
        <div className="border-t px-5 py-3" style={{ borderColor: C.border }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.rose }}>{error}</span>
        </div>
      )}
    </motion.div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }} className="uppercase mb-1">{label}</p>
      <p style={{ fontSize: 13, color: C.muted }}>{value}</p>
    </div>
  );
}

function SignalCard({ signal, accent }: { signal: SignalItem; accent: string }) {
  const [open, setOpen] = useState(false);
  const tagColors: Record<string, string> = {
    PLG: C.sage, Expansion: C.gold, Intent: C.gold, Competitor: C.rose,
    Funding: C.sage, Scale: C.indigo, Hiring: C.indigo, Traction: C.sage,
  };
  const tagColor = signal.tag ? (tagColors[signal.tag] ?? C.muted) : undefined;
  return (
    <button onClick={() => setOpen(o => !o)} className="w-full text-left rounded-lg px-3 py-2.5 transition-all"
      style={{ background: `${accent}08`, border: `1px solid ${accent}22` }}
      onMouseEnter={e => (e.currentTarget.style.background = `${accent}12`)}
      onMouseLeave={e => (e.currentTarget.style.background = `${accent}08`)}>
      <div className="flex items-start gap-2">
        <span style={{ color: accent, fontSize: 13, lineHeight: 1.2, flexShrink: 0, marginTop: 1 }}>›</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{signal.title}</span>
            {signal.tag && tagColor && (
              <span style={{ fontFamily: MONO, fontSize: 9, color: tagColor, background: `${tagColor}15`, border: `1px solid ${tagColor}30`, padding: "1px 6px", borderRadius: 4 }}>{signal.tag}</span>
            )}
          </div>
          <AnimatePresence>
            {open && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }} style={{ fontSize: 11, color: C.muted, lineHeight: 1.55, marginTop: 4 }}>
                {signal.detail}
              </motion.p>
            )}
          </AnimatePresence>
          {!open && <p style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>tap to expand</p>}
        </div>
      </div>
    </button>
  );
}

function ExternalMetrics({ profile }: { profile: CompanyProfile }) {
  const metrics = [
    profile.estimatedRevenue && { label: "Est. Revenue",   value: profile.estimatedRevenue,     color: C.gold },
    profile.fundingTotal     && { label: "Total Raised",   value: profile.fundingTotal,          color: C.sage },
    profile.linkedinEmployeeCount && { label: "Employees", value: profile.linkedinEmployeeCount, color: C.indigo },
    profile.monthlyVisitors  && { label: "Monthly Visits", value: profile.monthlyVisitors,       color: C.muted },
    profile.glassdoorRating  && { label: "Glassdoor",      value: profile.glassdoorRating,       color: C.gold },
    profile.g2Rating         && { label: "G2",             value: profile.g2Rating,              color: C.gold },
    profile.revenueModel     && { label: "Revenue Model",  value: profile.revenueModel,          color: C.muted },
  ].filter(Boolean) as { label: string; value: string; color: string }[];

  if (!metrics.length) return null;

  return (
    <div className="lg:col-span-3">
      <p style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }} className="uppercase mb-2">External Intel</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="rounded-lg px-3 py-2.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <p style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.1em" }} className="uppercase mb-1">{m.label}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
