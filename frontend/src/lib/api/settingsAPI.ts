// path: frontend/src/lib/settingsAPI.ts
import api from './api';

// Settings enums and interfaces
export enum SettingScope {
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
  USER = 'user'
}

export interface Setting {
  _id?: string;
  key: string;
  value: any;
  scope: SettingScope;
  userId?: string;
  organizationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfileSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  orderNotifications: boolean;
  inventoryAlerts: boolean;
  weeklyReports: boolean;
  supplierUpdates: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  sidebarCollapsed: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number; // in minutes
  lastPasswordChange?: Date;
}

export const settingsAPI = {
  // Get settings with optional key and format parameters
  getSettings: async (scope: SettingScope, key?: string, format: 'keyValue' | 'array' = 'array') => {
    const params = new URLSearchParams();
    params.append('scope', scope);
    
    if (key) {
      params.append('key', key);
    }
    
    if (format === 'keyValue') {
      params.append('format', 'keyValue');
    }
    
    const response = await api.get(`/api/settings?${params.toString()}`);
    return response.data;
  },

  // Update a single setting
  updateSetting: async (key: string, value: any, scope: SettingScope) => {
    const response = await api.put('/api/settings', { key, value, scope });
    return response.data;
  },

  // Bulk update settings
  bulkUpdateSettings: async (settings: Array<{ key: string, value: any }>, scope: SettingScope) => {
    const response = await api.put('/api/settings/bulk', { settings, scope });
    return response.data;
  },

  // Delete a setting
  deleteSetting: async (id: string) => {
    const response = await api.delete(`/api/settings/${id}`);
    return response.data;
  },
  
  // Get user profile settings
  getUserProfile: async () => {
    const response = await api.get('/api/settings?scope=user&key=profile&format=keyValue');
    return response.data.profile || {};
  },
  
  // Update user profile settings
  updateUserProfile: async (profileData: UserProfileSettings) => {
    const response = await api.put('/api/settings', { 
      key: 'profile', 
      value: profileData, 
      scope: SettingScope.USER 
    });
    return response.data;
  },
  
  // Get notification settings
  getNotificationSettings: async () => {
    const response = await api.get('/api/settings?scope=user&key=notifications&format=keyValue');
    return response.data.notifications || {
      emailNotifications: true,
      orderNotifications: true,
      inventoryAlerts: true,
      weeklyReports: true,
      supplierUpdates: true
    };
  },
  
  // Update notification settings
  updateNotificationSettings: async (notificationData: NotificationSettings) => {
    const response = await api.put('/api/settings', { 
      key: 'notifications', 
      value: notificationData, 
      scope: SettingScope.USER 
    });
    return response.data;
  },
  
  // Get appearance settings
  getAppearanceSettings: async () => {
    const response = await api.get('/api/settings?scope=user&key=appearance&format=keyValue');
    return response.data.appearance || {
      theme: 'system',
      compactMode: false,
      fontSize: 'medium',
      sidebarCollapsed: false
    };
  },
  
  // Update appearance settings
  updateAppearanceSettings: async (appearanceData: AppearanceSettings) => {
    const response = await api.put('/api/settings', { 
      key: 'appearance', 
      value: appearanceData, 
      scope: SettingScope.USER 
    });
    return response.data;
  },
  
  // Get security settings
  getSecuritySettings: async () => {
    const response = await api.get('/api/settings?scope=user&key=security&format=keyValue');
    return response.data.security || {
      twoFactorEnabled: false,
      sessionTimeout: 30
    };
  },
  
  // Update security settings
  updateSecuritySettings: async (securityData: SecuritySettings) => {
    const response = await api.put('/api/settings', { 
      key: 'security', 
      value: securityData, 
      scope: SettingScope.USER 
    });
    return response.data;
  }
};

// Export individual functions for flexibility
export const getSettings = settingsAPI.getSettings;
export const updateSetting = settingsAPI.updateSetting;
export const bulkUpdateSettings = settingsAPI.bulkUpdateSettings;
export const deleteSetting = settingsAPI.deleteSetting;
export const getUserProfile = settingsAPI.getUserProfile;
export const updateUserProfile = settingsAPI.updateUserProfile;
export const getNotificationSettings = settingsAPI.getNotificationSettings;
export const updateNotificationSettings = settingsAPI.updateNotificationSettings;
export const getAppearanceSettings = settingsAPI.getAppearanceSettings;
export const updateAppearanceSettings = settingsAPI.updateAppearanceSettings;
export const getSecuritySettings = settingsAPI.getSecuritySettings;
export const updateSecuritySettings = settingsAPI.updateSecuritySettings;

export default settingsAPI;