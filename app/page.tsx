"use client";

import { useState, useRef } from "react";

type Source = { url: string; success: boolean };

export default function Home() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [report, setReport] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function handleResearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setReport("");
    setSources([]);
    setError("");
    setStatus("Starting research...");

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Research request failed");
      }

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
          const payload = JSON.parse(line.slice(6));

          if (payload.event === "status") setStatus(payload.message);
          if (payload.event === "chunk")
            setReport((p) => p + payload.text);
          if (payload.event === "done") {
            setSources(payload.sources);
            setStatus("");
          }
          if (payload.event === "error") {
            setError(payload.message);
            setStatus("");
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message ?? "Something went wrong");
        setStatus("");
      }
    } finally {
      setLoading(false);
    }
  }

  const examples = [
    "Hyperbrowser",
    "Anthropic Claude",
    "OpenAI",
    "Vercel",
    "Stripe",
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-mono">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm font-semibold tracking-widest text-gray-400 uppercase">
          WebSight
        </span>
        <span className="text-xs text-gray-600 ml-auto">
          powered by{" "}
          <a
            href="https://www.hyperbrowser.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-500 hover:text-emerald-400"
          >
            Hyperbrowser
          </a>{" "}
          +{" "}
          <a
            href="https://www.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300"
          >
            Claude
          </a>
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Web Research,{" "}
            <span className="text-emerald-400">Automated</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Enter any company, technology, or topic. WebSight scrapes the open
            web in real time using Hyperbrowser, then synthesizes a structured
            intelligence brief with Claude.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleResearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Hyperbrowser, Next.js, OpenAI..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm px-5 py-3 rounded-lg transition-colors"
            >
              {loading ? "..." : "Research"}
            </button>
          </div>
        </form>

        {/* Examples */}
        {!report && !loading && (
          <div className="flex flex-wrap gap-2 mb-12">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setQuery(ex)}
                className="text-xs bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-full transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {/* Status */}
        {status && (
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {status}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="space-y-6">
            <div className="prose prose-invert prose-sm max-w-none">
              <ReportRenderer text={report} />
            </div>

            {sources.length > 0 && (
              <div className="border-t border-gray-800 pt-6">
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
                  Sources scraped
                </p>
                <div className="space-y-1.5">
                  {sources.map((s) => (
                    <div key={s.url} className="flex items-center gap-2 text-xs">
                      <span
                        className={
                          s.success ? "text-emerald-500" : "text-red-500"
                        }
                      >
                        {s.success ? "✓" : "✗"}
                      </span>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-300 truncate transition-colors"
                      >
                        {s.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!report && !loading && !error && (
          <div className="text-center py-16 text-gray-700 text-sm">
            Results will appear here
          </div>
        )}
      </main>
    </div>
  );
}

function ReportRenderer({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="text-emerald-400 font-semibold text-sm uppercase tracking-wider mt-6 mb-2 first:mt-0"
            >
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-2 text-sm text-gray-300 pl-2">
              <span className="text-emerald-600 mt-0.5">›</span>
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        if (line === "---") {
          return <hr key={i} className="border-gray-800 my-4" />;
        }
        if (line.trim() === "") {
          return <div key={i} className="h-2" />;
        }
        return (
          <p key={i} className="text-sm text-gray-300 leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}
