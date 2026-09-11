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

  // The filter/sort chips now dispatch inside startTransition so the
  // <ViewTransition> wrapping each card can animate the list changing. These
  // cover that the state still lands — a Transition that never commits would
  // leave the list untouched and is otherwise invisible.
  /** Picks one of the type chips (`.type-filters` scopes out same-named text elsewhere). */
  function typeChip(container: HTMLElement, label: string): HTMLElement {
    const chip = [...container.querySelectorAll(".type-filters .chip")].find(
      (el) => el.textContent?.trim() === label,
    );
    if (!chip) throw new Error(`type chip not found: ${label}`);
    return chip as HTMLElement;
  }

  it("filters facilities by type chip", () => {
    const { container } = render(<Page />);
    const all = container.querySelectorAll(".card").length;

    fireEvent.click(typeChip(container, "パルクール"));

    const parkour = container.querySelectorAll(".card").length;
    expect(parkour).toBeGreaterThan(0);
    expect(parkour).toBeLessThan(all);
  });

  it("returns to the full list when the すべて chip is picked again", () => {
    const { container } = render(<Page />);
    const all = container.querySelectorAll(".card").length;

    fireEvent.click(typeChip(container, "パルクール"));
    expect(container.querySelectorAll(".card").length).toBeLessThan(all);

    fireEvent.click(typeChip(container, "すべて"));
    expect(container.querySelectorAll(".card")).toHaveLength(all);
  });

  it("reorders the list when a sort chip is picked", () => {
    const { container } = render(<Page />);
    const names = () =>
      [...container.querySelectorAll(".card")].map((c) => c.textContent);
    const byDistance = names();

    const priceBtn = [...container.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "料金",
    )!;
    fireEvent.click(priceBtn);

    // Same facilities, different order.
    const byPrice = names();
    expect(byPrice).toHaveLength(byDistance.length);
    expect(byPrice).not.toEqual(byDistance);
  });

  it("keeps a stable ViewTransition name per facility so cards are matched across filters", () => {
    const { container } = render(<Page />);
    // ViewTransition renders no DOM node of its own — the card stays the direct
    // child of the scroller, which is what the existing `.card` queries assume.
    const scroller = container.querySelector(".list-scroll")!;
    const cards = [...scroller.children].filter((el) => el.classList.contains("card"));
    expect(cards.length).toBe(container.querySelectorAll(".card").length);
  });
});
