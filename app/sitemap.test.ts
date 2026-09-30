import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";
import { FACILITIES } from "@/lib/data";
import { facilitiesByPrefecture } from "@/lib/areas";
import { SITE_URL } from "@/lib/site";

describe("sitemap", () => {
  const entries = sitemap();

  it("lists the static routes, every area and every facility", () => {
    expect(entries).toHaveLength(5 + facilitiesByPrefecture().length + FACILITIES.length);
    expect(entries[0]).toMatchObject({ url: `${SITE_URL}/`, priority: 1 });
    expect(entries.map((e) => e.url)).toContain(`${SITE_URL}/area/tokyo`);
    expect(entries.map((e) => e.url)).toContain(`${SITE_URL}/facilities/f01`);
  });

  it("dates facility entries by their last data update", () => {
    const f01 = entries.find((e) => e.url.endsWith("/facilities/f01"))!;
    expect(f01.lastModified).toEqual(new Date(FACILITIES[0].updatedAt));
    expect(f01.changeFrequency).toBe("monthly");
  });

  it("never lists a URL twice", () => {
    expect(new Set(entries.map((e) => e.url)).size).toBe(entries.length);
  });
});
