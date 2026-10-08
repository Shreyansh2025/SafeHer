const crypto = require("crypto");
const QRCode = require("qrcode");
const UserQr = require("../models/UserQr");

const getOrCreateToken = async (userId) => {
    const [row] = await UserQr.findOrCreate({
        where: { userId },
        defaults: { userId, token: crypto.randomBytes(24).toString("hex") },
    });

    return row.token;
};

const generateUserQR = async (user) => {
    const base = (process.env.QR_BASE_URL || "").trim().replace(/\/+$/, "");

    let qrData = JSON.stringify({ type: "SAFEHER_USER", userId: user.id });

    // QR mein link jaata hai: <QR_BASE_URL>/qr/<secret-token>
    // Kuch fail ho to purana payload use hota hai (register/profile nahi tootega)
    if (base) {
        try {
            qrData = `${base}/qr/${await getOrCreateToken(user.id)}`;
        } catch (error) {
            console.error("QR token error:", error.message);
        }
    }

    console.log("QR DATA:", qrData);
    
    return QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "M",
    });
};

module.exports = { generateUserQR };