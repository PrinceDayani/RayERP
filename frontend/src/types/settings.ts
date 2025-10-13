// frontend/src/types/settings.ts

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