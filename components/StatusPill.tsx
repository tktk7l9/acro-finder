export function StatusPill({ open, closesAt }: { open: boolean; closesAt: string }) {
  return (
    <span className={`status-pill ${open ? "open" : "closed"}`}>
      <span className="pulse" />
      {open ? `営業中 · ${closesAt}まで` : "営業時間外"}
    </span>
  );
}
