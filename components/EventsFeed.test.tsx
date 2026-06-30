import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import type { ReactNode } from "react";
import { render, fireEvent } from "@testing-library/react";

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
});
