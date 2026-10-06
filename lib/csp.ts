// Source of truth for the Content-Security-Policy and the other security headers.
// next.config.ts headers() serves them on Worker responses, and
// scripts/export-static.mjs writes them to public/_headers for the pages that are
// served as Workers static assets (those never run the Worker, so next.config.ts
// does not reach them). This file is imported by that .mjs script through Node's
// type stripping, so it may only use erasable TypeScript and must not import
// other project modules.
//
// proxy.ts used to issue a per-request CSP with a nonce, but in Next 16 the proxy
// runs only on the Node runtime and OpenNext (Cloudflare Workers) does not support
// Node middleware, so it could not be migrated. We dropped the nonce.
//
// Without `scriptHashes`, script-src needs 'unsafe-inline' because Next's bootstrap
// (self.__next_f.push) is inline and its text is only known after `next build`, which
// is after next.config.ts is read. Static pages instead allow exactly the inline
// scripts they ship, by sha256 hash (see inlineScriptHashes). ld+json is a data block
// and is not executed, so script-src does not apply to it.
// img-src blob: / https: are for map tiles and facility photos; worker-src blob: is for the
// Worker the map library spawns.
//
// Two places are widened for the Cloudflare Web Analytics beacon. The script itself is
// loaded from static.cloudflareinsights.com (appended after hydration by
// components/Analytics.tsx, not written into the HTML), and the data is POSTed to
// cloudflareinsights.com. **If either is missing, the page still looks fine
// while only the beacon is silently blocked**, so csp.test.ts and analytics.test.ts pin both.
import { createHash } from "node:crypto";

export interface CspOptions {
  dev?: boolean;
  /** sha256 sources ("sha256-…") that replace 'unsafe-inline' in script-src. */
  scriptHashes?: string[];
  /**
   * For a <meta http-equiv> policy: frame-ancestors is ignored there (and logs a
   * console warning), so it is left out. The header policy still carries it.
   */
  meta?: boolean;
}

export function contentSecurityPolicy({
  dev = false,
  scriptHashes,
  meta = false,
}: CspOptions = {}): string {
  const inline = scriptHashes ? scriptHashes.map((hash) => `'${hash}'`).join(" ") : "'unsafe-inline'";
  return [
    "default-src 'self'",
    [`script-src 'self'`, inline, "https://static.cloudflareinsights.com", dev ? "'unsafe-eval'" : ""]
      .filter(Boolean)
      .join(" "),
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://cloudflareinsights.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    meta ? "" : "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");
}

export interface Header {
  key: string;
  value: string;
}

/** Every security header, CSP first. Worker responses use the 'unsafe-inline' policy. */
export function securityHeaders({ dev = false }: { dev?: boolean } = {}): Header[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy({ dev }) },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "X-DNS-Prefetch-Control", value: "on" },
    {
      key: "Permissions-Policy",
      value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()",
    },
  ];
}

/**
 * CSP hash sources ("sha256-…") for every inline script a prerendered HTML page executes
 * (Next's bootstrap and RSC payload). Data blocks such as JSON-LD are not executed, so CSP
 * does not apply to them and they are skipped. The hash covers the exact text between the
 * tags, which is what the browser hashes, because static assets are served byte for byte.
 */
export function inlineScriptHashes(html: string): string[] {
  const hashes = new Set<string>();
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1].toLowerCase();
    if (type && type !== "module" && !type.includes("javascript")) continue;
    hashes.add(`sha256-${createHash("sha256").update(body, "utf8").digest("base64")}`);
  }
  return [...hashes];
}

/**
 * Puts a <meta http-equiv="Content-Security-Policy"> right after <meta charSet>, before any
 * script, so it governs the whole page. Used where a per-page header rule does not fit the
 * _headers limits (see scripts/export-static.mjs). Script bodies are untouched, so hashes
 * computed before or after this call are the same.
 */
