// Poora number screen par nahi dikhate, sirf last 4 digits.
const maskPhone = (phone) => {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  return digits.length > 4 ? `••••••${digits.slice(-4)}` : "••••";
};

export default function EmergencyContact({ contact }) {
  const hasPhone = Boolean(contact?.phone);

  return (
    <section className="card">
      <h2>Emergency Contact</h2>
      <dl className="details-list">
        <div className="details-row"><dt>Name</dt><dd>{contact?.name || "—"}</dd></div>
        <div className="details-row"><dt>Phone</dt><dd>{maskPhone(contact?.phone)}</dd></div>
      </dl>
      {hasPhone ? (
        <a className="btn btn-outline" href={`tel:${contact.phone}`}>📞 Call Contact</a>
      ) : (
        <button className="btn btn-outline" disabled>Call not available</button>
      )}
    </section>
  );
}