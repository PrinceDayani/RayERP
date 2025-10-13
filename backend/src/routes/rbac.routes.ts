import express from 'express';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  createPermission,
  assignRolesToUser,
  getUserPermissions,
  toggleRoleStatus
} from '../controllers/rbacController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Roles management
router.get('/roles', requirePermission('manage_roles'), getRoles);
router.post('/roles', requirePermission('manage_roles'), createRole);
router.put('/roles/:roleId', requirePermission('manage_roles'), updateRole);
router.delete('/roles/:roleId', requirePermission('manage_roles'), deleteRole);

// Permissions management
router.get('/permissions', requirePermission('manage_roles'), getPermissions);
router.post('/permissions', requirePermission('manage_roles'), createPermission);

// User role assignment
router.put('/users/:userId/roles', requirePermission('manage_roles'), assignRolesToUser);
router.get('/users/:userId/permissions', requirePermission('view_users'), getUserPermissions);
router.patch('/roles/:roleId/toggle-status', requirePermission('manage_roles'), toggleRoleStatus);

export default router;