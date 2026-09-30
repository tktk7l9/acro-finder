import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/app/owners/actions", () => ({
  submitContactForm: async () => ({ status: "idle", fieldErrors: {}, formError: null }),
}));

import OwnersPage, { metadata } from "./page";
import { FACILITIES } from "@/lib/data";
import { facilitiesByPrefecture } from "@/lib/areas";

describe("owners page", () => {
  it("states the current listing size", async () => {
    render(await OwnersPage());
    expect(
      screen.getByText(`${FACILITIES.length}施設・${facilitiesByPrefecture().length}都道府県`),
    ).toBeInTheDocument();
  });

  it("offers the three tiers, each pointing at the contact form", async () => {
    render(await OwnersPage());
    for (const title of ["無料掲載", "PR掲載（特集枠）", "予約・月謝管理ツール"]) {
      expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument();
    }
    // Each CTA lands on its own anchor at the top of the form, which
    // preselects the matching subject (SHIG 40, 42).
    const ctas: [string, string][] = [
      ["掲載・修正を依頼する", "contact-listing"],
      ["PR掲載を相談する", "contact-pr"],
      ["先行案内を希望する", "contact-tool"],
    ];
    for (const [name, anchor] of ctas) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", `#${anchor}`);
      expect(document.getElementById(anchor)).not.toBeNull();
    }
    expect(document.getElementById("owner-contact")).not.toBeNull();
  });

  it("renders the contact form inside the page", async () => {
    render(await OwnersPage());
    expect(screen.getByRole("button", { name: "送信する" })).toBeInTheDocument();
  });

  it("has a canonical URL", () => {
    expect(metadata.alternates?.canonical).toBe("/owners");
  });
});
