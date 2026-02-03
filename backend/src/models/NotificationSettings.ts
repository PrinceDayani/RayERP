import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationSettings extends Document {
  user: mongoose.Types.ObjectId;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  orderNotifications: boolean;
  inventoryAlerts: boolean;
  projectUpdates: boolean;
  taskReminders: boolean;
  budgetAlerts: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  systemAlerts: boolean;
  securityAlerts: boolean;
  maintenanceNotices: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSettingsSchema = new Schema<INotificationSettings>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  emailNotifications: { type: Boolean, default: true },
  pushNotifications: { type: Boolean, default: true },
  soundEnabled: { type: Boolean, default: true },
  orderNotifications: { type: Boolean, default: true },
  inventoryAlerts: { type: Boolean, default: true },
  projectUpdates: { type: Boolean, default: true },
  taskReminders: { type: Boolean, default: true },
  budgetAlerts: { type: Boolean, default: true },
  dailyReports: { type: Boolean, default: false },
  weeklyReports: { type: Boolean, default: true },
  monthlyReports: { type: Boolean, default: true },
  systemAlerts: { type: Boolean, default: true },
  securityAlerts: { type: Boolean, default: true },
  maintenanceNotices: { type: Boolean, default: true }
}, { timestamps: true });

NotificationSettingsSchema.index({ user: 1 });

export default mongoose.model<INotificationSettings>('NotificationSettings', NotificationSettingsSchema);
