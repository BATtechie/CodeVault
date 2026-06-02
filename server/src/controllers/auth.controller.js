import bcrypt from 'bcrypt';
import prisma from '../db/prisma.js';
import { sendError, sendSuccess } from '../utils/http.js';
import {
  buildTwoFactorSetup,
  clearSessionCookie,
  consumeBackupCode,
  createSessionToken,
  generateBackupCodes,
  hashBackupCodes,
  normalizeEmail,
  setSessionCookie,
  verifyTwoFactorCode,
} from '../utils/security.js';
import { validateSchema, authSchemas } from '../utils/validation.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  rememberMeDefault: true,
  twoFactorEnabled: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
};

const validatePassword = (password) => {
  if (String(password || '').length < 8) {
    return 'Password must be at least 8 characters long.';
  }

  return null;
};

const validateEmail = (email) => {
  if (!EMAIL_REGEX.test(email)) {
    return 'Please provide a valid email address.';
  }

  return null;
};

const buildAuthResponse = (user) => {
  const { sessionVersion: _sessionVersion, ...publicUser } = user;

  return {
    user: publicUser,
  };
};

const isSchemaMismatchError = (error) =>
  error?.code === 'P2021' || error?.code === 'P2022';

const signUserIn = (res, user, rememberMe) => {
  const token = createSessionToken(user, { rememberMe });
  setSessionCookie(res, token, rememberMe);
};

