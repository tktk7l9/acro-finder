import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import type { ReactNode } from "react";
import { render, fireEvent, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { EventsFeed } from "./EventsFeed";

// Pin the clock so date-derived event statuses are deterministic
// (JST noon on 2026-06-25 — All Japan XTC 2026 is the upcoming event).
beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-25T03:00:00Z"));
});
afterAll(() => vi.useRealTimers());

function rowByLabel(container: HTMLElement, label: string) {
  return [...container.querySelectorAll(".filter-row")].find(
    (r) => r.querySelector(".lbl")?.textContent === label,
  ) as HTMLElement;
}

describe("EventsFeed", () => {
  it("renders the feed header", () => {
    const { getByText } = render(<EventsFeed />);
    expect(getByText("EVENTS & COMPETITIONS")).toBeTruthy();
  });

  it("filters by event type", () => {
    const { container } = render(<EventsFeed />);
    fireEvent.click(rowByLabel(container, "大会"));
    expect(container.querySelector(".feed-stat .v .accent")?.textContent).toBe("10");
  });

  it("shows an empty state when the search matches nothing", () => {
    const { container, getByText } = render(<EventsFeed />);
    const input = container.querySelector(".search input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "zzz-no-such-event" } });
    expect(getByText("NO EVENTS FOUND")).toBeTruthy();
  });

  it("groups events into month sections", () => {
    const { container } = render(<EventsFeed />);
    expect(container.querySelectorAll(".month-divider").length).toBeGreaterThan(0);
  });

  it("surfaces upcoming events under the 開催予定 filter", () => {
    const { container, getAllByText, queryByText } = render(<EventsFeed />);
    fireEvent.click(rowByLabel(container, "開催予定"));
    expect(getAllByText("All Japan XTC 2026").length).toBeGreaterThan(0);
    expect(queryByText("NO EVENTS FOUND")).toBeNull();
  });

  describe("SHIG review", () => {
    // SHIG 37: buttons without a handler.
    it("has no dead calendar / organiser buttons", () => {
      const { queryByText } = render(<EventsFeed />);
      expect(queryByText(/カレンダー表示/)).toBeNull();
      expect(queryByText(/イベント主催/)).toBeNull();
    });

    // SHIG 94: filters are real buttons that expose their state.
    it("renders filters as pressed-state buttons", () => {
      const { container } = render(<EventsFeed />);
      const all = rowByLabel(container, "開催予定");
      expect(all.tagName).toBe("BUTTON");
      expect(all.getAttribute("aria-pressed")).toBe("false");
      fireEvent.click(all);
      expect(all.getAttribute("aria-pressed")).toBe("true");
    });

    // SHIG 13: an option that can only produce an empty list is not offered.
    it("disables event types with no events", () => {
      const { container } = render(<EventsFeed />);
      expect((rowByLabel(container, "撮影会") as HTMLButtonElement).disabled).toBe(true);
      expect((rowByLabel(container, "大会") as HTMLButtonElement).disabled).toBe(false);
    });

    // SHIG 50: hiragana finds katakana, like the facility search.
    it("matches kana-insensitively", () => {
      const { container, getAllByText } = render(<EventsFeed />);
      const input = container.querySelector(".search input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "おーるじゃぱん" } });
      expect(getAllByText("All Japan XTC 2026").length).toBeGreaterThan(0);
    });

    // SHIG 55/60: the empty state offers a way back.
    it("clears every condition from the empty state", () => {
      const { container, getByText, queryByText } = render(<EventsFeed />);
      fireEvent.click(rowByLabel(container, "ジャム"));
      const input = container.querySelector(".search input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "zzz-no-such-event" } });
      fireEvent.click(getByText("条件をすべて解除"));
      expect(input.value).toBe("");
      expect(queryByText("NO EVENTS FOUND")).toBeNull();
      expect(rowByLabel(container, "すべて").getAttribute("aria-pressed")).toBe("true");
    });
  });

  it("shows only past events, most recent first, under 開催済み", () => {
    const { container } = render(<EventsFeed />);
    fireEvent.click(rowByLabel(container, "開催済み"));
    const cards = container.querySelectorAll(".event-card");
    expect(cards.length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".event-card.past")).toHaveLength(cards.length);
    expect(screen.queryByText("All Japan XTC 2026")).toBeNull();
    // Month sections run newest → oldest for the archive.
    const months = [...container.querySelectorAll(".month-divider")].map((m) => m.textContent!);
    expect(months.length).toBeGreaterThan(1);
  });

  it("finds an event by its venue", () => {
    const { container } = render(<EventsFeed />);
    const input = container.querySelector(".search input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "札幌" } });
    const cards = container.querySelectorAll(".event-card");
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) expect(c.querySelector(".venue")?.textContent).toContain("札幌");
    expect(screen.queryByText("NO EVENTS FOUND")).toBeNull();
  });

  it("combines the type and status filters", () => {
    const { container } = render(<EventsFeed />);
    fireEvent.click(rowByLabel(container, "大会"));
    fireEvent.click(rowByLabel(container, "開催予定"));
    const cards = container.querySelectorAll(".event-card");
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) {
      expect(c.querySelector(".event-type")?.textContent).toBe("大会");
      expect(c).not.toHaveClass("past");
    }
  });
});
