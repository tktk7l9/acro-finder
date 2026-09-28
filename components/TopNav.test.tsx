import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TopNav } from "./TopNav";

// SHIG 6/73: every screen shows the same tabs in the same order.
describe("TopNav", () => {
  it("renders the four primary tabs in a fixed order", () => {
    const { container } = render(<TopNav />);
    const labels = [...container.querySelectorAll(".top-nav-link")].map((a) =>
      a.textContent?.replace(/\d+/g, "").replace(/[▣▤◈◆]/g, "").trim(),
    );
    expect(labels).toEqual(["施設マップ", "施設一覧", "イベント", "技ガイド"]);
  });

  it("marks the current tab with aria-current and keeps it a link", () => {
    const { container } = render(<TopNav active="events" />);
    const current = container.querySelector('[aria-current="page"]') as HTMLElement;
    expect(current.getAttribute("href")).toBe("/events");
    expect(current.className).toContain("active");
  });

  it("shows a count badge where given", () => {
    const { container } = render(<TopNav badges={{ events: 13 }} />);
    expect(container.querySelector('a[href="/events"] .top-nav-badge')?.textContent).toBe("13");
    expect(container.querySelectorAll(".top-nav-badge")).toHaveLength(1);
  });

  it("hides the decorative icons from screen readers", () => {
    const { container } = render(<TopNav />);
    for (const icon of container.querySelectorAll(".top-nav-icon")) {
      expect(icon.getAttribute("aria-hidden")).toBe("true");
    }
  });
});
