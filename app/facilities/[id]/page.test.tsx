import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { Facility } from "@/lib/types";

// notFound() throws in Next; the test only needs to observe that it was called.
const NOT_FOUND = new Error("NEXT_NOT_FOUND");
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw NOT_FOUND;
  },
}));

// Real data plus two synthetic facilities that hit the branches no real
// facility hits yet: one with nothing optional, one with every optional field
// but no lessons and no prefecture link target.
vi.mock("@/lib/data", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/data")>();
  const base = mod.FACILITIES[0];
  const bare: Facility = {
    id: "t-bare",
    registeredAt: "2026-01-01",
    updatedAt: "2026-01-02",
    name: "BARE GYM",
    nameJa: "ベアジム",
    type: "tricking",
    typeLabel: "トリッキング",
    address: "海外 Somewhere 1-1",
    area: "海外",
    distance: 9999,
    lat: 0,
    lng: 0,
    tags: [],
    description: "最小構成の施設。",
    photos: [{ label: "BARE GYM — 写真準備中", color: "ok-slate" }],
    links: {},
  };
  const full: Facility = {
    ...base,
    id: "t-full",
    name: "FULL GYM",
    nameJa: "フルジム",
    address: "沖縄県那覇市1-1",
    area: "沖縄 / 那覇市",
    links: {
      web: "https://full.example.test",
      instagram: "@full_ig",
      twitter: "@full_x",
      youtube: "@full_yt",
      tiktok: "@full_tt",
    },
    price: "¥2,000",
    priceDay: "1日 ¥3,500",
    lessons: { available: false, types: [], schedule: "", price: "" },
    booking: { required: false, walkIn: true, methods: ["電話", "Web"], leadTime: "前日まで" },
    payment: ["現金", "クレジットカード"],
  };
  return { ...mod, FACILITIES: [...mod.FACILITIES, bare, full] };
});

import FacilityPage, { generateMetadata } from "./page";
import { FACILITIES } from "@/lib/data";

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const renderPage = async (id: string) => render(await FacilityPage(params(id)));
const mission = FACILITIES.find((f) => f.id === "f01")!;