export function withCspMeta(html: string, policy: string): string {
  const tag = `<meta http-equiv="Content-Security-Policy" content="${policy
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")}"/>`;
  const charset = /<meta charSet="utf-8"\/>/i.exec(html);
  if (charset) {
    const end = charset.index + charset[0].length;
    return html.slice(0, end) + tag + html.slice(end);
  }
  const head = /<head[^>]*>/i.exec(html);
  if (!head) throw new Error("withCspMeta: no <head> in the page");
  const end = head.index + head[0].length;
  return html.slice(0, end) + tag + html.slice(end);
}

export interface HeaderRule {
  path: string;
  headers: Header[];
}

/** Static files in public/ that are not HTML pages. A new one needs an entry here. */
export const STATIC_FILE_PATHS = [
  "/icon.svg",
  "/apple-icon",
  "/favicon.ico",
  "/opengraph-image",
  "/twitter-image",
  "/manifest.webmanifest",
  "/sitemap.xml",
  "/robots.txt",
  "/map-placeholder.webp",
];

// Files without an extension would be served as application/octet-stream.
const PNG_PATHS = new Set(["/apple-icon", "/opengraph-image", "/twitter-image"]);

/**
 * Every rule of public/_headers, given one CSP rule per HTML page (path pattern).
 *
 * Exactly one rule sets the CSP for any path. A "/*" policy plus a page rule that detaches
 * it ("! Content-Security-Policy") works in wrangler dev but not on the Workers edge for "/",
 * which then answered with both policies (hit in my-apps-portal). So "/*" carries every
 * header except the CSP, each page rule sets its own, and the other static files get a
 * policy that allows no inline script at all.
 */
export function staticHeaderRules(pageRules: HeaderRule[]): HeaderRule[] {
  const csp = (value: string): Header => ({ key: "Content-Security-Policy", value });
  const strict = csp(contentSecurityPolicy({ scriptHashes: [] }));
  return [
    { path: "/*", headers: securityHeaders().filter(({ key }) => key !== "Content-Security-Policy") },
    // Next.js emits /_next/static/* with content hashes, so those can be cached forever.
    {
      path: "/_next/static/*",
      headers: [strict, { key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
    ...pageRules,
    ...STATIC_FILE_PATHS.map((path) => ({
      path,
      headers: [strict, ...(PNG_PATHS.has(path) ? [{ key: "Content-Type", value: "image/png" }] : [])],
    })),
  ];
}

/**
 * Why a rule list would misbehave on Workers static assets, or [] when it is fine.
 * The limits are 100 rules and 2,000 characters a line, and a header named in two rules
 * that match the same path is joined with a comma (two CSPs would both be enforced).
 * Only "/*" overlaps other rules here, so it may share no header with them, and no
 * path may appear twice.
 * https://developers.cloudflare.com/workers/static-assets/headers/
 */
export function headerRuleProblems(rules: HeaderRule[]): string[] {
  const problems: string[] = [];
  if (rules.length > 100) problems.push(`${rules.length} rules exceed the limit of 100`);
  const long = headersFile(rules)
    .split("\n")
    .find((line) => line.length > 2000);
  if (long) problems.push(`line over 2,000 characters: ${long.slice(0, 80)}…`);
  const paths = rules.map((r) => r.path);
  for (const path of new Set(paths.filter((p, i) => paths.indexOf(p) !== i))) {
    problems.push(`${path} has more than one rule`);
  }
  const catchAll = new Set(rules.find((r) => r.path === "/*")?.headers.map((h) => h.key) ?? []);
  for (const rule of rules) {
    if (rule.path === "/*") continue;
    for (const { key } of rule.headers) {
      if (catchAll.has(key)) problems.push(`${key} is set by both /* and ${rule.path}`);
    }
  }
  return problems;
}

/** Body of a Workers static assets `_headers` file: one block of headers per path pattern. */
export function headersFile(rules: HeaderRule[]): string {
  return rules
    .map(({ path, headers }) => [path, ...headers.map(({ key, value }) => `  ${key}: ${value}`)].join("\n"))
    .join("\n\n")
    .concat("\n");
}
