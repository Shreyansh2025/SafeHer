import { formatTimeFull } from "../utils/format";

export default function Timeline({ items = [] }) {
  return (
    <section className="card">
      <h2>Emergency Timeline</h2>
      {items.length === 0 ? (
        <p className="muted-note">No events yet.</p>
      ) : (
        <ol className="timeline">
          {items.map((item, index) => (
            <li
              key={item.id || `${item.time || "event"}-${item.type || index}`}
              className="timeline-item"
            >
              <div className="timeline-time">{formatTimeFull(item.time)}</div>
              <div className="timeline-label">{item.label}</div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
