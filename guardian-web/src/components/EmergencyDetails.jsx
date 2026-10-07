import { formatTimeFull, triggerLabel } from "../utils/format";

export default function EmergencyDetails({ emergency }) {
  const rows = [
    ["Emergency ID", emergency.emergencyId],
    ["User", emergency.userName],
    ["Trigger Type", triggerLabel(emergency.triggerType)],
    ["Status", emergency.status],
    ["Start Time", formatTimeFull(emergency.startedAt)],
    ["Last Update", formatTimeFull(emergency.lastUpdated)],
    ["Latitude", emergency.latitude],
    ["Longitude", emergency.longitude],
  ];

  return (
    <section className="card">
      <h2>Emergency Details</h2>
      <dl className="details-list">
        {rows.map(([label, value]) => (
          <div key={label} className="details-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}