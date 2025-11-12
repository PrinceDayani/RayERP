// backend/src/utils/settingsHelper.ts
import Setting, { SettingScope } from '../models/Settings';
import AdminSettings from '../models/AdminSettings';

export class SettingsHelper {
  // Get a single setting value with fallback
  static async getSetting(key: string, scope: SettingScope, userId?: string, defaultValue?: any): Promise<any> {
    const query: any = { key, scope };
    if (scope === SettingScope.USER && userId) query.userId = userId;
    
    const setting = await Setting.findOne(query);
    return setting ? setting.value : defaultValue;
  }

  // Check if a setting exists
  static async settingExists(key: string, scope: SettingScope, userId?: string): Promise<boolean> {
    const query: any = { key, scope };
    if (scope === SettingScope.USER && userId) query.userId = userId;
    
    const count = await Setting.countDocuments(query);
    return count > 0;
  }

  // Get multiple settings by keys
  static async getSettingsByKeys(keys: string[], scope: SettingScope, userId?: string): Promise<Record<string, any>> {
    const query: any = { key: { $in: keys }, scope };
    if (scope === SettingScope.USER && userId) query.userId = userId;
    
    const settings = await Setting.find(query);
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
  }

  // Get admin setting value
  static async getAdminSetting(section: string, field: string, defaultValue?: any): Promise<any> {
    const settings = await AdminSettings.findOne();
    if (!settings) return defaultValue;
    
    const sectionData = (settings as any)[section];
    return sectionData?.[field] ?? defaultValue;
  }

  // Merge user settings with defaults
  static async getUserSettingsWithDefaults(userId: string, defaults: Record<string, any>): Promise<Record<string, any>> {
    const userSettings = await Setting.find({ scope: SettingScope.USER, userId }).lean();
    
    const settingsMap = userSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
    
    return { ...defaults, ...settingsMap };
  }

  // Export settings for backup
  static async exportSettings(scope?: SettingScope, userId?: string): Promise<any[]> {
    const query: any = {};
    if (scope) query.scope = scope;
    if (scope === SettingScope.USER && userId) query.userId = userId;
    
    return await Setting.find(query).lean();
  }

  // Import settings from backup
  static async importSettings(settings: any[]): Promise<number> {
    let imported = 0;
    
    for (const setting of settings) {
      const { key, value, scope, userId, organizationId } = setting;
      const query: any = { key, scope };
      
      if (userId) query.userId = userId;
      if (organizationId) query.organizationId = organizationId;
      
      await Setting.findOneAndUpdate(query, { value, ...query }, { upsert: true });
      imported++;
    }
    
    return imported;
  }

  // Clean up orphaned settings
  static async cleanupOrphanedSettings(): Promise<number> {
    const User = (await import('../models/User')).default;
    
    // Get all user IDs
    const users = await User.find().select('_id');
    const userIds = users.map(u => u._id.toString());
    
    // Delete settings for non-existent users
    const result = await Setting.deleteMany({
      scope: SettingScope.USER,
      userId: { $nin: userIds }
    });
    
    return result.deletedCount || 0;
  }

  // Get settings statistics
  static async getSettingsStats(): Promise<any> {
    const totalSettings = await Setting.countDocuments();
    const userSettings = await Setting.countDocuments({ scope: SettingScope.USER });
    const globalSettings = await Setting.countDocuments({ scope: SettingScope.GLOBAL });
    const orgSettings = await Setting.countDocuments({ scope: SettingScope.ORGANIZATION });
    
    return {
      total: totalSettings,
      byScope: {
        user: userSettings,
        global: globalSettings,
        organization: orgSettings
      }
    };
  }
}

export default SettingsHelper;
