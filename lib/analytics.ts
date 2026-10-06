// Cloudflare Web Analytics, replacing Vercel Analytics removed in the 2026-09-14 Workers
// migration. Client-side module: it must not import lib/csp.ts (node:crypto). The CSP allows
// the script origin and the POST target there; analytics.test.ts keeps the two in sync.
export const BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";

/**
 * Site token. It ends up in every page and is visible to every visitor, so it is not a secret.
 * gitleaks flags a 32-digit hex as generic-api-key, so gitleaks:allow on the flagged line
 * suppresses it (a config file would also hide real secrets).
 */
export const BEACON_TOKEN = "4bc6c9283c434c8eb00a63fda94b12f1"; // gitleaks:allow
