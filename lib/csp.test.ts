import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  contentSecurityPolicy,
  headersFile,
  inlineScriptHashes,
  securityHeaders,
  withCspMeta,
} from "./csp";

describe("contentSecurityPolicy", () => {
  const prod = contentSecurityPolicy();

  it("contains no nonce (middleware was removed, so nothing issues one)", () => {
    expect(prod).not.toContain("nonce-");
  });

  it("does not contain 'strict-dynamic'", () => {
    // Under CSP Level 3, 'strict-dynamic' makes the allowlist and 'self' / 'unsafe-inline'
    // ignored. Adding it to this setup, which has no nonce or hash, removes the root of trust
    // and every script on the page stops. If you add it, provide a nonce or hash at the same time.
    expect(prod).not.toContain("strict-dynamic");
    // Forbidden in dev as well, so a regression that breaks only dev is not missed.
    expect(contentSecurityPolicy({ dev: true })).not.toContain("strict-dynamic");
  });

  it("explicitly allows inline scripts in script-src", () => {
    // Pin it including the trailing ;. Otherwise it would still pass if loose values were
    // appended after it, as in "'unsafe-inline' https: *".
    expect(prod).toContain(
      "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com;",
    );
  });

  it("omits 'unsafe-eval' in production", () => {
    expect(prod).not.toContain("unsafe-eval");
  });

  it("adds 'unsafe-eval' in dev for the Next overlay", () => {
    expect(contentSecurityPolicy({ dev: true })).toContain("'unsafe-eval'");
  });

  it("allows blob: and https: in img-src for map tiles and facility photos", () => {
    expect(prod).toContain("img-src 'self' data: blob: https:");
  });

  it("allows blob: in worker-src (the map library spawns a Worker)", () => {
    expect(prod).toContain("worker-src 'self' blob:");
  });

  it("has every directive that should be locked down", () => {
    for (const directive of [
      "default-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "connect-src 'self' https://cloudflareinsights.com;",
      "manifest-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ]) {
      expect(prod).toContain(directive);
    }
  });

  it("allows both origins the Cloudflare Web Analytics beacon needs", () => {
    // The beacon is loaded from static.cloudflareinsights.com and POSTs its data to
    // cloudflareinsights.com. **If either is missing, the page still looks fine
    // while only the beacon is silently blocked** (only a CSP violation shows
    // in the console), so both are pinned here.
    expect(prod).toContain("https://static.cloudflareinsights.com");
    expect(prod).toContain("connect-src 'self' https://cloudflareinsights.com;");
  });

  it("separates directives with ; and adds no trailing ;", () => {
    expect(prod.endsWith(";")).toBe(false);
    expect(prod).not.toContain(";;");
  });
});

describe("contentSecurityPolicy with script hashes", () => {
  const hashed = contentSecurityPolicy({ scriptHashes: ["sha256-AAA=", "sha256-BBB="] });

  it("replaces 'unsafe-inline' in script-src with the listed hashes", () => {
    expect(hashed).toContain(
      "script-src 'self' 'sha256-AAA=' 'sha256-BBB=' https://static.cloudflareinsights.com;",
    );
    expect(hashed).not.toContain("'unsafe-inline' https://static");
    // style-src keeps 'unsafe-inline' (Leaflet positions tiles with inline styles).
    expect(hashed).toContain("style-src 'self' 'unsafe-inline'");
  });

  it("leaves frame-ancestors out of a <meta> policy, where browsers ignore it", () => {
    expect(contentSecurityPolicy({ meta: true })).not.toContain("frame-ancestors");
    expect(hashed).toContain("frame-ancestors 'none'");
  });
});

describe("securityHeaders", () => {
  it("lists the CSP first and every hardening header once", () => {
    const headers = securityHeaders();
    expect(headers[0]).toEqual({ key: "Content-Security-Policy", value: contentSecurityPolicy() });
    const keys = headers.map((h) => h.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(
      expect.arrayContaining([
        "Strict-Transport-Security",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Referrer-Policy",
        "Permissions-Policy",
      ]),
    );
    expect(securityHeaders({ dev: true })[0].value).toContain("'unsafe-eval'");
  });
});

describe("inlineScriptHashes", () => {
  const sha = (text: string) => `sha256-${createHash("sha256").update(text, "utf8").digest("base64")}`;

  it("hashes executable inline scripts once each and skips src scripts and data blocks", () => {
    const html =
      '<script src="/a.js"></script><script>self.a=1</script><script type="module">b()</script>' +
      '<script type="application/ld+json">{"x":1}</script><script type="text/javascript">c()</script>' +
      "<script>self.a=1</script>";
    expect(inlineScriptHashes(html)).toEqual([sha("self.a=1"), sha("b()"), sha("c()")]);
  });

  it("returns nothing for a page without inline scripts", () => {
    expect(inlineScriptHashes("<p>hi</p>")).toEqual([]);
  });
});

describe("withCspMeta", () => {
  it("inserts the policy right after <meta charSet>, escaping quotes", () => {
    const out = withCspMeta('<html><head><meta charSet="utf-8"/><script>x</script></head>', `a 'b' "c"`);
    expect(out).toBe(
      '<html><head><meta charSet="utf-8"/><meta http-equiv="Content-Security-Policy" content="a \'b\' &quot;c&quot;"/><script>x</script></head>',
    );
  });

  it("falls back to right after <head>, and refuses a page without one", () => {
    expect(withCspMeta('<head lang="ja"><title>t</title></head>', "p&q")).toBe(
      '<head lang="ja"><meta http-equiv="Content-Security-Policy" content="p&amp;q"/><title>t</title></head>',
    );
    expect(() => withCspMeta("<p>no head</p>", "p")).toThrow(/no <head>/);
  });
});

describe("headersFile", () => {
  it("writes one indented block per path, separated by blank lines", () => {
    expect(
      headersFile([
        { path: "/*", headers: [{ key: "A", value: "1" }] },
        { path: "/x", headers: [{ key: "B", value: "2" }, { key: "C", value: "3" }] },
      ]),
    ).toBe("/*\n  A: 1\n\n/x\n  B: 2\n  C: 3\n");
  });
});
