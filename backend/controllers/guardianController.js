const guardianService = require('../services/guardianService');

const getEmergency = async (req, res) => {
  try {
    const data = await guardianService.getGuardianEmergency(req.params.token);

    // Same answer for "bad token" and "expired token": reveal nothing.
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    res.set('Cache-Control', 'no-store');

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ Guardian fetch failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to load emergency'
    });
  }
};

module.exports = { getEmergency };
