const EMAIL_REGEX =
  /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

const NAME_REGEX =
  /^[\p{L}\p{M}]+(?:[.'-][\p{L}\p{M}]+)*\.?(?:\s+[\p{L}\p{M}]+(?:[.'-][\p{L}\p{M}]+)*\.?)*$/u;

const PHONE_INPUT_REGEX = /^\+?[0-9\s().-]+$/;


// Normalize inputs
export const normalizeName = (name = '') =>
  name.trim().replace(/\s+/g, ' ');

export const normalizeEmail = (email = '') =>
  email.trim().toLowerCase();

export const normalizePhone = (phone = '') =>
  phone.replace(/\D/g, '');


// UTF-8 byte length for password compatibility
export const utf8ByteLength = (value = '') =>
  Array.from(value).reduce((total, character) => {
    const codePoint = character.codePointAt(0);

    if (codePoint <= 0x7f) return total + 1;
    if (codePoint <= 0x7ff) return total + 2;
    if (codePoint <= 0xffff) return total + 3;

    return total + 4;
  }, 0);


// Name validation
export const validateName = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return 'Full name is required';
  }

  const name = normalizeName(value);

  if (name.length < 2) {
    return 'Full name must contain at least 2 characters';
  }

  if (name.length > 80) {
    return 'Full name must be 80 characters or fewer';
  }

  if (!NAME_REGEX.test(name)) {
    return 'Name can contain letters, spaces, apostrophes, periods and hyphens only';
  }

  return null;
};


// Email validation
export const validateEmail = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return 'Email is required';
  }

  const email = normalizeEmail(value);

  if (email.length > 254) {
    return 'Email must be 254 characters or fewer';
  }

  const [localPart, domain] = email.split('@');
  const domainLabels = domain ? domain.split('.') : [];

  if (
    !EMAIL_REGEX.test(email) ||
    !localPart ||
    localPart.length > 64 ||
    domainLabels.length < 2 ||
    domainLabels.some(
      (label) => !label || label.length > 63
    ) ||
    domainLabels[domainLabels.length - 1]?.length < 2
  ) {
    return 'Enter a valid email address';
  }

  return null;
};

// Phone validation
export const validatePhone = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return 'Phone number is required';
  }
  const phone = value.trim();

  if (!PHONE_INPUT_REGEX.test(phone)) {
    return 'Use digits and optional +, spaces, parentheses or hyphens only';
  }
  const digits = normalizePhone(phone);

  if (digits.length < 10 || digits.length > 15) {
    return 'Phone number must contain 10 to 15 digits';
  }

  return null;
};

// Password validation for registration
export const validatePassword = (value) => {
  if (typeof value !== 'string' || !value) {
    return 'Password is required';
  }

  if (Array.from(value).length < 8) {
    return 'Password must contain at least 8 characters';
  }

  if (utf8ByteLength(value) > 72) {
    return 'Password must not exceed 72 UTF-8 bytes';
  }

  if (!/[A-Z]/.test(value)) {
    return 'Password must include an uppercase letter';
  }

  if (!/[a-z]/.test(value)) {
    return 'Password must include a lowercase letter';
  }

  if (!/[0-9]/.test(value)) {
    return 'Password must include a number';
  }

  if (!/[^A-Za-z0-9\s]/.test(value)) {
    return 'Password must include a special character';
  }

  if (/\s/.test(value)) {
    return 'Password must not contain spaces';
  }

  return null;
};


// Registration validation
export const validateRegistration = ({
  name,
  email,
  phone,
  password,
  confirmPassword,
} = {}) => {
  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    phone: validatePhone(phone),
    password: validatePassword(password),
  };

  if (
    typeof confirmPassword !== 'string' ||
    !confirmPassword
  ) {
    errors.confirmPassword =
      'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword =
      'Passwords do not match';
  }

  return Object.fromEntries(
    Object.entries(errors).filter(
      ([, message]) => Boolean(message)
    )
  );
};

// Login validation
export const validateLogin = ({
  email,
  password,
} = {}) => {
  const errors = {
    email: validateEmail(email),
  };

  if (
    typeof password !== 'string' ||
    !password.trim()
  ) {
    errors.password = 'Password is required';
  }

  return Object.fromEntries(
    Object.entries(errors).filter(
      ([, message]) => Boolean(message)
    )
  );
};