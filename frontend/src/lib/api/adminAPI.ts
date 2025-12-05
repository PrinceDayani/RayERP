import { apiClient } from '../api';
import axios from "axios";

const ADMIN_API_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || process.env.NEXT_PUBLIC_API_URL;

export const adminApi = axios.create({
  baseURL: `${ADMIN_API_URL}/admin`,
  withCredentials: true,
});


// Types
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  systemAlerts: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  status: string;
  details: string;
  ipAddress: string;
}

export interface AdminGeneralSettings {
  companyName: string;
  supportEmail: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
}

export interface AdminSecuritySettings {
  requireMfa: boolean;
  passwordComplexity: string;
  sessionTimeout: string;
  maxLoginAttempts: string;
  allowPasswordReset: boolean;
}

export interface AdminNotificationSettings {
  emailNotifications: boolean;
  systemAlerts: boolean;
  userActivityAlerts: boolean;
  maintenanceAlerts: boolean;
}

export interface AdminBackupSettings {
  autoBackup: boolean;
  backupFrequency: string;
  retentionPeriod: string;
  lastBackupDate: string;
  backupLocation: string;
}

export interface AdminSettings {
  general: AdminGeneralSettings;
  security: AdminSecuritySettings;
  notifications: AdminNotificationSettings;
  backup: AdminBackupSettings;
}

