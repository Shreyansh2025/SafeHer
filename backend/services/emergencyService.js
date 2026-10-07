const {
  Emergency,
  EmergencyContact,
  Notification,
  User,
} = require("../models/relation");

const guardianService = require("./guardianService");
const { sendWhatsApp } = require("./twilioService");
const { sendSMS, makeVoiceCall } = require("./vonageService");

let io = null;

const setIo = (ioInstance) => {
  io = ioInstance;
};

const VALID_TRIGGER_TYPES = new Set([
  "SOS_BUTTON",
  "SHAKE",
  "IOT",
  "VOICE",
  "SMARTWATCH",
]);

const normalizeTriggerType = (value) => {
  const type = String(value || "SOS_BUTTON").trim().toUpperCase();
  return VALID_TRIGGER_TYPES.has(type) ? type : "SOS_BUTTON";
};

const validateCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const error = new Error("Latitude and longitude must be valid numbers.");
    error.code = "INVALID_COORDINATES";
    throw error;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    const error = new Error("Latitude or longitude is outside a valid range.");
    error.code = "INVALID_COORDINATES";
    throw error;
  }

  return { lat, lng };
};

const updateGuardianLinkStatus = async (guardianLink, patch) => {
  if (!guardianLink) return;

  try {
    await guardianLink.update(patch);
    guardianService.emitNotificationUpdate(guardianLink);
  } catch (error) {
    console.error("⚠️ Could not save Guardian channel status:", error.message);
  }
};

/* =========================================================
   CREATE EMERGENCY
========================================================= */

const createEmergency = async (
  userId,
  latitude,
  longitude,
  address,
  triggerType = "SOS_BUTTON",
) => {
  try {
    const { lat, lng } = validateCoordinates(latitude, longitude);

    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // One ACTIVE emergency per user.
    const activeEmergency = await Emergency.findOne({
      where: { userId, status: "ACTIVE" },
      order: [["startedAt", "DESC"]],
    });

    if (activeEmergency) {
      const error = new Error("SOS is already active.");
      error.code = "ACTIVE_SOS_EXISTS";
      error.emergency = activeEmergency;
      throw error;
    }

    const normalizedTriggerType = normalizeTriggerType(triggerType);

    const contacts = await EmergencyContact.findAll({
      where: { userId },
      order: [["createdAt", "ASC"]],
    });

    // Guardian links are part of the real notification flow. Do not silently
    // skip link creation because the base URL is missing.
    if (contacts.length > 0) {
      guardianService.getGuardianBaseUrl();
    }

    const emergency = await Emergency.create({
      userId,
      latitude: lat,
      longitude: lng,
      address,
      triggerType: normalizedTriggerType,
    });

    await guardianService.logEvent(
      emergency.id,
      "SOS_TRIGGERED",
      `SOS triggered (${normalizedTriggerType})`,
    );
    await guardianService.logEvent(
      emergency.id,
      "EMERGENCY_CREATED",
      "Emergency created",
    );

    const notificationData = contacts.map((contact) => ({
      emergencyId: emergency.id,
      contactId: contact.id,
      message: "SafeHer SOS alert",
      type: "SOS_ALERT",
      status: "PENDING",
    }));

    let notificationRecords = [];

    if (notificationData.length > 0) {
      notificationRecords = await Notification.bulkCreate(notificationData);
    }

    const googleMapsLink = `https://maps.google.com/?q=${lat},${lng}`;

    let whatsappSent = 0;
    let whatsappFailed = 0;
    let smsSent = 0;
    let smsFailed = 0;
    let callsPlaced = 0;
    let callsFailed = 0;
    let contactsNotified = 0;
    let contactsFailed = 0;

    for (const contact of contacts) {
      const notification = notificationRecords.find(
        (record) => record.contactId === contact.id,
      );

      let whatsappResult = { success: false, reason: "Not attempted" };
      let smsResult = { success: false, reason: "Not attempted" };
      let callResult = { success: false, reason: "Not attempted" };
      let guardianLink = null;

      // CREATE SECURE GUARDIAN LINK AUTOMATICALLY.
      try {
        guardianLink = await guardianService.createLink(
          emergency.id,
          contact.id,
        );
      } catch (error) {
        console.error(
          `❌ Guardian link creation failed for contact ${contact.id}:`,
          error.message,
        );
      }

      const guardianUrl = guardianLink
        ? guardianService.buildGuardianUrl(guardianLink.token)
        : null;

      // This URL is what gets sent automatically. No SQL copy/paste is needed.

      const alertMessage = guardianUrl
        ? `🚨 SAFEHER SOS! ${user.name || "User"} needs help. Guardian: ${guardianUrl} | Maps: ${googleMapsLink}`
        : `🚨 SAFEHER SOS! ${user.name || "User"} needs help. Maps: ${googleMapsLink}`;

      if (guardianUrl) {
  console.log(`🔗 Guardian Link for ${contact.name}: ${guardianUrl}`);
}
      if (!contact.phone) {
        console.warn("⚠️ Contact has no phone number:", contact.id);
      } else {
        try {
          whatsappResult = await sendWhatsApp(
            contact.phone,
            alertMessage,
            user.name || "SafeHer User",
            guardianUrl || googleMapsLink,
          );
        } catch (error) {
          console.error("❌ WhatsApp exception:", error.message);
          whatsappResult = { success: false, reason: error.message };
        }

        if (whatsappResult.success) {
          whatsappSent++;
        } else {
          whatsappFailed++;
        }

        await updateGuardianLinkStatus(guardianLink, {
          whatsappStatus: whatsappResult.success ? "SENT" : "FAILED",
        });

        try {
          smsResult = await sendSMS(contact.phone, alertMessage);
        } catch (error) {
          console.error("❌ SMS exception:", error.message);
          smsResult = { success: false, reason: error.message };
        }

        if (smsResult.success) {
          smsSent++;
        } else {
          smsFailed++;
        }

        await updateGuardianLinkStatus(guardianLink, {
          smsStatus: smsResult.success ? "SENT" : "FAILED",
        });

        try {
          callResult = await makeVoiceCall(
            contact.phone,
            user.name || "a SafeHer user",
          );
        } catch (error) {
          console.error("❌ Voice call exception:", error.message);
          callResult = { success: false, reason: error.message };
        }

        if (callResult.success) {
          callsPlaced++;
        } else {
          callsFailed++;
        }

        await updateGuardianLinkStatus(guardianLink, {
          callStatus: callResult.success ? "SENT" : "FAILED",
        });
      }

      const contactNotified =
        whatsappResult.success || smsResult.success || callResult.success;

      if (contactNotified) {
        contactsNotified++;

        if (notification) {
          await notification.update({
            status: "SENT",
            sentAt: new Date(),
            message: alertMessage,
          });
        }
      } else {
        contactsFailed++;

        if (notification) {
          await notification.update({
            status: "FAILED",
            sentAt: null,
            message: alertMessage,
          });
        }
      }
    }

    const totalSent = whatsappSent + smsSent + callsPlaced;
    const totalFailed = whatsappFailed + smsFailed + callsFailed;

    console.log("\n📊 EMERGENCY ALERT SUMMARY");
    console.log(`   👥 Contacts: ${contacts.length}`);
    console.log(`   ✅ Contacts notified: ${contactsNotified}`);
    console.log(`   ❌ Contacts failed: ${contactsFailed}`);
    console.log(`   💬 WhatsApp: ${whatsappSent} sent, ${whatsappFailed} failed`);
    console.log(`   📩 SMS: ${smsSent} sent, ${smsFailed} failed`);
    console.log(`   📞 Calls: ${callsPlaced} placed, ${callsFailed} failed`);
    console.log(`   📊 Total channels sent: ${totalSent}`);
    console.log(`   📊 Total channels failed: ${totalFailed}`);

    if (whatsappSent > 0) {
      await guardianService.logEvent(
        emergency.id,
        "WHATSAPP_SENT",
        "WhatsApp notification sent",
      );
    }
    if (whatsappFailed > 0) {
      await guardianService.logEvent(
        emergency.id,
        "WHATSAPP_FAILED",
        "WhatsApp notification failed",
      );
    }
    if (smsSent > 0) {
      await guardianService.logEvent(
        emergency.id,
        "SMS_SENT",
        "SMS notification sent",
      );
    }
    if (smsFailed > 0) {
      await guardianService.logEvent(
        emergency.id,
        "SMS_FAILED",
        "SMS notification failed",
      );
    }
    if (callsPlaced > 0) {
      await guardianService.logEvent(
        emergency.id,
        "CALL_PLACED",
        "Voice call placed",
      );
    }
    if (callsFailed > 0) {
      await guardianService.logEvent(
        emergency.id,
        "CALL_FAILED",
        "Voice call failed",
      );
    }

    return {
      emergency,
      notifications: notificationRecords.length,
      contactsNotified,
      contactsFailed,
      whatsappSent,
      whatsappFailed,
      smsSent,
      smsFailed,
      callsPlaced,
      callsFailed,
      totalSent,
      totalFailed,
    };
  } catch (error) {
    console.error("❌ Error creating emergency:", error);
    throw error;
  }
};

