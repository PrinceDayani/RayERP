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
  toggleRoleStatus,
  initializePermissions
} from '../controllers/rbacController';
import { reduceRolePermissions, getUsersByRoleLevel } from '../controllers/rolePermissionController';
import { authenticateToken, protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { authorizeAboveLevel } from '../middleware/role.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Roles management - Root always has access, others need permission
router.get('/roles', requirePermission('roles.view'), getRoles);
router.post('/roles', requirePermission('roles.create'), createRole);
router.post('/roles/bulk-delete', requirePermission('roles.delete'), bulkDeleteRoles);
router.get('/roles/:roleId', requirePermission('roles.view'), async (req, res) => {
  try {
    const { Role } = await import('../models/Role');
    const role = await Role.findById(req.params.roleId);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch role', error });
  }
});
router.post('/roles/:roleId', requirePermission('roles.edit'), updateRole);
router.put('/roles/:roleId', requirePermission('roles.edit'), updateRole);
router.patch('/roles/:roleId/toggle-status', requirePermission('roles.edit'), toggleRoleStatus);
router.delete('/roles/:roleId', requirePermission('roles.delete'), deleteRole);

// Permissions management - Root always has access, others need permission
router.get('/permissions', requirePermission('permissions.view'), getPermissions);
router.post('/permissions', requirePermission('permissions.create'), createPermission);
router.post('/permissions/initialize', async (req, res) => {
  try {
    const result = await initializePermissions();
    res.json({ success: true, message: 'Permissions initialized', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to initialize permissions', error });
  }
});

// User role assignment - Only Root can assign roles
router.put('/users/:userId/role', assignRolesToUser);
router.get('/users/:userId/permissions', getUserPermissions);

// High-level role management (level > 80)
router.post('/roles/:roleId/reduce-permissions', authorizeAboveLevel(80), reduceRolePermissions);
router.get('/users/by-level', authorizeAboveLevel(80), getUsersByRoleLevel);

export default router;