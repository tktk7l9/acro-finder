import { describe, it, expect } from "vitest";
import { PREFECTURES } from "./prefectures";

describe("PREFECTURES", () => {
  it("lists all 47 prefectures with unique names", () => {
    expect(PREFECTURES).toHaveLength(47);
    expect(new Set(PREFECTURES.map((p) => p.name)).size).toBe(47);
  });
  it("places every prefecture within Japan's coordinate range", () => {
    for (const p of PREFECTURES) {
      expect(p.lat).toBeGreaterThan(24);
      expect(p.lat).toBeLessThan(46);
      expect(p.lng).toBeGreaterThan(122);
      expect(p.lng).toBeLessThan(154);
    }
  });
  it("includes Hokkaido and Okinawa", () => {
    const names = PREFECTURES.map((p) => p.name);
    expect(names[0]).toBe("北海道");
    expect(names).toContain("沖縄県");
  });
});