describe("facility page", () => {
  it("throws notFound for an unknown id", async () => {
    await expect(FacilityPage(params("nope"))).rejects.toBe(NOT_FOUND);
  });

  it("shows the name, description, tags and basic info", async () => {
    const { container } = await renderPage("f01");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(mission.name);
    expect(screen.getByText(mission.description)).toBeInTheDocument();
    const tags = [...container.querySelectorAll(".doc-tags .tag")].map((t) => t.textContent);
    expect(tags).toEqual(mission.tags);
    expect(screen.getByText(mission.address)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: mission.phone! })).toHaveAttribute(
      "href",
      "tel:0358792291",
    );
    expect(screen.getByText("2018年")).toBeInTheDocument();
  });

  it("links back to the prefecture and breadcrumbs through it", async () => {
    await renderPage("f01");
    expect(screen.getByRole("link", { name: "東京都の施設をすべて見る →" })).toHaveAttribute(
      "href",
      "/area/tokyo",
    );
    const nav = screen.getByRole("navigation", { name: /パンくず|breadcrumb/i });
    expect(within(nav).getByText("東京都")).toBeInTheDocument();
  });

  it("lists equipment, features, lessons, booking and payment", async () => {
    const { container } = await renderPage("f01");
    const equipment = [...container.querySelectorAll(".equip-item")].map((e) => e.textContent);
    expect(equipment).toEqual(mission.equipment!.map((e) => `▣${e}`));
    for (const f of mission.features!) expect(screen.getByText(f)).toBeInTheDocument();
    for (const t of mission.lessons!.types) expect(screen.getByText(t)).toBeInTheDocument();
    expect(screen.getByText(mission.lessons!.schedule)).toBeInTheDocument();
    expect(screen.getByText("要予約")).toBeInTheDocument();
    expect(screen.getByText("不可")).toBeInTheDocument();
    // "—" lead time is a placeholder and must not render as a cell.
    expect(screen.queryByText("予約期限")).toBeNull();
    for (const p of mission.payment!) expect(screen.getByText(p)).toBeInTheDocument();
  });

  it("offers official site, directions and the map deep link", async () => {
    await renderPage("f01");
    expect(screen.getByRole("link", { name: "公式サイト・予約" })).toHaveAttribute(
      "href",
      mission.links.web,
    );
    expect(screen.getByRole("link", { name: "経路を見る" })).toHaveAttribute(
      "href",
      `https://www.google.com/maps/dir/?api=1&destination=${mission.lat},${mission.lng}`,
    );
    expect(screen.getByRole("link", { name: "地図で見る" })).toHaveAttribute("href", "/?f=f01");
  });

  it("shows up to six other facilities in the same prefecture", async () => {
    const { container } = await renderPage("f01");
    expect(screen.getByText("東京都の他の施設")).toBeInTheDocument();
    const nearby = container.querySelectorAll(".area-grid .fac-link");
    expect(nearby.length).toBeGreaterThan(0);
    expect(nearby.length).toBeLessThanOrEqual(6);
    expect([...nearby].some((a) => a.textContent?.includes(mission.name))).toBe(false);
  });

  it("embeds LocalBusiness and breadcrumb JSON-LD", async () => {
    const { container } = await renderPage("f01");
    const json = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!.textContent!,
    );
    expect(json).toHaveLength(2);
    expect(json[1]["@type"]).toBe("BreadcrumbList");
  });

  it("omits every optional section for a bare facility", async () => {
    const { container } = await renderPage("t-bare");
    expect(container.querySelector(".doc-tags")).toBeNull();
    expect(screen.queryByText("設備・器具")).toBeNull();
    expect(screen.queryByText("レッスン")).toBeNull();
    expect(screen.queryByText("予約")).toBeNull();
    expect(screen.queryByText("公式サイト・SNS")).toBeNull();
    expect(screen.queryByRole("link", { name: "公式サイト・予約" })).toBeNull();
    expect(screen.queryByText(/の他の施設/)).toBeNull();
    expect(screen.queryByText(/の施設をすべて見る/)).toBeNull();
    expect(screen.getByText(/情報更新 2026-01-02/)).toBeInTheDocument();
  });

  it("links every SNS profile and explains a free-practice-only facility", async () => {
    await renderPage("t-full");
    expect(screen.getByRole("link", { name: /Instagram @full_ig/ })).toHaveAttribute(
      "href",
      "https://instagram.com/full_ig",
    );
    expect(screen.getByRole("link", { name: /X @full_x/ })).toHaveAttribute(
      "href",
      "https://x.com/full_x",
    );
    expect(screen.getByRole("link", { name: /YouTube/ })).toHaveAttribute(
      "href",
      "https://youtube.com/@full_yt",
    );
    expect(screen.getByRole("link", { name: /TikTok/ })).toHaveAttribute(
      "href",
      "https://tiktok.com/@full_tt",
    );
    expect(
      screen.getByText("フリー練習のみの施設です。コーチング・クラスはありません。"),
    ).toBeInTheDocument();
    expect(screen.getByText("予約不要")).toBeInTheDocument();
    expect(screen.getByText("可能")).toBeInTheDocument();
    expect(screen.getByText("前日まで")).toBeInTheDocument();
    expect(screen.getByText("1日 ¥3,500")).toBeInTheDocument();
    // Only facility in Okinawa → no neighbours section, but still an area link.
    expect(screen.queryByText("沖縄県の他の施設")).toBeNull();
    expect(screen.getByRole("link", { name: "沖縄県の施設をすべて見る →" })).toBeInTheDocument();
  });
});

describe("facility metadata", () => {
  it("builds title, description and canonical from the facility", async () => {
    const meta = await generateMetadata(params("f01"));
    expect(meta.title).toBe(`${mission.name}（${mission.area}）`);
    expect(String(meta.description).length).toBeLessThanOrEqual(150);
    expect(meta.alternates?.canonical).toBe("/facilities/f01");
    expect(meta.openGraph?.url).toBe("/facilities/f01");
  });

  it("adds the hotlinked image to Open Graph only when present", async () => {
    const withImage = FACILITIES.find((f) => f.image)!;
    const meta = await generateMetadata(params(withImage.id));
    expect((meta.openGraph as { images?: string[] }).images).toEqual([withImage.image]);
    const bare = await generateMetadata(params("t-bare"));
    expect((bare.openGraph as { images?: string[] }).images).toBeUndefined();
  });

  it("falls back to a not-found title", async () => {
    expect(await generateMetadata(params("nope"))).toEqual({ title: "施設が見つかりません" });
  });
});
