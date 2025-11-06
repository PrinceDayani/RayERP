// backend/src/controllers/settingsController.ts
import { Request, Response } from 'express';
import Setting, { SettingScope } from '../models/Settings';
import mongoose from 'mongoose';
import { io } from '../server';

// Get settings based on scope and optional identifiers
export const getSettings = async (req: Request, res: Response) => {
  try {
    const { scope, key } = req.query;
    const userId = req.user?.id;
    
    const query: any = {};
    
    // Apply filters based on provided parameters
    if (scope) {
      query.scope = scope;
    }
    
    if (key) {
      query.key = key;
    }
    
    // For user scope, ensure we're querying the current user's settings
    if (scope === SettingScope.USER && userId) {
      query.userId = userId;
    }
    
    // Execute the query
    const settings = await Setting.find(query);
    
    // Transform into key-value pairs if requested
    if (req.query.format === 'keyValue') {
      const keyValueSettings = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);
      
      return res.status(200).json(keyValueSettings);
    }
    
    // Return as array by default
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
    
    // For user settings, ensure we're updating the current user's settings
    if (scope === SettingScope.USER && !userId) {
      return res.status(401).json({ message: 'User ID is required for user settings' });
    }
    
    // Prepare the query to find the existing setting
    const query: any = { key, scope };
    
    if (scope === SettingScope.USER) {
      query.userId = userId;
    }
    
    // Update or create the setting
    const updatedSetting = await Setting.findOneAndUpdate(
      query,
      { value, ...query },
      { new: true, upsert: true }
    );
    
    // Emit real-time update for settings sync
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
    
    // For user settings, ensure we're updating the current user's settings
    if (scope === SettingScope.USER && !userId) {
      return res.status(401).json({ message: 'User ID is required for user settings' });
    }
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const results = [];
      
      for (const { key, value } of settings) {
        // Prepare the query to find the existing setting
        const query: any = { key, scope };
        
        if (scope === SettingScope.USER) {
          query.userId = userId;
        }
        
        // Update or create the setting
        const updatedSetting = await Setting.findOneAndUpdate(
          query,
          { value, ...query },
          { new: true, upsert: true, session }
        );
        
        results.push(updatedSetting);
      }
      
      // Commit the transaction
      await session.commitTransaction();
      
      return res.status(200).json(results);
    } catch (error) {
      // Abort the transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
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
    
    // Ensure users can only delete their own settings
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