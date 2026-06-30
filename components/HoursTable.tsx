import type { HourEntry } from "@/lib/types";
import { todayLabel } from "@/lib/util";

export function HoursTable({ hours }: { hours: HourEntry[] }) {
  const td = todayLabel();
  return (
    <div className="hours">
      {hours.map((h) => (
        <div
          key={h.day}
          className={`hour-row ${h.day === td ? "today" : ""} ${h.closed ? "closed" : ""}`}
        >
          <span className="day">{h.day}</span>
          <span className="time">{h.time}</span>
          {h.day === td && !h.closed && <span className="badge-now">今日</span>}
        </div>
      ))}
    </div>
  );
}
