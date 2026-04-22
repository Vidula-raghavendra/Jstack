import { Hyperbrowser } from "@hyperbrowser/sdk";
import { z } from "zod";

export const maxDuration = 120;

const hb = new Hyperbrowser({ apiKey: process.env.HYPERBROWSER_API_KEY! });

export type Pack = "sdr" | "recruiter" | "vc";

const PACK_CONFIG: Record<Pack, { extraUrls: (c: string) => string[]; focus: string; signalKey: "buying" | "hiring" | "investment" }> = {
  sdr: {
    extraUrls: (c) => [`https://${c}/pricing`, `https://${c}/customers`, `https://${c}/case-studies`],
    focus: `SDR FOCUS: surface concrete buying signals an outbound rep could act on this week — pricing model (self-serve vs sales-led, "Talk to sales" CTAs), named logos, recent integrations or product launches, expansion into new segments, public roadmap items. People: founders, VP/Head/Director titles with publicly listed contact info.`,
    signalKey: "buying",
  },
  recruiter: {
    extraUrls: (c) => [`https://${c}/engineering`, `https://${c}/blog`, `https://${c}/handbook`],
    focus: `RECRUITER FOCUS: full hiring trajectory — every open role with title/team/location, languages/frameworks/clouds explicitly named in job posts, engineering blog topics, public team-size/handbook hints. People: engineering leaders and hiring managers.`,
    signalKey: "hiring",
  },
  vc: {
    extraUrls: (c) => [`https://${c}/press`, `https://${c}/news`, `https://${c}/investors`, `https://${c}/about`],
    focus: `VC FOCUS: investment-grade signals — funding stage and latest round, named investors, traction proof (customer logos, ARR/usage stats, partnerships), team caliber (where founders previously worked), market expansion moves. People: founders and exec team with LinkedIn URLs.`,
    signalKey: "investment",
  },
};

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
  namedCustomers: z.array(z.string()).default([]).describe("Specific customer logos or company names mentioned on the site (case studies, customer pages, testimonials)"),
  techStack: z.array(z.string()).describe("Technologies explicitly mentioned on the site or in job postings"),
  openRoles: z.array(z.object({
    title: z.string(),
    team: z.string().optional(),
    location: z.string().optional(),
  })).describe("All open job listings"),
  hiringVelocity: z.enum(["none", "slow", "steady", "aggressive"]).describe("none=0 roles, slow=1-3, steady=4-10, aggressive=10+"),
  pricingModel: z.enum(["self-serve", "sales-led", "freemium", "enterprise", "unknown"]).default("unknown").describe("Self-serve = signup + pricing public; sales-led = 'Talk to sales' only; freemium = free tier + paid; enterprise = bespoke quote"),
  fundingStage: z.string().optional(),
  investors: z.array(z.string()).default([]).describe("Named investors if mentioned on press/about/investors page"),
  teamSizeEstimate: z.string().optional(),
  foundedYear: z.string().optional(),
  recentLaunches: z.array(z.string()).default([]).describe("Specific products, features, or initiatives announced in the last 6-12 months"),
  keySignals: z.array(z.string()).describe("3-5 cross-cutting strategic signals"),
  signals: SignalsSchema,
  people: z.array(PersonSchema).default([]).describe("People found on team/about/leadership pages with public contact info only — never invent emails or LinkedIn URLs"),
  socialLinks: z.object({
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
  }).optional(),
  linkedinCompanyUrl: z.string().optional().describe("Full LinkedIn company URL if linked from the site footer or about page (e.g. https://linkedin.com/company/...)"),
});

export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

export interface EnrichResult {
  domain: string;
  status: "ok" | "error";
  pack?: Pack;
  profile?: CompanyProfile;
  error?: string;
  scrapedAt?: string;
}

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

  const result = await hb.extract.startAndWait({
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
  });

  if (result.status !== "completed" || !result.data) {
    return { domain: clean, status: "error", pack, error: result.error ?? "Extract failed" };
  }

  try {
    const profile = CompanyProfileSchema.parse(result.data);
    return { domain: clean, status: "ok", pack, profile, scrapedAt: new Date().toISOString() };
  } catch {
    return { domain: clean, status: "error", pack, error: "Schema validation failed" };
  }
}

export async function POST(request: Request) {
  const { domains, pack } = await request.json();
  const selectedPack: Pack = pack === "recruiter" || pack === "vc" ? pack : "sdr";

  if (!Array.isArray(domains) || domains.length === 0) {
    return Response.json({ error: "domains array required" }, { status: 400 });
  }

  const list: string[] = domains.slice(0, 10);

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
        "Running AI analysis",
        "Validating & formatting results",
      ];
      const STEP_MS = [0, 2000, 5000, 9000, 14000, 20000, 27000, 34000, 44000, 56000];

      for (const domain of list) {
        send({ event: "started", domain });

        // Stream step events concurrently alongside the blocking scrape
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
          const msg = String(err);
          const isRateLimit = /rate.?limit|concurrent|quota|429/i.test(msg);
          send({
            event: "result", domain, status: "error", pack: selectedPack,
            error: isRateLimit
              ? "Rate limit — free tier allows one session at a time. Wait a moment and retry."
              : msg,
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
