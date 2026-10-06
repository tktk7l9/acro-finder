import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

const NOT_FOUND = new Error("NEXT_NOT_FOUND");
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw NOT_FOUND;
  },
}));

import AreaPage, { dynamicParams, generateMetadata, generateStaticParams } from "./page";
import { facilitiesByPrefecture, facilitiesInPrefecture, prefectureSummary } from "@/lib/areas";

const params = (pref: string) => ({ params: Promise.resolve({ pref }) });

describe("area page", () => {
  it("prerenders exactly the prefectures that have a facility", () => {
    const params = generateStaticParams();
    expect(params.map((p) => p.pref)).toEqual(facilitiesByPrefecture().map((g) => g.slug));
    expect(params).toContainEqual({ pref: "tokyo" });
    // Unknown slugs must 404 instead of rendering on the Worker.
    expect(dynamicParams).toBe(false);
  });

  it("throws notFound for an unknown slug", async () => {
    await expect(AreaPage(params("atlantis"))).rejects.toBe(NOT_FOUND);
  });

  it("throws notFound for a prefecture with no facility", async () => {
    const empty = ["akita", "tottori", "shimane", "kochi", "saga"].find(
      (slug) => facilitiesInPrefecture(slugName(slug)).length === 0,
    );
    expect(empty).toBeDefined();
    await expect(AreaPage(params(empty!))).rejects.toBe(NOT_FOUND);
  });

  it("lists every facility in the prefecture with a real type breakdown", async () => {
    const { container } = render(await AreaPage(params("tokyo")));
    const list = facilitiesInPrefecture("東京都");
    const s = prefectureSummary("東京都");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "東京都のアクロバット練習施設",
    );
    expect(container.querySelector(".doc-sub")?.textContent).toContain(`${s.total} 施設`);
    expect(container.querySelector(".doc-sub")?.textContent).toMatch(/パルクール\d+/);
    expect(container.querySelectorAll(".area-grid .fac-link")).toHaveLength(list.length);
    expect(screen.getByText(list[0].name)).toBeInTheDocument();
    expect(container.querySelector(".doc-lede")?.textContent).toContain(s.cities[0]);
  });

  it("breadcrumbs home → list → prefecture", async () => {
    render(await AreaPage(params("osaka")));
    const crumbs = within(screen.getByRole("navigation", { name: "パンくずリスト" }));
    expect(crumbs.getByRole("link", { name: "ホーム" })).toHaveAttribute("href", "/");
    expect(crumbs.getByRole("link", { name: "施設一覧" })).toHaveAttribute("href", "/facilities");
    expect(crumbs.getByText("大阪府")).toBeInTheDocument();
  });

  it("embeds breadcrumb and item-list JSON-LD", async () => {
    const { container } = render(await AreaPage(params("tokyo")));
    const json = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!.textContent!,
    );
    expect(json.map((j: { "@type": string }) => j["@type"])).toEqual([
      "BreadcrumbList",
      "ItemList",
    ]);
    expect(json[1].itemListElement).toHaveLength(facilitiesInPrefecture("東京都").length);
  });
});

describe("area metadata", () => {
  it("describes the prefecture with counts and cities", async () => {
    const meta = await generateMetadata(params("tokyo"));
    const s = prefectureSummary("東京都");
    expect(meta.title).toBe(`東京都のアクロバット練習施設（${s.total}件）`);
    expect(String(meta.description)).toContain(s.cities[0]);
    expect(meta.alternates?.canonical).toBe("/area/tokyo");
  });

  it("falls back to a not-found title", async () => {
    expect(await generateMetadata(params("atlantis"))).toEqual({ title: "エリアが見つかりません" });
  });
});

function slugName(slug: string): string {
  return (
    { akita: "秋田県", tottori: "鳥取県", shimane: "島根県", kochi: "高知県", saga: "佐賀県" }[
      slug
    ] ?? ""
  );
}
