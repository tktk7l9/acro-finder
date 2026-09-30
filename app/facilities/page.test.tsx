import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FacilitiesIndexPage, { metadata } from "./page";
import { FACILITIES } from "@/lib/data";
import { facilitiesByPrefecture } from "@/lib/areas";

describe("facilities index page", () => {
  it("groups every facility under its prefecture", async () => {
    const { container } = render(await FacilitiesIndexPage());
    const groups = facilitiesByPrefecture();
    expect(container.querySelector(".doc-sub")?.textContent).toBe(
      `全 ${FACILITIES.length} 施設 · ${groups.length} 都道府県`,
    );
    expect(container.querySelectorAll(".area-section")).toHaveLength(groups.length);
    expect(container.querySelectorAll(".fac-link")).toHaveLength(FACILITIES.length);
    // Largest prefecture first, with its count.
    const first = container.querySelector(".area-section h2")!;
    expect(first.textContent).toBe(
      `${groups[0].prefecture.name}（${groups[0].facilities.length}）`,
    );
  });

  it("links each prefecture to its area page", async () => {
    render(await FacilitiesIndexPage());
    const links = screen.getAllByRole("link", { name: "このエリアを見る →" });
    expect(links.map((a) => a.getAttribute("href"))).toEqual(
      facilitiesByPrefecture().map((g) => `/area/${g.slug}`),
    );
  });

  it("invites facility owners to the listing page", async () => {
    render(await FacilitiesIndexPage());
    expect(screen.getByRole("link", { name: "掲載・PRのご案内 →" })).toHaveAttribute(
      "href",
      "/owners",
    );
  });

  it("has a canonical URL", () => {
    expect(metadata.alternates?.canonical).toBe("/facilities");
  });
});
