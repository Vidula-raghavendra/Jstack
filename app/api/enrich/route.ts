import { Hyperbrowser } from "@hyperbrowser/sdk";
import { z } from "zod";

export const maxDuration = 120;

const hb = new Hyperbrowser({ apiKey: process.env.HYPERBROWSER_API_KEY! });

const CompanyProfileSchema = z.object({
  name: z.string().describe("Company legal or brand name"),
  oneLiner: z.string().describe("One sentence: what the company does and for whom"),
  productCategory: z.string().describe("e.g. DevTools, Fintech, AI Infrastructure, SaaS CRM, E-commerce"),
  customers: z.string().describe("Who they sell to: enterprises, developers, SMBs, consumers, etc."),
  techStack: z.array(z.string()).describe("Technologies explicitly mentioned on the site or in job postings — languages, frameworks, cloud providers, databases, tools"),
  openRoles: z.array(z.object({
    title: z.string(),
    team: z.string().optional(),
    location: z.string().optional(),
  })).describe("All open job listings found on the site or careers page"),
  hiringVelocity: z.enum(["none", "slow", "steady", "aggressive"]).describe("none=0 open roles, slow=1-3, steady=4-10, aggressive=10+"),
  fundingStage: z.string().optional().describe("Seed, Series A, Series B, public, bootstrapped, etc. if mentioned"),
  teamSizeEstimate: z.string().optional().describe("Approximate headcount range, e.g. '10-50', '50-200'"),
  foundedYear: z.string().optional().describe("Year the company was founded if mentioned"),
  keySignals: z.array(z.string()).describe("3-5 notable, specific signals: e.g. 'Hiring 5 ML engineers suggesting AI product push', 'Migrating from Python to Rust per job requirements'"),
  people: z.array(z.object({
    name: z.string().describe("Full name of the person"),
    role: z.string().optional().describe("Their role/title at the company, e.g. 'CEO', 'Head of Engineering', 'Founding Engineer'"),
    linkedin: z.string().optional().describe("Full LinkedIn profile URL if publicly listed on the company site (e.g. https://linkedin.com/in/...)"),
    email: z.string().optional().describe("Public email address if explicitly listed on the company site (only include if shown publicly — do not guess)"),
    twitter: z.string().optional().describe("Twitter/X profile URL if listed publicly"),
  })).describe("People currently working at the company found on the team/about/leadership pages — include name, role, and any publicly listed LinkedIn URLs or emails. Do not invent contact info that is not present on the page.").default([]),
  socialLinks: z.object({
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
  }).optional().describe("Social/community links found on the site"),
});

export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

export interface EnrichResult {
  domain: string;
  status: "ok" | "error";
  profile?: CompanyProfile;
  error?: string;
  scrapedAt?: string;
}

async function enrichDomain(domain: string): Promise<EnrichResult> {
  const clean = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

  // Hyperbrowser extract visits multiple URL variants automatically,
  // uses stealth mode to bypass bot detection on ATS platforms,
  // and applies its own built-in AI to extract structured data —
  // no external LLM key required.
  const result = await hb.extract.startAndWait({
    urls: [
      `https://${clean}`,
      `https://${clean}/careers`,
      `https://${clean}/jobs`,
      `https://${clean}/about`,
      `https://${clean}/team`,
      `https://${clean}/about/team`,
      `https://${clean}/people`,
      `https://${clean}/leadership`,
      `https://${clean}/about-us`,
      `https://${clean}/contact`,
    ],
    prompt: `Extract a comprehensive company intelligence profile.
Focus especially on: what the company builds, who their customers are,
their technology choices (from job requirements, engineering blog, etc.),
all open job listings with titles and locations, and any strategic signals
(funding news, new product launches, major hiring pushes, technology migrations).

For the "people" field: collect every person currently working at the company that
is listed on the team/about/leadership/contact pages. For each person include:
  - their full name (required)
  - their role or title if shown
  - the FULL LinkedIn profile URL if it is publicly linked from the page
  - any public email address that is explicitly shown next to them
  - any public Twitter/X profile linked from their bio
Do NOT invent or guess emails or LinkedIn URLs — only include data that is actually
present on the company's own pages. Prefer founders, executives, and engineering
leaders when there are many people.`,
    schema: CompanyProfileSchema,
    sessionOptions: {
      useStealth: true,
    },
  });

  if (result.status !== "completed" || !result.data) {
    return { domain: clean, status: "error", error: result.error ?? "Extract failed" };
  }

  try {
    const profile = CompanyProfileSchema.parse(result.data);
    return { domain: clean, status: "ok", profile, scrapedAt: new Date().toISOString() };
  } catch {
    return { domain: clean, status: "error", error: "Schema validation failed" };
  }
}

export async function POST(request: Request) {
  const { domains } = await request.json();

  if (!Array.isArray(domains) || domains.length === 0) {
    return Response.json({ error: "domains array required" }, { status: 400 });
  }

  const list: string[] = domains.slice(0, 10);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      for (const domain of list) {
        send({ event: "started", domain });
        try {
          const result = await enrichDomain(domain);
          send({ event: "result", ...result });
        } catch (err) {
          send({ event: "result", domain, status: "error", error: String(err) });
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
