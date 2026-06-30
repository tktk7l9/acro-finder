import type { Facility } from "./types";

// schema.org JSON-LD builders. Pure functions returning plain objects so they
// can be unit-tested and serialized into a <script type="application/ld+json">.

interface FacilityJsonLdInput {
  facility: Facility;
  prefectureName?: string;
  canonicalUrl: string;
}

// SportsActivityLocation (a LocalBusiness subtype) for a single facility.
export function facilityJsonLd({
  facility,
  prefectureName,
  canonicalUrl,
}: FacilityJsonLdInput): Record<string, unknown> {
  const { links } = facility;
  const sameAs: string[] = [];
  if (links.web) sameAs.push(links.web);
  if (links.instagram) sameAs.push(`https://instagram.com/${links.instagram.replace(/^@/, "")}`);
  if (links.twitter) sameAs.push(`https://x.com/${links.twitter.replace(/^@/, "")}`);
  if (links.youtube) sameAs.push(`https://youtube.com/${links.youtube}`);
  if (links.tiktok) sameAs.push(`https://tiktok.com/${links.tiktok}`);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "@id": canonicalUrl,
    name: facility.name,
    alternateName: facility.nameJa,
    description: facility.description,
    url: canonicalUrl,
    address: {
      "@type": "PostalAddress",
      addressCountry: "JP",
      ...(prefectureName ? { addressRegion: prefectureName } : {}),
      streetAddress: facility.address,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: facility.lat,
      longitude: facility.lng,
    },
  };
  if (facility.phone) data.telephone = facility.phone;
  if (facility.price) data.priceRange = facility.price;
  if (facility.image) data.image = facility.image;
  if (sameAs.length) data.sameAs = sameAs;
  if (facility.rating !== undefined && facility.reviewCount !== undefined) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: facility.rating,
      reviewCount: facility.reviewCount,
    };
  }
  return data;
}

export interface CrumbItem {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(items: CrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function itemListJsonLd(items: CrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  };
}
