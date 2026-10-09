const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { User, LoginOtp } = require("../models/relation");
const { sendLoginOtpEmail } = require("./emailService");

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const makeError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const hashOtp = (challengeId, otp) => {
  const secret =
    process.env.OTP_HASH_SECRET ||
    process.env.JWT_SECRET;

  if (!secret) {
    throw makeError(
      "OTP security is not configured",
      500
    );
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`${challengeId}:${otp}`)
    .digest("hex");
};

const createLoginOtp = async (user) => {
  const existing = await LoginOtp.findOne({
    where: { userId: user.id },
  });

  const now = new Date();

  if (
    existing &&
    now.getTime() -
      new Date(existing.lastSentAt).getTime() <
      RESEND_COOLDOWN_MS
  ) {
    throw makeError(
      "Please wait 60 seconds before requesting another OTP",
      429
    );
  }

  const challengeId = crypto.randomUUID();
  const otp = String(
    crypto.randomInt(0, 1000000)
  ).padStart(6, "0");

  const expiresAt = new Date(
    now.getTime() + OTP_TTL_MS
  );

  const values = {
    userId: user.id,
    challengeId,
    otpHash: hashOtp(challengeId, otp),
    expiresAt,
    attempts: 0,
    lastSentAt: now,
  };

  let record;

  try {
    if (existing) {
      await existing.update(values);
      record = existing;
    } else {
      record = await LoginOtp.create(values);
    }

    await sendLoginOtpEmail({
      to: user.email,
      otp,
      expiresInMinutes: 10,
    });
  } catch (error) {
    if (record) {
      await record.destroy().catch(() => {});
    }

    console.error("Unable to send login OTP:", error.message);

    if (error.statusCode) throw error;

    throw makeError(
      "Unable to send the verification email. Please try again later.",
      503
    );
  }

  return {
    otpRequired: true,
    challengeId,
    expiresInSeconds: 600,
    emailHint: maskEmail(user.email),
  };
};

const maskEmail = (email) => {
  const [local, domain] = email.split("@");

  if (!local || !domain) return "";

  return `${local.slice(0, 2)}***@${domain}`;
};

const verifyLoginOtp = async (challengeId, otp) => {
  if (
    typeof challengeId !== "string" ||
    !challengeId.trim() ||
    typeof otp !== "string" ||
    !/^\d{6}$/.test(otp)
  ) {
    throw makeError(
      "Enter a valid six-digit OTP",
      400
    );
  }

  const record = await LoginOtp.findOne({
    where: { challengeId },
  });

  if (!record) {
    throw makeError(
      "Invalid or expired OTP. Please log in again.",
      401
    );
  }

  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    await record.destroy();

    throw makeError(
      "OTP has expired. Please log in again.",
      401
    );
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await record.destroy();

    throw makeError(
      "Too many attempts. Please log in again.",
      429
    );
  }

  const expected = Buffer.from(
    record.otpHash,
    "hex"
  );

  const actual = Buffer.from(
    hashOtp(challengeId, otp),
    "hex"
  );

  const matches =
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual);

  if (!matches) {
    record.attempts += 1;

    if (record.attempts >= MAX_ATTEMPTS) {
      await record.destroy();

      throw makeError(
        "Too many incorrect attempts. Please log in again.",
        429
      );
    }

    await record.save();

    throw makeError("Incorrect OTP", 401);
  }

  const user = await User.findByPk(record.userId);

  if (!user || user.role === "ADMIN") {
    await record.destroy();

    throw makeError(
      "Unable to verify this login",
      401
    );
  }

  if (!process.env.JWT_SECRET) {
    throw makeError(
      "Authentication is not configured",
      500
    );
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

  // OTP cannot be reused after successful verification
  await record.destroy();

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    token,
  };
};

module.exports = {
  createLoginOtp,
  verifyLoginOtp,
};