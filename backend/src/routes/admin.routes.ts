import express from 'express';
import {
  getAdminStats,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getActivityLogs,
  getAdminSettings,
  updateGeneralSettings,
  updateSecuritySettings,
  updateNotificationSettings,
  updateBackupSettings,
  triggerManualBackup
} from '../controllers/adminController';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  assignRolesToUser,
  getUserPermissions
} from '../controllers/rbacController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = express.Router();

// Apply authentication and admin role requirement to all routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'super_admin', 'root']));

// Admin stats
router.get('/stats', getAdminStats);

// User management
router.get('/users', getAdminUsers);
router.post('/users', createAdminUser);
router.put('/users/:userId', updateAdminUser);
router.delete('/users/:userId', deleteAdminUser);

// Activity logs
router.get('/logs', getActivityLogs);

// Settings
router.get('/settings', getAdminSettings);
router.put('/settings/general', updateGeneralSettings);
router.put('/settings/security', updateSecuritySettings);
router.put('/settings/notifications', updateNotificationSettings);
router.put('/settings/backup', updateBackupSettings);

// Backup
router.post('/backup/manual', triggerManualBackup);

// RBAC endpoints
router.get('/rbac/roles', getRoles);
router.post('/rbac/roles', createRole);
router.put('/rbac/roles/:roleId', updateRole);
router.delete('/rbac/roles/:roleId', deleteRole);
router.get('/rbac/permissions', getPermissions);
router.put('/rbac/users/:userId/roles', assignRolesToUser);
router.get('/rbac/users/:userId/permissions', getUserPermissions);

export default router;