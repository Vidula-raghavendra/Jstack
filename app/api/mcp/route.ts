import { enrichForMcp, type Pack } from "../enrich/route";

export const maxDuration = 300;

const SERVER_INFO = {
  name: "seam",
  version: "0.2.0",
  protocolVersion: "2025-03-26",
};

const TOOLS = [
  {
    name: "enrich_companies",
    description:
      "Enrich a list of company domains using Hyperbrowser stealth scraping. Returns full intelligence profiles: people with public LinkedIn URLs, tech stack, open roles, hiring velocity, named customers, funding signals, and pack-specific signals (buying / hiring / investment).",
    inputSchema: {
      type: "object",
      properties: {
        domains: {
          type: "array",
          items: { type: "string" },
          description: "List of company domains, e.g. ['stripe.com', 'linear.app']. Max 10 per call.",
          maxItems: 10,
        },
        pack: {
          type: "string",
          enum: ["sdr", "recruiter", "vc"],
          description:
            "Which intelligence lens to use. sdr = buying signals + decision-makers. recruiter = hiring trajectory + tech stack. vc = funding + traction + team caliber.",
          default: "sdr",
        },
      },
      required: ["domains"],
    },
  },
  {
    name: "list_packs",
    description: "List available intelligence packs and what each one optimises for.",
    inputSchema: { type: "object", properties: {} },
  },
];

const PACKS_DOC = [
  { id: "sdr", title: "SDR Pack", optimisedFor: "Outbound sales — decision-makers + buying signals", returns: "people (founders/VPs), pricing model, named customers, recent launches, integrations" },
  { id: "recruiter", title: "Recruiter Pack", optimisedFor: "Talent intel — who they hire + what stack", returns: "all open roles, tech stack from job posts, hiring velocity, engineering leaders" },
  { id: "vc", title: "VC Pack", optimisedFor: "Investment screening — traction + team + market", returns: "funding stage, named investors, customer logos, founder backgrounds, expansion signals" },
];

type JsonRpcRequest = { jsonrpc: "2.0"; id?: number | string | null; method: string; params?: unknown };

function ok(id: number | string | null | undefined, result: unknown) {
  return { jsonrpc: "2.0" as const, id: id ?? null, result };
}

function err(id: number | string | null | undefined, code: number, message: string) {
  return { jsonrpc: "2.0" as const, id: id ?? null, error: { code, message } };
}

async function handleRpc(req: JsonRpcRequest) {
  switch (req.method) {
    case "initialize":
      return ok(req.id, {
        protocolVersion: SERVER_INFO.protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_INFO.name, version: SERVER_INFO.version },
      });

    case "notifications/initialized":
      return null;

    case "tools/list":
      return ok(req.id, { tools: TOOLS });

    case "tools/call": {
      const params = (req.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
      const name = params.name;
      const args = params.arguments ?? {};

      if (name === "list_packs") {
        return ok(req.id, {
          content: [{ type: "text", text: JSON.stringify(PACKS_DOC, null, 2) }],
        });
      }

      if (name === "enrich_companies") {
        const domains = Array.isArray(args.domains) ? (args.domains as string[]).slice(0, 10) : [];
        const pack: Pack = args.pack === "recruiter" || args.pack === "vc" ? args.pack : "sdr";
        if (!domains.length) return err(req.id, -32602, "domains array required");

        const results = [];
        for (const d of domains) {
          try {
            results.push(await enrichForMcp(d, pack));
          } catch (e) {
            results.push({ domain: d, status: "error" as const, pack, error: String(e) });
          }
        }

        return ok(req.id, {
          content: [{ type: "text", text: JSON.stringify({ pack, results }, null, 2) }],
        });
      }

      return err(req.id, -32601, `Unknown tool: ${name}`);
    }

    default:
      return err(req.id, -32601, `Unknown method: ${req.method}`);
  }
}

export async function POST(request: Request) {
  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = await request.json();
  } catch {
    return Response.json(err(null, -32700, "Parse error"), { status: 400 });
  }

  if (Array.isArray(body)) {
    const responses = (await Promise.all(body.map(handleRpc))).filter(Boolean);
    return Response.json(responses);
  }

  const response = await handleRpc(body);
  if (response === null) return new Response(null, { status: 204 });
  return Response.json(response);
}

export async function GET() {
  return Response.json({
    server: SERVER_INFO,
    description:
      "Seam MCP server — agentic GTM intelligence on Hyperbrowser. POST JSON-RPC 2.0 to this endpoint. Methods: initialize, tools/list, tools/call.",
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    packs: PACKS_DOC,
    usage: {
      curl: `curl -X POST $URL -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"enrich_companies","arguments":{"domains":["stripe.com"],"pack":"sdr"}}}'`,
      claudeDesktop:
        "Add via mcp-remote: { \"seam\": { \"command\": \"npx\", \"args\": [\"mcp-remote\", \"$URL\"] } }",
    },
  });
}
