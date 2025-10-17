import { apiRequest } from '../api';
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
      return await apiRequest('/api/admin/stats');
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  },

  // User Management
  getUsers: async (): Promise<AdminUser[]> => {
    try {
      return await apiRequest('/api/admin/users');
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  createUser: async (userData: any): Promise<AdminUser> => {
    try {
      return await apiRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  updateUser: async (userId: string, userData: any): Promise<AdminUser> => {
    try {
      return await apiRequest(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      await apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Activity Logs
  getLogs: async (params?: any): Promise<ActivityLog[]> => {
    try {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await apiRequest(`/api/activities${queryString}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  },

  // Settings
  getSettings: async (): Promise<AdminSettings> => {
    try {
      return await apiRequest('/api/admin/settings');
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  updateGeneralSettings: async (settings: AdminGeneralSettings): Promise<AdminGeneralSettings> => {
    try {
      return await apiRequest('/api/admin/settings/general', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    } catch (error) {
      console.error('Error updating general settings:', error);
      throw error;
    }
  },

  updateSecuritySettings: async (settings: AdminSecuritySettings): Promise<AdminSecuritySettings> => {
    try {
      return await apiRequest('/api/admin/settings/security', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  },

  updateNotificationSettings: async (settings: AdminNotificationSettings): Promise<AdminNotificationSettings> => {
    try {
      return await apiRequest('/api/admin/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  updateBackupSettings: async (settings: AdminBackupSettings): Promise<AdminBackupSettings> => {
    try {
      return await apiRequest('/api/admin/settings/backup', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    } catch (error) {
      console.error('Error updating backup settings:', error);
      throw error;
    }
  },

  triggerManualBackup: async (): Promise<{ success: boolean; timestamp: string }> => {
    try {
      return await apiRequest('/api/admin/backup/manual', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error triggering manual backup:', error);
      throw error;
    }
  },

  // Role Management
  getRoles: async (): Promise<any[]> => {
    try {
      return await apiRequest('/api/rbac/roles');
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  },

  assignRolesToUser: async (userId: string, roleIds: string[]): Promise<AdminUser> => {
    try {
      const response = await apiRequest(`/api/auth/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: roleIds[0] })
      });
      return response.user;
    } catch (error) {
      console.error('Error assigning roles to user:', error);
      throw error;
    }
  },

  updateUserRole: async (userId: string, role: string): Promise<AdminUser> => {
    try {
      const response = await apiRequest(`/api/auth/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      });
      return response.user;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  // RBAC Management
  getPermissions: async (): Promise<any[]> => {
    try {
      return await apiRequest('/api/rbac/permissions');
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
  },

  createRole: async (roleData: any): Promise<any> => {
    try {
      return await apiRequest('/api/rbac/roles', {
        method: 'POST',
        body: JSON.stringify(roleData)
      });
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  updateRole: async (roleId: string, roleData: any): Promise<any> => {
    try {
      return await apiRequest(`/api/rbac/roles/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify(roleData)
      });
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  },

  deleteRole: async (roleId: string): Promise<void> => {
    try {
      await apiRequest(`/api/rbac/roles/${roleId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  },
};

export default adminAPI;