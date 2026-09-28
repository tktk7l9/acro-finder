import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "./csp";

describe("contentSecurityPolicy", () => {
  const prod = contentSecurityPolicy();

  it("nonce を含まない（middleware を廃止したので発行元が無い）", () => {
    expect(prod).not.toContain("nonce-");
  });

  it("'strict-dynamic' を含まない", () => {
    // Under CSP Level 3, 'strict-dynamic' makes the allowlist and 'self' / 'unsafe-inline'
    // ignored. Adding it to this setup, which has no nonce or hash, removes the root of trust
    // and every script on the page stops. If you add it, provide a nonce or hash at the same time.
    expect(prod).not.toContain("strict-dynamic");
    // Forbidden in dev as well, so a regression that breaks only dev is not missed.
    expect(contentSecurityPolicy({ dev: true })).not.toContain("strict-dynamic");
  });

  it("インラインを許すことを script-src に明示している", () => {
    // Pin it including the trailing ;. Otherwise it would still pass if loose values were
    // appended after it, as in "'unsafe-inline' https: *".
    expect(prod).toContain(
      "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com;",
    );
  });

  it("本番では 'unsafe-eval' を出さない", () => {
    expect(prod).not.toContain("unsafe-eval");
  });

  it("dev では Next のオーバーレイ用に 'unsafe-eval' を足す", () => {
    expect(contentSecurityPolicy({ dev: true })).toContain("'unsafe-eval'");
  });

  it("地図タイルと施設写真のため img-src に blob: と https: を許す", () => {
    expect(prod).toContain("img-src 'self' data: blob: https:");
  });

  it("worker-src に blob: を許す（地図ライブラリが Worker を起こす）", () => {
    expect(prod).toContain("worker-src 'self' blob:");
  });

  it("締めるべきディレクティブが揃っている", () => {
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

  it("Cloudflare Web Analytics のビーコンに必要な2オリジンを許可している", () => {
    // The beacon is loaded from static.cloudflareinsights.com and POSTs its data to
    // cloudflareinsights.com. **If either is missing, the page still looks fine
    // while only the beacon is silently blocked** (only a CSP violation shows
    // in the console), so both are pinned here.
    expect(prod).toContain("https://static.cloudflareinsights.com");
    expect(prod).toContain("connect-src 'self' https://cloudflareinsights.com;");
  });

  it("ディレクティブは ; 区切りで、末尾に余分な ; を付けない", () => {
    expect(prod.endsWith(";")).toBe(false);
    expect(prod).not.toContain(";;");
  });
});
