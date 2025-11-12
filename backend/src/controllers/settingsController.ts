// backend/src/controllers/settingsController.ts
import { Request, Response } from 'express';
import Setting, { SettingScope } from '../models/Settings';
import AdminSettings from '../models/AdminSettings';
import mongoose from 'mongoose';
import { io } from '../server';

// Get settings based on scope and optional identifiers
export const getSettings = async (req: Request, res: Response) => {
  try {
    const { scope, key } = req.query;
    const userId = req.user?.id;
    
    const query: any = {};
    
    if (scope) query.scope = scope;
    if (key) query.key = key;
    
    if (scope === SettingScope.USER && userId) {
      query.userId = userId;
    }
    
    const settings = await Setting.find(query);
    
    if (req.query.format === 'keyValue') {
      const keyValueSettings = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);
      
      return res.status(200).json(keyValueSettings);
    }
    
    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

// Update a specific setting
export const updateSetting = async (req: Request, res: Response) => {
  try {
    const { key, value, scope } = req.body;
    
    if (!key || value === undefined || !scope) {
      return res.status(400).json({ message: 'Key, value, and scope are required' });
    }
    
    const userId = req.user?.id;
    
    if (scope === SettingScope.USER && !userId) {
      return res.status(401).json({ message: 'User ID is required for user settings' });
    }
    
    const query: any = { key, scope };
    if (scope === SettingScope.USER) query.userId = userId;
    
    const updatedSetting = await Setting.findOneAndUpdate(
      query,
      { value, ...query },
      { new: true, upsert: true }
    );
    
    if (scope === SettingScope.USER && userId) {
      io.to(`user-${userId}`).emit('settings:updated', {
        key,
        value,
        scope,
        timestamp: new Date()
      });
    }
    
    return res.status(200).json(updatedSetting);
  } catch (error) {
    console.error('Error updating setting:', error);
    return res.status(500).json({ message: 'Failed to update setting' });
  }
};

// Bulk update settings
export const bulkUpdateSettings = async (req: Request, res: Response) => {
  try {
    const { settings, scope } = req.body;
    
    if (!settings || !Array.isArray(settings) || !scope) {
      return res.status(400).json({ message: 'Valid settings array and scope are required' });
    }
    
    const userId = req.user?.id;
    
    if (scope === SettingScope.USER && !userId) {
      return res.status(401).json({ message: 'User ID is required for user settings' });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const results = [];
      
      for (const { key, value } of settings) {
        const query: any = { key, scope };
        if (scope === SettingScope.USER) query.userId = userId;
        
        const updatedSetting = await Setting.findOneAndUpdate(
          query,
          { value, ...query },
          { new: true, upsert: true, session }
        );
        
        results.push(updatedSetting);
      }
      
      await session.commitTransaction();
      
      if (scope === SettingScope.USER && userId) {
        io.to(`user-${userId}`).emit('settings:bulk_updated', {
          settings: results,
          timestamp: new Date()
        });
      }
      
      return res.status(200).json(results);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error bulk updating settings:', error);
    return res.status(500).json({ message: 'Failed to update settings' });
  }
};

// Delete a setting
export const deleteSetting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const setting = await Setting.findById(id);
    
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    
    if (setting.scope === SettingScope.USER && setting.userId?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this setting' });
    }
    
    await Setting.findByIdAndDelete(id);
    
    return res.status(200).json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return res.status(500).json({ message: 'Failed to delete setting' });
  }
};

// Get admin settings
export const getAdminSettings = async (req: Request, res: Response) => {
  try {
    let settings = await AdminSettings.findOne();
    
    if (!settings) {
      settings = await AdminSettings.create({});
    }
    
    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return res.status(500).json({ message: 'Failed to fetch admin settings' });
  }
};

// Update admin settings
export const updateAdminSettings = async (req: Request, res: Response) => {
  try {
    const { section, data } = req.body;
    
    if (!section || !data) {
      return res.status(400).json({ message: 'Section and data are required' });
    }
    
    const validSections = ['general', 'security', 'notifications', 'backup'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: 'Invalid section' });
    }
    
    let settings = await AdminSettings.findOne();
    
    if (!settings) {
      settings = await AdminSettings.create({ [section]: data });
    } else {
      (settings as any)[section] = { ...(settings as any)[section], ...data };
      await settings.save();
    }
    
    io.emit('admin:settings_updated', { section, data, timestamp: new Date() });
    
    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return res.status(500).json({ message: 'Failed to update admin settings' });
  }
};

// Reset settings to defaults
export const resetSettings = async (req: Request, res: Response) => {
  try {
    const { scope } = req.body;
    const userId = req.user?.id;
    
    if (!scope) {
      return res.status(400).json({ message: 'Scope is required' });
    }
    
    const query: any = { scope };
    if (scope === SettingScope.USER && userId) {
      query.userId = userId;
    }
    
    await Setting.deleteMany(query);
    
    if (scope === SettingScope.USER && userId) {
      io.to(`user-${userId}`).emit('settings:reset', { timestamp: new Date() });
    }
    
    return res.status(200).json({ message: 'Settings reset successfully' });
  } catch (error) {
    console.error('Error resetting settings:', error);
    return res.status(500).json({ message: 'Failed to reset settings' });
  }
};