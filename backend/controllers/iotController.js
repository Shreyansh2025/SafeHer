const emergencyService = require("../services/emergencyService");

const triggerIotSOS = async (req, res) => {
  try {
    const deviceKey = req.headers["x-device-key"];

    if (!deviceKey || deviceKey !== process.env.IOT_DEVICE_KEY) {
      return res.status(401).json({
        success: false,
        message: "Invalid IoT device key",
      });
    }

    const { userId, latitude, longitude, address } = req.body;

    if (!userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId, latitude and longitude are required",
      });
    }

    const result = await emergencyService.createEmergency(
      userId,
      latitude,
      longitude,
      address || "IoT device location",
      "IOT"
    );

    return res.status(201).json({
      success: true,
      message: "IoT SOS triggered successfully",
      emergency: result,
    });
  } catch (error) {
    if (error.code === "ACTIVE_SOS_EXISTS") {
      return res.status(409).json({
        success: false,
        message: "SOS is already active.",
        emergency: error.emergency,
      });
    }

    if (
      error.code === "INVALID_COORDINATES" ||
      error.code === "GUARDIAN_WEB_URL_MISSING"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("IoT SOS error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to trigger IoT SOS",
    });
  }
};

module.exports = { triggerIotSOS };