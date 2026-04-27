import { Hyperbrowser } from "@hyperbrowser/sdk";
import { z } from "zod";
import { isValidDomain, sanitizeError, normalizeDomain } from "../_utils";

export const maxDuration = 300;

const hbKey = process.env.HYPERBROWSER_API_KEY;
if (!hbKey) throw new Error("HYPERBROWSER_API_KEY is not set");
const hb = new Hyperbrowser({ apiKey: hbKey });

// GitHub repos whose stargazers are high-signal Hyperbrowser prospects
const TARGET_REPOS = [
  "microsoft/playwright",
  "browserbase/stagehand",
  "browser-use/browser-use",
  "steel-dev/steel-browser",
  "apify/crawlee",
  "puppeteer/puppeteer",
];

const GithubUserSchema = z.object({
  login:   z.string(),
  name:    z.string().optional(),
  company: z.string().optional(),
  blog:    z.string().optional(),
  email:   z.string().optional(),
  bio:     z.string().optional(),
  location:z.string().optional(),
});

const ProspectProfileSchema = z.object({
  domain:        z.string(),
  companyName:   z.string().optional(),
  oneLiner:      z.string().optional(),
  techStack:     z.array(z.string()).default([]),
  usesPlaywright:z.boolean().default(false),
  usesSelenium:  z.boolean().default(false),
  usesPuppeteer: z.boolean().default(false),
  buildsAgents:  z.boolean().default(false),
  openRoles:     z.array(z.string()).default([]),
  hiringVelocity:z.enum(["none","slow","steady","aggressive"]).default("none"),
  fundingStage:  z.string().optional(),
  teamSize:      z.string().optional(),
  score:         z.number().min(0).max(100),
  scoreReasons:  z.array(z.string()).default([]),
  sourceRepo:    z.string().optional(),
  githubLogin:   z.string().optional(),
});

export type ProspectProfile = z.infer<typeof ProspectProfileSchema>;

export interface ProspectResult {
  domain:  string;
  status:  "ok" | "error";
  prospect?: ProspectProfile;
  error?:  string;
  scrapedAt?: string;
}

function scoreDomain(raw: Record<string, unknown>): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const stack = (raw.techStack as string[] | undefined) ?? [];
  const stackLower = stack.map(s => s.toLowerCase());
  const roles = (raw.openRoles as string[] | undefined) ?? [];
  const rolesLower = roles.map(r => r.toLowerCase());
  const bio = ((raw.bio ?? raw.oneLiner ?? "") as string).toLowerCase();

  if (stackLower.some(s => /playwright|puppeteer|selenium|browser.?use/.test(s))) {
    score += 30; reasons.push("Uses browser automation tech in stack");
  }
  if (bio.match(/ai.?agent|browser.?agent|scraping|automation|crawl/)) {
    score += 25; reasons.push("Building AI agents or automation");
  }
  if (rolesLower.some(r => /scraping|automation|playwright|browser|crawler/.test(r))) {
    score += 20; reasons.push("Hiring for browser automation roles");
  }
  if (rolesLower.some(r => /ai|ml|llm|agent|python/.test(r))) {
    score += 10; reasons.push("AI/ML team growth signal");
  }
  const velocity = (raw.hiringVelocity as string | undefined) ?? "none";
  if (velocity === "aggressive") { score += 15; reasons.push("Aggressive hiring velocity"); }
  if (velocity === "steady")     { score += 8;  reasons.push("Steady hiring velocity"); }
  if (raw.fundingStage && raw.fundingStage !== "unknown") {
    score += 10; reasons.push(`Funded: ${raw.fundingStage}`);
  }

  return { score: Math.min(score, 100), reasons };
}

async function extractGithubUsers(repo: string): Promise<Array<z.infer<typeof GithubUserSchema>>> {
  try {
    const result = await hb.extract.startAndWait({
      urls: [`https://github.com/${repo}/stargazers`],
      prompt: `Extract the first 20 GitHub usernames/logins visible on the stargazers page. For each person shown, extract their username (login), display name if shown, and company if shown.`,
      schema: z.object({
        users: z.array(GithubUserSchema).max(20),
      }),
      sessionOptions: { useStealth: true },
    });
    if (result.status === "completed" && result.data) {
      return (result.data as { users: z.infer<typeof GithubUserSchema>[] }).users ?? [];
    }
    return [];
  } catch {
    return [];
  }
}

