/* Converts browser-use agent steps into a portable Playwright TypeScript script. */

interface BrowserUseAction {
  go_to_url?: { url: string };
  click_element?: { index?: number; xpath?: string };
  input_text?: { index?: number; text?: string; xpath?: string };
  scroll?: { coordinate?: number[]; scroll_direction?: string; amount?: number };
  extract_content?: { include_links?: boolean; goal?: string };
  wait?: { seconds?: number };
  done?: { text?: string };
  open_tab?: { url?: string };
  go_back?: Record<string, unknown>;
  search_google?: { query?: string };
  [key: string]: unknown;
}

interface AgentStep {
  model_output?: {
    thinking?: string;
    next_goal?: string;
    evaluation_previous_goal?: string;
    action?: BrowserUseAction[];
    current_state?: {
      next_goal?: string;
      memory?: string;
    };
  };
  state?: {
    url?: string;
    title?: string;
  };
  result?: Array<{
    is_done?: boolean | null;
    success?: boolean | null;
    extracted_content?: string | null;
    error?: string | null;
  }>;
  metadata?: {
    step_number?: number;
    step_start_time?: number;
    step_end_time?: number;
  };
}

function indent(code: string, spaces = 2) {
  return code
    .split("\n")
    .map((l) => (l.trim() ? " ".repeat(spaces) + l : ""))
    .join("\n");
}

