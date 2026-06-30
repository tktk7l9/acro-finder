import { describe, it, expect } from "vitest";
import { SKILLS, SKILL_GENRES } from "./skills-data";

const GENRE_IDS = ["tricking", "parkour", "gym", "break", "ski", "snow"];

describe("SKILLS", () => {
  it("has 160 skills with unique ids", () => {
    expect(SKILLS).toHaveLength(160);
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(160);
  });

  it("has well-formed fields on every skill", () => {
    for (const s of SKILLS) {
      expect(s.id.length).toBeGreaterThan(0);
      expect(s.name_ja.length).toBeGreaterThan(0);
      expect(s.name_en.length).toBeGreaterThan(0);
      expect(GENRE_IDS).toContain(s.genre);
      expect(s.lv).toBeGreaterThanOrEqual(1);
      expect(s.lv).toBeLessThanOrEqual(10);
      expect(s.tags.length).toBeGreaterThan(0);
      expect(s.desc_ja.length).toBeGreaterThan(0);
      expect(s.desc_en.length).toBeGreaterThan(0);
      expect(s.tips_ja.length).toBeGreaterThan(0);
    }
  });

  it("only references existing skills in prereqs and leads", () => {
    const ids = new Set(SKILLS.map((s) => s.id));
    for (const s of SKILLS) {
      for (const ref of [...s.prereqs, ...s.leads]) {
        expect(ids.has(ref)).toBe(true);
      }
    }
  });

  it("covers all six genres", () => {
    const present = new Set(SKILLS.map((s) => s.genre));
    expect(present.size).toBe(6);
  });
});

describe("SKILL_GENRES", () => {
  it("starts with 'all' and lists every genre", () => {
    expect(SKILL_GENRES[0].id).toBe("all");
    const ids = SKILL_GENRES.map((g) => g.id);
    for (const g of GENRE_IDS) expect(ids).toContain(g);
  });
});
