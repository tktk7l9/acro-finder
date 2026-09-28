// Source of truth for the Content-Security-Policy. next.config.ts headers() serves it.
//
// proxy.ts used to issue a per-request CSP with a nonce, but in Next 16 the proxy
// runs only on the Node runtime and OpenNext (Cloudflare Workers) does not support
// Node middleware, so it could not be migrated. We dropped the nonce and moved to a static header.
//
// script-src needs 'unsafe-inline' because Next's bootstrap (self.__next_f.push) is
// inline. ld+json is a data block and is not executed, so script-src does not apply to it.
// img-src blob: / https: are for map tiles and facility photos; worker-src blob: is for the
// Worker the map library spawns.
//
// Two places are widened for the Cloudflare Web Analytics beacon. The script itself is
// loaded from static.cloudflareinsights.com, and the data is POSTed to
// cloudflareinsights.com. **If either is missing, the page still looks fine
// while only the beacon is silently blocked**, so csp.test.ts pins both.
export function contentSecurityPolicy({ dev = false }: { dev?: boolean } = {}): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://cloudflareinsights.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
