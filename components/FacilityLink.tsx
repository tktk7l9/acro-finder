import Link from "next/link";
import type { Facility } from "@/lib/types";

// Compact, crawlable link card used on the index and area pages.
//
// prefetch を切っているのは、この 1 コンポーネントが /facilities に 99 個並ぶため。
// 既定ではビューポートに入った時点で全件のRSCを先読みするが、リンク先は force-dynamic で
// CDN キャッシュに乗らないため、その全てが Vercel の Fast Origin Transfer として課金される
// （実測: 軽くスクロールしただけで 21 リクエスト / 約 25KB）。
// 利用者が実際に開くのは 99 件のうち数件なので、先読みの価値より転送コストが上回る。
export function FacilityLink({ facility }: { facility: Facility }) {
  return (
    <Link href={`/facilities/${facility.id}`} className="fac-link" prefetch={false}>
      <span className="name">{facility.name}</span>
      <span className="meta">
        <span>{facility.area}</span>
        <span>{facility.typeLabel}</span>
        {facility.price && <span>{facility.price}</span>}
      </span>
      {facility.tags.length > 0 && (
        <span className="fac-tags">
          {facility.tags.slice(0, 3).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </span>
      )}
    </Link>
  );
}
