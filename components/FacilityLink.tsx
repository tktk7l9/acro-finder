import Link from "next/link";
import type { Facility } from "@/lib/types";

// Compact, crawlable link card used on the index and area pages.
export function FacilityLink({ facility }: { facility: Facility }) {
  return (
    <Link href={`/facilities/${facility.id}`} className="fac-link">
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
