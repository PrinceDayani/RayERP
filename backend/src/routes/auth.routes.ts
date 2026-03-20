import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getCurrentUser, logout, checkInitialSetup, checkAuth, changePassword, refreshAccessToken, getMySessions, revokeMySession, getUserSessions, revokeUserSession, revokeAllUserSessions, getAllActiveSessions } from '../controllers/authController';
import { protect, requireAdminOrRoot } from '../middleware/auth.middleware';
import { authorizeMinLevel } from '../middleware/role.middleware';
import { updateUserRole, getAllUsers } from '../controllers/userController';
import { validateCsrfToken } from '../middleware/csrf.middleware';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 5, // 5 attempts per 10 seconds per user
  message: { 
    success: false,
    message: 'Too many authentication attempts. Please try again in 10 seconds.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development for easier testing
    return process.env.NODE_ENV === 'development';
  },
  keyGenerator: (req) => {
    // Use email from request body for login attempts, fallback to IP
    const email = req.body?.email;
    if (email && typeof email === 'string') {
      return `auth:${email}`;
    }
    return `auth:${req.ip || 'unknown'}`;
  },
});

const generalLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 50, // 50 requests per 10 seconds
  message: { 
    success: false,
    message: 'Too many requests. Please try again in 10 seconds.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', authLimiter, login);
router.post('/logout', generalLimiter, logout);
router.post('/refresh', generalLimiter, refreshAccessToken);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.get('/check', protect, checkAuth);

// Session management - User's own sessions
router.get('/sessions/my', protect, generalLimiter, getMySessions);
router.delete('/sessions/my/:sessionId', protect, generalLimiter, revokeMySession);

// Session management - Admin only
router.get('/sessions/all', protect, requireAdminOrRoot, generalLimiter, getAllActiveSessions);
router.get('/sessions/user/:userId', protect, requireAdminOrRoot, generalLimiter, getUserSessions);
router.delete('/sessions/:sessionId', protect, requireAdminOrRoot, generalLimiter, revokeUserSession);
router.delete('/sessions/user/:userId/all', protect, requireAdminOrRoot, generalLimiter, revokeAllUserSessions);

router.post('/register', protect, authLimiter, register);

router.get('/users', protect, authorizeMinLevel(80), getAllUsers);
router.patch('/users/:id/role', protect, authorizeMinLevel(90), updateUserRole);
router.put('/users/:id/role', protect, authorizeMinLevel(90), updateUserRole);

router.post('/initial-setup', authLimiter, register);
router.get('/initial-setup', generalLimiter, checkInitialSetup);

router.put('/change-password', protect, generalLimiter, validateCsrfToken, changePassword);

export default router;