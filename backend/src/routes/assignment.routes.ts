import express from 'express';
import {
  getUserAssignments,
  createAssignment,
  removeAssignment,
  checkUserAccess
} from '../controllers/assignmentController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { requirePermission } from '../middleware/permission.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get user assignments
router.get('/users/:userId/assignments', requirePermission('users.view'), getUserAssignments);

// Check user access to specific resource
router.get('/users/:userId/access/:resourceType/:resourceId', requirePermission('users.view'), checkUserAccess);

// Create assignment (admin only)
router.post('/assignments', requirePermission('admin.access'), createAssignment);

// Remove assignment (admin only)
router.delete('/assignments/:assignmentId', requirePermission('admin.access'), removeAssignment);

export default router;