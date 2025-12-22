import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getCurrentUser, logout, checkInitialSetup, checkAuth, changePassword } from '../controllers/authController';
import { protect } from '../middleware/auth.middleware';
import { authorizeMinLevel } from '../middleware/role.middleware';
import { updateUserRole, getAllUsers } from '../controllers/userController';

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
  keyGenerator: (req) => {
    // Use email from request body for login attempts, fallback to IP
    return req.body?.email || req.ip || 'unknown';
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

// Protected routes
router.get('/me', protect, getCurrentUser);
router.get('/check', protect, checkAuth);

router.post('/register', protect, authLimiter, register);

router.get('/users', protect, authorizeMinLevel(80), getAllUsers);
router.patch('/users/:id/role', protect, authorizeMinLevel(90), updateUserRole);
router.put('/users/:id/role', protect, authorizeMinLevel(90), updateUserRole);

router.post('/initial-setup', authLimiter, register);
router.get('/initial-setup', generalLimiter, checkInitialSetup);

router.put('/change-password', protect, generalLimiter, changePassword);

export default router;