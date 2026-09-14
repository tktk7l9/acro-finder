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
        {/* アナリティクスは Cloudflare Web Analytics に差し替える。ダッシュボードで
            サイトを登録してトークンを取る必要があるので、まず Analytics 無しで
            デプロイして動作を確認し、トークン取得後に別コミットでビーコンを足す。
            中途半端なスニペットを入れて CSP 違反を起こすより確実。
            移行前は VERCEL 環境変数でゲートした Vercel Analytics を置いていたが、
            Workers ではその変数が存在しないので、そのままだと静かに消えるだけだった。 */}
      </body>
    </html>
  );
}
