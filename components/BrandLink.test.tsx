import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandLink } from "./BrandLink";

describe("BrandLink", () => {
  it("links home, named by the wordmark it shows (WCAG 2.5.3)", () => {
    render(<BrandLink />);
    const link = screen.getByRole("link", { name: "ACRO/FINDER アクロバット練習施設" });
    expect(link.getAttribute("href")).toBe("/");
    expect(link.hasAttribute("aria-label")).toBe(false);
  });

  it("keeps the decorative A mark out of the accessible name", () => {
    const { container } = render(<BrandLink />);
    expect(container.querySelector(".brand-mark")?.getAttribute("aria-hidden")).toBe("true");
  });
});