// Default export with all admin functions
const adminAPI = {
  // Admin Stats
  getStats: async (): Promise<AdminStats> => {
    try {
      return await apiClient.get('/api/admin/stats');
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  },

  // User Management
  getUsers: async (): Promise<AdminUser[]> => {
    try {
      return await apiClient.get('/api/users');
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  createUser: async (userData: any): Promise<AdminUser> => {
    try {
      return await apiClient.post('/api/auth/register', userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  updateUser: async (userId: string, userData: any): Promise<AdminUser> => {
    try {
      return await apiClient.post(`/api/users/${userId}`, userData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/users/${userId}`, {});
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Activity Logs
  getLogs: async (params?: any): Promise<ActivityLog[]> => {
    try {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await apiClient.get(`/api/activities${queryString}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  },

  // Settings
  getSettings: async (): Promise<AdminSettings> => {
    try {
      return await apiClient.get('/api/admin/settings');
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  updateGeneralSettings: async (settings: AdminGeneralSettings): Promise<AdminGeneralSettings> => {
    try {
      return await apiClient.post('/api/admin/settings/general', settings);
    } catch (error) {
      console.error('Error updating general settings:', error);
      throw error;
    }
  },

  updateSecuritySettings: async (settings: AdminSecuritySettings): Promise<AdminSecuritySettings> => {
    try {
      return await apiClient.post('/api/admin/settings/security', settings);
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  },

  updateNotificationSettings: async (settings: AdminNotificationSettings): Promise<AdminNotificationSettings> => {
    try {
      return await apiClient.post('/api/admin/settings/notifications', settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  updateBackupSettings: async (settings: AdminBackupSettings): Promise<AdminBackupSettings> => {
    try {
      return await apiClient.post('/api/admin/settings/backup', settings);
    } catch (error) {
      console.error('Error updating backup settings:', error);
      throw error;
    }
  },

  triggerManualBackup: async (): Promise<{ success: boolean; timestamp: string }> => {
    try {
      return await apiClient.post('/api/admin/backup/manual', {});
    } catch (error) {
      console.error('Error triggering manual backup:', error);
      throw error;
    }
  },

  // Role Management
  getRoles: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get('/api/rbac/roles');
      console.log('getRoles response:', response);
      // Handle different response formats
      if (Array.isArray(response)) {
        return response;
      } else if (response?.roles && Array.isArray(response.roles)) {
        return response.roles;
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      console.warn('Unexpected roles response format:', response);
      return [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  assignRolesToUser: async (userId: string, roleIds: string[]): Promise<AdminUser> => {
    try {
      const response = await apiClient.post(`/api/rbac/users/${userId}/roles`, { roleIds });
      return response;
    } catch (error) {
      console.error('Error assigning roles to user:', error);
      throw error;
    }
  },

  updateUserRole: async (userId: string, roleId: string): Promise<AdminUser> => {
    try {
      const response = await apiClient.post(`/api/users/${userId}/role`, { roleId });
      return response;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  bulkUpdateUserRoles: async (userIds: string[], roleId: string): Promise<{ success: boolean; updated: number }> => {
    try {
      const response = await apiClient.post('/api/users/bulk/role', { userIds, roleId });
      return response;
    } catch (error) {
      console.error('Error bulk updating user roles:', error);
      throw error;
    }
  },

  // RBAC Management
  getPermissions: async (): Promise<any[]> => {
    try {
      return await apiClient.get('/api/rbac/permissions');
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
  },

  createRole: async (roleData: any): Promise<any> => {
    try {
      return await apiClient.post('/api/rbac/roles', roleData);
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  updateRole: async (roleId: string, roleData: any): Promise<any> => {
    try {
      return await apiClient.post(`/api/rbac/roles/${roleId}`, roleData);
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  },

  deleteRole: async (roleId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/rbac/roles/${roleId}`, {});
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  },

  resetPassword: async (userId: string, newPassword: string): Promise<void> => {
    try {
      const response = await apiClient.post(`/api/users/${userId}/reset-password`, { newPassword });
      return response;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  exportLogs: async (format: 'text' | 'pdf' | 'excel' | 'csv'): Promise<Blob> => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;
      console.log('Exporting logs:', { format, API_URL, tokenPresent: !!token });
      
      const response = await fetch(`${API_URL}/api/admin/export-logs?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        },
        credentials: 'include'
      });
      
      console.log('Export response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || response.statusText;
        } catch {
          errorMessage = await response.text() || response.statusText;
        }
        throw new Error(`Export failed (${response.status}): ${errorMessage}`);
      }
      
      const blob = await response.blob();
      console.log('Blob created:', { size: blob.size, type: blob.type });
      
      if (blob.size === 0) {
        throw new Error('Empty file received');
      }
      
      return blob;
    } catch (error: any) {
      console.error('Export logs error:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  },

  // Alternative export method using text response
  exportLogsAsText: async (format: 'text' | 'pdf' | 'excel' | 'csv'): Promise<string> => {
    try {
      const response = await apiClient.get(`/api/admin/export-logs?format=${format}`);
      return response;
    } catch (error) {
      console.error('Export logs as text error:', error);
      throw error;
    }
  },

  // System Administration APIs
  getAuditTrail: async (params?: any) => {
    try {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      return await apiClient.get(`/api/audit-trail${queryString}`);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      throw error;
    }
  },

  exportAuditTrail: async (filters: any) => {
    try {
      return await apiClient.post('/api/audit-trail/export', filters);
    } catch (error) {
      console.error('Error exporting audit trail:', error);
      throw error;
    }
  },

  getSystemLogs: async (params?: any) => {
    try {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      return await apiClient.get(`/api/system-logs${queryString}`);
    } catch (error) {
      console.error('Error fetching system logs:', error);
      throw error;
    }
  },

  exportSystemLogs: async (filters: any) => {
    try {
      return await apiClient.post('/api/system-logs/export', filters);
    } catch (error) {
      console.error('Error exporting system logs:', error);
      throw error;
    }
  },

  getNotificationSettings: async () => {
    try {
      return await apiClient.get('/api/notification-settings');
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  },

  updateNotificationSettingsNew: async (settings: any) => {
    try {
      return await apiClient.post('/api/notification-settings', settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  exportData: async (module: string, format: string, filters: any) => {
    try {
      return await apiClient.post('/api/data-export', { module, format, filters });
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  getExportJobs: async () => {
    try {
      return await apiClient.get('/api/data-export/jobs');
    } catch (error) {
      console.error('Error fetching export jobs:', error);
      throw error;
    }
  },

  getBackups: async () => {
    try {
      return await apiClient.get('/api/backup/logs');
    } catch (error) {
      console.error('Error fetching backups:', error);
      throw error;
    }
  },

  createBackup: async () => {
    try {
      return await apiClient.get('/api/backup/download');
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  },

  restoreBackup: async (backupId: string) => {
    try {
      return await apiClient.post('/api/backup/restore', { backupId });
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  },
};

export default adminAPI;
