"use client";

import { useState } from "react";
import Link from "next/link";

const SERIF = "'Bodoni Moda', Georgia, serif";
const SANS  = "'Figtree', system-ui, sans-serif";
const MONO  = "'Geist Mono', monospace";

const C = {
  bg:       "#0C0B09",
  surface:  "#141210",
  card:     "#1C1A16",
  border:   "#242118",
  borderHi: "#302D26",
  text:     "#F0EDE6",
  muted:    "#7A7168",
  dim:      "#3D3A32",
  gold:     "#C9A96E",
  goldLo:   "rgba(201,169,110,0.10)",
  goldBorder:"rgba(201,169,110,0.25)",
  sage:     "#7EA88A",
  sageLo:   "rgba(126,168,138,0.10)",
  indigo:   "#8B90C8",
};

type Editor = "claude" | "cursor" | "windsurf" | "cline" | "continue";
type OS = "mac" | "windows" | "linux";

const EDITORS: { id: Editor; label: string; icon: string; desc: string }[] = [
  { id: "claude",   label: "Claude Desktop", icon: "◈", desc: "Anthropic's desktop app" },
  { id: "cursor",   label: "Cursor",         icon: "⌥", desc: "AI-first code editor" },
  { id: "windsurf", label: "Windsurf",       icon: "◎", desc: "Codeium's agentic IDE" },
  { id: "cline",    label: "Cline",          icon: "◇", desc: "VS Code extension" },
  { id: "continue", label: "Continue",       icon: "→", desc: "VS Code / JetBrains" },
];

const OS_OPTIONS: { id: OS; label: string; icon: string }[] = [
  { id: "mac",     label: "macOS",   icon: "⌘" },
  { id: "windows", label: "Windows", icon: "⊞" },
  { id: "linux",   label: "Linux",   icon: "◉" },
];

const MCP_URL = "https://jstack-omega.vercel.app/api/mcp";

function getConfigPath(editor: Editor, os: OS): string {
  const paths: Record<Editor, Record<OS, string>> = {
    claude: {
      mac:     "~/Library/Application Support/Claude/claude_desktop_config.json",
      windows: "%APPDATA%\\Claude\\claude_desktop_config.json",
      linux:   "~/.config/Claude/claude_desktop_config.json",
    },
    cursor: {
      mac:     "~/.cursor/mcp.json",
      windows: "%USERPROFILE%\\.cursor\\mcp.json",
      linux:   "~/.cursor/mcp.json",
    },
    windsurf: {
      mac:     "~/.codeium/windsurf/mcp_config.json",
      windows: "%USERPROFILE%\\.codeium\\windsurf\\mcp_config.json",
      linux:   "~/.codeium/windsurf/mcp_config.json",
    },
    cline: {
      mac:     "VS Code settings → Cline → MCP Servers",
      windows: "VS Code settings → Cline → MCP Servers",
      linux:   "VS Code settings → Cline → MCP Servers",
    },
    continue: {
      mac:     "~/.continue/config.json",
      windows: "%USERPROFILE%\\.continue\\config.json",
      linux:   "~/.continue/config.json",
    },
  };
  return paths[editor][os];
}

function getConfig(editor: Editor, apiKey: string): string {
  const key = apiKey || "YOUR_HYPERBROWSER_API_KEY";

  if (editor === "continue") {
    return JSON.stringify({
      mcpServers: [{
        name: "seam",
        transport: { type: "http", url: MCP_URL },
        env: { HYPERBROWSER_API_KEY: key },
      }],
    }, null, 2);
  }

  return JSON.stringify({
    mcpServers: {
      seam: {
        command: "npx",
        args: ["-y", "mcp-remote", MCP_URL],
        env: { HYPERBROWSER_API_KEY: key },
      },
    },
  }, null, 2);
}

function getInstallNote(editor: Editor): string {
  const notes: Record<Editor, string> = {
    claude:   "Restart Claude Desktop after saving.",
    cursor:   "Restart Cursor after saving. Find MCP in Settings → Features → MCP.",
    windsurf: "Restart Windsurf. Find MCP in the Cascade sidebar.",
    cline:    "In VS Code, open Cline sidebar → MCP Servers → Add Server → paste the config.",
    continue: "Restart Continue extension after saving.",
  };
  return notes[editor];
}

