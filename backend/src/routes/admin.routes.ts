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
  triggerManualBackup,
  exportLogs
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
import {
  logAdminActivity,
  logUserManagement,
  logSystemManagement,
  logSecurityAction
} from '../middleware/adminActivity.middleware';

const router = express.Router();

// Apply authentication and admin role requirement to all routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'super_admin', 'root']));

// Admin stats
router.get('/stats', logAdminActivity({ action: 'view_stats', resource: 'admin_dashboard' }), getAdminStats);

// User management
router.get('/users', logUserManagement('view_users'), getAdminUsers);
router.post('/users', logUserManagement('create_user'), createAdminUser);
router.put('/users/:userId', logUserManagement('update_user'), updateAdminUser);
router.delete('/users/:userId', logUserManagement('delete_user'), deleteAdminUser);

// Activity logs
router.get('/logs', logAdminActivity({ action: 'view_logs', resource: 'activity_logs' }), getActivityLogs);
router.get('/export-logs', logAdminActivity({ action: 'export_logs', resource: 'activity_logs' }), exportLogs);
router.options('/export-logs', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Settings
router.get('/settings', logAdminActivity({ action: 'view_settings', resource: 'system_settings' }), getAdminSettings);
router.put('/settings/general', logSystemManagement('update_general_settings'), updateGeneralSettings);
router.put('/settings/security', logSecurityAction('update_security_settings'), updateSecuritySettings);
router.put('/settings/notifications', logSystemManagement('update_notification_settings'), updateNotificationSettings);
router.put('/settings/backup', logSystemManagement('update_backup_settings'), updateBackupSettings);

// Backup
router.post('/backup/manual', logSystemManagement('trigger_manual_backup'), triggerManualBackup);

// RBAC endpoints
router.get('/rbac/roles', logAdminActivity({ action: 'view_roles', resource: 'role_management' }), getRoles);
router.post('/rbac/roles', logSecurityAction('create_role'), createRole);
router.put('/rbac/roles/:roleId', logSecurityAction('update_role'), updateRole);
router.delete('/rbac/roles/:roleId', logSecurityAction('delete_role'), deleteRole);
router.get('/rbac/permissions', logAdminActivity({ action: 'view_permissions', resource: 'permission_management' }), getPermissions);
router.put('/rbac/users/:userId/roles', logSecurityAction('assign_user_roles'), assignRolesToUser);
router.get('/rbac/users/:userId/permissions', logAdminActivity({ action: 'view_user_permissions', resource: 'user_permissions' }), getUserPermissions);

export default router;