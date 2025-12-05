import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { 
  assignPermissionsToRole,
  revokePermissionsFromRole,
  getUserEffectivePermissions,
  bulkUpdatePermissions
} from '../controllers/permissionManagementController';

const router = express.Router();

router.post('/roles/:roleId/assign', protect, requirePermission('permissions.manage'), assignPermissionsToRole);
router.post('/roles/:roleId/revoke', protect, requirePermission('permissions.manage'), revokePermissionsFromRole);
router.get('/users/:userId/effective', protect, requirePermission('permissions.manage'), getUserEffectivePermissions);
router.post('/bulk-update', protect, requirePermission('permissions.manage'), bulkUpdatePermissions);

export default router;
