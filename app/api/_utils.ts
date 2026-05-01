/**
 * Shared utilities for API routes.
 */

/** Returns true if the string looks like a valid hostname (e.g. stripe.com, sub.domain.io). */
export function isValidDomain(s: string): boolean {
  return (
    typeof s === "string" &&
    s.length <= 253 &&
    /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(s)
  );
}

/** Strips internal SDK/error details before returning to the client. */
export function sanitizeError(raw: string): string {
  if (/credit.?limit|purchase.?more.?credit|upgrade.?your.?plan/i.test(raw))
    return "Credit limit reached — the demo's free Hyperbrowser credits are exhausted. Check back later or use your own API key.";
  if (/rate.?limit|concurrent|quota|429/i.test(raw))
    return "Rate limit — free tier allows one session at a time. Wait a moment and retry.";
  if (/api.?key|unauthorized|401|403/i.test(raw))
    return "Service configuration error. Please try again later.";
  // First sentence only — no stack traces, no internal paths
  return raw.split(/\n|at\s/)[0].trim().slice(0, 200);
}

/** Cleans and normalises a raw domain string (strips protocol, trailing slash, paths). */
export function normalizeDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0];
}
