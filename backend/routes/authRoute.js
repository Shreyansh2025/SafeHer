const express = require("express");

const router = express.Router();

const {
  register,
  login,
  googleLogin,
  verifyLoginOtp,
} = require("../controllers/authController");

// Registration and login
router.post("/register", register);
router.post("/login", login);

// Login OTP verification
router.post("/login/verify-otp", verifyLoginOtp);

// Google authentication
router.post("/google", googleLogin);

module.exports = router;