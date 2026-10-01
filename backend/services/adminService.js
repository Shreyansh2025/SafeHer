const User = require("../models/User");
const Emergency = require("../models/Emergency");
const admin = require("../models/Admin")

// Hardcoded admin credentials
const ADMIN_EMAIL = "admin@safeher.com";
const ADMIN_PASSWORD = "admin123";

// Admin Login
const verifyAdmin = async (email, password) => {
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    throw new Error("Invalid admin email or password");
  }

  return {
    id: 1,
    name: "SafeHer Admin",
    email: ADMIN_EMAIL,
    role: "ADMIN",
  };
};

// Get all ACTIVE emergencies
const findAllActive = async () => {
  const emergencies = await Emergency.findAll({
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

  return emergencies;
};


// Get all emergency history
const findAll = async (filters = {}) => {
  const where = {};

  // Filter by status
  if (filters.status) {
    where.status = filters.status;
  }

  // Filter by user
  if (filters.userId) {
    where.userId = filters.userId;
  }

  const emergencies = await Emergency.findAll({
    where,
    include: [
      {
        model: User,
        attributes: ["id", "name", "email", "phone"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return emergencies;
};

// Get all users
const findAllUsers = async () => {
  const users = await User.findAll({
    attributes: [
      "id",
      "name",
      "email",
      "phone",
      "createdAt",
    ],
    order: [["createdAt", "DESC"]],
  });

  return users;
};

module.exports={verifyAdmin,findAllActive,findAll,findAllUsers}