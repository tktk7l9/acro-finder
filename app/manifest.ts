import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ACRO/FINDER · アクロバット練習施設マップ",
    short_name: "ACRO/FINDER",
    description: "トリッキング・パルクールなどアクロバット練習施設を地図とリストで検索",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0f0d",
    theme_color: "#0e0f0d",
    lang: "ja",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
