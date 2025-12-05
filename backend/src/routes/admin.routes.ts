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
import { requirePermission } from '../middleware/rbac.middleware';
import {
  logAdminActivity,
  logUserManagement,
  logSystemManagement,
  logSecurityAction
} from '../middleware/adminActivity.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Admin stats
router.get('/stats', requirePermission('admin.view'), logAdminActivity({ action: 'view_stats', resource: 'admin_dashboard' }), getAdminStats);

// User management
router.get('/users', requirePermission('users.manage'), logUserManagement('view_users'), getAdminUsers);
router.post('/users', requirePermission('users.manage'), logUserManagement('create_user'), createAdminUser);
router.put('/users/:userId', requirePermission('users.manage'), logUserManagement('update_user'), updateAdminUser);
router.delete('/users/:userId', requirePermission('users.delete'), logUserManagement('delete_user'), deleteAdminUser);

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
router.get('/settings', requirePermission('system.view'), logAdminActivity({ action: 'view_settings', resource: 'system_settings' }), getAdminSettings);
router.put('/settings/general', requirePermission('system.manage'), logSystemManagement('update_general_settings'), updateGeneralSettings);
router.put('/settings/security', requirePermission('system.manage'), logSecurityAction('update_security_settings'), updateSecuritySettings);
router.put('/settings/notifications', requirePermission('system.manage'), logSystemManagement('update_notification_settings'), updateNotificationSettings);
router.put('/settings/backup', requirePermission('system.manage'), logSystemManagement('update_backup_settings'), updateBackupSettings);

// Backup
router.post('/backup/manual', requirePermission('system.manage'), logSystemManagement('trigger_manual_backup'), triggerManualBackup);

// RBAC endpoints
router.get('/rbac/roles', requirePermission('roles.view'), logAdminActivity({ action: 'view_roles', resource: 'role_management' }), getRoles);
router.post('/rbac/roles', requirePermission('roles.manage'), logSecurityAction('create_role'), createRole);
router.put('/rbac/roles/:roleId', requirePermission('roles.manage'), logSecurityAction('update_role'), updateRole);
router.delete('/rbac/roles/:roleId', requirePermission('roles.delete'), logSecurityAction('delete_role'), deleteRole);
router.get('/rbac/permissions', requirePermission('roles.view'), logAdminActivity({ action: 'view_permissions', resource: 'permission_management' }), getPermissions);
router.put('/rbac/users/:userId/roles', requirePermission('roles.manage'), logSecurityAction('assign_user_roles'), assignRolesToUser);
router.get('/rbac/users/:userId/permissions', requirePermission('users.view'), logAdminActivity({ action: 'view_user_permissions', resource: 'user_permissions' }), getUserPermissions);

export default router;