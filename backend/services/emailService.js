const nodemailer = require("nodemailer");

const getTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASS
  ) {
    throw new Error(
      "SMTP email configuration is incomplete"
    );
  }

  const port = Number(SMTP_PORT);

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure:
      process.env.SMTP_SECURE === "true" ||
      port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

const sendLoginOtpEmail = async ({
  to,
  otp,
  expiresInMinutes = 10,
}) => {
  if (!to || !/^\d{6}$/.test(String(otp))) {
    throw new Error("Valid email and six-digit OTP are required");
  }

  const transporter = getTransporter();

  const from =
    process.env.SMTP_FROM || process.env.SMTP_USER;

  const result = await transporter.sendMail({
    from: `"SafeHer" <${from}>`,
    to,
    subject: "Your SafeHer login verification code",
    text: [
      "Hello,",
      "",
      `Your SafeHer login verification code is: ${otp}`,
      "",
      `This code expires in ${expiresInMinutes} minutes.`,
      "Do not share this code with anyone.",
      "",
      "If you did not attempt to log in, you can ignore this email.",
      "",
      "SafeHer Team",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#29213B">
        <h2 style="color:#6D28D9">SafeHer</h2>
        <h3>Login verification</h3>
        <p>Use this code to complete your login:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#6D28D9;padding:16px 0">
          ${otp}
        </div>
        <p>This code expires in ${expiresInMinutes} minutes.</p>
        <p>Never share your verification code with anyone.</p>
        <p style="color:#777;font-size:12px">
          If you did not attempt to log in, ignore this email.
        </p>
      </div>
    `,
  });

  return {
    messageId: result.messageId,
  };
};

module.exports = {
  sendLoginOtpEmail,
};