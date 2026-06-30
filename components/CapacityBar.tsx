export function CapacityBar({ entered, capacity }: { entered: number; capacity: number }) {
  const pct = Math.min(100, Math.round((entered / capacity) * 100));
  const cls = pct >= 100 ? "full" : pct >= 80 ? "warn" : "";
  return (
    <div className="capacity-bar">
      <div className="capacity-bar-track">
        <div className={`capacity-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="capacity-bar-label">
        <span>
          {entered} / {capacity} 名
        </span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}
