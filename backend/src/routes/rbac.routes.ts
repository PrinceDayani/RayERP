import express from 'express';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  bulkDeleteRoles,
  getPermissions,
  createPermission,
  assignRolesToUser,
  getUserPermissions,
  toggleRoleStatus
} from '../controllers/rbacController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Roles management - Only Root can manage roles
router.get('/roles', getRoles);
router.post('/roles', createRole);
router.post('/roles/bulk-delete', bulkDeleteRoles);
router.put('/roles/:roleId', updateRole);
router.delete('/roles/:roleId', deleteRole);
router.patch('/roles/:roleId/toggle-status', toggleRoleStatus);

// Permissions management - Only Root can manage permissions
router.get('/permissions', getPermissions);
router.post('/permissions', createPermission);

// User role assignment - Only Root can assign roles
router.put('/users/:userId/role', assignRolesToUser);
router.get('/users/:userId/permissions', getUserPermissions);

export default router;