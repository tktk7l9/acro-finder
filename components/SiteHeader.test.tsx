import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("renders every primary nav link", () => {
    const { getByText, container } = render(<SiteHeader />);
    for (const label of ["施設マップ", "施設一覧", "イベント", "技ガイド"]) {
      expect(getByText(label)).toBeTruthy();
    }
    expect(container.querySelector('a[href="/facilities"]')).toBeTruthy();
  });

  it("marks the active item with aria-current", () => {
    const { container } = render(<SiteHeader active="facilities" />);
    const active = container.querySelector('[aria-current="page"]') as HTMLElement;
    expect(active.getAttribute("href")).toBe("/facilities");
  });

  it("links to the facility-owner page", () => {
    const { getByText, container } = render(<SiteHeader />);
    expect(getByText("施設運営者の方へ")).toBeTruthy();
    expect(container.querySelector('a[href="/owners"]')).toBeTruthy();
  });
});
