const jwt = require("jsonwebtoken");
const adminService = require("../services/adminService");

// ADMIN LOGIN

const login = async (req, res) => {
  try {

    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await adminService.verifyAdmin(
      email,
      password
    );

    if (!process.env.ADMIN_JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Admin JWT secret is not configured",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
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

    return res.status(401).json({
      success: false,
      message: error.message,
    });

  }
};
//get all active emergency
const getAllActive = async (req, res) => {
  try {
    const emergencies =
      await adminService.findAllActive();

    return res.status(200).json({
      success: true,
      count: emergencies.length,
      data: emergencies,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET ALL EMERGENCY HISTORY

const getAllHistory = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      userId: req.query.userId,
    };

    const emergencies =
      await adminService.findAll(filters);

    return res.status(200).json({
      success: true,
      count: emergencies.length,
      data: emergencies,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL USERS

const listUsers = async (req, res) => {
  try {
    const users =
      await adminService.findAllUsers();

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports={login,getAllActive,getAllHistory,listUsers}