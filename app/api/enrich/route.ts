import { Hyperbrowser } from "@hyperbrowser/sdk";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const maxDuration = 120;

const hb = new Hyperbrowser({ apiKey: process.env.HYPERBROWSER_API_KEY! });
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Stealth session options — bypasses bot detection on career pages (Greenhouse, Lever, Workday)
const STEALTH_OPTS = {
  useStealth: true,
  solveCaptchas: true,
};

// Schema for what we extract from each company
const CompanyProfileSchema = z.object({
  name: z.string().describe("Company name"),
  oneLiner: z.string().describe("What the company does in one sentence"),
  productCategory: z
    .string()
    .describe("e.g. DevTools, Fintech, AI Infrastructure, SaaS CRM"),
  customers: z
    .string()
    .describe("Who they sell to: enterprises, developers, SMBs, consumers"),
  techStack: z
    .array(z.string())
    .describe(
      "Technologies mentioned in job postings or engineering blog — languages, frameworks, infra"
    ),
  openRoles: z
    .array(
      z.object({
        title: z.string(),
        team: z.string().optional(),
        location: z.string().optional(),
      })
    )
    .describe("Open job listings found"),
  hiringVelocity: z
    .enum(["none", "slow", "steady", "aggressive"])
    .describe("Inferred from number and seniority of open roles"),
  fundingStage: z
    .string()
    .optional()
    .describe("Seed, Series A, Series B, public, etc. if mentioned"),
  teamSizeEstimate: z
    .string()
    .optional()
    .describe("e.g. '10-50', '50-200', if determinable"),
  keySignals: z
    .array(z.string())
    .describe(
      "3-5 notable signals: e.g. 'Hiring 5 ML engineers', 'Migrating to Rust', 'Recently launched enterprise tier'"
    ),
});

export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

export interface EnrichResult {
  domain: string;
  status: "ok" | "error";
  profile?: CompanyProfile;
  error?: string;
}

async function enrichDomain(domain: string): Promise<EnrichResult> {
  const clean = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const homeUrl = `https://${clean}`;
  const careerUrls = [
    `https://${clean}/careers`,
    `https://${clean}/jobs`,
    `https://${clean}/about/careers`,
    `https://${clean}/company/careers`,
  ];

  // Scrape homepage + top career URL candidates in parallel
  const [homeResult, ...careerResults] = await Promise.allSettled([
    hb.scrape.startAndWait({
      url: homeUrl,
      sessionOptions: STEALTH_OPTS,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true, timeout: 20000 },
    }),
    // Try first two career URL patterns simultaneously
    hb.scrape.startAndWait({
      url: careerUrls[0],
      sessionOptions: STEALTH_OPTS,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true, timeout: 20000 },
    }),
    hb.scrape.startAndWait({
      url: careerUrls[1],
      sessionOptions: STEALTH_OPTS,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true, timeout: 20000 },
    }),
  ]);

  const homeMarkdown =
    homeResult.status === "fulfilled"
      ? homeResult.value?.data?.markdown ?? ""
      : "";

  const careerMarkdown = careerResults
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof hb.scrape.startAndWait>>> =>
      r.status === "fulfilled" && !!r.value?.data?.markdown
    )
    .map((r) => r.value?.data?.markdown ?? "")
    .join("\n\n");

  if (!homeMarkdown && !careerMarkdown) {
    return { domain: clean, status: "error", error: "Could not load any pages" };
  }

  // Use Claude to extract structured profile from raw scraped content
  const msg = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a B2B research analyst. Extract a structured company profile from the scraped content below.
Domain: ${clean}

Return ONLY valid JSON matching this exact structure, no markdown, no explanation:
{
  "name": string,
  "oneLiner": string,
  "productCategory": string,
  "customers": string,
  "techStack": string[],
  "openRoles": [{"title": string, "team": string|null, "location": string|null}],
  "hiringVelocity": "none"|"slow"|"steady"|"aggressive",
  "fundingStage": string|null,
  "teamSizeEstimate": string|null,
  "keySignals": string[]
}

Rules:
- techStack: only extract technologies EXPLICITLY mentioned (languages, frameworks, cloud, tools)
- keySignals: be specific and actionable ("Hiring 4 senior ML engineers" not "company is growing")
- hiringVelocity: none=0 jobs, slow=1-3, steady=4-10, aggressive=10+
- If info isn't available, use null or empty arrays

--- HOMEPAGE ---
${homeMarkdown.slice(0, 2500)}

--- CAREERS PAGE ---
${careerMarkdown.slice(0, 2500)}`,
      },
    ],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();

  try {
    const parsed = JSON.parse(raw);
    const profile = CompanyProfileSchema.parse(parsed);
    return { domain: clean, status: "ok", profile };
  } catch {
    return { domain: clean, status: "error", error: "Failed to parse profile" };
  }
}

export async function POST(request: Request) {
  const { domains } = await request.json();

  if (!Array.isArray(domains) || domains.length === 0) {
    return Response.json({ error: "domains array required" }, { status: 400 });
  }

  const list: string[] = domains.slice(0, 10); // cap at 10

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );

      // Process all domains concurrently — this is the core Hyperbrowser value:
      // parallel stealth browser sessions, impossible to do at this scale with a regular scraper
      await Promise.allSettled(
        list.map(async (domain) => {
          send({ event: "started", domain });
          const result = await enrichDomain(domain);
          send({ event: "result", ...result });
        })
      );

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
