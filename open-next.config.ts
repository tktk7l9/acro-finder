// OpenNext (Cloudflare) config.
//
// incrementalCache: prerendered pages are read through Next's incremental cache when the
// Worker does answer them (e.g. RSC fallbacks, /owners). Without a cache implementation
// OpenNext cannot find the prerender output and statically generated dynamic segments
// (/facilities/<id>, /area/<pref>) answer 404 while plain routes keep working (hit in
// service-anatomy). The static assets cache is read-only and serves exactly what
// `next build` produced; neither ISR nor on-demand revalidation is used.
//
// The pages themselves are copied into public/ by scripts/export-static.mjs, so the common
// path never runs the Worker at all.
// https://opennext.js.org/cloudflare/caching
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
