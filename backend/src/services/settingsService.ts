// backend/src/services/settingsService.ts
import Setting, { SettingScope, ISetting } from '../models/Settings';
import AdminSettings, { IAdminSettings } from '../models/AdminSettings';
import { io } from '../server';

class SettingsService {
  async getSettings(scope: SettingScope, userId?: string, key?: string): Promise<any[]> {
    const query: any = { scope };
    if (key) query.key = key;
    if (scope === 'user' && userId) query.userId = userId;
    return await Setting.find(query).lean() as any[];
  }

  async getSettingsAsKeyValue(scope: SettingScope, userId?: string, key?: string): Promise<Record<string, any>> {
    const settings = await this.getSettings(scope, userId, key);
    return settings.reduce((acc, setting) => {
      acc[(setting as any).key] = (setting as any).value;
      return acc;
    }, {} as Record<string, any>);
  }

  async updateSetting(key: string, value: any, scope: SettingScope, userId?: string): Promise<any> {
    const query: any = { key, scope };
    if (scope === 'user' && userId) query.userId = userId;
    
    const setting = await Setting.findOneAndUpdate(query, { value, ...query }, { new: true, upsert: true }) as any;
    
    if (scope === 'user' && userId) {
      io.to(`user-${userId}`).emit('settings:updated', { key, value, scope, timestamp: new Date() });
    } else if (scope === 'global') {
      io.emit('settings:global_updated', { key, value, timestamp: new Date() });
    }
    
    return setting;
  }

  async bulkUpdateSettings(settings: Array<{ key: string; value: any }>, scope: SettingScope, userId?: string): Promise<any[]> {
    const results: any[] = [];
    
    for (const { key, value } of settings) {
      const query: any = { key, scope };
      if (scope === 'user' && userId) query.userId = userId;
      const setting = await Setting.findOneAndUpdate(query, { value, ...query }, { new: true, upsert: true }) as any;
      results.push(setting);
    }
    
    if (scope === 'user' && userId) {
      io.to(`user-${userId}`).emit('settings:bulk_updated', { settings: results, timestamp: new Date() });
    }
    
    return results;
  }

  async deleteSetting(id: string, userId?: string): Promise<void> {
    const setting = await Setting.findById(id);
    if (!setting) throw new Error('Setting not found');
    if ((setting as any).scope === 'user' && (setting as any).userId?.toString() !== userId) {
      throw new Error('Not authorized to delete this setting');
    }
    await Setting.findByIdAndDelete(id);
  }

  async resetSettings(scope: SettingScope, userId?: string): Promise<void> {
    const query: any = { scope };
    if (scope === 'user' && userId) query.userId = userId;
    await Setting.deleteMany(query);
    if (scope === 'user' && userId) {
      io.to(`user-${userId}`).emit('settings:reset', { timestamp: new Date() });
    }
  }

  async getAdminSettings(): Promise<IAdminSettings> {
    let settings = await AdminSettings.findOne();
    if (!settings) settings = await AdminSettings.create({});
    return settings;
  }

  async updateAdminSettings(section: string, data: any): Promise<IAdminSettings> {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await AdminSettings.create({ [section]: data });
    } else {
      (settings as any)[section] = { ...(settings as any)[section], ...data };
      await settings.save();
    }
    io.emit('admin:settings_updated', { section, data, timestamp: new Date() });
    return settings;
  }

  getDefaultUserSettings(): Record<string, any> {
    return {
      appearance: { theme: 'system', compactMode: false, fontSize: 'medium', sidebarCollapsed: false },
      notifications: { emailNotifications: true, orderNotifications: true, inventoryAlerts: true, weeklyReports: true, supplierUpdates: true },
      security: { twoFactorEnabled: false, sessionTimeout: 30 }
    };
  }

  async initializeUserSettings(userId: string): Promise<void> {
    const defaults = this.getDefaultUserSettings();
    for (const [key, value] of Object.entries(defaults)) {
      await this.updateSetting(key, value, 'user' as SettingScope, userId);
    }
  }
}

export default new SettingsService();
