import express from 'express';
import { register, login, getCurrentUser, logout, checkInitialSetup, checkAuth } from '../controllers/authController';
import { protect } from '../middleware/auth.middleware';
import { authorize, authorizeHierarchy } from '../middleware/role.middleware';
import { UserRole } from '../models/User';
import { updateUserRole, getAllUsers } from '../controllers/userController';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.get('/check', protect, checkAuth);

// Role-protected routes
// Only authenticated users with required roles can access these routes
router.post('/register', protect, register);

// User management routes with role-based access
router.get('/users', protect, authorizeHierarchy(UserRole.ADMIN), getAllUsers);
router.patch('/users/:id/role', protect, authorizeHierarchy(UserRole.SUPER_ADMIN), updateUserRole);
router.put('/users/:id/role', protect, authorizeHierarchy(UserRole.SUPER_ADMIN), updateUserRole);

// Special case: Allow first user registration without authentication
router.post('/initial-setup', register);
router.get('/initial-setup', checkInitialSetup);

export default router;