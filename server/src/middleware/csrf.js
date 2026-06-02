/**
 * CSRF protection middleware using double-submit cookie pattern
 * Protects against Cross-Site Request Forgery attacks
 */

import crypto from 'crypto';
import { sendError } from '../utils/http.js';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_NAME = '__csrf';

/**
 * Generate a new CSRF token
 */
export const generateCsrfToken = () => {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
};

/**
 * Set CSRF token in cookie
 */
export const setCsrfCookie = (res, token) => {
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by client to include in headers
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    path: '/',
  });
};

/**
 * CSRF middleware - validates tokens on state-changing requests
 */
export const csrfMiddleware = (req, res, next) => {
  const method = req.method.toUpperCase();

  // Only validate on state-changing requests
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return next();
  }

  // Allow public endpoints to skip CSRF (like signup/login)
  const publicPaths = ['/api/auth/signup', '/api/auth/login', '/api/auth/logout'];
  if (publicPaths.includes(req.path)) {
    // Still generate a token if not present
    if (!req.cookies[CSRF_COOKIE_NAME]) {
      setCsrfCookie(res, generateCsrfToken());
    }
    return next();
  }

  // Verify CSRF token for authenticated requests
  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken) {
    return sendError(res, {
      status: 403,
      message: 'CSRF token is missing in cookie.',
    });
  }

  if (!headerToken) {
    return sendError(res, {
      status: 403,
      message: 'CSRF token is missing in request header.',
    });
  }

  // Tokens must match (double-submit cookie pattern)
  if (cookieToken !== headerToken) {
    return sendError(res, {
      status: 403,
      message: 'CSRF token validation failed.',
    });
  }

  return next();
};

/**
 * Generate CSRF token middleware - returns token for client to use
 */
export const generateCsrfTokenMiddleware = (req, res, next) => {
  if (!req.cookies[CSRF_COOKIE_NAME]) {
    setCsrfCookie(res, generateCsrfToken());
  }
  next();
};