/* =========================================================
   GET ALL EMERGENCIES
========================================================= */

const getAllEmergencies = async (userId) => {
  try {
    return await Emergency.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
  } catch (error) {
    console.error("❌ Error fetching emergencies:", error);
    throw error;
  }
};

/* =========================================================
   RESOLVE EMERGENCY
========================================================= */

const resolveEmergency = async (emergencyId, userId) => {
  try {
    const emergency = await Emergency.findOne({
      where: {
        id: emergencyId,
        userId,
        status: "ACTIVE",
      },
    });

    if (!emergency) {
      throw new Error("Emergency not found or already resolved");
    }

    emergency.status = "RESOLVED";
    emergency.endedAt = new Date();

    await emergency.save();

    await guardianService.logEvent(
      emergency.id,
      "EMERGENCY_RESOLVED",
      "Emergency resolved",
    );

    guardianService.forgetEmergency(emergency.id);

    if (io) {
      io.to(`guardian:${emergency.id}`).emit("emergency:resolved", {
        status: "RESOLVED",
        endedAt: emergency.endedAt,
      });
    }

    // Give the resolved event a chance to reach Guardian browsers before
    // closing their server-side sockets. No future location packet is
    // accepted anyway because sendLocation re-checks ACTIVE state.
    setTimeout(() => {
      if (io) {
        io.in(`guardian:${emergency.id}`).disconnectSockets(true);
      }
    }, 250);

    return emergency;
  } catch (error) {
    console.error("❌ Error resolving emergency:", error);
    throw error;
  }
};

module.exports = {
  createEmergency,
  getAllEmergencies,
  resolveEmergency,
  setIo,
};
