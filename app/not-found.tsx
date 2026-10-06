import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  robots: { index: false },
};

// Replaces Next's English default 404 so a stale or mistyped link still leads
// back into the app (SHIG 60 escape hatch, 11 the user's language, 55).
export default function NotFound() {
  return (
    <div className="doc-shell">
      <SiteHeader />
      <main className="doc">
        <h1>ページが見つかりません</h1>
        <p className="doc-lede">
          URL が間違っているか、施設の掲載が終了した可能性があります。地図か一覧から探し直せます。
        </p>
        <div className="doc-cta">
          <a className="btn btn-primary" href="/">
            施設マップで探す
          </a>
          <a className="btn" href="/facilities">
            都道府県別の一覧を見る
          </a>
        </div>
      </main>
    </div>
  );
}
