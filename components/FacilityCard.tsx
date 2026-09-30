import { memo } from "react";
import type { Facility } from "@/lib/types";
import { formatDistance } from "@/lib/util";
import { Photo, Star } from "./Photo";
import { StatusPill } from "./StatusPill";
import { InstagramIcon, TiktokIcon, WebIcon, XIcon, YoutubeIcon } from "./SnsIcons";

interface Props {
  facility: Facility;
  /** 1-based position in the list — the same number the map pin shows (SHIG 5). */
  index?: number;
  active: boolean;
  favorite?: boolean;
  onClick: () => void;
}

function FacilityCardImpl({ facility, index, active, favorite = false, onClick }: Props) {
  const { links } = facility;
  return (
    // The card itself is not a control: a role=button with focusable SNS links
    // inside is a nested-interactive violation. The name is a real <button>
    // whose ::after covers the card (see .card-open), and this onClick only
    // catches the pointer outside that overlay (SHIG 94).
    <div
      className={`card ${active ? "active" : ""}`}
      onClick={onClick}
      aria-current={active || undefined}
      data-facility-id={facility.id}
    >
      <div className="card-row">
        <div className="card-thumb">
          {index !== undefined && <span className="card-thumb-num">{index}</span>}
          <Photo data={facility.photos[0]} src={facility.image} type={facility.type} />
        </div>
        <div className="card-body">
          <h2 className="card-title">
            <button
              type="button"
              className="card-open title-text"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              {facility.name}
            </button>
            {favorite && (
              <span className="card-fav" role="img" aria-label="お気に入り">
                ★
              </span>
            )}
            {facility.isOpen !== undefined && (
              <StatusPill open={facility.isOpen} closesAt={facility.closesAt ?? ""} />
            )}
          </h2>
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
  (prev, next) =>
    prev.facility === next.facility &&
    prev.index === next.index &&
    prev.active === next.active &&
    prev.favorite === next.favorite,
);
