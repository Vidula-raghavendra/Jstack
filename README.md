# Seam — B2B Intelligence Powered by Hyperbrowser

> **Intelligence runs deep.**

Seam is a stealth-powered B2B company intelligence tool. Paste domains, pick a pack, and get pack-shaped signals extracted in under 60 seconds — no signup, no API key required from the end user.

Built as a showcase for [Hyperbrowser](https://hyperbrowser.ai)'s stealth browser extraction capabilities.

**Live demo:** https://jstack-omega.vercel.app

---

## What it demonstrates

| Hyperbrowser capability | How Seam uses it |
|------------------------|-----------------|
| **Stealth sessions** | `useStealth: true` bypasses bot detection on every domain |
| **Multi-URL extraction** | Visits 6–10 pages per domain (homepage, pricing, careers, about, team, press) in one session |
| **Structured AI extraction** | `hb.extract.startAndWait()` with a Zod schema → typed, validated output |
| **Real-time SSE streaming** | Progress step events stream from server to client as scraping runs |
| **MCP server** | Ships as a JSON-RPC 2.0 MCP server — call `enrich_companies()` directly from Claude or Cursor |

---

## The three packs

Each pack visits the same company but extracts different signal shapes:

| Pack | Primary signals | Use case |
|------|-----------------|----------|
| **SDR** | Pricing model, decision-makers, named logos, buying intent | Outbound sales |
| **Recruiter** | Open roles, tech stack from job posts, hiring velocity, eng leaders | Talent sourcing |
| **VC** | Funding stage, named investors, traction proof, founder backgrounds | Investment screening |

---

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Hyperbrowser SDK** — stealth browser extraction
- **Claude** — structured AI extraction via Hyperbrowser
- **Framer Motion** — live progress animation
- **Zod** — typed schema validation
- **MCP (Model Context Protocol)** — `mcp-remote` stdio bridge for Claude / Cursor

---

## Getting started

### 1. Clone & install

```bash
git clone https://github.com/your-org/seam.git
cd seam
npm install
```

### 2. Set environment variables

Create `.env.local`:

```env
HYPERBROWSER_API_KEY=your_key_here
```

Get your API key at [hyperbrowser.ai](https://hyperbrowser.ai).

> **Free tier:** The free tier allows one concurrent stealth session. Seam processes domains sequentially so this works out of the box — each domain finishes before the next begins.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Deploy to Vercel

```bash
vercel deploy
```

Add `HYPERBROWSER_API_KEY` as an environment variable in your Vercel project settings.

---

## MCP integration

Seam ships as a fully-functional MCP server. Add this to `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "seam": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-deployment.vercel.app/api/mcp"
      ]
    }
  }
}
```

Then ask Claude:

```
> extract stripe.com and linear.app with the SDR pack
> list available packs
```

Exposed tools: `enrich_companies(domains, pack)` · `list_packs()`

---

## Project structure

```
app/
  page.tsx              # Landing page
  app/
    page.tsx            # Power tool — input, results, history, CSV export
  api/
    enrich/
      route.ts          # SSE stream + Hyperbrowser extraction + MCP helper
    mcp/
      route.ts          # JSON-RPC 2.0 MCP server endpoint
  components/
    SmoothScroll.tsx
```

---

## How the extraction works

```typescript
// Each domain visits 6-10 URLs in a single stealth session
const result = await hb.extract.startAndWait({
  urls: [...baseUrls, ...packSpecificUrls],
  prompt: packFocusedExtractionPrompt,
  schema: CompanyProfileSchema,           // Zod schema → typed output
  sessionOptions: { useStealth: true },   // Bypass bot detection
});
```

The route handler fires concurrent SSE step events alongside the blocking scrape call, so the UI shows live progress (10 steps, time-interpolated) rather than a blank loading state.

---

Built with [Hyperbrowser](https://hyperbrowser.ai) · [Live demo](https://jstack-omega.vercel.app)