export default function ConnectPage() {
  const [editor, setEditor] = useState<Editor>("claude");
  const [os, setOs]         = useState<OS>("mac");
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [testedOk, setTestedOk] = useState<boolean | null>(null);
  const [testing, setTesting]   = useState(false);

  const config = getConfig(editor, apiKey);
  const configPath = getConfigPath(editor, os);

  function copy() {
    navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function testConnection() {
    setTesting(true);
    setTestedOk(null);
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "1" } } }),
      });
      const json = await res.json();
      setTestedOk(!!json?.result?.serverInfo);
    } catch {
      setTestedOk(false);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg, color: C.text, fontFamily: SANS }}>

      {/* Nav */}
      <nav className="border-b px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm"
        style={{ borderColor: C.border, background: "rgba(12,11,9,0.94)" }}>
        <Link href="/"
          style={{ fontFamily: SERIF, color: C.text, fontWeight: 400, fontSize: 20, letterSpacing: "-0.02em", fontStyle: "italic" }}
          className="hover:opacity-70 transition-opacity flex items-center gap-1">
          Seam<span style={{ color: C.gold, fontSize: 8, marginLeft: 1, marginBottom: 2 }}>●</span>
        </Link>
        <Link href="/app"
          style={{ fontFamily: MONO, fontSize: 11, color: C.muted, border: `1px solid ${C.border}` }}
          className="px-3 py-1.5 rounded-lg hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all">
          ← Back to app
        </Link>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-14 space-y-10">

        {/* Header */}
        <div className="space-y-2">
          <p style={{ fontFamily: MONO, fontSize: 10, color: C.gold, letterSpacing: "0.2em" }} className="uppercase">MCP Connect</p>
          <h1 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Add Seam to your<br />AI assistant.
          </h1>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, maxWidth: 440, marginTop: 8 }}>
            Seam runs as a JSON-RPC 2.0 MCP server. Pick your editor, paste your Hyperbrowser key, copy the config. Done.
          </p>
        </div>

        {/* Step 1 — API key */}
        <section className="space-y-3">
          <Label n="01" text="Your Hyperbrowser API key" />
          <input
            type="password"
            placeholder="hb_••••••••••••••••••••••••••••••"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            style={{ fontFamily: MONO, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, width: "100%" }}
            className="rounded-xl px-4 py-3 focus:outline-none focus:border-[#C9A96E] focus:shadow-[0_0_0_3px_rgba(201,169,110,0.10)] transition-all placeholder-[#3D3A32]"
          />
          <p style={{ fontFamily: MONO, fontSize: 11, color: C.dim }}>
            Get one at <a href="https://hyperbrowser.ai" target="_blank" rel="noreferrer" style={{ color: C.gold }} className="hover:underline">hyperbrowser.ai</a> → Dashboard → API Keys. Never stored here.
          </p>
        </section>

        {/* Step 2 — Editor */}
        <section className="space-y-3">
          <Label n="02" text="Your AI editor" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EDITORS.map(e => (
              <button key={e.id} onClick={() => setEditor(e.id)}
                className="text-left rounded-xl px-4 py-3 transition-all"
                style={{
                  background: editor === e.id ? C.card : "transparent",
                  border: `1px solid ${editor === e.id ? C.goldBorder : C.border}`,
                  boxShadow: editor === e.id ? `0 0 0 3px ${C.goldLo}` : "none",
                }}>
                <div style={{ fontSize: 18, color: editor === e.id ? C.gold : C.dim, marginBottom: 4 }}>{e.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: editor === e.id ? C.text : C.muted }}>{e.label}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: C.dim, marginTop: 2 }}>{e.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Step 3 — OS */}
        <section className="space-y-3">
          <Label n="03" text="Operating system" />
          <div className="flex gap-2">
            {OS_OPTIONS.map(o => (
              <button key={o.id} onClick={() => setOs(o.id)}
                className="rounded-xl px-5 py-2.5 transition-all flex items-center gap-2"
                style={{
                  background: os === o.id ? C.card : "transparent",
                  border: `1px solid ${os === o.id ? C.goldBorder : C.border}`,
                  color: os === o.id ? C.text : C.muted,
                  fontSize: 13, fontWeight: 500,
                }}>
                <span style={{ color: os === o.id ? C.gold : C.dim }}>{o.icon}</span> {o.label}
              </button>
            ))}
          </div>
        </section>

        {/* Step 4 — Config */}
        <section className="space-y-3">
          <Label n="04" text="Copy into your config file" />

          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            {/* Path bar */}
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.dim }} className="truncate">{configPath}</span>
              <button onClick={copy}
                style={{ fontFamily: MONO, fontSize: 11, color: copied ? C.sage : C.gold, background: C.card, border: `1px solid ${C.border}`, flexShrink: 0 }}
                className="ml-3 px-3 py-1 rounded-lg hover:border-[#C9A96E] transition-all">
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>

            {/* Config */}
            <pre style={{ fontFamily: MONO, fontSize: 12, color: C.text, background: C.bg, padding: "16px 20px", overflowX: "auto", margin: 0, lineHeight: 1.7 }}>
              {config.split("\n").map((line, i) => {
                const keyPattern = /"(mcpServers|seam|command|args|env|name|transport|type|url|HYPERBROWSER_API_KEY)"/g;
                const valPattern = /"(npx|-y|mcp-remote|http|YOUR_HYPERBROWSER_API_KEY|[^"]*hyperbrowser[^"]*)"/g;
                const colored = line
                  .replace(keyPattern, `<span style="color:${C.indigo}">"$1"</span>`)
                  .replace(valPattern, `<span style="color:${C.gold}">"$1"</span>`);
                return <span key={i} dangerouslySetInnerHTML={{ __html: colored + "\n" }} />;
              })}
            </pre>
          </div>

          <p style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{getInstallNote(editor)}</p>
        </section>

        {/* Test */}
        <section className="space-y-3">
          <Label n="05" text="Test the connection" />
          <div className="flex items-center gap-3">
            <button onClick={testConnection} disabled={testing}
              style={{ background: C.goldLo, border: `1px solid ${C.goldBorder}`, color: C.gold, fontFamily: SANS, fontSize: 13, fontWeight: 600 }}
              className="px-5 py-2.5 rounded-xl hover:bg-[rgba(201,169,110,0.18)] transition-all disabled:opacity-50">
              {testing ? "Testing…" : "Ping Seam MCP →"}
            </button>
            {testedOk === true  && <span style={{ fontFamily: MONO, fontSize: 12, color: C.sage }}>✓ Server is live — 2 tools available</span>}
            {testedOk === false && <span style={{ fontFamily: MONO, fontSize: 12, color: "#C87070" }}>✗ Could not reach server</span>}
          </div>
        </section>

        {/* What you get */}
        <section className="rounded-xl p-6 space-y-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <p style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: "0.15em" }} className="uppercase">What you can do after connecting</p>
          {[
            { cmd: 'enrich_companies(["stripe.com", "linear.app"], pack="sdr")', desc: "Get buying signals, pricing model, decision-makers" },
            { cmd: 'enrich_companies(["openai.com"], pack="recruiter")',          desc: "Get every open role, tech stack, eng leaders" },
            { cmd: 'enrich_companies(["hyperbrowser.ai"], pack="vc")',            desc: "Get funding stage, traction, investor names" },
            { cmd: "list_packs()",                                                desc: "See all available intelligence packs" },
          ].map(({ cmd, desc }) => (
            <div key={cmd} className="space-y-1">
              <code style={{ fontFamily: MONO, fontSize: 11, color: C.gold, display: "block" }}>{cmd}</code>
              <p style={{ fontFamily: SANS, fontSize: 12, color: C.muted, paddingLeft: 2 }}>{desc}</p>
            </div>
          ))}
        </section>

      </main>
    </div>
  );
}

function Label({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span style={{ fontFamily: MONO, fontSize: 10, color: C.gold, background: C.goldLo, border: `1px solid ${C.goldBorder}`, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>{n}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{text}</span>
    </div>
  );
}
