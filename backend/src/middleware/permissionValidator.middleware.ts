/**
 * Permission Validator Middleware
 * Provides additional validation and security for permission checks
 */

import { Request, Response, NextFunction } from 'express';
import { Permission } from '../models/Permission';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Cache for valid permissions (refreshed every 5 minutes)
let permissionCache: Set<string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load all valid permissions from database
 */
async function loadValidPermissions(): Promise<Set<string>> {
  const now = Date.now();
  
  // Return cached permissions if still valid
  if (permissionCache && (now - cacheTimestamp) < CACHE_TTL) {
    return permissionCache;
  }

  // Fetch from database
  const permissions = await Permission.find({ isActive: true }).select('name');
  permissionCache = new Set(permissions.map(p => p.name));
  cacheTimestamp = now;
  
  return permissionCache;
}

/**
 * Validate that a permission exists in the system
 */
export const validatePermissionExists = async (permission: string): Promise<boolean> => {
  const validPermissions = await loadValidPermissions();
  return validPermissions.has(permission);
};

/**
 * Middleware to validate permission format
 */
export const validatePermissionFormat = (permission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Check format: should be module.action (e.g., users.view)
      const permissionRegex = /^[a-z]+\.[a-z_]+$/;
      
      if (!permissionRegex.test(permission)) {
        console.error(`Invalid permission format: ${permission}`);
        return res.status(500).json({ 
          message: 'Invalid permission configuration',
          error: 'INVALID_PERMISSION_FORMAT'
        });
      }

      // Validate permission exists in database
      const exists = await validatePermissionExists(permission);
      
      if (!exists) {
        console.warn(`Permission not found in database: ${permission}`);
        // Don't block the request, but log for monitoring
      }

      next();
    } catch (error) {
      console.error('Permission validation error:', error);
      next(); // Continue even if validation fails
    }
  };
};

/**
 * Clear permission cache (useful after permission updates)
 */
export const clearPermissionCache = () => {
  permissionCache = null;
  cacheTimestamp = 0;
};

/**
 * Get all valid permissions (for admin UI)
 */
export const getAllValidPermissions = async (): Promise<string[]> => {
  const validPermissions = await loadValidPermissions();
  return Array.from(validPermissions).sort();
};

/**
 * Middleware to log permission checks (for audit)
 */
export const logPermissionCheck = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || 'anonymous';
    const method = req.method;
    const path = req.path;
    
    console.log(`[PERMISSION CHECK] User: ${userId} | Permission: ${permission} | ${method} ${path}`);
    next();
  };
};

/**
 * Batch permission validator for multiple permissions
 */
export const validateMultiplePermissions = async (permissions: string[]): Promise<{
  valid: string[];
  invalid: string[];
}> => {
  const validPermissions = await loadValidPermissions();
  
  const valid: string[] = [];
  const invalid: string[] = [];
  
  for (const perm of permissions) {
    if (validPermissions.has(perm)) {
      valid.push(perm);
    } else {
      invalid.push(perm);
    }
  }
  
  return { valid, invalid };
};
