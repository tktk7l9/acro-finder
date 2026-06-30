import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";

// The Leaflet map can't run in jsdom — stub it so the page logic is testable.
vi.mock("@/components/InteractiveMap", () => ({
  InteractiveMap: () => null,
}));

import Page from "./page";

describe("home page", () => {
  // The page reads/writes ?q= and ?f= on the URL; reset it between tests so
  // one test's deep-link state does not leak into the next.
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("renders a facility card for all 99 facilities", () => {
    const { container } = render(<Page />);
    expect(container.querySelectorAll(".card")).toHaveLength(99);
  });

  it("filters facilities by search query", () => {
    const { container } = render(<Page />);
    const input = container.querySelector(".search input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "MISSION" } });
    const cards = container.querySelectorAll(".card");
    expect(cards.length).toBe(2);
    expect(container.textContent).toContain("MISSION PARKOUR PARK TOKYO");
  });

  it("shows an empty state when nothing matches", () => {
    const { container } = render(<Page />);
    const input = container.querySelector(".search input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "zzz-no-such-facility" } });
    expect(container.querySelectorAll(".card")).toHaveLength(0);
  });

  it("hydrates the search query from the ?q= URL param", () => {
    window.history.replaceState(null, "", "/?q=MISSION");
    const { container } = render(<Page />);
    const input = container.querySelector(".search input") as HTMLInputElement;
    expect(input.value).toBe("MISSION");
    expect(container.querySelectorAll(".card")).toHaveLength(2);
  });

  it("reflects the search query into the URL", () => {
    const { container } = render(<Page />);
    const input = container.querySelector(".search input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "渋谷" } });
    expect(new URLSearchParams(window.location.search).get("q")).toBe("渋谷");
  });
});
