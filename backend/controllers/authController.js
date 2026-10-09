const {
  registerService,
  loginService,
  googleLoginService,
} = require("../services/authservice");

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
// LOGIN
// =====================================================

const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body || {};

    const result = await loginService(
      email,
      password
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
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

const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }
    const data = await googleLoginService(idToken);
    return res.status(200).json({ message: "Login successful", data });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
};