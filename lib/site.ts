// Canonical site origin, shared by layout metadata, per-page canonicals,
// the sitemap and robots. Prefers an explicit env, then the Vercel production
// URL, falling back to localhost for development.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_NAME = "ACRO/FINDER";
