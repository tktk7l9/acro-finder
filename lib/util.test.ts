import { describe, it, expect, vi } from "vitest";
import {
  formatDistance,
  todayLabel,
  fmtEventDate,
  haversineKm,
  priceValue,
  normalizeForSearch,
  todayJst,
  addDaysIso,
} from "./util";

describe("addDaysIso", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDaysIso("2026-06-25", 14)).toBe("2026-07-09");
    expect(addDaysIso("2026-08-30", 1)).toBe("2026-08-31");
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("todayJst", () => {
  it("returns the current JST date as YYYY-MM-DD", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // 15:30 UTC is 00:30 the next day in JST.
    vi.setSystemTime(new Date("2026-06-25T15:30:00Z"));
    expect(todayJst()).toBe("2026-06-26");
    vi.useRealTimers();
  });
});

describe("formatDistance", () => {
  it("shows one decimal under 100km", () => {
    expect(formatDistance(1.4)).toBe("1.4 km");
    expect(formatDistance(18.24)).toBe("18.2 km");
    expect(formatDistance(99.94)).toBe("99.9 km");
  });
  it("rounds to integer at 100km and above", () => {
    expect(formatDistance(100)).toBe("100 km");
    expect(formatDistance(880.3)).toBe("880 km");
  });
});

describe("todayLabel", () => {
  it("returns a valid weekday character", () => {
    expect(["日", "月", "火", "水", "木", "金", "土"]).toContain(todayLabel());
  });
});

describe("fmtEventDate", () => {
  it("parses a date string into structured fields", () => {
    const f = fmtEventDate("2026-06-14");
    expect(f.year).toBe(2026);
    expect(f.monthNum).toBe(6);
    expect(f.day).toBe(14);
    expect(f.monthShort).toBe("JUN");
    expect(f.monthEn).toBe("JUNE");
    expect(f.monthKey).toBe("2026-06");
    expect(f.monthLabel).toBe("2026年 6月");
  });
  it("zero-pads the month key", () => {
    expect(fmtEventDate("2026-01-05").monthKey).toBe("2026-01");
  });
  it("computes weekday (2026-01-01 is Thursday)", () => {
    const f = fmtEventDate("2026-01-01");
    expect(f.dayIdx).toBe(4);
    expect(f.dayName).toBe("木");
  });
});

describe("priceValue", () => {
  it("parses a single amount", () => {
    expect(priceValue("¥3,000 / オープンジム")).toBe(3000);
  });
  it("takes only the first amount when several are present", () => {
    expect(priceValue("月額 ¥9,800〜 / 入会金 ¥3,000")).toBe(9800);
  });
  it("sorts missing or unparseable prices last", () => {
    expect(priceValue(undefined)).toBe(Number.MAX_SAFE_INTEGER);
    expect(priceValue("要問合せ")).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("normalizeForSearch", () => {
  it("lowercases latin text", () => {
    expect(normalizeForSearch("MISSION")).toBe("mission");
  });
  it("folds hiragana into katakana", () => {
    expect(normalizeForSearch("とらんぽりん")).toBe(normalizeForSearch("トランポリン"));
  });
  it("leaves katakana and kanji unchanged", () => {
    expect(normalizeForSearch("渋谷")).toBe("渋谷");
  });
});

describe("haversineKm", () => {
  it("is zero for identical points", () => {
    expect(haversineKm({ lat: 35.68, lng: 139.77 }, { lat: 35.68, lng: 139.77 })).toBe(0);
  });
  it("approximates one degree of latitude as ~111km", () => {
    const d = haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });
  it("is symmetric", () => {
    const a = { lat: 35.68, lng: 139.77 };
    const b = { lat: 34.69, lng: 135.5 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });
  it("gives a plausible Tokyo–Osaka distance", () => {
    const d = haversineKm({ lat: 35.68, lng: 139.77 }, { lat: 34.69, lng: 135.5 });
    expect(d).toBeGreaterThan(380);
    expect(d).toBeLessThan(420);
  });
});
