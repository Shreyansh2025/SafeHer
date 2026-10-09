const EMAIL_REGEX =
  /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

const NAME_REGEX =
  /^[\p{L}\p{M}]+(?:[.'-][\p{L}\p{M}]+)*\.?(?:\s+[\p{L}\p{M}]+(?:[.'-][\p{L}\p{M}]+)*\.?)*$/u;

const PHONE_INPUT_REGEX = /^\+?[0-9\s().-]+$/;


// Normalization helpers
const normalizeEmail = (email) =>
  email.trim().toLowerCase();

const normalizeName = (name) =>
  name.trim().replace(/\s+/g, " ");

const normalizePhone = (phone) =>
  phone.replace(/\D/g, "");

const utf8ByteLength = (value) =>
  Buffer.byteLength(value, "utf8");


// Name validation
const validateName = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return "Full name is required";
  }

  const name = normalizeName(value);

  if (name.length < 2) {
    return "Full name must contain at least 2 characters";
  }

  if (name.length > 80) {
    return "Full name must be 80 characters or fewer";
  }

  if (!NAME_REGEX.test(name)) {
    return "Name can contain letters, spaces, apostrophes, periods and hyphens only";
  }

  return null;
};


// Email validation
const validateEmail = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return "Email is required";
  }

  const email = normalizeEmail(value);

  if (email.length > 254) {
    return "Email must be 254 characters or fewer";
  }

  const [localPart, domain] = email.split("@");

  if (
    !EMAIL_REGEX.test(email) ||
    !localPart ||
    localPart.length > 64 ||
    !domain ||
    domain.split(".").some(
      (label) => !label || label.length > 63
    ) ||
    domain.split(".").at(-1).length < 2
  ) {
    return "Enter a valid email address";
  }

  return null;
};


// Phone validation
const validatePhone = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return "Phone number is required";
  }

  const phone = value.trim();

  if (!PHONE_INPUT_REGEX.test(phone)) {
    return "Phone number can contain digits, an optional +, spaces, parentheses and hyphens only";
  }

  const digits = normalizePhone(phone);

  if (digits.length < 10 || digits.length > 15) {
    return "Phone number must contain 10 to 15 digits, including country code when used";
  }

  return null;
};


// Password validation for new registrations
const validatePassword = (value) => {
  if (typeof value !== "string" || !value) {
    return "Password is required";
  }

  if (Array.from(value).length < 8) {
    return "Password must contain at least 8 characters";
  }

  if (utf8ByteLength(value) > 72) {
    return "Password must not exceed 72 UTF-8 bytes";
  }

  if (!/[A-Z]/.test(value)) {
    return "Password must include an uppercase letter";
  }

  if (!/[a-z]/.test(value)) {
    return "Password must include a lowercase letter";
  }

  if (!/[0-9]/.test(value)) {
    return "Password must include a number";
  }

  if (!/[^A-Za-z0-9\s]/.test(value)) {
    return "Password must include a special character";
  }

  if (/\s/.test(value)) {
    return "Password must not contain spaces";
  }

  return null;
};


// Registration validation
const validateRegistration = ({
  name,
  email,
  phone,
  password,
} = {}) => {
  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    phone: validatePhone(phone),
    password: validatePassword(password),
  };

  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message))
  );
};


// Login validation
const validateLogin = ({ email, password } = {}) => {
  const errors = {
    email: validateEmail(email),
  };

  if (
    typeof password !== "string" ||
    !password.trim()
  ) {
    errors.password = "Password is required";
  }

  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message))
  );
};


module.exports = {
  normalizeEmail,
  normalizeName,
  normalizePhone,
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateRegistration,
  validateLogin,
};