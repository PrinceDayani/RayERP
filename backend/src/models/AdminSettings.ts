import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminSettings extends Document {
  general: {
    companyName: string;
    supportEmail: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    language: string;
  };
  security: {
    requireMfa: boolean;
    passwordComplexity: string;
    sessionTimeout: string;
    maxLoginAttempts: string;
    allowPasswordReset: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    systemAlerts: boolean;
    userActivityAlerts: boolean;
    maintenanceAlerts: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionPeriod: string;
    lastBackupDate: string;
    backupLocation: string;
  };
}

const AdminSettingsSchema = new Schema<IAdminSettings>({
  general: {
    companyName: { type: String, default: 'Your Company' },
    supportEmail: { type: String, default: 'support@company.com' },
    timezone: { type: String, default: 'UTC' },
    dateFormat: { type: String, default: 'YYYY-MM-DD' },
    currency: { type: String, default: 'INR' },
    language: { type: String, default: 'en' }
  },
  security: {
    requireMfa: { type: Boolean, default: false },
    passwordComplexity: { type: String, default: 'medium' },
    sessionTimeout: { type: String, default: '24h' },
    maxLoginAttempts: { type: String, default: '5' },
    allowPasswordReset: { type: Boolean, default: true }
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true },
    userActivityAlerts: { type: Boolean, default: false },
    maintenanceAlerts: { type: Boolean, default: true }
  },
  backup: {
    autoBackup: { type: Boolean, default: true },
    backupFrequency: { type: String, default: 'daily' },
    retentionPeriod: { type: String, default: '30d' },
    lastBackupDate: { type: String, default: () => new Date().toISOString() },
    backupLocation: { type: String, default: 'local' }
  }
}, {
  timestamps: true
});

export default mongoose.model<IAdminSettings>('AdminSettings', AdminSettingsSchema);