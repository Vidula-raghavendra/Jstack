import { NextRequest } from "next/server";
import { generatePlaywrightScript } from "./codegen";

export async function POST(req: NextRequest) {
  let domain: unknown, pack: unknown, steps: unknown, finalResult: unknown;
  try {
    ({ domain, pack, steps, finalResult } = await req.json());
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (typeof domain !== "string" || !domain || !Array.isArray(steps) || steps.length === 0) {
    return new Response("Missing domain or steps", { status: 400 });
  }

  const domainStr = domain as string;
  const packStr = typeof pack === "string" ? pack : "sdr";

  const script = generatePlaywrightScript(
    domainStr,
    packStr,
    steps as unknown[],
    typeof finalResult === "string" ? finalResult : ""
  );

  const filename = `${domainStr.replace(/\./g, "_")}_${packStr}.ts`;

  return new Response(script, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
