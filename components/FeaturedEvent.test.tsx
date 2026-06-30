import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
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
});
