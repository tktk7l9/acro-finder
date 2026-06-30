import type { AcroEvent } from "@/lib/events-data";
import { EVENT_STATUS, eventStatus } from "@/lib/events-data";
import { fmtEventDate } from "@/lib/util";
import { CapacityBar } from "./CapacityBar";

interface Props {
  event: AcroEvent;
}

export function EventCard({ event }: Props) {
  const f = fmtEventDate(event.date);
  const dl = event.deadline ? fmtEventDate(event.deadline) : null;
  const st = eventStatus(event);
  const status = EVENT_STATUS[st];
  const ctaDim = st === "past" || st === "full" || st === "closed";
  const ctaLabel =
    st === "past"
      ? "大会情報を見る"
      : st === "full"
        ? "キャンセル待ち"
        : st === "closed"
          ? "受付終了"
          : "詳細・申込";
  const hasBottom = event.venue || event.capacity != null || dl;

  return (
    <div className={`event-card ${st === "past" ? "past" : ""}`}>
      <div className="event-date">
        <div className="d">{f.day}</div>
        <div className="m">{f.monthShort}</div>
        <div className={`day ${f.dayIdx === 6 ? "sat" : f.dayIdx === 0 ? "sun" : ""}`}>
          {f.dayName}
        </div>
      </div>
      <div className="event-body">
        <div className="event-type-row">
          <span className="event-type" data-type={event.type}>
            {event.typeLabel}
          </span>
          <span className={`event-status ${status.class}`}>{status.label}</span>
          {event.time && (
            <span
              style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}
            >
              {event.time}
            </span>
          )}
        </div>
        <h3 className="event-title">{event.title}</h3>
        <p className="event-title-ja">{event.titleJa}</p>
        <p className="event-desc">{event.description}</p>
        {hasBottom && (
          <div className="event-bottom">
            {event.venue && <span className="venue">{event.venue}</span>}
            {event.capacity != null && <span>定員 {event.capacity}</span>}
            {dl && (
              <span>
                申込締切 {dl.monthNum}/{dl.day}
              </span>
            )}
          </div>
        )}
        {event.tags && event.tags.length > 0 && (
          <div className="event-tags" style={{ marginTop: 6 }}>
            {event.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="event-right">
        {event.fee && <div className="event-fee">{event.fee}</div>}
        {event.feeNote && <div className="event-fee-note">{event.feeNote}</div>}
        {event.capacity != null && event.entered != null && (
          <CapacityBar entered={event.entered} capacity={event.capacity} />
        )}
        <div className={`event-card-cta ${ctaDim ? "dim" : ""}`}>{ctaLabel}</div>
      </div>
    </div>
  );
}
