import Link from "next/link";

const NAV = [
  { href: "/", label: "施設マップ", icon: "▣", key: "map" },
  { href: "/facilities", label: "施設一覧", icon: "▤", key: "facilities" },
  { href: "/events", label: "イベント", icon: "◈", key: "events" },
  { href: "/skills", label: "技ガイド", icon: "◆", key: "skills" },
] as const;

// Shared header for the server-rendered content pages. Mirrors the home topbar's
// branding and gives crawlers a stable internal-link hub across every page.
export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="doc-header">
      <Link href="/" className="brand" aria-label="ACRO/FINDER ホーム">
        <div className="brand-mark">A</div>
        <div>
          ACRO<span style={{ color: "var(--ink-3)" }}>/</span>FINDER
          <div className="jp">アクロバット練習施設</div>
        </div>
      </Link>
      <nav className="top-nav" aria-label="グローバルナビ">
        {NAV.map((n) => (
          <Link
            key={n.key}
            href={n.href}
            className={`top-nav-link ${active === n.key ? "active" : ""}`}
            aria-current={active === n.key ? "page" : undefined}
          >
            <span className="top-nav-icon">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
      <Link href="/owners" className="header-cta">
        施設運営者の方へ
      </Link>
    </header>
  );
}
