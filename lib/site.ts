// The single definition of the public URL. canonical / metadataBase / sitemap / robots / JSON-LD
// all refer to it.
//
// Migrated from Vercel to Cloudflare Workers on 2026-09-14. Before that it was built from
// `VERCEL_PROJECT_PRODUCTION_URL` and fell back to localhost when missing.
// That variable does not exist on Workers, so as-is **production canonical and
// sitemap would become http://localhost:3000** (the build passes and pages look fine).
// Since it breaks silently, we stopped reading env and made it a constant.
// site.test.ts blocks a revert to the old Vercel domain and a trailing slash.
export const SITE_URL = "https://acro-finder.saitotakuya0719.workers.dev";

export const SITE_NAME = "ACRO/FINDER";
