import { describe, it, expect } from "vitest";
import { FACILITIES, EQUIPMENT_FILTERS, TYPE_FILTERS } from "./data";

describe("FACILITIES", () => {
  it("has 99 real facilities with unique ids", () => {
    expect(FACILITIES).toHaveLength(99);
    expect(new Set(FACILITIES.map((f) => f.id)).size).toBe(99);
  });

  it("has well-formed core fields on every facility", () => {
    for (const f of FACILITIES) {
      expect(f.id).toMatch(/^f\d{2,3}$/);
      expect(f.name.length).toBeGreaterThan(0);
      expect(f.nameJa.length).toBeGreaterThan(0);
      expect(f.description.length).toBeGreaterThan(0);
      expect(["tricking", "parkour", "mixed"]).toContain(f.type);
      expect(f.lat).toBeGreaterThan(24);
      expect(f.lat).toBeLessThan(46);
      expect(f.lng).toBeGreaterThan(122);
      expect(f.lng).toBeLessThan(154);
      expect(f.distance).toBeGreaterThanOrEqual(0);
      expect(f.photos.length).toBeGreaterThan(0);
      expect(f.tags.length).toBeGreaterThan(0);
      expect(f.registeredAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(f.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("keeps optional rich fields internally consistent when present", () => {
    for (const f of FACILITIES) {
      if (f.hours) expect(f.hours).toHaveLength(7);
      if (f.rating !== undefined) {
        expect(f.rating).toBeGreaterThan(0);
        expect(f.rating).toBeLessThanOrEqual(5);
      }
      if (f.lessons) expect(typeof f.lessons.available).toBe("boolean");
      if (f.equipment) expect(f.equipment.length).toBeGreaterThan(0);
    }
  });

  it("covers multiple prefectures", () => {
    const prefs = new Set(FACILITIES.map((f) => f.area.split(" / ")[0]));
    expect(prefs.size).toBeGreaterThanOrEqual(5);
  });
});

describe("filter constants", () => {
  it("TYPE_FILTERS starts with 'all'", () => {
    expect(TYPE_FILTERS[0].key).toBe("all");
    expect(TYPE_FILTERS.length).toBeGreaterThan(1);
  });
  it("EQUIPMENT_FILTERS each have a key and icon", () => {
    expect(EQUIPMENT_FILTERS.length).toBeGreaterThan(0);
    for (const e of EQUIPMENT_FILTERS) {
      expect(e.key.length).toBeGreaterThan(0);
      expect(e.icon.length).toBeGreaterThan(0);
    }
  });
});
