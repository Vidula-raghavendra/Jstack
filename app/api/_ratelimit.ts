/**
 * Simple in-memory sliding window rate limiter.
 * Per-IP, resets after windowSec seconds.
 * Safe for single-instance deployments (Vercel serverless: each instance has its own map,
 * which is fine — limits are per-instance, providing soft rather than hard caps).
 */
const store = new Map<string, { hits: number; windowEnd: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // seconds
  headers: Record<string, string>;
}

export function checkRate(
  req: Request,
  opts: { limit: number; windowSec: number }
): RateLimitResult {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anon";

  const now = Date.now();
  const windowMs = opts.windowSec * 1000;
  const entry = store.get(ip);

  // Periodic cleanup to prevent unbounded memory growth
  if (store.size > 5000) {
    for (const [k, v] of store.entries()) {
      if (now > v.windowEnd) store.delete(k);
    }
  }

  if (!entry || now >= entry.windowEnd) {
    store.set(ip, { hits: 1, windowEnd: now + windowMs });
    return {
      allowed: true,
      remaining: opts.limit - 1,
      headers: {
        "X-RateLimit-Limit": String(opts.limit),
        "X-RateLimit-Remaining": String(opts.limit - 1),
        "X-RateLimit-Reset": String(Math.ceil((now + windowMs) / 1000)),
      },
    };
  }

  if (entry.hits >= opts.limit) {
    const retryAfter = Math.ceil((entry.windowEnd - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
      headers: {
        "X-RateLimit-Limit": String(opts.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(entry.windowEnd / 1000)),
        "Retry-After": String(retryAfter),
      },
    };
  }

  entry.hits++;
  return {
    allowed: true,
    remaining: opts.limit - entry.hits,
    headers: {
      "X-RateLimit-Limit": String(opts.limit),
      "X-RateLimit-Remaining": String(opts.limit - entry.hits),
      "X-RateLimit-Reset": String(Math.ceil(entry.windowEnd / 1000)),
    },
  };
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: `Rate limit exceeded. Retry in ${result.retryAfter}s.` }),
    {
      status: 429,
      headers: { "Content-Type": "application/json", ...result.headers },
    }
  );
}
