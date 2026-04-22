import { Hyperbrowser } from "@hyperbrowser/sdk";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { isValidDomain, sanitizeError, normalizeDomain } from "../_utils";

export const maxDuration = 300;

const hbKey = process.env.HYPERBROWSER_API_KEY;
if (!hbKey) throw new Error("HYPERBROWSER_API_KEY is not set");
const hb = new Hyperbrowser({ apiKey: hbKey });

const anthropicKey = process.env.ANTHROPIC_API_KEY;
const claude = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;

export type Pack = "sdr" | "recruiter" | "vc";

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
};

/* ── Pack-specific vision prompts ─────────────────────────────────────── */
const VISION_PROMPTS: Record<Pack, string> = {
  sdr: `You are analyzing a company's pricing page screenshot for B2B sales intelligence.
Extract the following and return ONLY valid JSON matching this exact shape:
{
  "pricingTiers": ["list of tier names visible, e.g. Starter, Pro, Enterprise"],
  "pricesVisible": ["any prices shown, e.g. $49/mo, contact us"],
  "hasTalkToSales": true or false,
  "hasFreeTrial": true or false,
  "socialProofLogos": ["company logo names visible in any customer/trust section"],
  "visualSignals": ["2-4 specific observations only visible in the screenshot, e.g. 'Enterprise tier has 8 features greyed out suggesting upsell pressure'"]
}
If the page is a 404 or error page, return all arrays empty and booleans false.`,

  recruiter: `You are analyzing a company's careers page screenshot for recruiting intelligence.
Extract the following and return ONLY valid JSON matching this exact shape:
{
  "departmentsHiring": ["departments or teams visible in job listings, e.g. Engineering, Design, Sales"],
  "officeLocations": ["any office locations or 'remote' mentions visible"],
  "benefitsVisible": ["any perks or benefits shown, e.g. equity, unlimited PTO, health insurance"],
  "cultureSignals": ["2-4 specific observations from the page that reveal company culture — tone of copy, photos, values listed"],
  "visualSignals": ["2-4 things only visible in the screenshot, e.g. 'job count badge shows 47 open roles', 'hero image shows diverse team photo'"]
}
If the page is a 404 or error page, return all arrays empty.`,

  vc: `You are analyzing a company's homepage screenshot for investment due diligence.
Extract the following and return ONLY valid JSON matching this exact shape:
{
  "customerLogoCount": number of customer/partner logos visible (0 if none),
  "customerLogosVisible": ["company names readable from logos"],
  "metricsBanners": ["any growth metrics or stats shown prominently, e.g. '10M users', '$2B processed'"],
  "pressLogos": ["press outlet logos visible, e.g. TechCrunch, Forbes"],
  "visualSignals": ["2-4 specific investment signals only visible in the screenshot, e.g. 'hero shows enterprise dashboard UI suggesting B2B focus', 'G2 badge visible showing 4.8/5 rating'"]
}
If the page is a 404 or error page, return customerLogoCount as 0 and all arrays empty.`,
};

const VisualIntelSchema = z.object({
  screenshotUrl: z.string(),
  // SDR fields
  pricingTiers: z.array(z.string()).default([]),
  pricesVisible: z.array(z.string()).default([]),
  hasTalkToSales: z.boolean().default(false),
  hasFreeTrial: z.boolean().default(false),
  socialProofLogos: z.array(z.string()).default([]),
  // Recruiter fields
  departmentsHiring: z.array(z.string()).default([]),
  officeLocations: z.array(z.string()).default([]),
  benefitsVisible: z.array(z.string()).default([]),
  cultureSignals: z.array(z.string()).default([]),
  // VC fields
  customerLogoCount: z.number().default(0),
  customerLogosVisible: z.array(z.string()).default([]),
  metricsBanners: z.array(z.string()).default([]),
  pressLogos: z.array(z.string()).default([]),
  // Common
  visualSignals: z.array(z.string()).default([]),
});

export type VisualIntel = z.infer<typeof VisualIntelSchema>;

const PersonSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  linkedin: z.string().optional(),
  email: z.string().optional(),
  twitter: z.string().optional(),
});

const SignalsSchema = z.object({
  buying: z.array(z.string()).default([]).describe("Buying signals: pricing model hints, recent launches, integrations, customer wins, expansion moves"),
  hiring: z.array(z.string()).default([]).describe("Hiring signals: roles being filled, tech migrations from job posts, team growth pace, location strategy"),
  investment: z.array(z.string()).default([]).describe("Investment signals: funding events, traction proof, team caliber, market position, partnerships"),
}).default({ buying: [], hiring: [], investment: [] });

