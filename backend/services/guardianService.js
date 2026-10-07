const crypto = require('crypto');
const {
  Emergency,
  EmergencyContact,
  EmergencyEvent,
  GuardianLink,
  User
} = require('../models/relation');

const TOKEN_REGEX = /^[a-f0-9]{48}$/;

const linkTtlMs = () =>
  (Number(process.env.GUARDIAN_LINK_TTL_HOURS) || 24) * 60 * 60 * 1000;

/* ---------------------------------------------------------
   TOKEN HELPERS
--------------------------------------------------------- */

const generateToken = () => crypto.randomBytes(24).toString('hex'); // 48 hex chars

const createLink = async (emergencyId, contactId) =>
  GuardianLink.create({
    token: generateToken(),
    emergencyId,
    contactId,
    expiresAt: new Date(Date.now() + linkTtlMs())
  });

// Returns the link row, or null when invalid / expired.
const validateToken = async (token) => {
  if (typeof token !== 'string' || !TOKEN_REGEX.test(token)) return null;

  const link = await GuardianLink.findOne({ where: { token } });

  if (!link || link.expiresAt < new Date()) return null;

  return link;
};

/* ---------------------------------------------------------
   TIMELINE
--------------------------------------------------------- */

// Never throws: a timeline problem must not break the SOS flow.
const logEvent = async (emergencyId, type, label) => {
  try {
    await EmergencyEvent.create({ emergencyId, type, label });
  } catch (error) {
    console.error('⚠️ Could not log emergency event:', error.message);
  }
};

/* ---------------------------------------------------------
   LIVE LOCATION PERSISTENCE (throttled)
   Mobile sends GPS ~1/sec. Only store a few of them.
--------------------------------------------------------- */

const lastPersist = new Map(); // emergencyId -> ms
const lastEvent = new Map();   // emergencyId -> ms
const PERSIST_EVERY_MS = 5000;
const EVENT_EVERY_MS = 30000;

const handleLocationUpdate = async (emergencyId, latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const now = Date.now();

  try {
    if (now - (lastPersist.get(emergencyId) || 0) >= PERSIST_EVERY_MS) {
      lastPersist.set(emergencyId, now);

      await Emergency.update(
        { latitude: lat, longitude: lng },
        { where: { id: emergencyId, status: 'ACTIVE' } }
      );
    }

    if (now - (lastEvent.get(emergencyId) || 0) >= EVENT_EVERY_MS) {
      const first = !lastEvent.has(emergencyId);
      lastEvent.set(emergencyId, now);

      await logEvent(
        emergencyId,
        first ? 'LOCATION_RECEIVED' : 'LOCATION_UPDATED',
        first ? 'Location received' : 'Location updated'
      );
    }
  } catch (error) {
    console.error('⚠️ Location persist failed:', error.message);
  }
};

const forgetEmergency = (emergencyId) => {
  lastPersist.delete(emergencyId);
  lastEvent.delete(emergencyId);
};

/* ---------------------------------------------------------
   PUBLIC PAYLOAD
   ONLY fields the guardian is allowed to see.
   Never: password, email, userId, address, JWT, other contacts.
--------------------------------------------------------- */

const getGuardianEmergency = async (token) => {
  const link = await validateToken(token);

  if (!link) return null;

  const emergency = await Emergency.findByPk(link.emergencyId);

  if (!emergency) return null;

  const [user, contact, events] = await Promise.all([
    User.findByPk(emergency.userId, { attributes: ['name'] }),
    EmergencyContact.findByPk(link.contactId, { attributes: ['name', 'phone'] }),
    EmergencyEvent.findAll({
      where: { emergencyId: emergency.id },
      order: [['createdAt', 'ASC']],
      limit: 50
    })
  ]);

  return {
    emergencyId: emergency.id,
    status: emergency.status,
    userName: user ? user.name : 'SafeHer User',
    triggerType: 'SOS_BUTTON', // not stored yet; future: SHAKE | IOT | VOICE | SMARTWATCH
    latitude: Number(emergency.latitude),
    longitude: Number(emergency.longitude),
    locationAccuracy: null,    // mobile app does not send accuracy yet
    startedAt: emergency.startedAt,
    lastUpdated: emergency.updatedAt,
    endedAt: emergency.endedAt,
    contact: contact
      ? { name: contact.name, phone: contact.phone }
      : null,
    notifications: {
      whatsapp: link.whatsappStatus,
      sms: link.smsStatus,
      voiceCall: link.callStatus
    },
    timeline: events.map((e) => ({
      time: e.createdAt,
      label: e.label
    }))
  };
};

module.exports = {
  createLink,
  validateToken,
  logEvent,
  handleLocationUpdate,
  forgetEmergency,
  getGuardianEmergency
};
