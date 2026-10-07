const STATUS_UI = {
  SENT: { icon: "✓", text: "Sent", cls: "ok" },
  FAILED: { icon: "✕", text: "Failed", cls: "bad" },
  PENDING: { icon: "…", text: "Pending", cls: "wait" },
  NOT_AVAILABLE: { icon: "—", text: "Not available", cls: "na" },
};

export default function NotificationStatus({ notifications }) {
  const items = [
    ["WhatsApp", notifications?.whatsapp],
    ["SMS", notifications?.sms],
    ["Voice Call", notifications?.voiceCall],
  ];

  return (
    <section className="card">
      <h2>Notifications</h2>
      <ul className="notif-list">
        {items.map(([label, status]) => {
          const ui = STATUS_UI[status] || STATUS_UI.NOT_AVAILABLE;
          return (
            <li key={label} className="notif-row">
              <span>{label}</span>
              <span className={`notif-status ${ui.cls}`}>{ui.icon} {ui.text}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}