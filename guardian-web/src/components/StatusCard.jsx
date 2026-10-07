import { formatTime, formatTimeFull, triggerLabel } from "../utils/format";

const STATUS_CONFIG = {
  ACTIVE: {
    cls: "active",
    title: "🚨 ACTIVE EMERGENCY",
    note: "This person may need help right now.",
  },
  RESOLVED: {
    cls: "resolved",
    title: "✅ EMERGENCY RESOLVED",
    note: "This emergency is no longer active.",
  },
  CANCELLED: {
    cls: "cancelled",
    title: "⚪ EMERGENCY CANCELLED",
    note: "This emergency is no longer active.",
  },
};

export default function StatusCard({ emergency }) {
  const cfg = STATUS_CONFIG[emergency.status] || STATUS_CONFIG.CANCELLED;
  const isActive = emergency.status === "ACTIVE";

  return (
    <section className={`card status-card ${cfg.cls}`}>
      <div className="status-title">{cfg.title}</div>
      <div className="status-note">{cfg.note}</div>

      <dl className="status-grid">
        <div>
          <dt>Person</dt>
          <dd>{emergency.userName}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{emergency.status}</dd>
        </div>
        <div>
          <dt>Trigger</dt>
          <dd>{triggerLabel(emergency.triggerType)}</dd>
        </div>
        <div>
          <dt>Started</dt>
          <dd>{formatTime(emergency.startedAt)}</dd>
        </div>
        {isActive ? (
          <div>
            <dt>Last location update</dt>
            <dd>{formatTimeFull(emergency.lastUpdated)}</dd>
          </div>
        ) : (
          <div>
            <dt>{emergency.status === "RESOLVED" ? "Resolved" : "Ended"}</dt>
            <dd>{formatTime(emergency.endedAt)}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
