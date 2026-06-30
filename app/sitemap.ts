import type { MetadataRoute } from "next";
import { FACILITIES } from "@/lib/data";
import { facilitiesByPrefecture } from "@/lib/areas";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/facilities`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/events`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/skills`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/owners`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const areaRoutes: MetadataRoute.Sitemap = facilitiesByPrefecture().map((g) => ({
    url: `${SITE_URL}/area/${g.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const facilityRoutes: MetadataRoute.Sitemap = FACILITIES.map((f) => ({
    url: `${SITE_URL}/facilities/${f.id}`,
    lastModified: new Date(f.updatedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...areaRoutes, ...facilityRoutes];
}
