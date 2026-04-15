"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line @typescript-eslint/no-unused-vars
import type { CompanyProfile, EnrichResult } from "../api/enrich/route";

type RowState = "pending" | "loading" | "ok" | "error";

interface Row {
  domain: string;
  state: RowState;
  profile?: CompanyProfile;
  error?: string;
  scrapedAt?: string;
}

interface HistoryEntry {
  id: string;
  domains: string[];
  results: Row[];
  runAt: string;
}

const VELOCITY_CONFIG: Record<string, { label: string; bars: number; colorClass: string; badgeClass: string }> = {
  none:       { label: "Not hiring",      bars: 0, colorClass: "text-[#3D3B4E]",  badgeClass: "bg-[#18161F] text-[#3D3B4E] border-[#1F1D28]" },
  slow:       { label: "Slow ↗",          bars: 2, colorClass: "text-[#FCD34D]",  badgeClass: "bg-[rgba(251,191,36,0.08)] text-[#FCD34D] border-[rgba(251,191,36,0.15)]" },
  steady:     { label: "Steady ↑",        bars: 3, colorClass: "text-[#818CF8]",  badgeClass: "bg-[rgba(129,140,248,0.10)] text-[#818CF8] border-[rgba(129,140,248,0.20)]" },
  aggressive: { label: "Aggressive ↑↑",  bars: 4, colorClass: "text-[#F59E0B]",  badgeClass: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border-[rgba(245,158,11,0.25)]" },
};

const BAR_COLORS: Record<string, string> = {
  none: "#1F1D28",
  slow: "#FCD34D",
  steady: "#818CF8",
  aggressive: "#F59E0B",
};

const PRESETS = ["stripe.com", "linear.app", "vercel.com", "clerk.com", "resend.com", "hyperbrowser.ai"];

function SignalBars({ velocity }: { velocity: string }) {
  const cfg = VELOCITY_CONFIG[velocity] ?? VELOCITY_CONFIG.none;
  const color = BAR_COLORS[velocity] ?? BAR_COLORS.none;
  const heights = [5, 8, 11, 14];
  return (
    <span className="inline-flex gap-[2px] items-end">
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: h,
            borderRadius: 2,
            background: i < cfg.bars ? color : "#1F1D28",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
      ))}
    </span>
  );
}

