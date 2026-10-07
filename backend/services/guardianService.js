const crypto = require('crypto');
const {
  Emergency,
  EmergencyContact,
  EmergencyEvent,
  GuardianLink,
  User,
} = require('../models/relation');

const TOKEN_REGEX = /^[a-f0-9]{48}$/;

let io = null;

const setIo = (ioInstance) => {
  io = ioInstance;
};

const linkTtlMs = () =>
  (Number(process.env.GUARDIAN_LINK_TTL_HOURS) || 24) * 60 * 60 * 1000;

const guardianBaseUrl = () =>
  (process.env.GUARDIAN_WEB_URL || '').trim().replace(/\/+$/, '');

const getGuardianBaseUrl = () => {
  const baseUrl = guardianBaseUrl();

  if (!baseUrl) {
    const error = new Error(
      'GUARDIAN_WEB_URL is not configured. Set it to the public Guardian Web URL before triggering SOS.'
    );
    error.code = 'GUARDIAN_WEB_URL_MISSING';
    throw error;
  }

  return baseUrl;
};

const buildGuardianUrl = (token) => `${getGuardianBaseUrl()}/e/${encodeURIComponent(token)}`;

/* ---------------------------------------------------------
   TOKEN HELPERS
--------------------------------------------------------- */

const generateToken = () => crypto.randomBytes(24).toString('hex');

const createLink = async (emergencyId, contactId) => {
  const token = generateToken();

  return GuardianLink.create({
    token,
    emergencyId,
    contactId,
    expiresAt: new Date(Date.now() + linkTtlMs()),
  });
};

const validateToken = async (token) => {
  if (typeof token !== 'string' || !TOKEN_REGEX.test(token)) return null;

  const link = await GuardianLink.findOne({ where: { token } });

  if (!link || !link.expiresAt || link.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return link;
};

/* ---------------------------------------------------------
   LIVE GUARDIAN EVENTS
--------------------------------------------------------- */

const emitToGuardians = (emergencyId, event, payload) => {
  if (!io || !emergencyId) return;
  io.to(`guardian:${emergencyId}`).emit(event, payload);
};

/* ---------------------------------------------------------
   TIMELINE
--------------------------------------------------------- */

const logEvent = async (emergencyId, type, label) => {
  try {
    const event = await EmergencyEvent.create({ emergencyId, type, label });

    emitToGuardians(emergencyId, 'timeline:event', {
      id: event.id,
      type: event.type,
      label: event.label,
      time: event.createdAt,
    });

    return event;
  } catch (error) {
    console.error('⚠️ Could not log emergency event:', error.message);
    return null;
  }
};

/* ---------------------------------------------------------
   LIVE LOCATION PERSISTENCE (throttled)
--------------------------------------------------------- */

const lastPersist = new Map();
const lastEvent = new Map();
const PERSIST_EVERY_MS = 5000;
const EVENT_EVERY_MS = 30000;

const handleLocationUpdate = async (emergencyId, latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;

  try {
    // Re-check ACTIVE state on every location packet so a resolved
    // emergency can never continue broadcasting from a stale socket room.
    const activeEmergency = await Emergency.findOne({
      where: { id: emergencyId, status: 'ACTIVE' },
      attributes: ['id'],
    });

    if (!activeEmergency) {
      forgetEmergency(emergencyId);
      return false;
    }

    const now = Date.now();

    if (now - (lastPersist.get(emergencyId) || 0) >= PERSIST_EVERY_MS) {
      const [updatedRows] = await Emergency.update(
        { latitude: lat, longitude: lng },
        { where: { id: emergencyId, status: 'ACTIVE' } }
      );

      if (updatedRows === 0) {
        forgetEmergency(emergencyId);
        return false;
      }

      lastPersist.set(emergencyId, now);
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

    return true;
  } catch (error) {
    console.error('⚠️ Location persist failed:', error.message);
    return false;
  }
};

const forgetEmergency = (emergencyId) => {
  lastPersist.delete(emergencyId);
  lastEvent.delete(emergencyId);
};

/* ---------------------------------------------------------
   PUBLIC PAYLOAD
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
      order: [['createdAt', 'DESC']],
      limit: 50,
    }),
  ]);

  return {
    emergencyId: emergency.id,
    status: emergency.status,
    userName: user ? user.name : 'SafeHer User',
    triggerType: emergency.triggerType || 'SOS_BUTTON',
    latitude: Number(emergency.latitude),
    longitude: Number(emergency.longitude),
    locationAccuracy: null,
    startedAt: emergency.startedAt,
    lastUpdated: emergency.updatedAt,
    endedAt: emergency.endedAt,
    contact: contact
      ? { name: contact.name, phone: contact.phone }
      : null,
    notifications: {
      whatsapp: link.whatsappStatus,
      sms: link.smsStatus,
      voiceCall: link.callStatus,
    },
    timeline: events
      .reverse()
      .map((event) => ({
        id: event.id,
        type: event.type,
        time: event.createdAt,
        label: event.label,
      })),
  };
};

const emitNotificationUpdate = (guardianLink) => {
  if (!guardianLink) return;

  emitToGuardians(guardianLink.emergencyId, 'notification:update', {
    whatsapp: guardianLink.whatsappStatus,
    sms: guardianLink.smsStatus,
    voiceCall: guardianLink.callStatus,
  });
};

module.exports = {
  setIo,
  getGuardianBaseUrl,
  buildGuardianUrl,
  createLink,
  validateToken,
  logEvent,
  handleLocationUpdate,
  forgetEmergency,
  emitToGuardians,
  emitNotificationUpdate,
  getGuardianEmergency,
};
