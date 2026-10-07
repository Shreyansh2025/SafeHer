const { Vonage } = require("@vonage/server-sdk");

let vonageClient = null;
let vonageVoiceClient = null;

/* =========================================================
   INITIALIZE VONAGE
   Used for SMS + Voice
========================================================= */

const initializeVonage = () => {
  const apiKey = process.env.VONAGE_API_KEY;

  const apiSecret = process.env.VONAGE_API_SECRET;

  const from = process.env.VONAGE_FROM;

  const applicationId = process.env.VONAGE_APPLICATION_ID;

  const privateKey = process.env.VONAGE_PRIVATE_KEY;

  console.log("\n🔍 Checking Vonage configuration...");

  console.log("   VONAGE_API_KEY:", apiKey ? "FOUND" : "MISSING");

  console.log("   VONAGE_API_SECRET:", apiSecret ? "FOUND" : "MISSING");

  console.log("   VONAGE_FROM:", from || "MISSING");

  console.log("   VONAGE_APPLICATION_ID:", applicationId ? "FOUND" : "MISSING");

  console.log("   VONAGE_PRIVATE_KEY:", privateKey ? "FOUND" : "MISSING");

  if (!apiKey || !apiSecret || !from) {
    console.error("❌ Vonage configuration incomplete");

    vonageClient = null;

    return null;
  }

  try {
    /* =====================================================
           SMS CLIENT
        ===================================================== */

    vonageClient = new Vonage({
      apiKey,
      apiSecret,
    });

    console.log("✅ Vonage initialized successfully");

    console.log("📨 Vonage SMS Sender:", from);

    /* =====================================================
           VOICE CLIENT
        ===================================================== */

    if (applicationId && privateKey) {
      vonageVoiceClient = new Vonage({
        applicationId,
        privateKey: privateKey
      });

      console.log("📞 Vonage Voice initialized successfully");
    } else {
      console.warn(
        "⚠️ Vonage Voice configuration missing - voice calls disabled",
      );

      vonageVoiceClient = null;
    }

    return vonageClient;
  } catch (error) {
    console.error("❌ Vonage initialization failed:", error.message);

    vonageClient = null;
    vonageVoiceClient = null;

    return null;
  }
};

/* =========================================================
   FORMAT PHONE NUMBER
========================================================= */

const formatPhoneNumber = (phone) => {
  if (!phone) {
    throw new Error("Phone number is empty");
  }

  let formattedPhone = String(phone)
    .trim()
    .replace(/[\s\-().]/g, "");

  // Already E.164
  // Example: +918871296211

  if (formattedPhone.startsWith("+")) {
    return formattedPhone;
  }

  // Indian number without +
  // Example: 918871296211

  if (formattedPhone.startsWith("91") && formattedPhone.length === 12) {
    return `+${formattedPhone}`;
  }

  // Indian number with leading zero
  // Example: 08871296211

  if (formattedPhone.startsWith("0")) {
    formattedPhone = formattedPhone.substring(1);
  }

  // Indian 10-digit number
  // Example: 8871296211

  if (formattedPhone.length === 10) {
    return `+91${formattedPhone}`;
  }

  throw new Error(`Invalid phone number format: ${phone}`);
};

/* =========================================================
   SEND SMS USING VONAGE
========================================================= */

