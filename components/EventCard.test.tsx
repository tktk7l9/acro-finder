import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render } from "@testing-library/react";
import { EventCard } from "./EventCard";
import { EVENTS } from "@/lib/events-data";

const ev = (id: string) => EVENTS.find((e) => e.id === id)!;
const withVenue = EVENTS.find((e) => e.venue)!;

// Pin the clock so date-derived statuses are deterministic (e01 is past).
beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-25T03:00:00Z"));
});
afterAll(() => vi.useRealTimers());

describe("EventCard", () => {
  it("renders the event title and type label", () => {
    const e = ev("e01");
    const { getByText } = render(<EventCard event={e} />);
    expect(getByText(e.title)).toBeTruthy();
    expect(getByText(e.typeLabel)).toBeTruthy();
  });

  it("shows the archive CTA and past styling for past events", () => {
    const { getByText, container } = render(<EventCard event={ev("e01")} />);
    expect(getByText("大会情報を見る")).toBeTruthy();
    expect(container.querySelector(".event-card.past")).toBeTruthy();
  });

  it("renders the venue when present", () => {
    const { getByText } = render(<EventCard event={withVenue} />);
    expect(getByText(withVenue.venue!)).toBeTruthy();
  });

  it("shows a closed CTA for closed events", () => {
    const e = { ...ev("e01"), status: "closed" as const };
    const { container } = render(<EventCard event={e} />);
    expect(container.querySelector(".event-card-cta.dim")?.textContent).toBe("受付終了");
  });
});
