const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { createLoginOtp } = require("./loginOtpService");
const { Op } = require("sequelize");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

const {
  normalizeEmail,
  normalizeName,
  normalizePhone,
  validateRegistration,
  validateLogin,
} = require("../utils/authValidation");

require("dotenv").config();

const authError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// =====================================================
// REGISTER
// =====================================================

const registerService = async (
  name,
  email,
  phone,
  password
) => {
  // Server-side validation
  const errors = validateRegistration({
    name,
    email,
    phone,
    password,
  });

  if (Object.keys(errors).length > 0) {
    throw authError(Object.values(errors)[0], 400);
  }

  // Normalize user input
  const normalizedName = normalizeName(name);
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  // Keep the admin account separate
  const adminEmail = normalizeEmail(
    process.env.ADMIN_EMAIL || ""
  );

  if (adminEmail && normalizedEmail === adminEmail) {
    throw authError(
      "This email is reserved for admin use",
      403
    );
  }

  // Check duplicate email or phone
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    },
  });

  if (existingUser) {
    if (
      normalizeEmail(existingUser.email) ===
      normalizedEmail
    ) {
      throw authError("Email already exists", 409);
    }

    if (
      normalizePhone(String(existingUser.phone || "")) ===
      normalizedPhone
    ) {
      throw authError(
        "Phone number already exists",
        409
      );
    }
  }

  if (!process.env.JWT_SECRET) {
    throw authError(
      "Authentication is not configured on the server",
      500
    );
  }

  // Hash password before storing it
  const hashedPassword = await bcrypt.hash(
    password,
    10
  );

  let user;

  try {
    user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role: "USER",
    });
  } catch (error) {
    // Handle concurrent duplicate registration attempts
    if (
      error.name === "SequelizeUniqueConstraintError"
    ) {
      throw authError(
        "An account with this email or phone number already exists",
        409
      );
    }

    throw error;
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

// =====================================================
// LOGIN
// =====================================================

const loginService = async (email, password) => {
  // Validate required fields and email
  const errors = validateLogin({
    email,
    password,
  });

  if (Object.keys(errors).length > 0) {
    throw authError(Object.values(errors)[0], 400);
  }

  const normalizedEmail = normalizeEmail(email);

  // Prevent admin login through the normal user endpoint
  const adminEmail = normalizeEmail(
    process.env.ADMIN_EMAIL || ""
  );

  if (adminEmail && normalizedEmail === adminEmail) {
    throw authError(
      "Admin account must use the admin login",
      403
    );
  }

  const user = await User.findOne({
    where: {
      email: normalizedEmail,
    },
  });

  // Use the same message for unknown users and wrong passwords
  if (!user || user.role === "ADMIN") {
    throw authError(
      "Invalid email or password",
      401
    );
  }
  if (!user.password) {
    throw new Error("This account uses Google login. Please continue with Google.");
}
  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordValid) {
    throw authError(
      "Invalid email or password",
      401
    );
  }

  if (!process.env.JWT_SECRET) {
    throw authError(
      "Authentication is not configured on the server",
      500
    );
  }
  
  // Send OTP instead of issuing JWT immediately
return await createLoginOtp(user);

  // const token = jwt.sign(
  //   {
  //     id: user.id,
  //     email: user.email,
  //     role: user.role,
  //   },
  //   process.env.JWT_SECRET,
  //   { expiresIn: "1h" }
  // );

  // return {
  //   user: {
  //     id: user.id,
  //     name: user.name,
  //     phone: user.phone,
  //     email: user.email,
  //     role: user.role,
  //   },
  //   token,
  // };
};

const googleLoginService = async (idToken) => {
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
        throw new Error("Google email not verified");
    }

    let user = await User.findOne({ where: { email: payload.email } });

    if (!user) {
        user = await User.create({
            name: payload.name || payload.email.split("@")[0],
            email: payload.email,
            phone: null,
            password: null,
            role: "USER",
        });
        await generateUserQR(user);
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    return {
        user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
        },
        token,
    };
};

module.exports = {
  registerService,
  loginService,
  googleLoginService,
};