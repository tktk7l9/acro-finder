import { describe, it, expect } from "vitest";
import { EVENTS, EVENT_TYPES, EVENT_STATUS, eventStatus } from "./events-data";

const TYPES = ["comp", "jam", "ws", "shoot"];
const STATUSES = ["open", "soon", "full", "closed", "past"];

describe("EVENTS", () => {
  it("has real events with unique ids", () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
  });

  it("has well-formed fields on every event", () => {
    for (const e of EVENTS) {
      expect(e.id).toMatch(/^e\d{2}$/);
      expect(e.title.length).toBeGreaterThan(0);
      expect(e.titleJa.length).toBeGreaterThan(0);
      expect(TYPES).toContain(e.type);
      expect(STATUSES).toContain(eventStatus(e, "2026-06-25"));
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.description.length).toBeGreaterThan(0);
    }
  });

  it("keeps capacity consistent when both fields are present", () => {
    for (const e of EVENTS) {
      if (e.capacity != null && e.entered != null) {
        expect(e.entered).toBeLessThanOrEqual(e.capacity);
      }
    }
  });
});

describe("event constants", () => {
  it("EVENT_TYPES starts with 'all' plus 4 types", () => {
    expect(EVENT_TYPES[0].key).toBe("all");
    expect(EVENT_TYPES).toHaveLength(5);
  });
  it("EVENT_STATUS covers every status with a label", () => {
    for (const s of STATUSES) {
      expect(EVENT_STATUS[s as keyof typeof EVENT_STATUS].label.length).toBeGreaterThan(0);
    }
  });
});

describe("eventStatus", () => {
  const base = EVENTS[0];
  it("is past once the (end) date is before today", () => {
    expect(eventStatus({ ...base, date: "2025-01-01", endDate: undefined }, "2026-06-25")).toBe(
      "past",
    );
  });
  it("is 'soon' within 14 days and 'open' beyond", () => {
    expect(eventStatus({ ...base, date: "2026-06-30" }, "2026-06-25")).toBe("soon");
    expect(eventStatus({ ...base, date: "2026-08-30" }, "2026-06-25")).toBe("open");
  });
  it("uses endDate to keep a multi-day event upcoming", () => {
    expect(eventStatus({ ...base, date: "2026-06-24", endDate: "2026-06-26" }, "2026-06-25")).toBe(
      "soon",
    );
  });
  it("respects an explicit status override", () => {
    expect(eventStatus({ ...base, status: "full" }, "2026-06-25")).toBe("full");
  });
  it("treats the All Japan XTC 2026 event as upcoming", () => {
    const xtc = EVENTS.find((e) => e.id === "e13")!;
    expect(eventStatus(xtc, "2026-06-25")).toBe("open");
  });
});
