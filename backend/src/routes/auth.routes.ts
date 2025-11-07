import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getCurrentUser, logout, checkInitialSetup, checkAuth } from '../controllers/authController';
import { protect } from '../middleware/auth.middleware';
import { authorizeMinLevel } from '../middleware/role.middleware';
import { updateUserRole, getAllUsers } from '../controllers/userController';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { 
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { 
    success: false,
    message: 'Too many requests. Please try again later.' 
  }
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

export default router;