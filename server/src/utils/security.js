import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_DIGITS = 6;
const TOTP_PERIOD_SECONDS = 30;
const SESSION_COOKIE_NAME = 'token';
const SESSION_ISSUER = 'CodeVault';
const SHORT_SESSION_MS = 12 * 60 * 60 * 1000;
const REMEMBER_ME_MS = 30 * 24 * 60 * 60 * 1000;

const ensureJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return process.env.JWT_SECRET;
};

const encodeBase32 = (buffer) => {
  let output = '';
  let bits = 0;
  let value = 0;

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
};

const decodeBase32 = (secret) => {
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (const char of secret.replace(/=+$/g, '').toUpperCase()) {
    const index = BASE32_ALPHABET.indexOf(char);

    if (index === -1) {
      continue;
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

const generateHotp = (secret, counter) => {
  const key = decodeBase32(secret);
  const buffer = Buffer.alloc(8);
  const normalizedCounter = BigInt(counter);

  buffer.writeUInt32BE(Number((normalizedCounter >> 32n) & 0xffffffffn), 0);
  buffer.writeUInt32BE(Number(normalizedCounter & 0xffffffffn), 4);

  const digest = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
};

const compareSecurely = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export const createSessionToken = (user, options = {}) => {
  const rememberMe = Boolean(options.rememberMe);

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionVersion: user.sessionVersion,
      rememberMe,
    },
    ensureJwtSecret(),
    {
      expiresIn: rememberMe ? '30d' : '12h',
      issuer: SESSION_ISSUER,
    },
  );
};

export const verifySessionToken = (token) =>
  jwt.verify(token, ensureJwtSecret(), { issuer: SESSION_ISSUER });

export const getSessionDurationMs = (rememberMe) =>
  rememberMe ? REMEMBER_ME_MS : SHORT_SESSION_MS;

export const getCookieOptions = (rememberMe = false) => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: getSessionDurationMs(rememberMe),
    path: '/',
  };
};

export const setSessionCookie = (res, token, rememberMe = false) =>
  res.cookie(SESSION_COOKIE_NAME, token, getCookieOptions(rememberMe));

export const clearSessionCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
};

export const generateTwoFactorSecret = () => encodeBase32(crypto.randomBytes(20));

export const buildTwoFactorSetup = (email) => {
  const secret = generateTwoFactorSecret();
  const label = encodeURIComponent(`${SESSION_ISSUER}:${email}`);
  const issuer = encodeURIComponent(SESSION_ISSUER);
  const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD_SECONDS}`;

  return {
    secret,
    otpauthUrl,
  };
};

export const verifyTwoFactorCode = (secret, input, options = {}) => {
  const sanitizedInput = String(input || '').replace(/\s+/g, '');
  const allowedWindow = options.window ?? 1;

  if (!secret || !/^\d{6}$/.test(sanitizedInput)) {
    return false;
  }

  const currentStep = Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS);

  for (let offset = -allowedWindow; offset <= allowedWindow; offset += 1) {
    const candidate = generateHotp(secret, currentStep + offset);

    if (compareSecurely(candidate, sanitizedInput)) {
      return true;
    }
  }

  return false;
};

export const generateBackupCodes = () =>
  Array.from({ length: 8 }, () => {
    const left = String(crypto.randomInt(1000, 10000));
    const right = String(crypto.randomInt(1000, 10000));
    return `${left}-${right}`;
  });

export const hashBackupCodes = async (codes) =>
  Promise.all(codes.map((code) => bcrypt.hash(code, 10)));

export const consumeBackupCode = async (input, hashedCodes) => {
  const candidate = String(input || '').trim().toLowerCase();

  if (!candidate) {
    return null;
  }

  for (let index = 0; index < hashedCodes.length; index += 1) {
    const hash = hashedCodes[index];

    if (await bcrypt.compare(candidate, hash)) {
      return hashedCodes.filter((_, currentIndex) => currentIndex !== index);
    }
  }

  return null;
};
