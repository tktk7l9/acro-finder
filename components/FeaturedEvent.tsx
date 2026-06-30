import type { AcroEvent } from "@/lib/events-data";
import { EVENT_STATUS, eventStatus } from "@/lib/events-data";
import { fmtEventDate } from "@/lib/util";
import { Photo } from "./Photo";
import { CapacityBar } from "./CapacityBar";

interface Props {
  event: AcroEvent;
}

export function FeaturedEvent({ event }: Props) {
  const f = fmtEventDate(event.date);
  const dl = event.deadline ? fmtEventDate(event.deadline) : null;
  const status = EVENT_STATUS[eventStatus(event)];
  return (
    <div className="featured-event">
      <div className="featured-cover">
        <Photo data={{ label: `${event.title} / Cover`, color: event.cover }} />
      </div>
      <div className="featured-body">
        <div className="featured-meta">
          <span className="event-type" data-type={event.type}>
            {event.typeLabel}
          </span>
          <span className={`event-status ${status.class}`}>{status.label}</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>
            {f.year}.{String(f.monthNum).padStart(2, "0")}.{String(f.day).padStart(2, "0")} (
            {f.dayName})
          </span>
        </div>
        <h2 className="featured-title">{event.title}</h2>
        <p className="featured-title-ja">{event.titleJa}</p>
        <p className="featured-desc">{event.description}</p>
        <div className="featured-info">
          {event.venue && (
            <div className="featured-info-cell">
              <div className="k">Venue</div>
              <div className="v">{event.venue}</div>
            </div>
          )}
          {event.time && (
            <div className="featured-info-cell">
              <div className="k">Time</div>
              <div className="v mono">{event.time}</div>
            </div>
          )}
          {event.fee && (
            <div className="featured-info-cell">
              <div className="k">Entry Fee</div>
              <div className="v mono">{event.fee}</div>
              {event.feeNote && (
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                  {event.feeNote}
                </div>
              )}
            </div>
          )}
          {event.capacity != null && (
            <div className="featured-info-cell">
              <div className="k">Capacity</div>
              <div className="v mono">
                {event.entered ?? 0} / {event.capacity}
              </div>
              {dl && (
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                  申込締切 {dl.monthNum}/{dl.day}
                </div>
              )}
            </div>
          )}
        </div>
        {event.tags && event.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {event.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        )}
        {event.capacity != null && event.entered != null && (
          <div className="featured-cta">
            <CapacityBar entered={event.entered} capacity={event.capacity} />
          </div>
        )}
      </div>
    </div>
  );
}
