import Link from "next/link";
import { TopNav, type NavKey } from "./TopNav";

// Shared header for the server-rendered content pages. Mirrors the home topbar's
// branding and gives crawlers a stable internal-link hub across every page.
export function SiteHeader({ active }: { active?: NavKey }) {
  return (
    <header className="doc-header">
      <Link href="/" className="brand" aria-label="ACRO/FINDER ホーム">
        <div className="brand-mark">A</div>
        <div>
          ACRO<span style={{ color: "var(--ink-3)" }}>/</span>FINDER
          <div className="jp">アクロバット練習施設</div>
        </div>
      </Link>
      <TopNav active={active} />
      <Link href="/owners" className="header-cta">
        施設運営者の方へ
      </Link>
    </header>
  );
}
