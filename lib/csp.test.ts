import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "./csp";

describe("contentSecurityPolicy", () => {
  const prod = contentSecurityPolicy();

  it("nonce を含まない（middleware を廃止したので発行元が無い）", () => {
    expect(prod).not.toContain("nonce-");
  });

  it("'strict-dynamic' を含まない", () => {
    // CSP Level 3 では 'strict-dynamic' があると allowlist と 'self' / 'unsafe-inline' が
    // 無視される。nonce もハッシュも無いこの構成で足すと信頼の起点が消え、
    // ページ上の全スクリプトが止まる。足すなら nonce かハッシュを同時に用意すること。
    expect(prod).not.toContain("strict-dynamic");
    // dev 側も同じく禁止。dev だけ壊れる混入を見逃さない。
    expect(contentSecurityPolicy({ dev: true })).not.toContain("strict-dynamic");
  });

  it("インラインを許すことを script-src に明示している", () => {
    // 末尾の ; まで含めて固定する。含めないと "'unsafe-inline' https: *" のように
    // 後ろに緩い値が足されても通ってしまう。
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
    // ビーコンは static.cloudflareinsights.com から読み込まれ、計測データを
    // cloudflareinsights.com へ POST する。**片方でも欠けるとページは正常に
    // 見えたままビーコンだけ黙ってブロックされる**（コンソールに CSP 違反が
    // 出るだけ）ので、両方をここで固定する。
    expect(prod).toContain("https://static.cloudflareinsights.com");
    expect(prod).toContain("connect-src 'self' https://cloudflareinsights.com;");
  });

  it("ディレクティブは ; 区切りで、末尾に余分な ; を付けない", () => {
    expect(prod.endsWith(";")).toBe(false);
    expect(prod).not.toContain(";;");
  });
});
