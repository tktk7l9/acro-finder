// Hosts whose facility images are fetched as anonymous CORS requests.
//
// image.jimcdn.com sets a third-party `__cf_bm` cookie on every image response,
// which Lighthouse reports as "Uses third-party cookies" (Best Practices) and as
// a Cookie issue in the DevTools Issues panel. A `crossorigin="anonymous"` fetch
// never sends or stores cookies for a cross-origin URL, so the cookie is simply
// not set. That only works because the host answers with
// `Access-Control-Allow-Origin: *` — adding a host that does not would make its
// image fail to load (Photo then falls back to the placeholder), so only list
// hosts after checking that header.
const ANONYMOUS_CORS_HOSTS = new Set(["image.jimcdn.com"]);

export function imageCrossOrigin(src: string | undefined): "anonymous" | undefined {
  if (!src) return undefined;
  try {
    return ANONYMOUS_CORS_HOSTS.has(new URL(src).hostname) ? "anonymous" : undefined;
  } catch {
    return undefined;
  }
}
