import { Hyperbrowser } from "@hyperbrowser/sdk";
import { z } from "zod";
import { isValidDomain, sanitizeError, normalizeDomain } from "../_utils";

export const maxDuration = 300;

const hbKey = process.env.HYPERBROWSER_API_KEY;
if (!hbKey) throw new Error("HYPERBROWSER_API_KEY is not set");
const hb = new Hyperbrowser({ apiKey: hbKey });

export type Pack = "sdr" | "recruiter" | "vc" | "upgrade";

const PACK_CONFIG: Record<Pack, { extraUrls: (c: string) => string[]; focus: string; signalKey: "buying" | "hiring" | "investment"; screenshotUrl: (c: string) => string }> = {
  sdr: {
    extraUrls: (c) => [`https://${c}/pricing`, `https://${c}/customers`, `https://${c}/case-studies`],
    focus: `SDR FOCUS — you are an outbound sales rep building a call list.
PRIORITY 1 — Pricing intelligence: Is this self-serve (credit card, instant signup), sales-led ("Talk to Sales", "Request Demo"), freemium, or enterprise-only? Are prices public or hidden? What tiers exist?
PRIORITY 2 — Named customer logos: Extract every company name visible as a customer logo or testimonial. These are the namedrop arsenal for cold outreach.
PRIORITY 3 — Trigger events: Recent product launches, integrations, funding announcements, new market expansion, or partnerships — anything that happened in the last 90 days that a rep could reference.
PRIORITY 4 — Decision makers: Extract founders, C-suite, VP/Head/Director of Sales, Marketing, Engineering, Product — with publicly listed email, LinkedIn URL, Twitter. Never invent contact info.
PRIORITY 5 — Competitor mentions: Any competitors named on the site (often in comparison tables or "vs" pages).
For signals.buying: 4-6 items, each a specific actionable insight (e.g. "Sales-led pricing — 'Talk to Sales' CTA on every tier" or "Just launched Salesforce integration — expansion signal").`,
    signalKey: "buying",
    screenshotUrl: (c) => `https://${c}/pricing`,
  },
  recruiter: {
    extraUrls: (c) => [`https://${c}/careers`, `https://${c}/jobs`, `https://${c}/engineering`],
    focus: `RECRUITER FOCUS — you are a technical recruiter sourcing candidates and mapping org structure.
PRIORITY 1 — Every open role: Extract title, team/department, location (remote/hybrid/city), and seniority level. Do not summarise — list every individual role.
PRIORITY 2 — Tech stack from job posts: List every language, framework, database, cloud, and tool explicitly named in job descriptions (TypeScript, Rust, Go, React, Postgres, AWS, k8s, etc.). This is your candidate search filter.
PRIORITY 3 — Engineering org structure: How many eng teams exist? What are they called (Platform, Infra, ML, Product Eng, etc.)? What seniority levels are they hiring at?
PRIORITY 4 — Hiring managers and engineering leaders: CTO, VP Eng, Engineering Managers, Tech Leads — with LinkedIn URLs. These are your warm intro targets.
PRIORITY 5 — Culture signals: Remote vs office policy, equity compensation mentions, notable perks, engineering blog topics (signals technical depth and team values).
For signals.hiring: 4-6 items (e.g. "Hiring Rust engineers — rare signal, strong senior pipeline opportunity" or "5 open ML roles — building in-house AI, not outsourcing").`,
    signalKey: "hiring",
    screenshotUrl: (c) => `https://${c}/careers`,
  },
  vc: {
    extraUrls: (c) => [`https://${c}/press`, `https://${c}/about`, `https://${c}/blog`],
    focus: `VC FOCUS — you are an investor doing pre-meeting due diligence.
PRIORITY 1 — Funding history: Current stage (Pre-seed / Seed / Series A/B/C / Growth), total raised, most recent round size and date, named lead investors (fund names and partner names if visible).
PRIORITY 2 — Founder backgrounds: Where did each founder work before? (Prior company, role, exit or outcome). This is the single strongest predictor of outcome.
PRIORITY 3 — Traction proof: Named enterprise customers, ARR or revenue figures, user/company counts, growth metrics, partnerships with named companies. Extract numbers and logos, not vague claims.
PRIORITY 4 — Market signals: New market expansion, recent product launches, press coverage in named outlets, analyst recognition. What is the TAM narrative they are telling?
PRIORITY 5 — Team caliber: Total team size, LinkedIn employee count, key executive hires in the last 6 months.
For signals.investment: 4-6 items (e.g. "Series B — $40M led by a16z, Jan 2025" or "Founders previously built and sold X to Stripe — strong exit pedigree").`,
    signalKey: "investment",
    screenshotUrl: (c) => `https://${c}`,
  },
  upgrade: {
    extraUrls: (c) => [`https://${c}/about`, `https://${c}/pricing`],
    focus: `GROWTH PACK FOCUS — you are qualifying a Hyperbrowser free-tier user for a paid plan upgrade.
PRIORITY 1 — What exactly do they build with browser automation? Is it a core product feature or an internal tool? Is it live in production serving real customers?
PRIORITY 2 — Scale indicators: How many concurrent browser sessions would their use case require? Do they mention real-time monitoring, parallel scraping, high-volume extraction, or commercial SLAs?
PRIORITY 3 — Revenue and funding signals: Are they funded? Do they have paying customers? Is this a commercial product or a side project? Extract funding stage, named investors, pricing model.
PRIORITY 4 — Team size and growth: LinkedIn employee count, hiring pace, open engineering roles — signals they are scaling and have budget.
PRIORITY 5 — Free-tier bottleneck evidence: Any mention of rate limits, session limits, credit exhaustion, performance requirements that exceed 1 concurrent session or 5k monthly credits.
For signals.buying: 4-6 items that are concrete upgrade triggers (e.g. "Production scraping pipeline — free tier 1-session limit is a hard bottleneck" or "Series A funded — budget for infrastructure exists").`,
    signalKey: "buying",
    screenshotUrl: (c) => `https://${c}`,
  },
};

