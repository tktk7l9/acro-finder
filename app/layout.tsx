import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono, Zen_Kaku_Gothic_New } from "next/font/google";
import { SITE_URL } from "@/lib/site";
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

const TITLE = "ACRO/FINDER · アクロバット練習施設マップ";
const DESCRIPTION =
  "トリッキング・パルクール・体操などアクロバットを練習できる施設を地図とリストで検索。営業時間・設備・器具・レッスン・予約・支払い方法、現在地からの距離まで一覧で確認できます。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · ACRO/FINDER",
  },
  description: DESCRIPTION,
  applicationName: "ACRO/FINDER",
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
  authors: [{ name: "ACRO/FINDER" }],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: "ACRO/FINDER",
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
        {/* Cloudflare Web Analytics。2026-09-14 の Workers 移行で Vercel Analytics を
            外した代わり。token は HTML に埋まって全訪問者に見えるため秘密情報ではない。
            許可オリジンは lib/csp.ts 側にあり、csp.test.ts が両方を固定している。
            gitleaks は 32桁hex を generic-api-key として検出するので、検出行に
            gitleaks:allow を置いて抑止する（設定ファイルを置くと他の本物の秘密まで隠れる）。 */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts --
            type="module" のスクリプトは仕様上 defer されるため、パーサーを止めない */}
        <script
          type="module"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={'{"token": "4bc6c9283c434c8eb00a63fda94b12f1"}' /* gitleaks:allow */}
        />
      </body>
    </html>
  );
}
