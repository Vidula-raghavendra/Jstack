"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

/* ── Design tokens (matches landing + app page) ─────────────────── */
const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "'Bodoni Moda', Georgia, serif";
const MONO  = "'Geist Mono', monospace";

const C = {
  bg:          "#0A0908",
  surface:     "#111009",
  card:        "#181610",
  border:      "#2A2622",
  borderHi:    "#3D3830",
  text:        "#F4EFE4",
  muted:       "#8A8174",
  dim:         "#4A4640",
  gold:        "#C9A96E",
  goldLo:      "rgba(201,169,110,0.08)",
  goldBorder:  "rgba(201,169,110,0.22)",
  sage:        "#7EA88A",
  sageLo:      "rgba(126,168,138,0.08)",
  sageBorder:  "rgba(126,168,138,0.22)",
  indigo:      "#8B90C8",
  indigoLo:    "rgba(139,144,200,0.08)",
};

/* ── Grain overlay ──────────────────────────────────────────────── */
function Grain() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat", backgroundSize: "128px 128px",
    }} />
  );
}

/* ── BeveledCard ─────────────────────────────────────────────────── */
function Bracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const h = pos.includes("r");
  const v = pos.includes("b");
  return (
    <div style={{
      position: "absolute",
      [v ? "bottom" : "top"]: -1,
      [h ? "right" : "left"]: -1,
      width: 10, height: 10,
      borderTop:    v ? "none" : `1px solid ${C.borderHi}`,
      borderBottom: v ? `1px solid ${C.borderHi}` : "none",
      borderLeft:   h ? "none" : `1px solid ${C.borderHi}`,
      borderRight:  h ? `1px solid ${C.borderHi}` : "none",
    }} />
  );
}

function BeveledCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={{
      position: "relative",
      background: `linear-gradient(135deg, rgba(201,169,110,0.04) 0%, transparent 50%, rgba(126,168,138,0.03) 100%)`,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      ...style,
    }}>
      <Bracket pos="tl" /><Bracket pos="tr" /><Bracket pos="bl" /><Bracket pos="br" />
      <div style={{
        position: "absolute", inset: 1, borderRadius: 15,
        background: C.card,
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

/* ── Types ───────────────────────────────────────────────────────── */
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

function getConfig(editor: Editor): string {
  if (editor === "continue") {
    return JSON.stringify({
      mcpServers: [{
        name: "seam",
        transport: { type: "http", url: MCP_URL },
      }],
    }, null, 2);
  }
  return JSON.stringify({
    mcpServers: {
      seam: {
        command: "npx",
        args: ["-y", "mcp-remote", MCP_URL],
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

/* ── Step label ──────────────────────────────────────────────────── */
function StepLabel({ n, text }: { n: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <span style={{
        fontFamily: MONO, fontSize: 10, color: C.gold,
        background: C.goldLo, border: `1px solid ${C.goldBorder}`,
        width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 6, flexShrink: 0,
      }}>{n}</span>
      <span style={{ fontFamily: SF, fontSize: 13, fontWeight: 600, color: C.text }}>{text}</span>
    </div>
  );
}

/* ── Syntax-colored JSON line ────────────────────────────────────── */
function colorLine(line: string): string {
  return line
    .replace(/"(mcpServers|seam|command|args|env|name|transport|type|url|HYPERBROWSER_API_KEY)"/g,
      `<span style="color:${C.indigo}">"$1"</span>`)
    .replace(/"(npx|-y|mcp-remote|http|YOUR_HYPERBROWSER_API_KEY|[^"]*hyperbrowser[^"]*)"/g,
      `<span style="color:${C.gold}">"$1"</span>`);
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function ConnectPage() {
  const [editor, setEditor] = useState<Editor>("claude");
  const [os, setOs]         = useState<OS>("mac");
  const [copied, setCopied] = useState(false);
  const [testedOk, setTestedOk] = useState<boolean | null>(null);
  const [testing, setTesting]   = useState(false);

  const config     = getConfig(editor);
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
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1, method: "initialize",
          params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "1" } },
        }),
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
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: SF, position: "relative" }}>
      <Grain />

      {/* Nav */}
      <nav style={{
        borderBottom: `1px solid ${C.border}`,
        padding: "0 24px",
        height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
        backdropFilter: "blur(12px)",
        background: "rgba(10,9,8,0.88)",
      }}>
        <Link href="/" style={{
          fontFamily: SERIF, color: C.text, fontWeight: 400,
          fontSize: 20, letterSpacing: "-0.02em", fontStyle: "italic",
          display: "flex", alignItems: "center", gap: 4, textDecoration: "none",
          opacity: 1, transition: "opacity 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.65")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          Seam<span style={{ color: C.gold, fontSize: 7, marginLeft: 1, marginBottom: 2 }}>●</span>
        </Link>
        <Link href="/app" style={{
          fontFamily: MONO, fontSize: 11, color: C.muted,
          border: `1px solid ${C.border}`, borderRadius: 999,
          padding: "6px 14px", textDecoration: "none",
          transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
        >
          ← app
        </Link>
      </nav>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px 96px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ marginBottom: 52 }}>
          <p style={{ fontFamily: MONO, fontSize: 10, color: C.gold, letterSpacing: "0.18em", marginBottom: 10 }}>
            MCP CONNECT
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 14 }}>
            Add Seam to your<br />AI assistant.
          </h1>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.65, maxWidth: 420 }}>
            Seam runs as a JSON-RPC 2.0 MCP server. Pick your editor, paste your Hyperbrowser key, copy the config.
          </p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>

          {/* Step 1 — Editor */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <StepLabel n="01" text="Your AI editor" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {EDITORS.map((e, i) => (
                <motion.button key={e.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.04 }}
                  onClick={() => setEditor(e.id)}
                  style={{
                    textAlign: "left", borderRadius: 12, padding: "12px 14px",
                    background: editor === e.id ? C.card : "transparent",
                    border: `1px solid ${editor === e.id ? C.goldBorder : C.border}`,
                    boxShadow: editor === e.id ? `0 0 0 3px ${C.goldLo}` : "none",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 16, color: editor === e.id ? C.gold : C.dim, marginBottom: 5 }}>{e.icon}</div>
                  <div style={{ fontFamily: SF, fontSize: 13, fontWeight: 600, color: editor === e.id ? C.text : C.muted }}>{e.label}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: C.dim, marginTop: 2 }}>{e.desc}</div>
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* Step 2 — OS */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <StepLabel n="02" text="Operating system" />
            <div style={{ display: "flex", gap: 8 }}>
              {OS_OPTIONS.map(o => (
                <button key={o.id} onClick={() => setOs(o.id)}
                  style={{
                    borderRadius: 999, padding: "8px 18px",
                    background: os === o.id ? C.card : "transparent",
                    border: `1px solid ${os === o.id ? C.goldBorder : C.border}`,
                    color: os === o.id ? C.text : C.muted,
                    fontFamily: SF, fontSize: 13, fontWeight: 500,
                    display: "flex", alignItems: "center", gap: 7,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <span style={{ color: os === o.id ? C.gold : C.dim }}>{o.icon}</span>
                  {o.label}
                </button>
              ))}
            </div>
          </motion.section>

          {/* Step 3 — Config */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <StepLabel n="03" text="Copy into your config file" />
            <BeveledCard>
              {/* Path bar */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
              }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {configPath}
                </span>
                <motion.button
                  onClick={copy}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    fontFamily: MONO, fontSize: 11,
                    color: copied ? C.sage : C.gold,
                    background: "transparent",
                    border: `1px solid ${copied ? C.sageBorder : C.goldBorder}`,
                    borderRadius: 8, padding: "4px 12px",
                    cursor: "pointer", flexShrink: 0, marginLeft: 12,
                    transition: "all 0.15s",
                  }}
                >
                  {copied ? "Copied ✓" : "Copy"}
                </motion.button>
              </div>

              {/* Config JSON */}
              <pre style={{
                fontFamily: MONO, fontSize: 12, color: C.text,
                padding: "16px 20px", overflowX: "auto", margin: 0, lineHeight: 1.75,
              }}>
                {config.split("\n").map((line, i) => (
                  <span key={i} dangerouslySetInnerHTML={{ __html: colorLine(line) + "\n" }} />
                ))}
              </pre>
            </BeveledCard>
            <p style={{ fontFamily: MONO, fontSize: 11, color: C.muted, marginTop: 10 }}>
              {getInstallNote(editor)}
            </p>
          </motion.section>

          {/* Step 4 — Test */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
            <StepLabel n="04" text="Test the connection" />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <motion.button
                onClick={testConnection}
                disabled={testing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: C.goldLo,
                  border: `1px solid ${C.goldBorder}`,
                  color: C.gold,
                  fontFamily: SF, fontSize: 13, fontWeight: 600,
                  padding: "10px 20px", borderRadius: 999,
                  cursor: testing ? "default" : "pointer",
                  opacity: testing ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
              >
                {testing ? "Testing…" : "Ping Seam MCP →"}
              </motion.button>
              <AnimatePresence mode="wait">
                {testedOk === true && (
                  <motion.span key="ok"
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    style={{ fontFamily: MONO, fontSize: 12, color: C.sage }}>
                    ✓ Server is live — 2 tools available
                  </motion.span>
                )}
                {testedOk === false && (
                  <motion.span key="fail"
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    style={{ fontFamily: MONO, fontSize: 12, color: "#C87070" }}>
                    ✗ Could not reach server
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* What you get */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
            <BeveledCard style={{ padding: 0 }}>
              <div style={{ padding: "20px 24px 0" }}>
                <p style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: "0.15em", marginBottom: 16 }}>
                  WHAT YOU CAN DO AFTER CONNECTING
                </p>
              </div>
              <div style={{ padding: "0 24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { cmd: 'enrich_companies(["stripe.com", "linear.app"], pack="sdr")', desc: "Get buying signals, pricing model, decision-makers" },
                  { cmd: 'enrich_companies(["openai.com"], pack="recruiter")',          desc: "Get every open role, tech stack, eng leaders" },
                  { cmd: 'enrich_companies(["hyperbrowser.ai"], pack="vc")',            desc: "Get funding stage, traction, investor names" },
                  { cmd: "list_packs()",                                                desc: "See all available intelligence packs" },
                ].map(({ cmd, desc }, i) => (
                  <motion.div key={cmd}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.06 }}>
                    <code style={{ fontFamily: MONO, fontSize: 11, color: C.gold, display: "block", marginBottom: 3 }}>
                      {cmd}
                    </code>
                    <p style={{ fontFamily: SF, fontSize: 12, color: C.muted, paddingLeft: 2, margin: 0 }}>
                      {desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </BeveledCard>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
