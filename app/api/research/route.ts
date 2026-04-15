import { Hyperbrowser } from "@hyperbrowser/sdk";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const hb = new Hyperbrowser({ apiKey: process.env.HYPERBROWSER_API_KEY! });
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(request: Request) {
  const { query } = await request.json();

  if (!query?.trim()) {
    return Response.json({ error: "Query is required" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`)
        );
      };

      try {
        send("status", { message: `Searching the web for "${query}"...` });

        // Scrape multiple sources in parallel using Hyperbrowser
        const sources = [
          `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/ /g, "_"))}`,
          `https://news.ycombinator.com/search?q=${encodeURIComponent(query)}`,
          `https://github.com/search?q=${encodeURIComponent(query)}&type=repositories`,
        ];

        send("status", { message: "Scraping sources with Hyperbrowser..." });

        const scrapeResults = await Promise.allSettled(
          sources.map((url) =>
            hb.scrape.startAndWait({
              url,
              scrapeOptions: {
                formats: ["markdown"],
                onlyMainContent: true,
                timeout: 20000,
              },
            })
          )
        );

        const scrapedContent = scrapeResults
          .map((result, i) => {
            if (result.status === "fulfilled" && result.value?.data?.markdown) {
              return `## Source: ${sources[i]}\n\n${result.value.data.markdown.slice(0, 3000)}`;
            }
            return null;
          })
          .filter(Boolean)
          .join("\n\n---\n\n");

        if (!scrapedContent) {
          send("error", { message: "Could not retrieve data from sources." });
          controller.close();
          return;
        }

        send("status", { message: "Synthesizing research with Claude..." });

        // Stream Claude's analysis
        const claudeStream = claude.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: `You are a research analyst. Based on the following scraped web content, produce a structured intelligence brief about "${query}".

Format your response as clean markdown with these sections:
## Summary
(2-3 sentences, the core insight)

## Key Facts
(bullet list of the most important facts)

## Technical Details
(if applicable — architecture, stack, approach)

## Market Position
(competitors, funding, traction if available)

## Recent Activity
(news, releases, notable events)

## Bottom Line
(one paragraph assessment)

---

SCRAPED CONTENT:
${scrapedContent}`,
            },
          ],
        });

        let reportText = "";
        for await (const chunk of claudeStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            reportText += chunk.delta.text;
            send("chunk", { text: chunk.delta.text });
          }
        }

        send("done", {
          sources: sources.map((url, i) => ({
            url,
            success: scrapeResults[i].status === "fulfilled",
          })),
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        send("error", { message });
      } finally {
        controller.close();
      }
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