const sendSMS = async (to, message) => {
  if (!vonageClient) {
    console.log("⚠️ Vonage not initialized - SMS not sent");

    return {
      success: false,

      provider: "vonage",

      channel: "sms",

      reason: "Vonage not configured",
    };
  }

  let formattedPhone = String(to);

  try {
    formattedPhone = formatPhoneNumber(to);

    const vonageFrom = process.env.VONAGE_FROM;

    if (!vonageFrom) {
      throw new Error("VONAGE_FROM is missing from .env");
    }

    // Vonage SMS API expects international
    // number without the leading +

    const destination = formattedPhone.replace(/^\+/, "");

    console.log("\n📤 Sending SMS through Vonage...");

    console.log("   From:", vonageFrom);

    console.log("   To:", formattedPhone);

    const response = await vonageClient.sms.send({
      to: destination,

      from: vonageFrom,

      text: String(message),
    });

    console.log("📨 Raw Vonage response:", JSON.stringify(response, null, 2));

    const messages =
      response?.messages || (Array.isArray(response) ? response : []);

    const result = messages[0];

    if (!result) {
      console.error("❌ Vonage returned no message result");

      return {
        success: false,

        provider: "vonage",

        channel: "sms",

        reason: "No message result returned by Vonage",
      };
    }

    console.log("📨 Vonage message result:", JSON.stringify(result, null, 2));

    // Vonage status 0 = successful submission

    if (String(result.status) === "0") {
      console.log("✅ Vonage SMS submitted successfully!");

      console.log(
        "   Message ID:",
        result["message-id"] || result.messageId || "N/A",
      );

      return {
        success: true,

        provider: "vonage",

        channel: "sms",

        messageId: result["message-id"] || result.messageId,
      };
    }

    console.error("❌ Vonage rejected SMS");

    console.error("   Status:", result.status);

    console.error(
      "   Error:",
      result["error-text"] ||
        result.errorText ||
        result.message ||
        "Unknown Vonage error",
    );

    return {
      success: false,

      provider: "vonage",

      channel: "sms",

      status: result.status,

      reason:
        result["error-text"] ||
        result.errorText ||
        result.message ||
        "Vonage rejected SMS",
    };
  } catch (error) {
    console.error("\n❌ Vonage SMS sending failed");

    console.error("   To:", formattedPhone);

    console.error("   Error:", error.message);

    const vonageResponse = error?.response || null;

    if (vonageResponse) {
      console.error(
        "📨 Vonage error response:",
        JSON.stringify(vonageResponse, null, 2),
      );
    }

    const failedMessage = vonageResponse?.messages?.[0];

    if (failedMessage) {
      console.error("🚨 ACTUAL VONAGE ERROR");

      console.error("   Status:", failedMessage.status);

      console.error(
        "   Error:",
        failedMessage["error-text"] ||
          failedMessage.errorText ||
          failedMessage.message ||
          "Unknown",
      );

      console.error("   Full message:", JSON.stringify(failedMessage, null, 2));
    }

    return {
      success: false,

      provider: "vonage",

      channel: "sms",

      status: failedMessage?.status,

      reason:
        failedMessage?.["error-text"] ||
        failedMessage?.errorText ||
        failedMessage?.message ||
        error.message,
    };
  }
};

/* =========================================================
   MAKE VOICE CALL USING VONAGE
========================================================= */

const makeVoiceCall = async (to, userName) => {
  if (!vonageVoiceClient) {
    console.log("⚠️ Vonage Voice not initialized - call not placed");

    return {
      success: false,

      provider: "vonage",

      channel: "voice",

      reason: "Vonage Voice not configured",
    };
  }

  try {
    const formattedPhone = formatPhoneNumber(to);

    // Vonage Voice expects the destination
    // number in international format.

    const destination = formattedPhone.replace(/^\+/, "");

    const fromNumber = process.env.VONAGE_VOICE_FROM || process.env.VONAGE_FROM;

    if (!fromNumber) {
      throw new Error("VONAGE_VOICE_FROM or VONAGE_FROM is missing from .env");
    }

    const voiceFrom = String(fromNumber).replace(/^\+/, "");

    const name = userName || "a SafeHer user";

    const message =
      `Hello. This is SafeHer emergency alert. ` +
      `${name} may need immediate assistance. ` +
      `Please check the emergency notification.`;

    console.log("\n📞 Making Voice call through Vonage...");

    console.log("   From:", voiceFrom);

    console.log("   To:", destination);

    console.log("   Message:", message);

    const response = await vonageVoiceClient.voice.createOutboundCall({
      to: [
        {
          type: "phone",
          number: destination,
        },
      ],

      from: {
        type: "phone",
        number: voiceFrom,
      },

      ncco: [
        {
          action: "talk",
          text: message,
          language: "en-US",
        },
      ],
    });

    console.log("✅ Vonage Voice call started successfully!");

    console.log("   Response:", JSON.stringify(response, null, 2));

    return {
      success: true,

      provider: "vonage",

      channel: "voice",

      callId: response?.uuid,

      status: response?.status || "started",
    };
  } catch (error) {
    console.error("\n❌ Vonage Voice call failed");

    console.error("   To:", to);

    console.error("   Error:", error.message);

    if (error?.response) {
      console.error(
        "📨 Vonage Voice error response:",
        JSON.stringify(error.response, null, 2),
      );
    }

    return {
      success: false,

      provider: "vonage",

      channel: "voice",

      reason: error.message,
    };
  }
};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  initializeVonage,
  formatPhoneNumber,
  sendSMS,
  makeVoiceCall
};
