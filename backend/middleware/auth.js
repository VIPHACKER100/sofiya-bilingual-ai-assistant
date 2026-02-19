/**
 * SOFIYA Auth Middleware
 * Phase 12.3: JWT authentication, OAuth, role-based access
 */

import jwt from 'jsonwebtoken';
import { createClient } from 'pg';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

/**
 * Verifies JWT and attaches user to request
 */
export function authMiddleware(options = {}) {
  const { required = true } = options;

  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      if (required) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { id: decoded.sub || decoded.userId, role: decoded.role || 'user' };
      next();
    } catch (error) {
      if (required) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      req.user = null;
      next();
    }
  };
}

/**
 * Requires specific role
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Generates JWT for user
 */
export function generateToken(userId, role = 'user', expiresIn = '24h') {
  return jwt.sign(
    { sub: userId, userId, role },
    JWT_SECRET,
    { expiresIn }
  );
}
