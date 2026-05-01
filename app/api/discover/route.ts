import { Hyperbrowser } from "@hyperbrowser/sdk";
import { z } from "zod";

export const maxDuration = 300;

const hbKey = process.env.HYPERBROWSER_API_KEY;
if (!hbKey) throw new Error("HYPERBROWSER_API_KEY is not set");
const hb = new Hyperbrowser({ apiKey: hbKey });

const CompanySchema = z.object({
  name:        z.string(),
  domain:      z.string(),
  description: z.string(),
});

const CompaniesSchema = z.object({
  companies: z.array(CompanySchema).max(10),
});

const BLOCKED = /gmail|yahoo|outlook|hotmail|proton|icloud|github\.com|linkedin\.com|twitter\.com|x\.com|localhost|ycombinator\.com|producthunt\.com|crunchbase\.com|wellfound\.com|news\.ycombinator/;

function cleanDomain(raw: string): string | null {
  try {
    const cleaned = raw.trim().toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "")
      .split("/")[0]
      .split("?")[0];
    if (!cleaned.includes(".") || cleaned.length < 4) return null;
    if (BLOCKED.test(cleaned)) return null;
    return cleaned;
  } catch {
    return null;
  }
}

async function searchSource(
  urls: string[],
  prompt: string,
  source: string,
  seen: Set<string>,
  send: (d: object) => void,
) {
  try {
    const result = await hb.extract.startAndWait({
      urls,
      prompt,
      schema: CompaniesSchema,
      sessionOptions: { useStealth: true },
    });
    if (result.status !== "completed" || !result.data) return;
    const companies = (result.data as z.infer<typeof CompaniesSchema>).companies ?? [];
    for (const c of companies) {
      const domain = cleanDomain(c.domain);
      if (!domain || seen.has(domain)) continue;
      seen.add(domain);
      send({ event: "company", domain, name: c.name, description: c.description, source });
    }
  } catch { /* skip failed sources gracefully */ }
}

export async function POST(request: Request) {
  let body: { query?: unknown };
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim().slice(0, 300) : "";
  if (!query) return Response.json({ error: "query is required" }, { status: 400 });

  const enc = encodeURIComponent(query);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      const seen = new Set<string>();

      const basePrompt = (source: string) =>
        `Find companies matching the search: "${query}".
Source context: ${source}.
Extract up to 8 distinct companies (actual startups/businesses — not individual developers or personal projects).
For each company return:
- name: the company or product name
- domain: their website domain only (e.g. "stripe.com" — no https://, no paths, no ${source} URLs)
- description: one clear sentence describing what they build and who it's for
Only include companies with a real public website domain.`;

      // Run all sources in parallel for speed
      const sources: Array<{ label: string; urls: string[] }> = [
        {
          label: "GitHub",
          urls: [`https://github.com/search?q=${enc}&type=repositories&s=stars&o=desc`],
        },
        {
          label: "YC",
          urls: [`https://www.ycombinator.com/companies?query=${enc}`],
        },
        {
          label: "HackerNews",
          urls: [
            `https://hn.algolia.com/api/v1/search?query=${enc}&tags=story&hitsPerPage=20`,
            `https://news.ycombinator.com/submitted?id=whoishiring`,
          ],
        },
        {
          label: "ProductHunt",
          urls: [`https://www.producthunt.com/search?q=${enc}`],
        },
        {
          label: "Crunchbase",
          urls: [`https://www.crunchbase.com/search/organizations/field/organizations/facet_ids/company?query=${enc}`],
        },
        {
          label: "AngelList",
          urls: [`https://wellfound.com/search?q=${enc}`],
        },
        {
          label: "Web",
          urls: [
            `https://duckduckgo.com/?q=${enc}+startup+company+B2B&ia=web`,
            `https://www.google.com/search?q=${enc}+startup+site:techcrunch.com+OR+site:venturebeat.com`,
          ],
        },
      ];

      send({ event: "searching", source: sources.map(s => s.label).join(", ") });

      await Promise.all(
        sources.map(s =>
          searchSource(
            s.urls,
            basePrompt(s.label),
            s.label,
            seen,
            send,
          )
        )
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
