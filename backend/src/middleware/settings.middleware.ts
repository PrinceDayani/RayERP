// backend/src/middleware/settings.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { SettingScope } from '../models/Settings';

// Validate setting key format
export const validateSettingKey = (req: Request, res: Response, next: NextFunction) => {
  const { key } = req.body;
  
  if (!key) {
    return res.status(400).json({ message: 'Setting key is required' });
  }
  
  // Key should be alphanumeric with underscores and dots
  const keyRegex = /^[a-zA-Z0-9_.]+$/;
  if (!keyRegex.test(key)) {
    return res.status(400).json({ 
      message: 'Invalid key format. Use only letters, numbers, underscores, and dots' 
    });
  }
  
  next();
};

// Validate setting value
export const validateSettingValue = (req: Request, res: Response, next: NextFunction) => {
  const { value } = req.body;
  
  if (value === undefined) {
    return res.status(400).json({ message: 'Setting value is required' });
  }
  
  // Check value size (prevent storing huge objects)
  const valueSize = JSON.stringify(value).length;
  if (valueSize > 100000) { // 100KB limit
    return res.status(400).json({ 
      message: 'Setting value too large. Maximum size is 100KB' 
    });
  }
  
  next();
};

// Validate setting scope
export const validateSettingScope = (req: Request, res: Response, next: NextFunction) => {
  const { scope } = req.body;
  
  if (!scope) {
    return res.status(400).json({ message: 'Setting scope is required' });
  }
  
  const validScopes = ['global', 'user', 'organization', 'department', 'project'];
  if (!validScopes.includes(scope)) {
    return res.status(400).json({ 
      message: `Invalid scope. Must be one of: ${validScopes.join(', ')}` 
    });
  }
  
  next();
};

// Validate bulk settings
export const validateBulkSettings = (req: Request, res: Response, next: NextFunction) => {
  const { settings } = req.body;
  
  if (!settings || !Array.isArray(settings)) {
    return res.status(400).json({ message: 'Settings must be an array' });
  }
  
  if (settings.length === 0) {
    return res.status(400).json({ message: 'Settings array cannot be empty' });
  }
  
  if (settings.length > 50) {
    return res.status(400).json({ message: 'Cannot update more than 50 settings at once' });
  }
  
  // Validate each setting
  for (const setting of settings) {
    if (!setting.key || setting.value === undefined) {
      return res.status(400).json({ 
        message: 'Each setting must have a key and value' 
      });
    }
  }
  
  next();
};

// Validate admin settings section
export const validateAdminSection = (req: Request, res: Response, next: NextFunction) => {
  const { section } = req.body;
  
  if (!section) {
    return res.status(400).json({ message: 'Section is required' });
  }
  
  const validSections = ['general', 'security', 'notifications', 'backup'];
  if (!validSections.includes(section)) {
    return res.status(400).json({ 
      message: `Invalid section. Must be one of: ${validSections.join(', ')}` 
    });
  }
  
  next();
};