export type VisualIntel = Record<string, never>;

const PersonSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  linkedin: z.string().optional(),
  email: z.string().optional(),
  twitter: z.string().optional(),
});

const SignalItemSchema = z.object({
  title: z.string().describe("Short headline, max 8 words — the actionable takeaway"),
  detail: z.string().describe("One sentence of supporting evidence from what you found"),
  tag: z.string().optional().describe("Category tag, e.g. 'PLG', 'Expansion', 'Intent', 'Competitor', 'Funding', 'Scale'"),
});

const SignalsSchema = z.object({
  buying: z.array(SignalItemSchema).default([]).describe("Buying signals: each with short title + one-sentence evidence"),
  hiring: z.array(SignalItemSchema).default([]).describe("Hiring signals: each with short title + one-sentence evidence"),
  investment: z.array(SignalItemSchema).default([]).describe("Investment signals: each with short title + one-sentence evidence"),
}).default({ buying: [], hiring: [], investment: [] });

const CompanyProfileSchema = z.object({
  name: z.string().default("Unknown"),
  oneLiner: z.string().default(""),
  productCategory: z.string().default(""),
  customers: z.string().default(""),
  namedCustomers: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  openRoles: z.array(z.object({
    title: z.string(),
    team: z.string().optional(),
    location: z.string().optional(),
  })).default([]),
  hiringVelocity: z.enum(["none", "slow", "steady", "aggressive"]).default("none"),
  pricingModel: z.enum(["self-serve", "sales-led", "freemium", "enterprise", "unknown"]).default("unknown"),
  revenueModel: z.string().optional(),
  estimatedRevenue: z.string().optional(),
  fundingStage: z.string().optional(),
  fundingTotal: z.string().optional(),
  investors: z.array(z.string()).default([]),
  teamSizeEstimate: z.string().optional(),
  linkedinEmployeeCount: z.string().optional(),
  glassdoorRating: z.string().optional(),
  g2Rating: z.string().optional(),
  trustpilotRating: z.string().optional(),
  monthlyVisitors: z.string().optional(),
  foundedYear: z.string().optional(),
  recentLaunches: z.array(z.string()).default([]),
  competitorMentions: z.array(z.string()).default([]),
  keySignals: z.array(z.string()).default([]),
  signals: SignalsSchema,
  people: z.array(PersonSchema).default([]),
  socialLinks: z.object({
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
  }).optional(),
  linkedinCompanyUrl: z.string().optional(),
});

export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

export interface EnrichResult {
  domain: string;
  status: "ok" | "error";
  pack?: Pack;
  profile?: CompanyProfile;
  visualIntel?: VisualIntel;
  agentLiveUrl?: string;
  error?: string;
  scrapedAt?: string;
}

