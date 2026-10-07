const express = require('express');
const router = express.Router();
const guardianController = require('../controllers/guardianController');

/* ---------------------------------------------------------
   PUBLIC routes (no login). The secret token is the auth.
--------------------------------------------------------- */

// CORS: only the Guardian Web (and local dev) may call this from a browser.
const allowedOrigins = [
  (process.env.GUARDIAN_WEB_URL || '').replace(/\/+$/, ''),
  'http://localhost:5173'
].filter(Boolean);

router.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') return res.sendStatus(204);

  next();
});

// Tiny in-memory rate limit (per IP) so tokens can't be brute-forced.
const hits = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_HITS = 60;

router.use((req, res, next) => {
  const now = Date.now();
  const key = req.ip;
  const entry = hits.get(key);

  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(key, { start: now, count: 1 });
    return next();
  }

  entry.count += 1;

  if (entry.count > MAX_HITS) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait a moment.'
    });
  }

  next();
});

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (now - entry.start > WINDOW_MS) hits.delete(key);
  }
}, WINDOW_MS).unref();

router.get('/emergency/:token', guardianController.getEmergency);

module.exports = router;
