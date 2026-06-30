import { describe, it, expect } from "vitest";
import { FACILITIES } from "./data";
import { PREFECTURES } from "./prefectures";
import {
  PREFECTURE_SLUGS,
  prefectureOf,
  slugForPrefecture,
  prefectureBySlug,
  facilitiesInPrefecture,
  facilitiesByPrefecture,
  prefectureSummary,
  sameAreaFacilities,
} from "./areas";

describe("PREFECTURE_SLUGS", () => {
  it("has a unique romaji slug for all 47 prefectures", () => {
    expect(Object.keys(PREFECTURE_SLUGS)).toHaveLength(47);
    const slugs = Object.values(PREFECTURE_SLUGS);
    expect(new Set(slugs).size).toBe(47);
    expect(slugs.every((s) => /^[a-z]+$/.test(s))).toBe(true);
  });
  it("covers every prefecture in PREFECTURES", () => {
    for (const p of PREFECTURES) {
      expect(PREFECTURE_SLUGS[p.name]).toBeTruthy();
    }
  });
});

describe("prefectureOf", () => {
  it("maps every facility to a prefecture", () => {
    for (const f of FACILITIES) {
      expect(prefectureOf(f)).toBeDefined();
    }
  });
  it("returns undefined for an unrecognized address", () => {
    expect(prefectureOf({ ...FACILITIES[0], address: "海外..." })).toBeUndefined();
  });
});

describe("slug helpers", () => {
  it("round-trips a prefecture through its slug", () => {
    expect(slugForPrefecture("東京都")).toBe("tokyo");
    expect(prefectureBySlug("tokyo")?.name).toBe("東京都");
  });
  it("returns undefined for unknown names/slugs", () => {
    expect(slugForPrefecture("架空県")).toBeUndefined();
    expect(prefectureBySlug("atlantis")).toBeUndefined();
  });
});

describe("facilitiesInPrefecture", () => {
  it("returns only facilities in that prefecture, distance-sorted", () => {
    const tokyo = facilitiesInPrefecture("東京都");
    expect(tokyo.length).toBeGreaterThan(0);
    expect(tokyo.every((f) => f.address.startsWith("東京都"))).toBe(true);
    for (let i = 1; i < tokyo.length; i++) {
      expect(tokyo[i].distance).toBeGreaterThanOrEqual(tokyo[i - 1].distance);
    }
  });
  it("returns an empty list for a prefecture with no facilities", () => {
    expect(facilitiesInPrefecture("沖縄県")).toEqual([]);
  });
});

describe("facilitiesByPrefecture", () => {
  const groups = facilitiesByPrefecture();

  it("includes every facility exactly once across all groups", () => {
    const total = groups.reduce((n, g) => n + g.facilities.length, 0);
    expect(total).toBe(FACILITIES.length);
  });
  it("orders groups by facility count descending", () => {
    for (let i = 1; i < groups.length; i++) {
      expect(groups[i - 1].facilities.length).toBeGreaterThanOrEqual(groups[i].facilities.length);
    }
  });
  it("attaches a slug to every group", () => {
    expect(groups.every((g) => typeof g.slug === "string" && g.slug.length > 0)).toBe(true);
  });
  it("puts Tokyo first as the largest group", () => {
    expect(groups[0].prefecture.name).toBe("東京都");
  });
});

describe("prefectureSummary", () => {
  it("totals match the type breakdown and unique city count", () => {
    const s = prefectureSummary("東京都");
    expect(s.total).toBe(facilitiesInPrefecture("東京都").length);
    expect(s.byType.parkour + s.byType.tricking + s.byType.mixed).toBe(s.total);
    expect(s.cities.length).toBeGreaterThan(0);
    expect(new Set(s.cities).size).toBe(s.cities.length);
    expect(s.cities.some((c) => c.includes("区"))).toBe(true);
  });
  it("is empty for a prefecture with no facilities", () => {
    expect(prefectureSummary("沖縄県")).toEqual({
      total: 0,
      byType: { parkour: 0, tricking: 0, mixed: 0 },
      cities: [],
    });
  });
});

describe("sameAreaFacilities", () => {
  it("returns same-prefecture neighbours excluding the facility itself", () => {
    const f = facilitiesInPrefecture("東京都")[0];
    const near = sameAreaFacilities(f, 6);
    expect(near.length).toBeGreaterThan(0);
    expect(near.length).toBeLessThanOrEqual(6);
    expect(near.every((x) => x.id !== f.id)).toBe(true);
    expect(near.every((x) => x.address.startsWith("東京都"))).toBe(true);
  });
});
