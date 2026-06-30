import { describe, it, expect } from "vitest";
import { FACILITIES } from "./data";
import { facilityJsonLd, breadcrumbJsonLd, itemListJsonLd } from "./jsonld";

const URL = "https://acro-finder.test/facilities/f01";

describe("facilityJsonLd", () => {
  const f = FACILITIES[0];
  const ld = facilityJsonLd({ facility: f, prefectureName: "東京都", canonicalUrl: URL });

  it("emits a SportsActivityLocation with canonical id/url", () => {
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("SportsActivityLocation");
    expect(ld["@id"]).toBe(URL);
    expect(ld.url).toBe(URL);
    expect(ld.name).toBe(f.name);
  });
  it("includes a postal address with region and geo coordinates", () => {
    expect(ld.address).toMatchObject({
      "@type": "PostalAddress",
      addressCountry: "JP",
      addressRegion: "東京都",
      streetAddress: f.address,
    });
    expect(ld.geo).toMatchObject({ "@type": "GeoCoordinates", latitude: f.lat, longitude: f.lng });
  });
  it("derives sameAs from official + social links", () => {
    const sameAs = ld.sameAs as string[];
    expect(sameAs).toContain(f.links.web);
    expect(sameAs.some((u) => u.includes("instagram.com"))).toBe(true);
  });
  it("omits aggregateRating when rating data is absent", () => {
    const noRating = facilityJsonLd({
      facility: { ...f, rating: undefined, reviewCount: undefined },
      canonicalUrl: URL,
    });
    expect(noRating.aggregateRating).toBeUndefined();
    expect(noRating.address).toMatchObject({ addressCountry: "JP" });
    expect((noRating.address as Record<string, unknown>).addressRegion).toBeUndefined();
  });
  it("includes aggregateRating when rating + reviewCount are present", () => {
    const rated = facilityJsonLd({
      facility: { ...f, rating: 4.6, reviewCount: 23 },
      canonicalUrl: URL,
    });
    expect(rated.aggregateRating).toMatchObject({
      "@type": "AggregateRating",
      ratingValue: 4.6,
      reviewCount: 23,
    });
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers list items from 1", () => {
    const ld = breadcrumbJsonLd([
      { name: "ホーム", url: "https://x/" },
      { name: "東京都", url: "https://x/area/tokyo" },
    ]);
    expect(ld["@type"]).toBe("BreadcrumbList");
    const items = ld.itemListElement as Array<Record<string, unknown>>;
    expect(items[0].position).toBe(1);
    expect(items[1].item).toBe("https://x/area/tokyo");
  });
});

describe("itemListJsonLd", () => {
  it("reports the item count and positions", () => {
    const ld = itemListJsonLd([
      { name: "A", url: "https://x/a" },
      { name: "B", url: "https://x/b" },
      { name: "C", url: "https://x/c" },
    ]);
    expect(ld["@type"]).toBe("ItemList");
    expect(ld.numberOfItems).toBe(3);
    expect((ld.itemListElement as Array<Record<string, unknown>>)[2].position).toBe(3);
  });
});
