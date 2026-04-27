import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory rate limit store: ip → { count, resetAt }
// Edge runtime resets on cold start — adequate for abuse prevention on hobby tier
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;  // 10 enrichment calls per IP per minute

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function proxy(req: NextRequest) {
  const res = NextResponse.next();

  // ── Security headers ──────────────────────────────────────────────────────
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://www.google.com",
      "connect-src 'self'",
      // Allow Hyperbrowser live session iframes
      "frame-src https://*.hyperbrowser.ai https://hyperbrowser.ai",
      "frame-ancestors 'none'",
    ].join("; ")
  );

  const path = req.nextUrl.pathname;

  // ── Same-origin guard on enrich + forge (not MCP — it's a public API server) ──
  if (path.startsWith("/api/enrich") || path.startsWith("/api/forge")) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host) {
      const originHost = origin.replace(/^https?:\/\//, "");
      if (originHost !== host) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  // ── Rate limiting on API routes ───────────────────────────────────────────
  if (path.startsWith("/api/enrich") || path.startsWith("/api/mcp")) {
    const ip = getIp(req);
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || entry.resetAt < now) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      entry.count += 1;
      if (entry.count > MAX_REQUESTS) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment and try again." },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
            },
          }
        );
      }
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
