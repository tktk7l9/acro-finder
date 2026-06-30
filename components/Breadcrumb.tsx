import Link from "next/link";

export interface Crumb {
  name: string;
  href: string;
}

// Visual breadcrumb trail. The final crumb is the current page and is not linked.
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumb" aria-label="パンくずリスト">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={it.href} className="crumb">
            {i > 0 && <span className="sep">›</span>}
            {last ? (
              <span aria-current="page">{it.name}</span>
            ) : (
              <Link href={it.href}>{it.name}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
