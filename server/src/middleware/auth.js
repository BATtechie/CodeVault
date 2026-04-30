import prisma from '../db/prisma.js';
import { sendError } from '../utils/http.js';
import { verifySessionToken } from '../utils/security.js';

const extractToken = (req) => {
  const cookieToken = req.cookies?.token;

  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  if (/^bearer\s+/i.test(authHeader)) {
    return authHeader.replace(/^bearer\s+/i, '').trim();
  }

  return authHeader.trim();
};

const loadSessionUser = async (token) => {
  const decoded = verifySessionToken(token);
  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      sessionVersion: true,
      rememberMeDefault: true,
      twoFactorEnabled: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
  });

  if (!user || user.sessionVersion !== decoded.sessionVersion) {
    return null;
  }

  const { sessionVersion: _sessionVersion, ...publicUser } = user;
  return publicUser;
};

export const authMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return sendError(res, {
        status: 401,
        message: 'Authentication required.',
      });
    }

    const user = await loadSessionUser(token);

    if (!user) {
      return sendError(res, {
        status: 401,
        message: 'Your session is no longer valid. Please sign in again.',
      });
    }

    req.user = user;
    return next();
  } catch (_error) {
    return sendError(res, {
      status: 401,
      message: 'Invalid or expired session.',
    });
  }
};

export const optionalAuthMiddleware = async (req, _res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    const user = await loadSessionUser(token);

    if (user) {
      req.user = user;
    }
  } catch (_error) {
    req.user = null;
  }

  return next();
};
