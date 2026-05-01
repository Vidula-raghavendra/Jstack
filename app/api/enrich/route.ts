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
    focus: `SDR FOCUS: surface concrete buying signals an outbound rep could act on this week — pricing model (self-serve vs sales-led, "Talk to sales" CTAs), named logos, recent integrations or product launches, expansion into new segments, public roadmap items. People: founders, VP/Head/Director titles with publicly listed contact info.`,
    signalKey: "buying",
    screenshotUrl: (c) => `https://${c}/pricing`,
  },
  recruiter: {
    extraUrls: (c) => [`https://${c}/engineering`, `https://${c}/blog`, `https://${c}/handbook`],
    focus: `RECRUITER FOCUS: full hiring trajectory — every open role with title/team/location, languages/frameworks/clouds explicitly named in job posts, engineering blog topics, public team-size/handbook hints. People: engineering leaders and hiring managers.`,
    signalKey: "hiring",
    screenshotUrl: (c) => `https://${c}/careers`,
  },
  vc: {
    extraUrls: (c) => [`https://${c}/press`, `https://${c}/news`, `https://${c}/investors`, `https://${c}/about`],
    focus: `VC FOCUS: investment-grade signals — funding stage and latest round, named investors, traction proof (customer logos, ARR/usage stats, partnerships), team caliber (where founders previously worked), market expansion moves. People: founders and exec team with LinkedIn URLs.`,
    signalKey: "investment",
    screenshotUrl: (c) => `https://${c}`,
  },
  upgrade: {
    extraUrls: (c) => [`https://${c}/about`, `https://${c}/pricing`],
    focus: `UPGRADE FOCUS: This company uses the Hyperbrowser SDK. Qualify them for a paid plan upgrade.
Extract: exactly what they build with browser automation, whether it runs in production serving real customers, team size and hiring pace, funding or revenue signals, and any evidence they are hitting scale limits (parallel scraping jobs, real-time monitoring, commercial SLA requirements).
Surface in buying signals: concrete reasons their free tier (1 concurrent session, 5k credits) is a bottleneck for what they are building.`,
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
