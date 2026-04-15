"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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

const VELOCITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  none: { label: "Not hiring", color: "text-gray-500", bg: "bg-gray-900" },
  slow: { label: "Slow ↗", color: "text-yellow-400", bg: "bg-yellow-950" },
  steady: { label: "Steady ↑", color: "text-blue-400", bg: "bg-blue-950" },
  aggressive: { label: "Aggressive ↑↑", color: "text-emerald-400", bg: "bg-emerald-950" },
};

const PRESETS = ["stripe.com", "linear.app", "vercel.com", "clerk.com", "resend.com", "hyperbrowser.ai"];

function exportToCSV(rows: Row[]) {
  const ok = rows.filter(r => r.state === "ok" && r.profile);
  const headers = ["Domain", "Name", "Category", "Customers", "Tech Stack", "Open Roles", "Hiring Velocity", "Funding", "Team Size", "Key Signals", "Scraped At"];
  const lines = ok.map(r => {
    const p = r.profile!;
    return [
      r.domain,
      p.name,
      p.productCategory,
      p.customers,
      p.techStack.join("; "),
      p.openRoles.map(j => j.title).join("; "),
      p.hiringVelocity,
      p.fundingStage ?? "",
      p.teamSizeEstimate ?? "",
      p.keySignals.join("; "),
      r.scrapedAt ?? "",
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

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("prospectiq-history");
      if (saved) setHistory(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function saveHistory(newRows: Row[], domains: string[]) {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      domains,
      results: newRows,
      runAt: new Date().toISOString(),
    };
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
            finalRows = finalRows.map(r =>
              r.domain === payload.domain ? { ...r, state: "loading" } : r
            );
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
      if (sortKey === "velocity") {
        return (velOrder[a.profile?.hiringVelocity ?? "none"] ?? 3) - (velOrder[b.profile?.hiringVelocity ?? "none"] ?? 3);
      }
      if (sortKey === "roles") {
        return (b.profile?.openRoles?.length ?? 0) - (a.profile?.openRoles?.length ?? 0);
      }
      return a.domain.localeCompare(b.domain);
    });

  const doneCount = rows.filter(r => r.state === "ok" || r.state === "error").length;
  const okCount = rows.filter(r => r.state === "ok").length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
        <Link href="/" className="font-bold tracking-tight text-white hover:text-emerald-400 transition-colors">
          ProspectIQ
        </Link>
        <div className="flex items-center gap-3">
          {rows.some(r => r.state === "ok") && (
            <button
              onClick={() => exportToCSV(rows)}
              className="text-xs border border-gray-700 hover:border-gray-500 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              Export CSV
            </button>
          )}
          {running && (
            <span className="text-xs text-yellow-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              {doneCount}/{rows.length} done
            </span>
          )}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — history */}
        {history.length > 0 && (
          <aside className="w-56 border-r border-gray-800 p-3 overflow-y-auto hidden lg:block shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider">History</span>
              <button onClick={clearHistory} className="text-xs text-gray-700 hover:text-red-500 transition-colors">clear</button>
            </div>
            <div className="space-y-1">
              {history.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => loadHistory(entry)}
                  className={`w-full text-left px-2 py-2 rounded text-xs transition-colors ${
                    activeHistoryId === entry.id
                      ? "bg-gray-800 text-white"
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-900"
                  }`}
                >
                  <div className="font-medium truncate">{entry.domains.slice(0, 2).join(", ")}{entry.domains.length > 2 ? ` +${entry.domains.length - 2}` : ""}</div>
                  <div className="text-gray-700 text-[10px] mt-0.5">{new Date(entry.runAt).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input */}
          <div className="space-y-3">
            <form onSubmit={e => { e.preventDefault(); run(parseDomains(input)); }}>
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={"stripe.com\nlinear.app\nvercel.com\n..."}
                  rows={3}
                  disabled={running}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none font-mono"
                />
                <button
                  type="submit"
                  disabled={running || !input.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm px-6 rounded-lg transition-colors"
                >
                  {running ? "Running..." : "Enrich →"}
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-600">Quick add:</span>
              {PRESETS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setInput(p => {
                    const existing = parseDomains(p);
                    if (existing.includes(d)) return p;
                    return p ? `${p.trim()}\n${d}` : d;
                  })}
                  className="text-xs bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white px-2.5 py-1 rounded-full transition-colors"
                >
                  + {d}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          {rows.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-gray-500">{okCount} enriched · {rows.length - okCount} pending/failed</span>
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="text"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  placeholder="Filter by domain, category, tech..."
                  className="bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-600 w-56"
                />
                <select
                  value={sortKey}
                  onChange={e => setSortKey(e.target.value as typeof sortKey)}
                  className="bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-xs text-gray-400 focus:outline-none"
                >
                  <option value="domain">Sort: Domain</option>
                  <option value="velocity">Sort: Hiring velocity</option>
                  <option value="roles">Sort: Open roles</option>
                </select>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="space-y-2">
            {filteredRows.map(row => (
              <CompanyCard
                key={row.domain}
                row={row}
                expanded={expanded.has(row.domain)}
                onToggle={() => toggleExpand(row.domain)}
              />
            ))}
          </div>

          {rows.length === 0 && (
            <div className="text-center py-24 text-gray-700 text-sm">
              Enter domains above to start enriching
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CompanyCard({ row, expanded, onToggle }: { row: Row; expanded: boolean; onToggle: () => void }) {
  const { domain, state, profile, error } = row;
  const vel = profile ? VELOCITY_CONFIG[profile.hiringVelocity] : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Summary row — always visible */}
      <button
        onClick={onToggle}
        disabled={state === "pending" || state === "loading"}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-800/50 transition-colors disabled:cursor-default"
      >
        {/* Favicon */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          className="w-5 h-5 rounded shrink-0"
        />

        {/* Name + domain */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white text-sm">
              {profile?.name ?? domain}
            </span>
            <span className="text-xs text-gray-600">{domain}</span>
            {profile?.productCategory && (
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                {profile.productCategory}
              </span>
            )}
          </div>
          {profile?.oneLiner && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{profile.oneLiner}</p>
          )}
        </div>

        {/* Tech badges — top 4 */}
        <div className="hidden md:flex gap-1 shrink-0">
          {profile?.techStack?.slice(0, 4).map(t => (
            <span key={t} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
              {t}
            </span>
          ))}
          {(profile?.techStack?.length ?? 0) > 4 && (
            <span className="text-[10px] text-gray-600">+{profile!.techStack.length - 4}</span>
          )}
        </div>

        {/* Role count */}
        {profile && (
          <span className="text-xs text-gray-500 shrink-0 hidden sm:block">
            {profile.openRoles.length} role{profile.openRoles.length !== 1 ? "s" : ""}
          </span>
        )}

        {/* Velocity */}
        <div className="shrink-0 w-28 text-right">
          {state === "loading" && (
            <span className="text-xs text-yellow-500 flex items-center justify-end gap-1.5">
              <span className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" />
              scraping
            </span>
          )}
          {state === "pending" && <span className="text-xs text-gray-700">queued</span>}
          {state === "error" && <span className="text-xs text-red-500">failed</span>}
          {state === "ok" && vel && (
            <span className={`text-xs ${vel.color}`}>{vel.label}</span>
          )}
        </div>

        {state === "ok" && (
          <span className="text-gray-600 text-xs shrink-0">{expanded ? "▲" : "▼"}</span>
        )}
      </button>

      {/* Expanded detail */}
      {expanded && state === "ok" && profile && (
        <div className="border-t border-gray-800 px-5 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          {/* About */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            {profile.customers && (
              <Detail label="Customers" value={profile.customers} />
            )}
            {profile.fundingStage && (
              <Detail label="Funding" value={profile.fundingStage} />
            )}
            {profile.teamSizeEstimate && (
              <Detail label="Team size" value={profile.teamSizeEstimate} />
            )}
            {profile.foundedYear && (
              <Detail label="Founded" value={profile.foundedYear} />
            )}
          </div>

          {/* Full tech stack */}
          {profile.techStack.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Full Tech Stack</p>
              <div className="flex flex-wrap gap-1">
                {profile.techStack.map(t => (
                  <span key={t} className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Open roles */}
          {profile.openRoles.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                Open Roles ({profile.openRoles.length})
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {profile.openRoles.map((r, i) => (
                  <div key={i} className="flex items-baseline gap-2 text-gray-300">
                    <span className="text-emerald-700 shrink-0">›</span>
                    <span>{r.title}</span>
                    {r.team && <span className="text-gray-600">{r.team}</span>}
                    {r.location && <span className="text-gray-600 text-[10px] ml-auto shrink-0">{r.location}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key signals */}
          {profile.keySignals.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Key Signals</p>
              <div className="space-y-1.5">
                {profile.keySignals.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-gray-300">
                    <span className="text-yellow-600 shrink-0 mt-0.5">·</span>
                    <span className="leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social links */}
          {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
            <div className="lg:col-span-3 flex gap-4 pt-2 border-t border-gray-800">
              {profile.socialLinks.twitter && (
                <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-400 transition-colors">Twitter/X →</a>
              )}
              {profile.socialLinks.linkedin && (
                <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-400 transition-colors">LinkedIn →</a>
              )}
              {profile.socialLinks.github && (
                <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-200 transition-colors">GitHub →</a>
              )}
            </div>
          )}
        </div>
      )}

      {state === "error" && (
        <div className="border-t border-gray-800 px-5 py-3 text-xs text-red-400">{error}</div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-gray-300">{value}</p>
    </div>
  );
}
