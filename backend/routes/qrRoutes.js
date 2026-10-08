const express = require("express");
const router = express.Router();
const qrController = require("../controllers/qrController");

// Chhota rate limit (per IP) taaki token guess na kiya ja sake
const hits = new Map();
router.use((req, res, next) => {
    const now = Date.now();
    const e = hits.get(req.ip);

    if (!e || now - e.start > 60000) {
        hits.set(req.ip, { start: now, count: 1 });
        return next();
    }

    if (++e.count > 60) return res.status(429).send("Too many requests");

    next();
});

router.get("/:token", qrController.showQr);

module.exports = router;