function exportToCSV(rows: Row[]) {
  const ok = rows.filter(r => r.state === "ok" && r.profile);
  const headers = ["Domain", "Name", "Category", "Customers", "Tech Stack", "Open Roles", "Hiring Velocity", "Funding", "Team Size", "Key Signals", "Scraped At"];
  const lines = ok.map(r => {
    const p = r.profile!;
    return [
      r.domain, p.name, p.productCategory, p.customers,
      p.techStack.join("; "), p.openRoles.map(j => j.title).join("; "),
      p.hiringVelocity, p.fundingStage ?? "", p.teamSizeEstimate ?? "",
      p.keySignals.join("; "), r.scrapedAt ?? "",
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prospectiq-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AppPage() {
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<"domain" | "velocity" | "roles">("domain");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("prospectiq-history");
      if (saved) setHistory(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function saveHistory(newRows: Row[], domains: string[]) {
    const entry: HistoryEntry = { id: crypto.randomUUID(), domains, results: newRows, runAt: new Date().toISOString() };
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 20);
      localStorage.setItem("prospectiq-history", JSON.stringify(updated));
      return updated;
    });
    setActiveHistoryId(entry.id);
  }

  function loadHistory(entry: HistoryEntry) {
    setRows(entry.results);
    setActiveHistoryId(entry.id);
    setInput(entry.domains.join("\n"));
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem("prospectiq-history");
    setActiveHistoryId(null);
  }

  function parseDomains(text: string): string[] {
    return text
      .split(/[\n,]+/)
      .map(s => s.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, ""))
      .filter(s => s.includes(".") && s.length > 3);
  }

  function toggleExpand(domain: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(domain) ? next.delete(domain) : next.add(domain);
      return next;
    });
  }

  async function run(domains: string[]) {
    if (!domains.length || running) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setRunning(true);
    setActiveHistoryId(null);
    const initial: Row[] = domains.map(d => ({ domain: d, state: "pending" }));
    setRows(initial);

    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains }),
        signal: abortRef.current.signal,
      });
      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let finalRows: Row[] = [...initial];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6)) as EnrichResult & { event: string };

          if (payload.event === "started") {
            finalRows = finalRows.map(r => r.domain === payload.domain ? { ...r, state: "loading" } : r);
            setRows([...finalRows]);
          } else if (payload.event === "result") {
            finalRows = finalRows.map(r =>
              r.domain === payload.domain
                ? { ...r, state: payload.status === "ok" ? "ok" : "error", profile: payload.profile, error: payload.error, scrapedAt: payload.scrapedAt }
                : r
            );
            setRows([...finalRows]);
          } else if (payload.event === "done") {
            saveHistory(finalRows, domains);
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.error(e);
    } finally {
      setRunning(false);
    }
  }

  const velOrder = { aggressive: 0, steady: 1, slow: 2, none: 3 };

  const filteredRows = rows
    .filter(r => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      return (
        r.domain.includes(q) ||
        r.profile?.name?.toLowerCase().includes(q) ||
        r.profile?.productCategory?.toLowerCase().includes(q) ||
        r.profile?.techStack?.some(t => t.toLowerCase().includes(q)) ||
        r.profile?.customers?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortKey === "velocity") return (velOrder[a.profile?.hiringVelocity ?? "none"] ?? 3) - (velOrder[b.profile?.hiringVelocity ?? "none"] ?? 3);
      if (sortKey === "roles") return (b.profile?.openRoles?.length ?? 0) - (a.profile?.openRoles?.length ?? 0);
      return a.domain.localeCompare(b.domain);
    });

  const doneCount = rows.filter(r => r.state === "ok" || r.state === "error").length;
  const okCount = rows.filter(r => r.state === "ok").length;

  return (
    <div className="min-h-screen bg-[#0B0A0E] text-[#F4F3FF] flex flex-col" style={{ fontFamily: "'Geist', sans-serif" }}>
      {/* Nav */}
      <nav className="border-b border-[#1F1D28] px-6 py-3.5 flex items-center justify-between shrink-0 bg-[rgba(11,10,14,0.9)] backdrop-blur-sm sticky top-0 z-10">
        <Link
          href="/"
          style={{ fontFamily: "'Satoshi', sans-serif" }}
          className="font-extrabold text-[16px] tracking-tight text-[#F4F3FF] hover:text-[#F59E0B] transition-colors"
        >
          Prospect<span className="text-[#F59E0B]">IQ</span>
        </Link>
        <div className="flex items-center gap-3">
          {rows.some(r => r.state === "ok") && (
            <button
              onClick={() => exportToCSV(rows)}
              style={{ fontFamily: "'Geist Mono', monospace" }}
              className="text-[11px] border border-[#1F1D28] hover:border-[#2A2740] text-[#6B6880] hover:text-[#F4F3FF] px-3 py-1.5 rounded-[6px] transition-all"
            >
              Export CSV ↓
            </button>
          )}
          {running && (
            <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[11px] text-[#F59E0B] flex items-center gap-1.5">
              <span className="w-[5px] h-[5px] bg-[#F59E0B] rounded-full animate-pulse" />
              {doneCount}/{rows.length} done
            </span>
          )}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {history.length > 0 && (
          <aside className="w-[190px] border-r border-[#1F1D28] p-3 overflow-y-auto hidden lg:block shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[9px] text-[#3D3B4E] uppercase tracking-[0.1em]">History</span>
              <button onClick={clearHistory} style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[10px] text-[#3D3B4E] hover:text-[#F87171] transition-colors">clear</button>
            </div>
            <div className="space-y-0.5">
              {history.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => loadHistory(entry)}
                  className={`w-full text-left px-2.5 py-2 rounded-[6px] transition-colors ${
                    activeHistoryId === entry.id
                      ? "bg-[#18161F] text-[#F4F3FF]"
                      : "text-[#3D3B4E] hover:text-[#6B6880] hover:bg-[#111018]"
                  }`}
                >
                  <div className="text-[12px] font-medium truncate">
                    {entry.domains.slice(0, 2).join(", ")}{entry.domains.length > 2 ? ` +${entry.domains.length - 2}` : ""}
                  </div>
                  <div style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[10px] text-[#3D3B4E] mt-0.5">
                    {new Date(entry.runAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Input area */}
          <div className="space-y-3">
            <form onSubmit={e => { e.preventDefault(); run(parseDomains(input)); }}>
              <div className="flex gap-2.5">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={"stripe.com\nlinear.app\nvercel.com\n..."}
                  rows={3}
                  disabled={running}
                  style={{ fontFamily: "'Geist Mono', monospace" }}
                  className="flex-1 bg-[#111018] border border-[#1F1D28] focus:border-[#F59E0B] focus:shadow-[0_0_0_3px_rgba(245,158,11,0.12)] rounded-[10px] px-4 py-3 text-[12px] text-[#F4F3FF] placeholder-[#3D3B4E] outline-none transition-all resize-none"
                />
                <button
                  type="submit"
                  disabled={running || !input.trim()}
                  style={{ fontFamily: "'Satoshi', sans-serif" }}
                  className="bg-[#F59E0B] hover:bg-[#FBBF24] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B0A0E] font-bold text-[13px] px-6 rounded-[10px] transition-all hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(245,158,11,0.3)]"
                >
                  {running ? "Running..." : "Enrich →"}
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-2 items-center">
              <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[10px] text-[#3D3B4E]">Quick add:</span>
              {PRESETS.map(d => (
                <button
                  key={d}
                  type="button"
                  style={{ fontFamily: "'Geist Mono', monospace" }}
                  onClick={() => setInput(p => {
                    const existing = parseDomains(p);
                    if (existing.includes(d)) return p;
                    return p ? `${p.trim()}\n${d}` : d;
                  })}
                  className="text-[11px] bg-[#111018] border border-[#1F1D28] hover:border-[#F59E0B] hover:text-[#F59E0B] text-[#6B6880] px-3 py-1 rounded-full transition-all"
                >
                  + {d}
                </button>
              ))}
            </div>
          </div>

          {/* Filter/sort bar */}
          {rows.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[11px] text-[#6B6880]">
                {okCount} enriched · {rows.length - okCount} pending/failed
              </span>
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="text"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  placeholder="Filter by domain, category, tech..."
                  className="bg-[#111018] border border-[#1F1D28] focus:border-[#2A2740] rounded-[6px] px-3 py-1.5 text-[11px] text-[#6B6880] placeholder-[#3D3B4E] outline-none w-56 transition-colors"
                />
                <select
                  value={sortKey}
                  onChange={e => setSortKey(e.target.value as typeof sortKey)}
                  style={{ fontFamily: "'Geist Mono', monospace" }}
                  className="bg-[#111018] border border-[#1F1D28] rounded-[6px] px-2 py-1.5 text-[11px] text-[#6B6880] outline-none"
                >
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
                <CompanyCard
                  key={row.domain}
                  row={row}
                  index={i}
                  expanded={expanded.has(row.domain)}
                  onToggle={() => toggleExpand(row.domain)}
                />
              ))}
            </div>
          </AnimatePresence>

          {rows.length === 0 && (
            <div className="text-center py-24">
              <div style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[11px] text-[#3D3B4E] uppercase tracking-[0.1em]">
                Enter domains above to start enriching
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Satoshi:wght@400;500;600;700;800;900&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');
      `}</style>
    </div>
  );
}

function CompanyCard({ row, expanded, onToggle, index = 0 }: { row: Row; expanded: boolean; onToggle: () => void; index?: number }) {
  const { domain, state, profile, error } = row;
  const vel = profile ? (VELOCITY_CONFIG[profile.hiringVelocity] ?? VELOCITY_CONFIG.none) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className={`bg-[#111018] rounded-[10px] overflow-hidden relative
        ${state === "loading" ? "border border-[rgba(245,158,11,0.3)]" : "border border-[#1F1D28] hover:border-[#2A2740]"}
      `}
      style={{ transition: "border-color 200ms" }}
    >
      {/* Amber left-border pulse when loading */}
      {state === "loading" && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#F59E0B] rounded-l-[10px]"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <button
        onClick={onToggle}
        disabled={state === "pending" || state === "loading"}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#18161F] transition-colors disabled:cursor-default"
      >
        {/* Favicon */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          className="w-[18px] h-[18px] rounded shrink-0 opacity-80"
        />

        {/* Name + domain */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontFamily: "'Satoshi', sans-serif" }} className="font-bold text-[13px] text-[#F4F3FF]">
              {profile?.name ?? domain}
            </span>
            {profile?.name && (
              <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[10px] text-[#3D3B4E]">{domain}</span>
            )}
            {profile?.productCategory && (
              <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[10px] bg-[#18161F] border border-[#1F1D28] text-[#6B6880] px-2 py-0.5 rounded-full">
                {profile.productCategory}
              </span>
            )}
          </div>
          {profile?.oneLiner && (
            <p className="text-[11px] text-[#6B6880] mt-0.5 truncate">{profile.oneLiner}</p>
          )}
        </div>

        {/* Tech badges */}
        <div className="hidden md:flex gap-1 shrink-0">
          {profile?.techStack?.slice(0, 3).map(t => (
            <span key={t} style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[9px] bg-[#18161F] border border-[#1F1D28] text-[#6B6880] px-1.5 py-0.5 rounded">
              {t}
            </span>
          ))}
          {(profile?.techStack?.length ?? 0) > 3 && (
            <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[9px] text-[#3D3B4E]">
              +{profile!.techStack.length - 3}
            </span>
          )}
        </div>

        {/* Role count */}
        {profile && (
          <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[11px] text-[#6B6880] shrink-0 hidden sm:block">
            {profile.openRoles.length} role{profile.openRoles.length !== 1 ? "s" : ""}
          </span>
        )}

        {/* Velocity */}
        <div className="shrink-0 w-36 flex justify-end">
          {state === "loading" && (
            <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[10px] text-[#F59E0B] flex items-center gap-1.5">
              <span className="w-[4px] h-[4px] bg-[#F59E0B] rounded-full animate-pulse" />
              scraping
            </span>
          )}
          {state === "pending" && (
            <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[10px] text-[#3D3B4E]">queued</span>
          )}
          {state === "error" && (
            <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[10px] text-[#F87171]">failed</span>
          )}
          {state === "ok" && vel && (
            <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-medium ${vel.badgeClass}`}>
              <SignalBars velocity={profile!.hiringVelocity} />
              {vel.label}
            </span>
          )}
        </div>

        {state === "ok" && (
          <span className="text-[#3D3B4E] text-[10px] shrink-0">{expanded ? "▲" : "▼"}</span>
        )}
      </button>

      {/* Expanded detail */}
      {expanded && state === "ok" && profile && (
        <div className="border-t border-[#1F1D28] px-4 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-[12px]">
          {/* Meta row */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            {profile.customers && <DetailCell label="Customers" value={profile.customers} />}
            {profile.fundingStage && <DetailCell label="Funding" value={profile.fundingStage} />}
            {profile.teamSizeEstimate && <DetailCell label="Team size" value={profile.teamSizeEstimate} />}
            {profile.foundedYear && <DetailCell label="Founded" value={profile.foundedYear} />}
          </div>

          {/* Full tech stack */}
          {profile.techStack.length > 0 && (
            <div>
              <p style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[9px] text-[#3D3B4E] uppercase tracking-[0.1em] mb-2">Full Tech Stack</p>
              <div className="flex flex-wrap gap-1">
                {profile.techStack.map(t => (
                  <span key={t} style={{ fontFamily: "'Geist Mono', monospace" }} className="bg-[#18161F] border border-[#1F1D28] text-[#6B6880] px-2 py-0.5 rounded text-[10px]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Open roles */}
          {profile.openRoles.length > 0 && (
            <div>
              <p style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[9px] text-[#3D3B4E] uppercase tracking-[0.1em] mb-2">
                Open Roles ({profile.openRoles.length})
              </p>
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                {profile.openRoles.map((r, i) => (
                  <div key={i} className="flex items-baseline gap-2 text-[#6B6880]">
                    <span className="text-[#F59E0B] shrink-0 text-[10px]">›</span>
                    <span className="text-[11px]">{r.title}</span>
                    {r.team && <span className="text-[#3D3B4E] text-[10px]">{r.team}</span>}
                    {r.location && <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[#3D3B4E] text-[9px] ml-auto shrink-0">{r.location}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key signals */}
          {profile.keySignals.length > 0 && (
            <div>
              <p style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[9px] text-[#3D3B4E] uppercase tracking-[0.1em] mb-2">Key Signals</p>
              <div className="space-y-2">
                {profile.keySignals.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-[#6B6880]">
                    <span className="text-[#F59E0B] shrink-0 mt-0.5 text-[14px] leading-none">·</span>
                    <span className="text-[11px] leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social links */}
          {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
            <div className="lg:col-span-3 flex gap-4 pt-3 border-t border-[#1F1D28]">
              {profile.socialLinks.twitter && (
                <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#3D3B4E] hover:text-[#818CF8] transition-colors">Twitter/X →</a>
              )}
              {profile.socialLinks.linkedin && (
                <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#3D3B4E] hover:text-[#818CF8] transition-colors">LinkedIn →</a>
              )}
              {profile.socialLinks.github && (
                <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#3D3B4E] hover:text-[#F4F3FF] transition-colors">GitHub →</a>
              )}
            </div>
          )}
        </div>
      )}

      {state === "error" && (
        <div className="border-t border-[#1F1D28] px-4 py-3">
          <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[10px] text-[#F87171]">{error}</span>
        </div>
      )}

    </motion.div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[9px] text-[#3D3B4E] uppercase tracking-[0.1em] mb-1">{label}</p>
      <p className="text-[12px] text-[#6B6880]">{value}</p>
    </div>
  );
}
