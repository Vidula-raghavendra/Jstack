"use client";

import { useState, useRef } from "react";
import type { CompanyProfile, EnrichResult } from "./api/enrich/route";

type RowState = "pending" | "loading" | "ok" | "error";

interface Row {
  domain: string;
  state: RowState;
  profile?: CompanyProfile;
  error?: string;
}

const PRESETS = [
  "stripe.com",
  "linear.app",
  "vercel.com",
  "clerk.com",
  "resend.com",
  "hyperbrowser.ai",
  "anthropic.com",
  "openai.com",
];

const VELOCITY_LABELS: Record<string, { label: string; color: string }> = {
  none: { label: "Not hiring", color: "text-gray-500" },
  slow: { label: "Slow", color: "text-yellow-500" },
  steady: { label: "Steady", color: "text-blue-400" },
  aggressive: { label: "Aggressive ↑", color: "text-emerald-400" },
};

export default function Home() {
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  function parseDomains(text: string): string[] {
    return text
      .split(/[\n,\s]+/)
      .map((s) => s.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, ""))
      .filter((s) => s.includes("."));
  }

  async function run(domains: string[]) {
    if (!domains.length || running) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setRunning(true);
    setRows(domains.map((d) => ({ domain: d, state: "pending" })));

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });

        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6)) as EnrichResult & {
            event: string;
          };

          if (payload.event === "started") {
            setRows((prev) =>
              prev.map((r) =>
                r.domain === payload.domain ? { ...r, state: "loading" } : r
              )
            );
          } else if (payload.event === "result") {
            setRows((prev) =>
              prev.map((r) =>
                r.domain === payload.domain
                  ? {
                      ...r,
                      state: payload.status === "ok" ? "ok" : "error",
                      profile: payload.profile,
                      error: payload.error,
                    }
                  : r
              )
            );
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        console.error(e);
      }
    } finally {
      setRunning(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const domains = parseDomains(input);
    if (domains.length) run(domains);
  }

  function addPreset(domain: string) {
    setInput((prev) => {
      const existing = parseDomains(prev);
      if (existing.includes(domain)) return prev;
      return prev ? `${prev.trim()}\n${domain}` : domain;
    });
  }

  const visibleRows = filter
    ? rows.filter(
        (r) =>
          r.domain.includes(filter.toLowerCase()) ||
          r.profile?.productCategory
            ?.toLowerCase()
            .includes(filter.toLowerCase()) ||
          r.profile?.techStack?.some((t) =>
            t.toLowerCase().includes(filter.toLowerCase())
          )
      )
    : rows;

  const doneCount = rows.filter((r) => r.state === "ok" || r.state === "error").length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-widest text-white uppercase">ProspectIQ</span>
          <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
            beta
          </span>
        </div>
        <span className="text-xs text-gray-600 ml-auto hidden sm:block">
          B2B intel via{" "}
          <a href="https://www.hyperbrowser.ai" target="_blank" rel="noopener noreferrer" className="text-emerald-500">
            Hyperbrowser
          </a>{" "}
          stealth scraping · parallel browser sessions
        </span>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Pitch */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Enrich any company,{" "}
            <span className="text-emerald-400">instantly</span>
          </h1>
          <p className="text-gray-400 max-w-xl">
            Paste domains. ProspectIQ opens parallel stealth browser sessions via Hyperbrowser,
            scrapes their website + careers pages (including Greenhouse/Lever/Workday which
            block normal scrapers), and returns tech stack, hiring signals, and company intel —
            live, from the actual pages.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"stripe.com\nlinear.app\nvercel.com"}
              rows={4}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              disabled={running}
            />
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={running || !input.trim()}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm px-6 py-3 rounded-lg transition-colors h-full"
              >
                {running ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-black rounded-full animate-bounce" />
                    {doneCount}/{rows.length}
                  </span>
                ) : (
                  "Enrich →"
                )}
              </button>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-600 self-center">Try:</span>
            {PRESETS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => addPreset(d)}
                className="text-xs bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-gray-200 px-3 py-1 rounded-full transition-colors"
              >
                + {d}
              </button>
            ))}
          </div>
        </form>

        {/* Results */}
        {rows.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">
                {doneCount}/{rows.length} completed
              </span>
              {doneCount > 0 && (
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter by domain, category, or tech..."
                  className="ml-auto bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-600 w-64"
                />
              )}
            </div>

            <div className="space-y-3">
              {visibleRows.map((row) => (
                <CompanyCard key={row.domain} row={row} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CompanyCard({ row }: { row: Row }) {
  const { domain, state, profile, error } = row;
  const vel = profile ? VELOCITY_LABELS[profile.hiringVelocity] : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      {/* Top row */}
      <div className="flex items-start gap-3 mb-4">
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          className="w-6 h-6 rounded mt-0.5 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white hover:text-emerald-400 transition-colors"
            >
              {profile?.name ?? domain}
            </a>
            {profile?.productCategory && (
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                {profile.productCategory}
              </span>
            )}
            {profile?.fundingStage && (
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                {profile.fundingStage}
              </span>
            )}
          </div>
          {profile?.oneLiner && (
            <p className="text-sm text-gray-400 mt-0.5">{profile.oneLiner}</p>
          )}
        </div>

        {/* State badge */}
        <div className="shrink-0">
          {state === "loading" && (
            <span className="text-xs text-yellow-500 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
              scraping
            </span>
          )}
          {state === "pending" && (
            <span className="text-xs text-gray-600">queued</span>
          )}
          {state === "error" && (
            <span className="text-xs text-red-500">failed</span>
          )}
          {state === "ok" && vel && (
            <span className={`text-xs ${vel.color}`}>{vel.label}</span>
          )}
        </div>
      </div>

      {state === "ok" && profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Tech stack */}
          {profile.techStack.length > 0 && (
            <div>
              <p className="text-gray-500 uppercase tracking-wider mb-2 text-[10px]">
                Tech Stack
              </p>
              <div className="flex flex-wrap gap-1">
                {profile.techStack.map((t) => (
                  <span
                    key={t}
                    className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-[11px]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Open roles */}
          {profile.openRoles.length > 0 && (
            <div>
              <p className="text-gray-500 uppercase tracking-wider mb-2 text-[10px]">
                Open Roles ({profile.openRoles.length})
              </p>
              <div className="space-y-1">
                {profile.openRoles.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-gray-300">
                    <span className="text-emerald-700">›</span>
                    <span>{r.title}</span>
                    {r.location && (
                      <span className="text-gray-600 text-[10px]">{r.location}</span>
                    )}
                  </div>
                ))}
                {profile.openRoles.length > 5 && (
                  <span className="text-gray-600">
                    +{profile.openRoles.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Key signals */}
          {profile.keySignals.length > 0 && (
            <div>
              <p className="text-gray-500 uppercase tracking-wider mb-2 text-[10px]">
                Signals
              </p>
              <div className="space-y-1">
                {profile.keySignals.map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-gray-300">
                    <span className="text-yellow-600 mt-0.5">·</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {state === "error" && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
