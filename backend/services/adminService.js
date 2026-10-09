const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Emergency = require("../models/Emergency");

const {
  normalizeEmail,
} = require("../utils/authValidation");

// =====================================================
// VERIFY ADMIN CREDENTIALS
// =====================================================

const verifyAdmin = async (email, password) => {
  const adminEmail = process.env.ADMIN_EMAIL || "";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (
    !adminEmail.trim() ||
    typeof adminPassword !== "string" ||
    !adminPassword
  ) {
    const error = new Error(
      "Admin credentials are not configured"
    );
    error.statusCode = 500;
    throw error;
  }

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    const error = new Error(
      "Email and password are required"
    );
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = normalizeEmail(email);
  const configuredEmail = normalizeEmail(adminEmail);

  if (
    normalizedEmail !== configuredEmail ||
    password !== adminPassword
  ) {
    const error = new Error(
      "Invalid admin email or password"
    );
    error.statusCode = 401;
    throw error;
  }

  return {
    id: 1,
    name: "SafeHer Admin",
    email: configuredEmail,
    role: "ADMIN",
  };
};

// =====================================================
// GET ALL ACTIVE EMERGENCIES
// =====================================================

const findAllActive = async () => {
  return await Emergency.findAll({
    where: {
      status: "ACTIVE",
    },
    include: [
      {
        model: User,
        attributes: ["id", "name", "email", "phone"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

// =====================================================
// GET EMERGENCY HISTORY
// =====================================================

const findAll = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    const allowedStatuses = [
      "ACTIVE",
      "RESOLVED",
      "CANCELLED",
    ];

    const status = String(filters.status).toUpperCase();

    if (!allowedStatuses.includes(status)) {
      const error = new Error(
        "Invalid emergency status filter"
      );
      error.statusCode = 400;
      throw error;
    }

    where.status = status;
  }

  if (filters.userId !== undefined &&
      filters.userId !== null &&
      filters.userId !== "") {
    const userId = Number(filters.userId);

    if (!Number.isSafeInteger(userId) || userId < 1) {
      const error = new Error("Invalid user ID filter");
      error.statusCode = 400;
      throw error;
    }

    where.userId = userId;
  }

  return await Emergency.findAll({
    where,
    include: [
      {
        model: User,
        attributes: ["id", "name", "email", "phone"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

// =====================================================
// GET ALL USERS
// =====================================================

const findAllUsers = async () => {
  return await User.findAll({
    attributes: [
      "id",
      "name",
      "email",
      "phone",
      "createdAt",
    ],
    order: [["createdAt", "DESC"]],
  });
};

module.exports = {
  verifyAdmin,
  findAllActive,
  findAll,
  findAllUsers,
};