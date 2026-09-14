import { describe, expect, it } from "vitest";
import { SITE_URL } from "./site";

describe("SITE_URL", () => {
  it("Workers の公開URLを指している", () => {
    expect(SITE_URL).toBe("https://acro-finder.saitotakuya0719.workers.dev");
  });

  it("vercel.app を含まない", () => {
    // Vercel の Hobby アカウントは 2026-08-11 から停止していて配信されない。
    // ここが vercel.app に戻ると canonical・sitemap・OGP が死んだURLを指す。
    expect(SITE_URL).not.toContain("vercel.app");
  });

  it("localhost を含まない", () => {
    // 移行前は VERCEL_PROJECT_PRODUCTION_URL が無いと localhost に落ちる実装で、
    // Workers にはその環境変数が無い。env 読みを復活させるとビルドもページ表示も
    // 正常なまま canonical と sitemap だけが localhost を指す。
    expect(SITE_URL).not.toContain("localhost");
  });

  it("末尾スラッシュを持たない", () => {
    // 各所で `${SITE_URL}/facilities/${id}` のように連結するので、
    // 末尾スラッシュがあると // になる。
    expect(SITE_URL.endsWith("/")).toBe(false);
  });

  it("https である", () => {
    expect(SITE_URL.startsWith("https://")).toBe(true);
  });
});
