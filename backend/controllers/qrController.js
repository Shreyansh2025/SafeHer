const UserQr = require("../models/UserQr");
const User = require("../models/User");
const EmergencyContact = require("../models/EmergencyContact");
const Emergency = require("../models/Emergency");

const esc = (v) =>
    String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const page = (body) => `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SafeHer</title>
<style>
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f3f4f6;color:#1f2937}
  header{background:#111827;color:#fff;text-align:center;padding:14px}
  header b{letter-spacing:3px}
  main{max-width:520px;margin:0 auto;padding:12px}
  .card{background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
  h2{margin:0 0 10px;font-size:16px}
  .row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px}
  .row:last-child{border-bottom:none}
  .row span{color:#6b7280}.row b{text-align:right}
  .status{color:#fff;border-radius:14px;padding:16px;margin-bottom:12px;font-weight:800;font-size:20px}
  .active{background:#dc2626}.ok{background:#059669}
  a{color:#2563eb;text-decoration:none}
</style></head>
<body><header><b>SAFEHER</b><div style="font-size:12px;color:#9ca3af">User Details</div></header>
<main>${body}</main></body></html>`;

const notFound = (res) =>
    res
        .status(404)
        .type("html")
        .send(page(`<div class="card"><h2>Not found</h2>This QR code is invalid.</div>`));

// GET /qr/:token  (public, secret token is the key)
const showQr = async (req, res) => {
    try {
        const { token } = req.params;

        if (!/^[a-f0-9]{48}$/.test(token)) return notFound(res);

        const qr = await UserQr.findOne({ where: { token } });

        if (!qr) return notFound(res);

        const [user, contacts, active] = await Promise.all([
            User.findByPk(qr.userId, { attributes: ["name", "email", "phone"] }),
            EmergencyContact.findAll({ where: { userId: qr.userId } }),
            Emergency.findOne({
                where: { userId: qr.userId, status: "ACTIVE" },
                order: [["startedAt", "DESC"]],
            }),
        ]);

        if (!user) return notFound(res);

        const contactRows = contacts.length
            ? contacts
                  .map(
                      (c) =>
                          `<div class="row"><span>${esc(c.name)}${
                              c.relation ? " (" + esc(c.relation) + ")" : ""
                          }</span><b><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></b></div>`
                  )
                  .join("")
            : `<div class="row"><span>No contacts added</span></div>`;

        const status = active
            ? `<div class="status active">🚨 ACTIVE EMERGENCY</div>`
            : `<div class="status ok">✅ No active emergency</div>`;

        const html = page(`
${status}
<div class="card"><h2>Person</h2>
  <div class="row"><span>Name</span><b>${esc(user.name)}</b></div>
  <div class="row"><span>Phone</span><b><a href="tel:${esc(user.phone)}">${esc(user.phone)}</a></b></div>
  <div class="row"><span>Email</span><b>${esc(user.email)}</b></div>
</div>
<div class="card"><h2>Emergency Contacts</h2>${contactRows}</div>`);

        res.set("Cache-Control", "no-store");
        return res.status(200).type("html").send(html);
    } catch (error) {
        console.error("QR page error:", error.message);
        return res.status(500).type("html").send(page(`<div class="card">Something went wrong.</div>`));
    }
};

module.exports = { showQr };