async function enrichProspect(domain: string, sourceRepo: string, githubLogin?: string): Promise<ProspectResult> {
  const clean = normalizeDomain(domain);

  try {
    const result = await hb.extract.startAndWait({
      urls: [
        `https://${clean}`,
        `https://${clean}/about`,
        `https://${clean}/careers`,
        `https://${clean}/jobs`,
      ],
      prompt: `You are researching ${clean} as a potential customer for Hyperbrowser — a cloud browser infrastructure for AI agents and web scraping.
Extract:
- Company name and one-liner description
- Tech stack (especially: Playwright, Puppeteer, Selenium, browser-use, Scrapy, Crawlee, any AI agent frameworks)
- Open roles (title only)
- Hiring velocity (none/slow/steady/aggressive)
- Funding stage if mentioned
- Team size estimate
- Does this company appear to build browser automation, web scraping, or AI agents? (yes/no reasoning)`,
      schema: z.object({
        companyName:   z.string().optional(),
        oneLiner:      z.string().optional(),
        techStack:     z.array(z.string()).default([]),
        usesPlaywright:z.boolean().default(false),
        usesSelenium:  z.boolean().default(false),
        usesPuppeteer: z.boolean().default(false),
        buildsAgents:  z.boolean().default(false),
        openRoles:     z.array(z.string()).default([]),
        hiringVelocity:z.enum(["none","slow","steady","aggressive"]).default("none"),
        fundingStage:  z.string().optional(),
        teamSize:      z.string().optional(),
      }),
      sessionOptions: { useStealth: true },
    });

    if (result.status !== "completed" || !result.data) {
      return { domain: clean, status: "error", error: "Extract failed" };
    }

    const raw = result.data as Record<string, unknown>;
    const { score, reasons } = scoreDomain(raw);

    const prospect = ProspectProfileSchema.parse({
      domain: clean,
      ...raw,
      score,
      scoreReasons: reasons,
      sourceRepo,
      githubLogin,
    });

    return { domain: clean, status: "ok", prospect, scrapedAt: new Date().toISOString() };
  } catch {
    return { domain: clean, status: "error", error: "Enrichment failed" };
  }
}

function extractDomainFromUser(user: z.infer<typeof GithubUserSchema>): string | null {
  const raw = user.blog ?? user.email?.split("@")[1] ?? user.company;
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
    .split("/")[0];
  if (!cleaned.includes(".")) return null;
  if (/gmail|yahoo|outlook|hotmail|proton|icloud/.test(cleaned)) return null;
  return isValidDomain(cleaned) ? cleaned : null;
}

export async function POST(request: Request) {
  let body: { repos?: unknown; maxPerRepo?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const repos: string[] = Array.isArray(body.repos)
    ? (body.repos as unknown[]).filter((r): r is string => typeof r === "string" && TARGET_REPOS.includes(r))
    : TARGET_REPOS.slice(0, 3);

  const maxPerRepo = typeof body.maxPerRepo === "number" ? Math.min(body.maxPerRepo, 10) : 5;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      const seen = new Set<string>();

      for (const repo of repos) {
        send({ event: "repo", repo, status: "scraping" });

        const users = await extractGithubUsers(repo);
        send({ event: "repo", repo, status: "done", userCount: users.length });

        const candidates = users
          .map(u => ({ user: u, domain: extractDomainFromUser(u) }))
          .filter((c): c is { user: z.infer<typeof GithubUserSchema>; domain: string } => !!c.domain && !seen.has(c.domain))
          .slice(0, maxPerRepo);

        for (const { user, domain } of candidates) {
          if (seen.has(domain)) continue;
          seen.add(domain);

          send({ event: "prospect_started", domain });
          const result = await enrichProspect(domain, repo, user.login);
          send({ event: "prospect_result", ...result });
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
