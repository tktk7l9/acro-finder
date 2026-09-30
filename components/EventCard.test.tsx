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

  it("applies past styling and the 開催済み status for past events", () => {
    const { getByText, container } = render(<EventCard event={ev("e01")} />);
    expect(getByText("開催済み")).toBeTruthy();
    expect(container.querySelector(".event-card.past")).toBeTruthy();
  });

  it("renders the venue when present", () => {
    const { getByText } = render(<EventCard event={withVenue} />);
    expect(getByText(withVenue.venue!)).toBeTruthy();
  });

  it("shows the closed status for closed events", () => {
    const e = { ...ev("e01"), status: "closed" as const };
    const { container } = render(<EventCard event={e} />);
    expect(container.querySelector(".event-status")?.textContent).toBe("受付終了");
  });

  // SHIG 37: no event has a link, so there is no button pretending to be one.
  it("renders no dead call-to-action button", () => {
    const { container } = render(<EventCard event={ev("e01")} />);
    expect(container.querySelector(".event-card-cta")).toBeNull();
    expect(container.textContent).not.toMatch(/詳細・申込|大会情報を見る/);
    // Without fee or capacity the right column is not drawn at all (no empty bar on phones).
    if (!ev("e01").fee && ev("e01").capacity == null) {
      expect(container.querySelector(".event-right")).toBeNull();
    }
  });

  // The status pill is the only signal for full / open events now that the
  // dead CTA is gone (SHIG 37).
  it("shows the 満員 status for full events without a waitlist button", () => {
    const e = { ...ev("e01"), status: "full" as const };
    const { container } = render(<EventCard event={e} />);
    expect(container.querySelector(".event-status")?.textContent).toBe("満員");
    expect(container.querySelector(".event-status")).toHaveClass("st-full");
    expect(container.querySelector(".event-card-cta")).toBeNull();
    expect(screen.queryByText("キャンセル待ち")).toBeNull();
  });

  it("shows the 募集中 status for an upcoming open event without a signup button", () => {
    const e = { ...ev("e01"), date: "2026-09-01", status: undefined };
    const { container } = render(<EventCard event={e} />);
    expect(container.querySelector(".event-status")?.textContent).toBe("募集中");
    expect(container.querySelector(".event-card-cta")).toBeNull();
    expect(screen.queryByText("詳細・申込")).toBeNull();
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
    const bar = container.querySelector(".capacity-bar");
    expect(bar).toHaveTextContent("12 / 40 名");
    expect(bar).toHaveTextContent("30%");
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
