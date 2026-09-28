import Link from "next/link";
import type { Facility } from "@/lib/types";

// Compact, crawlable link card used on the index and area pages.
//
// Prefetch is off because this one component appears 99 times on /facilities.
// By default the RSC of every link is prefetched once it enters the viewport, but the linked
// facilities/[id] has no generateStaticParams, stays dynamic and is not CDN-cached,
// so all of it becomes transfer as-is (dropping the nonce CSP did not change this route)
// (measured: 21 requests / about 25KB from a light scroll).
// Users actually open only a few of the 99, so the transfer cost outweighs the prefetch value.
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
