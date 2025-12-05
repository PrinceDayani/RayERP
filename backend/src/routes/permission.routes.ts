/**
 * Permission Management Routes
 * Provides endpoints for managing permissions
 */

import { Router } from 'express';
import {
  getAllPermissions,
  getPermissionCategories,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionStats,
  bulkCreatePermissions
} from '../controllers/permissionController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all permissions (requires roles.view permission)
router.get('/', requirePermission('roles.view'), getAllPermissions);

// Get permission categories
router.get('/categories', requirePermission('roles.view'), getPermissionCategories);

// Get permission statistics
router.get('/stats', requirePermission('roles.view'), getPermissionStats);

// Create new permission (requires roles.manage permission)
router.post('/', requirePermission('roles.manage'), createPermission);

// Bulk create permissions
router.post('/bulk', requirePermission('roles.manage'), bulkCreatePermissions);

// Update permission
router.put('/:id', requirePermission('roles.manage'), updatePermission);

// Delete permission
router.delete('/:id', requirePermission('roles.delete'), deletePermission);

export default router;
