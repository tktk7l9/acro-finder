import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeaturedEvent } from "./FeaturedEvent";
import { EVENTS } from "@/lib/events-data";

// FeaturedEvent renders a single event prominently; test it with a real event
// that carries a venue and tags.
const event = EVENTS.find(
  (e) => e.venue && e.tags && e.tags.length > 0 && e.title !== e.titleJa,
)!;

describe("FeaturedEvent", () => {
  it("renders the event title and Japanese title", () => {
    const { getByText } = render(<FeaturedEvent event={event} />);
    expect(getByText(event.title)).toBeTruthy();
    expect(getByText(event.titleJa)).toBeTruthy();
  });

  it("renders the venue and tags", () => {
    const { getByText } = render(<FeaturedEvent event={event} />);
    expect(getByText(event.venue!)).toBeTruthy();
    expect(getByText(event.tags![0])).toBeTruthy();
  });

  it("shows time, fee, capacity and deadline cells when the event carries them", () => {
    const rich = {
      ...event,
      time: "13:00 開始",
      fee: "¥5,000",
      feeNote: "学割あり",
      capacity: 64,
      entered: 20,
      deadline: "2026-08-01",
    };
    const { container } = render(<FeaturedEvent event={rich} />);
    expect(screen.getByText("13:00 開始")).toBeInTheDocument();
    expect(screen.getByText("¥5,000")).toBeInTheDocument();
    expect(screen.getByText("学割あり")).toBeInTheDocument();
    expect(screen.getByText("20 / 64")).toBeInTheDocument();
    expect(screen.getByText("申込締切 8/1")).toBeInTheDocument();
    expect(container.querySelector(".featured-cta")).toBeTruthy();
  });

  it("counts entries from zero when only the capacity is known", () => {
    const { container } = render(
      <FeaturedEvent event={{ ...event, capacity: 30, entered: undefined }} />,
    );
    expect(screen.getByText("0 / 30")).toBeInTheDocument();
    expect(container.querySelector(".featured-cta")).toBeNull();
  });

  it("omits every optional cell for a minimal event", () => {
    const { container } = render(
      <FeaturedEvent event={{ ...event, venue: undefined, tags: undefined }} />,
    );
    expect(container.querySelectorAll(".featured-info-cell")).toHaveLength(0);
    expect(container.querySelector(".tag")).toBeNull();
  });
});
