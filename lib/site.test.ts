import { describe, expect, it } from "vitest";
import { SITE_URL } from "./site";

describe("SITE_URL", () => {
  it("points at the public Workers URL", () => {
    expect(SITE_URL).toBe("https://acro-finder.saitotakuya0719.workers.dev");
  });

  it("does not contain vercel.app", () => {
    // The Vercel Hobby account has been suspended since 2026-08-11 and serves nothing.
    // If this goes back to vercel.app, canonical, sitemap and OGP point at a dead URL.
    expect(SITE_URL).not.toContain("vercel.app");
  });

  it("does not contain localhost", () => {
    // Before the migration the code fell back to localhost without VERCEL_PROJECT_PRODUCTION_URL,
    // and Workers does not have that variable. Bringing back the env read would leave the build and
    // pages working while only canonical and sitemap point at localhost.
    expect(SITE_URL).not.toContain("localhost");
  });

  it("has no trailing slash", () => {
    // It is concatenated in many places, as in `${SITE_URL}/facilities/${id}`,
    // so a trailing slash would produce //.
    expect(SITE_URL.endsWith("/")).toBe(false);
  });

  it("uses https", () => {
    expect(SITE_URL.startsWith("https://")).toBe(true);
  });
});
