import { describe, it, expect } from "vitest";
import robots from "./robots";
import { DISALLOWED_AI_CRAWLERS } from "@/lib/crawlers";
import { SITE_URL } from "@/lib/site";

describe("robots", () => {
  const r = robots();
  const rules = r.rules as { userAgent: string; allow?: string; disallow?: string }[];

  it("allows everyone by default and blocks each AI crawler", () => {
    expect(rules[0]).toEqual({ userAgent: "*", allow: "/" });
    expect(rules.slice(1).map((x) => x.userAgent)).toEqual(DISALLOWED_AI_CRAWLERS);
    expect(rules.slice(1).every((x) => x.disallow === "/")).toBe(true);
  });

  it("points at the sitemap on the canonical host", () => {
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    expect(r.host).toBe(SITE_URL);
  });
});
