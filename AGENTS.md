<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## npm audit

- CI runs `node scripts/audit-gate.mjs` instead of a bare `npm audit`. It fails on any advisory not listed in
  `audit-allowlist.json`. An entry needs a reason and an `expires` date (keep it about a month out), and
  `devOnly: true` stops matching once the package becomes reachable from production dependencies. The gate also
  fails when an allowlisted advisory gets a fix, so the entry is removed by updating rather than forgotten.

## Static pages (Workers static assets)

- `/`, `/facilities`, `/facilities/<id>`, `/area/<pref>`, `/events`, `/skills`, the icons, OG images, manifest,
  `sitemap.xml`, `robots.txt` and `/favicon.ico` are prerendered by `next build` and copied into `public/` by
  `scripts/export-static.mjs` (the `build` script; `prebuild`/`predev` run it with `--clean`). OpenNext ships them
  as Workers static assets, which are served without running the Worker. Rendering them per request exceeded the
  free plan's CPU limit (error 1102, "Worker exceeded resource limits") under a few Lighthouse runs. Do not make
  these routes dynamic: `/facilities/[id]` and `/area/[pref]` use `generateStaticParams` + `dynamicParams = false`.
- `/owners` stays on the Worker: its contact form posts a Server Action to `/owners`. Do not copy it into `public/`.
- Security headers live in `lib/csp.ts`. next.config.ts applies them to Worker responses (CSP with
  `'unsafe-inline'`); the script writes them to `public/_headers` (generated, gitignored) for static assets.
- Exactly one `_headers` rule sets the CSP for any path; `/*` carries none (a `/*` CSP detached with
  `! Content-Security-Policy` in a page rule left two enforced policies on the edge in my-apps-portal). Top pages
  and area pages each get a rule whose script-src lists the sha256 of their inline scripts. The 116 facility pages
  do not fit the limits (100 rules, 2,000 characters a line), so each carries its hashed policy in a
  `<meta http-equiv>` tag and `/facilities/:id` keeps the `'unsafe-inline'` header; the browser enforces both.
  Never edit a copied HTML file after hashing. A new non-HTML file in `public/` needs an entry in `STATIC_FILE_PATHS`.
- The Cloudflare Web Analytics beacon is appended after hydration by `components/Analytics.tsx`, not written as a
  `<script src>` in the layout: Cloudflare swaps `beacon.min.js` under the same URL, so it cannot carry SRI, and
  Observatory deducts for an external script without it. script-src and connect-src still allow its two origins.
- Internal links are plain `<a>`, not `next/link` (`@next/next/no-html-link-for-pages` is off): static assets
  answer by path and ignore the query, so an RSC prefetch or client navigation would get HTML back.
- Data on the static pages is as fresh as the last build (deploy).

## First view of the map (mobile Lighthouse)

Lighthouse simulates the load and counts every request that finished before the first paint, so the map page's
LCP grows with each byte and request in its first view. Keep these in place:

- The map page's HTML carries only the first 20 cards (`SERVER_CARDS` in `components/MapApp.tsx`); the rest
  render on mount. All 116 made the HTML 171 KB (19 KB compressed, over the ~14 KB a new connection gets in its first
  round trip).
- `components/MapApp.tsx` is the client app. `app/page.tsx` hands it server-side values (the event count) so data
  it only counts stays out of its JavaScript. Pass small values, not lists: props are written into the HTML.
- Only Inter Tight is preloaded. It is self-hosted (`app/fonts/inter-tight.woff2`, made by
  `scripts/build-fonts.py`): Google's latin characters plus macron vowels, weights 400-700. A character outside
  it falls back to Arial; rerun the script with it added if a facility name needs one.
- JetBrains Mono is not preloaded and is not used by anything a phone renders in the first view. A family that
  leads a rendered element's `font-family` is downloaded for its line metrics even when it draws no glyph, which
  is why the equipment chip icons name their fallback fonts instead of `var(--font-mono)`.
