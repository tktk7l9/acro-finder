import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
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

  it("shows the waitlist CTA for full events", () => {
    const e = { ...ev("e01"), status: "full" as const };
    const { container } = render(<EventCard event={e} />);
    expect(container.querySelector(".event-card-cta.dim")?.textContent).toBe("キャンセル待ち");
  });

  it("offers signup for an upcoming open event", () => {
    const e = { ...ev("e01"), date: "2026-09-01", status: undefined };
    const { container } = render(<EventCard event={e} />);
    expect(container.querySelector(".event-card-cta")).not.toHaveClass("dim");
    expect(screen.getByText("詳細・申込")).toBeInTheDocument();
    expect(container.querySelector(".event-card.past")).toBeNull();
  });

  it("shows time, capacity, deadline, fee and the capacity bar when given", () => {
    const e = {
      ...ev("e01"),
      date: "2026-09-05", // Saturday
      time: "10:00-18:00",
      capacity: 40,
      entered: 12,
      fee: "¥3,000",
      feeNote: "当日 +¥500",
      deadline: "2026-08-20",
      status: undefined,
    };
    const { container } = render(<EventCard event={e} />);
    expect(screen.getByText("10:00-18:00")).toBeInTheDocument();
    expect(screen.getByText("定員 40")).toBeInTheDocument();
    expect(screen.getByText("申込締切 8/20")).toBeInTheDocument();
    expect(screen.getByText("¥3,000")).toBeInTheDocument();
    expect(screen.getByText("当日 +¥500")).toBeInTheDocument();
    expect(container.querySelector(".event-date .day")).toHaveClass("sat");
    expect(container.querySelector(".capacity-bar, .cap-bar, [class*=cap]")).toBeTruthy();
  });

  it("marks a Sunday date", () => {
    const e = { ...ev("e01"), date: "2026-09-06" };
    const { container } = render(<EventCard event={e} />);
    expect(container.querySelector(".event-date .day")).toHaveClass("sun");
  });

  it("omits the bottom row and tags when there is nothing to show", () => {
    const e = { ...ev("e01"), venue: undefined, tags: [], deadline: undefined };
    const { container } = render(<EventCard event={e} />);
    expect(container.querySelector(".event-bottom")).toBeNull();
    expect(container.querySelector(".event-tags")).toBeNull();
  });
});
