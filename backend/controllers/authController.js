const {
  registerService,
  loginService,
  googleLoginService,
} = require("../services/authservice");

const {
  verifyLoginOtp: verifyLoginOtpService,
} = require("../services/loginOtpService");

// =====================================================
// REGISTER
// =====================================================

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
    } = req.body || {};

    const result = await registerService(
      name,
      email,
      phone,
      password
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    console.error("Registration error:", error);

    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode >= 500
          ? "Registration failed due to a server error"
          : error.message,
    });
  }
};

// =====================================================
// LOGIN — PASSWORD VERIFICATION + OTP REQUEST
// =====================================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const result = await loginService(
      email,
      password
    );

    return res.status(200).json({
      success: true,
      message: result.otpRequired
        ? "OTP sent to your registered email"
        : "Login successful",
      data: result,
    });
  } catch (error) {
    console.error("Login error:", error);

    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode >= 500
          ? "Login failed due to a server error"
          : error.message,
    });
  }
};

// =====================================================
// VERIFY LOGIN OTP
// =====================================================

const verifyLoginOtp = async (req, res) => {
  try {
    const {
      challengeId,
      otp,
    } = req.body || {};

    const result = await verifyLoginOtpService(
      challengeId,
      otp
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified. Login successful",
      data: result,
    });
  } catch (error) {
    console.error("Login OTP verification error:", error);

    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode >= 500
          ? "OTP verification failed due to a server error"
          : error.message,
    });
  }
};

// =====================================================
// GOOGLE LOGIN — EXISTING FLOW
// =====================================================

const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body || {};

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "idToken is required",
      });
    }

    const data = await googleLoginService(idToken);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data,
    });
  } catch (error) {
    console.error("Google login error:", error);

    return res.status(401).json({
      success: false,
      message: "Google login failed",
    });
  }
};

module.exports = {
  register,
  login,
  verifyLoginOtp,
  googleLogin,
};