const authController = {
  async signup(req, res) {
    try {
      // Validate input against schema
      const validation = validateSchema(req.body, authSchemas.signup);
      if (!validation.valid) {
        return sendError(res, {
          status: 400,
          message: validation.error,
        });
      }

      const email = normalizeEmail(req.body.email);
      const password = req.body.password;
      const name = String(req.body.name || '').trim();
      const rememberMe = Boolean(req.body.rememberMe);

      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        return sendError(res, {
          status: 409,
          message: 'An account with that email already exists.',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          rememberMeDefault: rememberMe,
          lastLoginAt: new Date(),
        },
        select: {
          ...publicUserSelect,
          sessionVersion: true,
        },
      });

      signUserIn(res, user, rememberMe);

      return sendSuccess(res, {
        status: 201,
        message: 'Account created successfully.',
        data: buildAuthResponse(user),
      });
    } catch (error) {
      console.error('Signup error:', error);
      return sendError(res, {
        status: 500,
        message: isSchemaMismatchError(error)
          ? 'The database schema is out of date. Run the latest Prisma migrations and try again.'
          : 'We could not create your account right now.',
      });
    }
  },

  async login(req, res) {
    try {
      const email = normalizeEmail(req.body.email);
      const password = req.body.password;
      const providedRememberMe = req.body.rememberMe;
      const twoFactorCode = String(req.body.twoFactorCode || '').trim();

      if (!email || !password) {
        return sendError(res, {
          status: 400,
          message: 'Email and password are required.',
        });
      }

      const userWithPassword = await prisma.user.findUnique({
        where: { email },
        select: {
          ...publicUserSelect,
          password: true,
          sessionVersion: true,
          twoFactorSecret: true,
          twoFactorBackupCodes: true,
        },
      });

      if (!userWithPassword) {
        return sendError(res, {
          status: 401,
          message: 'Invalid email or password.',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);

      if (!isPasswordValid) {
        return sendError(res, {
          status: 401,
          message: 'Invalid email or password.',
        });
      }

      if (userWithPassword.twoFactorEnabled) {
        if (!twoFactorCode) {
          return sendSuccess(res, {
            message: 'Two-factor authentication required.',
            data: {
              twoFactorRequired: true,
            },
          });
        }

        const isValidTotp = verifyTwoFactorCode(
          userWithPassword.twoFactorSecret,
          twoFactorCode,
        );

        if (!isValidTotp) {
          const remainingBackupCodes = await consumeBackupCode(
            twoFactorCode.toLowerCase(),
            userWithPassword.twoFactorBackupCodes,
          );

          if (!remainingBackupCodes) {
            return sendError(res, {
              status: 401,
              message: 'Invalid two-factor code.',
            });
          }

          await prisma.user.update({
            where: { id: userWithPassword.id },
            data: {
              twoFactorBackupCodes: remainingBackupCodes,
            },
          });
        }
      }

      const rememberMe =
        typeof providedRememberMe === 'boolean'
          ? providedRememberMe
          : userWithPassword.rememberMeDefault;

      const user = await prisma.user.update({
        where: { id: userWithPassword.id },
        data: {
          lastLoginAt: new Date(),
          rememberMeDefault: rememberMe,
        },
        select: {
          ...publicUserSelect,
          sessionVersion: true,
        },
      });

      signUserIn(res, user, rememberMe);

      return sendSuccess(res, {
        message: 'Login successful.',
        data: buildAuthResponse(user),
      });
    } catch (error) {
      console.error('Login error:', error);
      return sendError(res, {
        status: 500,
        message: isSchemaMismatchError(error)
          ? 'The database schema is out of date. Run the latest Prisma migrations and try again.'
          : 'We could not sign you in right now.',
      });
    }
  },

  async getProfile(req, res) {
    try {
      const [snippetCount, teamCount, unreadNotifications] = await prisma.$transaction([
        prisma.snippet.count({
          where: { userId: req.user.id },
        }),
        prisma.teamMember.count({
          where: { userId: req.user.id },
        }),
        prisma.notification.count({
          where: {
            userId: req.user.id,
            readAt: null,
          },
        }),
      ]);

      return sendSuccess(res, {
        data: {
          user: req.user,
          summary: {
            snippetCount,
            teamCount,
            unreadNotifications,
          },
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to load your profile.',
      });
    }
  },

  async updateProfile(req, res) {
    try {
      const nextEmail = req.body.email ? normalizeEmail(req.body.email) : undefined;
      const name = req.body.name;
      const rememberMeDefault =
        typeof req.body.rememberMeDefault === 'boolean'
          ? req.body.rememberMeDefault
          : undefined;

      if (nextEmail) {
        const emailError = validateEmail(nextEmail);

        if (emailError) {
          return sendError(res, { status: 400, message: emailError });
        }

        if (nextEmail !== req.user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: nextEmail },
            select: { id: true },
          });

          if (existingUser) {
            return sendError(res, {
              status: 409,
              message: 'That email is already in use.',
            });
          }
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(nextEmail !== undefined && { email: nextEmail }),
          ...(name !== undefined && { name: String(name).trim() || null }),
          ...(rememberMeDefault !== undefined && { rememberMeDefault }),
        },
        select: publicUserSelect,
      });

      return sendSuccess(res, {
        message: 'Profile updated successfully.',
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return sendError(res, {
        status: 500,
        message: 'We could not update your profile right now.',
      });
    }
  },

  async setupTwoFactor(req, res) {
    try {
      const { secret, otpauthUrl } = buildTwoFactorSetup(req.user.email);
      const backupCodes = generateBackupCodes();
      const hashedBackupCodes = await hashBackupCodes(
        backupCodes.map((code) => code.toLowerCase()),
      );

      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          twoFactorSecret: secret,
          twoFactorEnabled: false,
          twoFactorBackupCodes: hashedBackupCodes,
        },
      });

      return sendSuccess(res, {
        message: 'Two-factor authentication setup generated.',
        data: {
          secret,
          otpauthUrl,
          backupCodes,
        },
      });
    } catch (error) {
      console.error('Setup 2FA error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to start two-factor setup.',
      });
    }
  },

  async enableTwoFactor(req, res) {
    try {
      const code = String(req.body.code || '').trim();
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          ...publicUserSelect,
          sessionVersion: true,
          twoFactorSecret: true,
        },
      });

      if (!user?.twoFactorSecret) {
        return sendError(res, {
          status: 400,
          message: 'Two-factor setup has not been started yet.',
        });
      }

      if (!verifyTwoFactorCode(user.twoFactorSecret, code)) {
        return sendError(res, {
          status: 400,
          message: 'Invalid verification code.',
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          twoFactorEnabled: true,
          sessionVersion: { increment: 1 },
        },
        select: {
          ...publicUserSelect,
          sessionVersion: true,
        },
      });

      signUserIn(res, updatedUser, updatedUser.rememberMeDefault);

      return sendSuccess(res, {
        message: 'Two-factor authentication enabled.',
        data: buildAuthResponse(updatedUser),
      });
    } catch (error) {
      console.error('Enable 2FA error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to enable two-factor authentication.',
      });
    }
  },

  async disableTwoFactor(req, res) {
    try {
      const code = String(req.body.code || '').trim();
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          ...publicUserSelect,
          sessionVersion: true,
          twoFactorSecret: true,
          twoFactorBackupCodes: true,
        },
      });

      if (!user?.twoFactorEnabled) {
        return sendError(res, {
          status: 400,
          message: 'Two-factor authentication is not enabled.',
        });
      }

      const isValidTotp = verifyTwoFactorCode(user.twoFactorSecret, code);
      const remainingBackupCodes = isValidTotp
        ? user.twoFactorBackupCodes
        : await consumeBackupCode(code.toLowerCase(), user.twoFactorBackupCodes);

      if (!isValidTotp && !remainingBackupCodes) {
        return sendError(res, {
          status: 400,
          message: 'Invalid verification code.',
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: [],
          sessionVersion: { increment: 1 },
        },
        select: {
          ...publicUserSelect,
          sessionVersion: true,
        },
      });

      signUserIn(res, updatedUser, updatedUser.rememberMeDefault);

      return sendSuccess(res, {
        message: 'Two-factor authentication disabled.',
        data: buildAuthResponse(updatedUser),
      });
    } catch (error) {
      console.error('Disable 2FA error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to disable two-factor authentication.',
      });
    }
  },

  async logout(_req, res) {
    try {
      clearSessionCookie(res);

      return sendSuccess(res, {
        message: 'Logged out successfully.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      return sendError(res, {
        status: 500,
        message: 'We could not sign you out right now.',
      });
    }
  },
};

export default authController;