/* ── Hyperbrowser-native extract (no LLM required) ──────────────────── */
async function enrichWithExtract(domain: string, pack: Pack): Promise<EnrichResult> {
  const clean = normalizeDomain(domain);
  const cfg = PACK_CONFIG[pack];

  const baseUrls = [
    `https://${clean}`, `https://${clean}/about`, `https://${clean}/team`,
    `https://${clean}/careers`, `https://${clean}/jobs`, `https://${clean}/leadership`,
    `https://www.crunchbase.com/organization/${clean.split(".")[0]}`,
    `https://www.linkedin.com/company/${clean.split(".")[0]}`,
  ];

  try {
    const result = await hb.extract.startAndWait({
      urls: [...baseUrls, ...cfg.extraUrls(clean)].slice(0, 10),
      prompt: `Extract a comprehensive company intelligence profile from all the pages provided. ${cfg.focus}
For "people": collect every person on team/about/leadership pages. Include name (required), role, full LinkedIn URL if publicly linked, public email/Twitter if shown. Never invent URLs.
For "signals": each item MUST have a "title" (max 8 words, action-oriented takeaway) and "detail" (one sentence of evidence). Populate buying, hiring, and investment arrays with 4-6 items each.
For external data fields (estimatedRevenue, fundingTotal, investors, glassdoorRating, g2Rating, linkedinEmployeeCount, monthlyVisitors): extract from Crunchbase, LinkedIn, and any press pages found. Leave null if not found — never guess.`,
      schema: CompanyProfileSchema,
      sessionOptions: { useStealth: true },
    });

    if (result.status !== "completed" || !result.data) {
      return { domain: clean, status: "error", pack, error: result.error ?? "Extract failed" };
    }

    const profile = CompanyProfileSchema.parse(result.data);
    return { domain: clean, status: "ok", pack, profile, scrapedAt: new Date().toISOString() };
  } catch (err) {
    console.error("[enrich] enrichWithExtract failed:", err);
    return { domain: clean, status: "error", pack, error: sanitizeError(String(err)) };
  }
}

/* ── Main enrichment — Hyperbrowser native extract only ─────────────── */
async function enrichDomain(domain: string, pack: Pack, _onLiveUrl?: (url: string) => void): Promise<EnrichResult> {
  return enrichWithExtract(domain, pack);
}

/* ── Streaming POST ──────────────────────────────────────────────────── */
export async function POST(request: Request) {
  let body: { domains?: unknown; pack?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { domains, pack } = body;
  const VALID_PACKS = new Set<Pack>(["sdr", "recruiter", "vc", "upgrade"]);
  const selectedPack: Pack = typeof pack === "string" && VALID_PACKS.has(pack as Pack) ? (pack as Pack) : "sdr";

  if (!Array.isArray(domains) || domains.length === 0) {
    return Response.json({ error: "domains array required" }, { status: 400 });
  }

  const list: string[] = (domains as unknown[])
    .filter((d): d is string => typeof d === "string")
    .map(normalizeDomain)
    .filter(isValidDomain)
    .slice(0, 10);

  if (list.length === 0) {
    return Response.json({ error: "No valid domains provided" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      const STEPS = [
        "Opening stealth browser session",
        "Bypassing bot detection",
        "Loading homepage",
        "Discovering linked pages",
        "Navigating to pricing page",
        "Scanning careers & job posts",
        "Reading team & about pages",
        "Extracting structured signals",
        "Capturing visual screenshot",
        "Running visual AI analysis",
        "Validating & formatting results",
      ];
      const STEP_MS = [0, 2000, 5000, 9000, 14000, 20000, 27000, 34000, 44000, 52000, 60000];

      for (const domain of list) {
        send({ event: "started", domain });

        let stepCancelled = false;
        const stepLoop = (async () => {
          for (let i = 0; i < STEPS.length; i++) {
            if (stepCancelled) break;
            if (i > 0) await new Promise<void>(r => setTimeout(r, STEP_MS[i] - STEP_MS[i - 1]));
            if (!stepCancelled) send({ event: "step", domain, step: STEPS[i], stepIndex: i, total: STEPS.length });
          }
        })();

        try {
          const result = await enrichDomain(domain, selectedPack, (liveUrl) => {
            send({ event: "liveUrl", domain, liveUrl });
          });
          stepCancelled = true;
          void stepLoop;
          send({ event: "result", ...result });
        } catch (err) {
          stepCancelled = true;
          send({
            event: "result", domain, status: "error", pack: selectedPack,
            error: sanitizeError(String(err)),
          });
        }
      }

      send({ event: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function enrichForMcp(domain: string, pack: Pack) {
  return enrichDomain(domain, pack);
}