const CompanyProfileSchema = z.object({
  name: z.string().describe("Company legal or brand name"),
  oneLiner: z.string().describe("One sentence: what the company does and for whom"),
  productCategory: z.string().describe("e.g. DevTools, Fintech, AI Infrastructure, SaaS CRM, E-commerce"),
  customers: z.string().describe("Who they sell to: enterprises, developers, SMBs, consumers, etc."),
  namedCustomers: z.array(z.string()).default([]).describe("Specific customer logos or company names mentioned on the site"),
  techStack: z.array(z.string()).describe("Technologies explicitly mentioned on the site or in job postings"),
  openRoles: z.array(z.object({
    title: z.string(),
    team: z.string().optional(),
    location: z.string().optional(),
  })).describe("All open job listings"),
  hiringVelocity: z.enum(["none", "slow", "steady", "aggressive"]).describe("none=0 roles, slow=1-3, steady=4-10, aggressive=10+"),
  pricingModel: z.enum(["self-serve", "sales-led", "freemium", "enterprise", "unknown"]).default("unknown"),
  fundingStage: z.string().optional(),
  investors: z.array(z.string()).default([]),
  teamSizeEstimate: z.string().optional(),
  foundedYear: z.string().optional(),
  recentLaunches: z.array(z.string()).default([]),
  keySignals: z.array(z.string()).describe("3-5 cross-cutting strategic signals"),
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
  error?: string;
  scrapedAt?: string;
}

/* ── Visual intelligence capture ─────────────────────────────────────── */
async function captureVisualIntel(domain: string, pack: Pack): Promise<VisualIntel | null> {
  if (!claude) return null;

  const targetUrl = PACK_CONFIG[pack].screenshotUrl(domain);

  try {
    const scraped = await hb.scrape.startAndWait({
      url: targetUrl,
      scrapeOptions: { formats: ["screenshot"] },
      sessionOptions: { useStealth: true },
    });

    const screenshot = (scraped.data as { screenshot?: string } | null)?.screenshot;
    if (!screenshot) return null;

    const response = await claude.messages.create({
      model: "claude-opus-4-7-20251101",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: screenshot },
          },
          { type: "text", text: VISION_PROMPTS[pack] },
        ],
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip markdown code fences if Claude wraps the JSON
    const clean = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(clean);
    return VisualIntelSchema.parse({ screenshotUrl: targetUrl, ...parsed });
  } catch {
    return null; // visual intel is best-effort — never fail the whole enrichment
  }
}

/* ── Main enrichment ─────────────────────────────────────────────────── */
async function enrichDomain(domain: string, pack: Pack): Promise<EnrichResult> {
  const clean = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const cfg = PACK_CONFIG[pack];

  const baseUrls = [
    `https://${clean}`,
    `https://${clean}/careers`,
    `https://${clean}/jobs`,
    `https://${clean}/about`,
    `https://${clean}/team`,
    `https://${clean}/leadership`,
  ];

  // Run text extraction and visual screenshot in parallel
  const [result, visualIntel] = await Promise.all([
    hb.extract.startAndWait({
      urls: [...baseUrls, ...cfg.extraUrls(clean)],
      prompt: `Extract a comprehensive company intelligence profile.

${cfg.focus}

For the "people" field: collect every person currently working at the company that
is listed on the team/about/leadership/contact pages. Include name (required), role,
the FULL LinkedIn profile URL if publicly linked, public email if explicitly shown,
public Twitter/X if linked. Do NOT invent or guess emails or LinkedIn URLs.

For the "signals" field: populate ALL three arrays (buying, hiring, investment) with
3-6 concrete, specific items each. These should be actionable — not vague. Bad: "they
are growing." Good: "Hiring 5 senior infra engineers with explicit Kubernetes + Rust
experience, suggesting platform rewrite."

For "pricingModel": infer from pricing page if accessible; default to "unknown" only
if no signal at all.`,
      schema: CompanyProfileSchema,
      sessionOptions: { useStealth: true },
    }),
    captureVisualIntel(clean, pack),
  ]);

  if (result.status !== "completed" || !result.data) {
    return { domain: clean, status: "error", pack, error: result.error ?? "Extract failed" };
  }

  try {
    const profile = CompanyProfileSchema.parse(result.data);
    return {
      domain: clean,
      status: "ok",
      pack,
      profile,
      visualIntel: visualIntel ?? undefined,
      scrapedAt: new Date().toISOString(),
    };
  } catch {
    return { domain: clean, status: "error", pack, error: "Schema validation failed" };
  }
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
  const selectedPack: Pack = pack === "recruiter" || pack === "vc" ? pack : "sdr";

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
          const result = await enrichDomain(domain, selectedPack);
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
