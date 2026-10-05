import Link from "next/link";

export type NavKey = "map" | "facilities" | "events" | "skills";

// The one list of primary tabs. Home, events, skills and the content pages all
// render it, so a tab never disappears or shifts position between screens
// (SHIG 6, 73).
const NAV: readonly { key: NavKey; href: string; label: string; icon: string }[] = [
  { key: "map", href: "/", label: "施設マップ", icon: "▣" },
  { key: "facilities", href: "/facilities", label: "施設一覧", icon: "▤" },
  { key: "events", href: "/events", label: "イベント", icon: "◈" },
  { key: "skills", href: "/skills", label: "技ガイド", icon: "◆" },
];

export function TopNav({
  active,
  badges,
}: {
  active?: NavKey;
  badges?: Partial<Record<NavKey, number>>;
}) {
  return (
    <nav className="top-nav" aria-label="グローバルナビ">
      {NAV.map((n) => (
        <Link
          key={n.key}
          href={n.href}
          className={`top-nav-link ${active === n.key ? "active" : ""}`}
          aria-current={active === n.key ? "page" : undefined}
        >
          <span className="top-nav-icon" aria-hidden="true">
            {n.icon}
          </span>
          {n.label}
          {badges?.[n.key] !== undefined && <span className="top-nav-badge">{badges[n.key]}</span>}
        </Link>
      ))}
    </nav>
  );
}
