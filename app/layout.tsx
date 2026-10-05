import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono, Zen_Kaku_Gothic_New } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { SnsIconSprite } from "@/components/SnsIcons";
import "./globals.css";

const fontEn = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--f-en",
  display: "swap",
});
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--f-mono",
  display: "swap",
});
const fontJp = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--f-jp",
  display: "swap",
  preload: false,
});

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
    <html lang="ja" className={`${fontEn.variable} ${fontMono.variable} ${fontJp.variable}`}>
      <body>
        <SnsIconSprite />
        {children}
        {/* Cloudflare Web Analytics, replacing Vercel Analytics removed in the 2026-09-14
            Workers migration. The token is embedded in the HTML and visible to every
            visitor, so it is not a secret. The allowed origins live in lib/csp.ts, and
            csp.test.ts pins both. gitleaks flags a 32-digit hex as generic-api-key, so
            gitleaks:allow on the flagged line suppresses it (a config file would also hide real secrets). */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts --
            type="module" scripts are deferred by spec, so this does not block the parser */}
        <script
          type="module"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={'{"token": "4bc6c9283c434c8eb00a63fda94b12f1"}' /* gitleaks:allow */}
        />
      </body>
    </html>
  );
}
