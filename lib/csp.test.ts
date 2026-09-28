import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "./csp";

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
