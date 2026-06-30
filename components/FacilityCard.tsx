import { memo } from "react";
import type { Facility } from "@/lib/types";
import { formatDistance } from "@/lib/util";
import { Photo, Star } from "./Photo";
import { StatusPill } from "./StatusPill";
import { InstagramIcon, TiktokIcon, WebIcon, XIcon, YoutubeIcon } from "./SnsIcons";

interface Props {
  facility: Facility;
  active: boolean;
  onClick: () => void;
}

function FacilityCardImpl({ facility, active, onClick }: Props) {
  const { links } = facility;
  return (
    <div
      className={`card ${active ? "active" : ""}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-current={active || undefined}
    >
      <div className="card-row">
        <div className="card-thumb">
          <span className="card-thumb-num">{facility.id.toUpperCase()}</span>
          <Photo data={facility.photos[0]} src={facility.image} type={facility.type} />
        </div>
        <div className="card-body">
          <h3 className="card-title">
            <span className="title-text">{facility.name}</span>
            {facility.isOpen !== undefined && (
              <StatusPill open={facility.isOpen} closesAt={facility.closesAt ?? ""} />
            )}
          </h3>
          <p className="card-title-ja">
            {facility.nameJa} · {facility.typeLabel}
          </p>
          <div className="card-meta">
            {facility.rating !== undefined && (
              <span className="rating">
                <Star />
                {facility.rating.toFixed(1)}{" "}
                {facility.reviewCount !== undefined && (
                  <span style={{ color: "var(--ink-3)", fontWeight: 400, marginLeft: 2 }}>
                    ({facility.reviewCount})
                  </span>
                )}
              </span>
            )}
            <span>{facility.area}</span>
            <span className="distance">{formatDistance(facility.distance)}</span>
          </div>
          {(facility.lessons || facility.booking || facility.payment) && (
            <div className="card-flags">
              {facility.lessons && (
                <span className={`card-flag ${facility.lessons.available ? "on" : ""}`}>
                  {facility.lessons.available ? "レッスン有" : "フリーのみ"}
                </span>
              )}
              {facility.booking && (
                <span className={`card-flag ${facility.booking.required ? "req" : "on"}`}>
                  {facility.booking.required ? "要予約" : "予約不要"}
                </span>
              )}
              {facility.payment?.includes("クレジットカード") && (
                <span className="card-flag on">カード可</span>
              )}
            </div>
          )}
          <div className="card-tags">
            {facility.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
            <span className="card-sns">
              {links.web && (
                <a
                  href={links.web}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="公式HP"
                  aria-label="公式HP"
                >
                  <WebIcon />
                </a>
              )}
              {links.instagram && (
                <a
                  href={`https://instagram.com/${links.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Instagram"
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
              )}
              {links.twitter && (
                <a
                  href={`https://x.com/${links.twitter.replace("@", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="X"
                  aria-label="X"
                >
                  <XIcon />
                </a>
              )}
              {links.youtube && (
                <a
                  href={`https://youtube.com/${links.youtube}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="YouTube"
                  aria-label="YouTube"
                >
                  <YoutubeIcon />
                </a>
              )}
              {links.tiktok && (
                <a
                  href={`https://tiktok.com/${links.tiktok}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="TikTok"
                  aria-label="TikTok"
                >
                  <TiktokIcon />
                </a>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// `onClick` is a fresh closure on every parent render but always selects the
// same facility, so it is excluded from the comparison — this lets a card skip
// re-rendering when an unrelated facility is selected.
export const FacilityCard = memo(
  FacilityCardImpl,
  (prev, next) => prev.facility === next.facility && prev.active === next.active,
);