function actionToPlaywright(action: BrowserUseAction, stepUrl: string): string[] {
  const lines: string[] = [];
  const key = Object.keys(action)[0];
  const val = action[key] as Record<string, unknown>;

  if (!key || !val) return [];

  switch (key) {
    case "go_to_url": {
      const url = (val as { url?: string }).url ?? stepUrl;
      lines.push(`await page.goto(${JSON.stringify(url)}, { waitUntil: "domcontentloaded" });`);
      break;
    }

    case "click_element": {
      const xpath = (val as { xpath?: string }).xpath;
      if (xpath) {
        lines.push(`await page.locator(${JSON.stringify("xpath=" + xpath)}).first().click();`);
      } else {
        // index-based: can't recover XPath, use nth-match on clickables as best effort
        const idx = (val as { index?: number }).index ?? 0;
        lines.push(`// Agent clicked element at index ${idx} — verify selector`);
        lines.push(`await page.locator("a, button, [role='button']").nth(${idx}).click();`);
      }
      lines.push(`await page.waitForLoadState("domcontentloaded").catch(() => {});`);
      break;
    }

    case "input_text": {
      const text = (val as { text?: string; index?: number; xpath?: string }).text ?? "";
      const xpath = (val as { xpath?: string }).xpath;
      const idx = (val as { index?: number }).index ?? 0;
      if (xpath) {
        lines.push(`await page.locator(${JSON.stringify("xpath=" + xpath)}).first().fill(${JSON.stringify(text)});`);
      } else {
        lines.push(`// Agent typed into input at index ${idx} — verify selector`);
        lines.push(`await page.locator("input, textarea, [contenteditable]").nth(${idx}).fill(${JSON.stringify(text)});`);
      }
      break;
    }

    case "scroll": {
      const dir = (val as { scroll_direction?: string }).scroll_direction ?? "down";
      const amount = (val as { amount?: number }).amount ?? 3;
      const px = amount * 300;
      const dy = dir === "down" ? px : -px;
      lines.push(`await page.mouse.wheel(0, ${dy});`);
      lines.push(`await page.waitForTimeout(500);`);
      break;
    }

    case "extract_content": {
      const goal = (val as { goal?: string }).goal ?? "Extract relevant content";
      lines.push(`// Extract: ${goal}`);
      lines.push(`const content = await page.evaluate(() => document.body.innerText);`);
      lines.push(`console.log("[extracted]", content.slice(0, 2000));`);
      break;
    }

    case "wait": {
      const secs = (val as { seconds?: number }).seconds ?? 1;
      lines.push(`await page.waitForTimeout(${secs * 1000});`);
      break;
    }

    case "open_tab":
    case "go_to_url": {
      const url = (val as { url?: string }).url ?? "";
      if (url) lines.push(`await page.goto(${JSON.stringify(url)});`);
      break;
    }

    case "go_back": {
      lines.push(`await page.goBack({ waitUntil: "domcontentloaded" });`);
      break;
    }

    case "search_google": {
      const query = (val as { query?: string }).query ?? "";
      lines.push(`await page.goto(${JSON.stringify(`https://www.google.com/search?q=${encodeURIComponent(query)}`)});`);
      lines.push(`await page.waitForLoadState("domcontentloaded");`);
      break;
    }

    case "done": {
      const text = (val as { text?: string }).text ?? "";
      lines.push(`// Task complete: ${text.replace(/\n/g, " ").slice(0, 120)}`);
      break;
    }

    default: {
      lines.push(`// Unhandled action: ${key} — ${JSON.stringify(val).slice(0, 80)}`);
      break;
    }
  }

  return lines;
}

export function generatePlaywrightScript(
  domain: string,
  pack: string,
  steps: unknown[],
  finalResult: string
): string {
  const taskDesc = pack === "sdr"
    ? `Sales intelligence research on ${domain}`
    : pack === "recruiter"
    ? `Recruiting intelligence research on ${domain}`
    : `Investor intelligence research on ${domain}`;

  const stepBlocks: string[] = [];

  for (const raw of steps) {
    const step = raw as AgentStep;
    const stepNum = step.metadata?.step_number ?? stepBlocks.length + 1;
    const url = step.state?.url ?? "";
    const thought = step.model_output?.thinking ?? step.model_output?.next_goal ?? step.model_output?.current_state?.next_goal ?? "";
    const actions: BrowserUseAction[] = step.model_output?.action ?? [];
    const result = step.result?.[0];
    const durationMs = step.metadata?.step_start_time && step.metadata?.step_end_time
      ? Math.round((step.metadata.step_end_time - step.metadata.step_start_time) * 1000)
      : null;

    const lines: string[] = [];

    // Step header comment
    lines.push(`// ── Step ${stepNum}${durationMs ? ` (${(durationMs / 1000).toFixed(1)}s)` : ""} ─────────────────────────`);
    if (url) lines.push(`// URL: ${url}`);
    if (thought) {
      const truncated = thought.replace(/\n/g, " ").slice(0, 200);
      lines.push(`// Reasoning: ${truncated}`);
    }

    // Convert each action
    for (const action of actions) {
      const converted = actionToPlaywright(action, url);
      lines.push(...converted);
    }

    // Extracted content as comment
    if (result?.extracted_content) {
      const preview = result.extracted_content.replace(/\n/g, " ").slice(0, 150);
      lines.push(`// Extracted: ${preview}`);
    }

    if (result?.error) {
      lines.push(`// Error at this step: ${result.error}`);
    }

    stepBlocks.push(lines.join("\n"));
  }

  // Final result extraction block
  const resultComment = finalResult
    ? `\n  // ── Final Result ────────────────────────────────────\n  // ${finalResult.replace(/\n/g, "\n  // ").slice(0, 600)}`
    : "";

  const body = stepBlocks.map((b) => indent(b, 2)).join("\n\n") + resultComment;

  return `/**
 * Generated by Seam Forge — hyperbrowser.ai
 * Task: ${taskDesc}
 * Generated: ${new Date().toISOString()}
 *
 * This script was compiled from a live AI agent run on ${domain}.
 * Run it with Playwright — no AI inference required.
 *
 * Usage:
 *   npm install -D playwright @playwright/test
 *   npx playwright install chromium
 *   npx ts-node ${domain.replace(/\./g, "_")}_${pack}.ts
 */

import { chromium, Page } from "playwright";

async function run(page: Page) {
${body}
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    await run(page);
  } finally {
    await browser.close();
  }
})();
`;
}
