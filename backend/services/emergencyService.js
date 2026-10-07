const {
  Emergency,
  EmergencyContact,
  Notification,
  User,
} = require("../models/relation");

const guardianService = require("./guardianService");

const { sendWhatsApp } = require("./twilioService");

const { sendSMS ,makeVoiceCall} = require("./vonageService");

/* =========================================================
   GUARDIAN WEB HELPERS
   (set from server.js so we can notify guardian browsers)
========================================================= */

let io = null;

const setIo = (ioInstance) => {
  io = ioInstance;
};

const guardianBaseUrl = () =>
  (process.env.GUARDIAN_WEB_URL || "").replace(/\/+$/, "");
/* =========================================================
   CREATE EMERGENCY
========================================================= */

const createEmergency = async (userId, latitude, longitude, address) => {
  try {
    // ---------------------------------------------------------
    // GET USER
    // ---------------------------------------------------------

    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // ---------------------------------------------------------
    // CREATE EMERGENCY
    // ---------------------------------------------------------

    const emergency = await Emergency.create({
      userId,
      latitude,
      longitude,
      address,
    });

    await guardianService.logEvent(emergency.id, "SOS_TRIGGERED", "SOS triggered");
    await guardianService.logEvent(emergency.id, "EMERGENCY_CREATED", "Emergency created");

    // ---------------------------------------------------------
    // GET EMERGENCY CONTACTS
    // ---------------------------------------------------------

    const contacts = await EmergencyContact.findAll({
      where: {
        userId,
      },
    });

    // ---------------------------------------------------------
    // CREATE NOTIFICATION RECORDS
    // ---------------------------------------------------------

    const notificationData = contacts.map((contact) => ({
      emergencyId: emergency.id,
      contactId: contact.id,
      message: `URGENT SOS! I need help. Location: ${latitude}, ${longitude}`,
      type: "SOS_ALERT",
      status: "PENDING",
    }));

    let notificationRecords = [];

    if (notificationData.length > 0) {
      notificationRecords = await Notification.bulkCreate(notificationData);
    }

    // ---------------------------------------------------------
    // GOOGLE MAPS LINK
    // ---------------------------------------------------------

    const googleMapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

    // ---------------------------------------------------------
    // MESSAGE
    // ---------------------------------------------------------

    const message = `SAFEHER SOS! ${user.name || "User"} needs help. Location: ${googleMapsLink}`;

    // ---------------------------------------------------------
    // DELIVERY COUNTERS
    // ---------------------------------------------------------

    let whatsappSent = 0;
    let whatsappFailed = 0;

    let smsSent = 0;
    let smsFailed = 0;

    let callsPlaced = 0;
    let callsFailed = 0;

    let contactsNotified = 0;
    let contactsFailed = 0;

    // ---------------------------------------------------------
    // SEND ALERTS
    // ---------------------------------------------------------

    for (const contact of contacts) {
      const notification = notificationRecords.find(
        (record) => record.contactId === contact.id,
      );

      let whatsappResult = {
        success: false,
        reason: "Not attempted",
      };

      let smsResult = {
        success: false,
        reason: "Not attempted",
      };

      let callResult = {
        success: false,
        reason: "Not attempted",
      };

      // -----------------------------------------------------
      // GUARDIAN LINK (one secure link per contact)
      // Falls back to the Google Maps link if anything fails,
      // so the SOS alert is never blocked by Guardian Web.
      // -----------------------------------------------------

      let guardianLink = null;
      let guardianUrl = googleMapsLink;

      if (guardianBaseUrl()) {
        try {
          guardianLink = await guardianService.createLink(
            emergency.id,
            contact.id,
          );

          guardianUrl = `${guardianBaseUrl()}/e/${guardianLink.token}`;
        } catch (error) {
          console.error("⚠️ Guardian link failed, using Maps link:", error.message);
        }
      }

      // -----------------------------------------------------
      // INVALID PHONE
      // -----------------------------------------------------

      if (!contact.phone) {
        console.warn("⚠️ Contact has no phone number:", contact.id);
      } else {
        // -------------------------------------------------
        // WHATSAPP
        // -------------------------------------------------

        try {
          whatsappResult = await sendWhatsApp(
            contact.phone,
            message,
            user.name || "SafeHer User",
            guardianUrl,
          );
        } catch (error) {
          console.error("❌ WhatsApp exception:", error.message);

          whatsappResult = {
            success: false,
            reason: error.message,
          };
        }

        if (whatsappResult.success) {
          whatsappSent++;
        } else {
          whatsappFailed++;
        }

        // -------------------------------------------------
        // SMS
        // -------------------------------------------------

        // try {
        //   smsResult = await sendSMS(contact.phone, message);
        // } catch (error) {
        //   console.error("❌ SMS exception:", error.message);

        //   smsResult = {
        //     success: false,
        //     reason: error.message,
        //   };
        // }

        // if (smsResult.success) {
        //   smsSent++;
        // } else {
        //   smsFailed++;
        // }

        // -------------------------------------------------
        // VOICE CALL
        // -------------------------------------------------

        try {
          callResult = await makeVoiceCall(
            contact.phone,
            user.name || "a SafeHer user",
          );
        } catch (error) {
          console.error("❌ Voice call exception:", error.message);

          callResult = {
            success: false,
            reason: error.message,
          };
        }

        if (callResult.success) {
          callsPlaced++;
        } else {
          callsFailed++;
        }
      }

      // -----------------------------------------------------
      // UPDATE NOTIFICATION STATUS
      // SENT = at least one channel succeeded
      // FAILED = all three channels failed
      // -----------------------------------------------------

      const contactNotified =
        whatsappResult.success || smsResult.success || callResult.success;

      if (contactNotified) {
        contactsNotified++;

        if (notification) {
          await notification.update({
            status: "SENT",
            sentAt: new Date(),
          });
        }
      } else {
        contactsFailed++;

        if (notification) {
          await notification.update({
            status: "FAILED",
            sentAt: null,
          });
        }
      }

      // -----------------------------------------------------
      // SAVE CHANNEL STATUS FOR GUARDIAN PAGE
      // -----------------------------------------------------

      if (guardianLink) {
        try {
          await guardianLink.update({
            whatsappStatus: whatsappResult.success ? "SENT" : "FAILED",
            smsStatus: smsResult.success ? "SENT" : "NOT_AVAILABLE",
            callStatus: callResult.success ? "SENT" : "FAILED",
          });
        } catch (error) {
          console.error("⚠️ Could not save channel status:", error.message);
        }
      }
    }

    // ---------------------------------------------------------
    // TOTALS
    // ---------------------------------------------------------

    const totalSent = whatsappSent + smsSent + callsPlaced;

    const totalFailed = whatsappFailed + smsFailed + callsFailed;

    // ---------------------------------------------------------
    // LOG SUMMARY
    // ---------------------------------------------------------

    console.log("\n📊 EMERGENCY ALERT SUMMARY");

    console.log(`   👥 Contacts: ${contacts.length}`);

    console.log(`   ✅ Contacts notified: ${contactsNotified}`);

    console.log(`   ❌ Contacts failed: ${contactsFailed}`);

    console.log(
      `   💬 WhatsApp: ${whatsappSent} sent, ${whatsappFailed} failed`,
    );

    console.log(`   📩 SMS: ${smsSent} sent, ${smsFailed} failed`);

    console.log(`   📞 Calls: ${callsPlaced} placed, ${callsFailed} failed`);

    console.log(`   📊 Total channels sent: ${totalSent}`);

    console.log(`   📊 Total channels failed: ${totalFailed}`);

    // ---------------------------------------------------------
    // TIMELINE EVENTS
    // ---------------------------------------------------------

    if (whatsappSent > 0) {
      await guardianService.logEvent(emergency.id, "WHATSAPP_SENT", "WhatsApp notification sent");
    }
    if (whatsappFailed > 0) {
      await guardianService.logEvent(emergency.id, "WHATSAPP_FAILED", "WhatsApp notification failed");
    }
    if (callsPlaced > 0) {
      await guardianService.logEvent(emergency.id, "CALL_PLACED", "Voice call placed");
    }
    if (callsFailed > 0) {
      await guardianService.logEvent(emergency.id, "CALL_FAILED", "Voice call failed");
    }

    // ---------------------------------------------------------
    // RETURN
    // ---------------------------------------------------------

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
    const emergencies = await Emergency.findAll({
      where: {
        userId,
      },

      order: [["createdAt", "DESC"]],
    });

    return emergencies;
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
        userId: userId,
      },
    });

    if (!emergency) {
      throw new Error("Emergency not found");
    }

    emergency.status = "RESOLVED";

    emergency.endedAt = new Date();

    await emergency.save();

    await guardianService.logEvent(emergency.id, "EMERGENCY_RESOLVED", "Emergency resolved");

    guardianService.forgetEmergency(emergency.id);

    if (io) {
      io.to(`guardian:${emergency.id}`).emit("emergency:resolved", {
        status: "RESOLVED",
        endedAt: emergency.endedAt,
      });
    }

    return emergency;
  } catch (error) {
    console.error("❌ Error resolving emergency:", error);

    throw error;
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  createEmergency,

  getAllEmergencies,

  resolveEmergency,

  setIo,
};
