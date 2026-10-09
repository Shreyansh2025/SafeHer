const jwt = require("jsonwebtoken");
const adminService = require("../services/adminService");

const {
  normalizeEmail,
  validateLogin,
} = require("../utils/authValidation");

// =====================================================
// ADMIN LOGIN
// =====================================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // Validate required fields and email format
    const errors = validateLogin({
      email,
      password,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: Object.values(errors)[0],
        errors,
      });
    }

    if (!process.env.ADMIN_JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Admin authentication is not configured",
      });
    }

    // Verify credentials through the existing service
    const admin = await adminService.verifyAdmin(
      normalizeEmail(email),
      password
    );

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: "ADMIN",
      },
      process.env.ADMIN_JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: {
        admin,
        token,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    if (
      error.message?.includes("credentials are not configured")
    ) {
      return res.status(500).json({
        success: false,
        message: "Admin login is not configured on the server",
      });
    }

    if (
      error.message === "Invalid admin email or password"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Admin login failed due to a server error",
    });
  }
};

// =====================================================
// GET ALL ACTIVE EMERGENCIES
// =====================================================

const getAllActive = async (req, res) => {
  try {
    const emergencies = await adminService.findAllActive();

    return res.status(200).json({
      success: true,
      count: emergencies.length,
      data: emergencies,
    });
  } catch (error) {
    console.error("Fetch active emergencies error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch active emergencies",
    });
  }
};

// =====================================================
// GET ALL EMERGENCY HISTORY
// =====================================================

const getAllHistory = async (req, res) => {
  try {
    const { status, userId } = req.query || {};

    // Validate optional status filter
    const allowedStatuses = [
      "ACTIVE",
      "RESOLVED",
      "CANCELLED",
    ];

    if (
      status &&
      !allowedStatuses.includes(
        String(status).toUpperCase()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency status filter",
      });
    }

    // Validate optional user ID filter
    if (
      userId !== undefined &&
      (!/^\d+$/.test(String(userId)) ||
        Number(userId) < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID filter",
      });
    }

    const filters = {
      status: status
        ? String(status).toUpperCase()
        : undefined,
      userId: userId
        ? Number(userId)
        : undefined,
    };

    const emergencies = await adminService.findAll(filters);

    return res.status(200).json({
      success: true,
      count: emergencies.length,
      data: emergencies,
    });
  } catch (error) {
    console.error("Fetch emergency history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch emergency history",
    });
  }
};

// =====================================================
// GET ALL USERS
// =====================================================

const listUsers = async (req, res) => {
  try {
    const users = await adminService.findAllUsers();

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Fetch users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

module.exports = {
  login,
  getAllActive,
  getAllHistory,
  listUsers,
};