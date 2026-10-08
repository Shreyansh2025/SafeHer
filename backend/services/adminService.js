const User = require("../models/User");
const Emergency = require("../models/Emergency");

// Admin Login
const verifyAdmin = async (email, password) => {

  const adminEmail = (process.env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();

  const adminPassword = process.env.ADMIN_PASSWORD;

  // Admin credentials must exist
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Admin credentials are not configured"
    );
  }

  const normalizedEmail = email
    .trim()
    .toLowerCase();

  if (
    normalizedEmail !== adminEmail ||
    password !== adminPassword
  ) {
    throw new Error(
      "Invalid admin email or password"
    );
  }

  return {
    id: 1,
    name: "SafeHer Admin",
    email: adminEmail,
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