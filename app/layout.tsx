import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { Analytics } from "@/components/Analytics";
import { SnsIconSprite } from "@/components/SnsIcons";
import "./globals.css";

// Inter Tight, self-hosted: Google's latin characters (plus macron vowels) with
// only the 400-700 weights, 28 KB instead of Google's 45 KB file and the 90 KB
// latin-ext one a facility name pulled in. Built by scripts/build-fonts.py.
// It is preloaded: the brand, tabs and list use it in the first view.
const fontEn = localFont({
  src: "./fonts/inter-tight.woff2",
  weight: "400 700",
  variable: "--f-en",
  display: "swap",
});
// Not preloaded, and nothing a phone shows in the first view of the map uses
// it (the map legend and the nav glyphs are hidden there; the equipment icons
// name their own fonts in globals.css), so a phone fetches it only on pages that
// set text in it. Preloaded, its 31 KB went out with the CSS, the map
// placeholder and the JS on every page.
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--f-mono",
  display: "swap",
  preload: false,
});
// Japanese text uses the OS font (Hiragino / Noto Sans CJK / Yu Gothic, see
// --font-jp in globals.css). A Japanese web font ships as ~20 unicode-range
// files per weight; Zen Kaku Gothic New in three weights was ~66 requests and
// ~650 KB on the first view of the map, the largest cost on a phone.

const TITLE = `${SITE_NAME} · アクロバット練習施設マップ`;
const DESCRIPTION =
  "トリッキング・パルクール・体操などアクロバットを練習できる施設を地図とリストで検索。営業時間・設備・器具・レッスン・予約・支払い方法、現在地からの距離まで一覧で確認できます。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "トリッキング",
    "パルクール",
    "アクロバット",
    "練習施設",
    "体操",
    "トランポリン",
    "フリーランニング",
    "施設検索",
  ],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e0f0d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${fontEn.variable} ${fontMono.variable}`}>
      <body>
        <SnsIconSprite />
        {children}
        {/* Cloudflare Web Analytics, appended after hydration (components/Analytics.tsx) so
            the HTML carries no external <script src> without SRI. */}
        <Analytics />
      </body>
    </html>
  );
}
