/**
 * Permission Management Controller
 * Handles CRUD operations for permissions
 */

import { Request, Response } from 'express';
import { Permission } from '../models/Permission';
import { Role } from '../models/Role';
import { clearPermissionCache } from '../middleware/permissionValidator.middleware';

/**
 * Get all permissions
 */
export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const { category, isActive } = req.query;
    
    const filter: any = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const permissions = await Permission.find(filter).sort({ category: 1, name: 1 });
    
    // Group by category
    const grouped = permissions.reduce((acc: any, perm) => {
      const cat = perm.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(perm);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        permissions,
        grouped,
        total: permissions.length
      }
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching permissions' 
    });
  }
};

/**
 * Get permission categories
 */
export const getPermissionCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Permission.distinct('category');
    
    res.json({
      success: true,
      data: categories.sort()
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching categories' 
    });
  }
};

/**
 * Create new permission
 */
export const createPermission = async (req: Request, res: Response) => {
  try {
    const { name, description, category } = req.body;
    
    // Validate format
    const permissionRegex = /^[a-z]+\.[a-z_]+$/;
    if (!permissionRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permission format. Use: module.action (e.g., users.view)'
      });
    }
    
    // Check if exists
    const existing = await Permission.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Permission already exists'
      });
    }
    
    const permission = await Permission.create({
      name,
      description,
      category: category || 'Other',
      isActive: true
    });
    
    clearPermissionCache();
    
    res.status(201).json({
      success: true,
      data: permission,
      message: 'Permission created successfully'
    });
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating permission' 
    });
  }
};

/**
 * Update permission
 */
export const updatePermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, category, isActive } = req.body;
    
    const permission = await Permission.findByIdAndUpdate(
      id,
      { description, category, isActive },
      { new: true, runValidators: true }
    );
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }
    
    clearPermissionCache();
    
    res.json({
      success: true,
      data: permission,
      message: 'Permission updated successfully'
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating permission' 
    });
  }
};

/**
 * Delete permission
 */
export const deletePermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const permission = await Permission.findById(id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }
    
    // Check if permission is used by any role
    const rolesUsingPermission = await Role.find({
      permissions: permission.name
    });
    
    if (rolesUsingPermission.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete permission. Used by ${rolesUsingPermission.length} role(s)`,
        data: {
          roles: rolesUsingPermission.map(r => r.name)
        }
      });
    }
    
    await Permission.findByIdAndDelete(id);
    clearPermissionCache();
    
    res.json({
      success: true,
      message: 'Permission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting permission' 
    });
  }
};

/**
 * Get permission usage statistics
 */
export const getPermissionStats = async (req: Request, res: Response) => {
  try {
    const totalPermissions = await Permission.countDocuments();
    const activePermissions = await Permission.countDocuments({ isActive: true });
    const categories = await Permission.distinct('category');
    
    // Get role usage
    const roles = await Role.find().select('name permissions');
    const permissionUsage: any = {};
    
    roles.forEach(role => {
      role.permissions?.forEach((perm: string) => {
        if (!permissionUsage[perm]) {
          permissionUsage[perm] = [];
        }
        permissionUsage[perm].push(role.name);
      });
    });
    
    res.json({
      success: true,
      data: {
        total: totalPermissions,
        active: activePermissions,
        inactive: totalPermissions - activePermissions,
        categories: categories.length,
        usage: permissionUsage,
        mostUsed: Object.entries(permissionUsage)
          .sort((a: any, b: any) => b[1].length - a[1].length)
          .slice(0, 10)
          .map(([perm, roles]) => ({ permission: perm, usedBy: roles }))
      }
    });
  } catch (error) {
    console.error('Error fetching permission stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching permission statistics' 
    });
  }
};

/**
 * Bulk create permissions
 */
export const bulkCreatePermissions = async (req: Request, res: Response) => {
  try {
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permissions array is required'
      });
    }
    
    const results = {
      created: [] as any[],
      skipped: [] as any[],
      errors: [] as any[]
    };
    
    for (const perm of permissions) {
      try {
        const existing = await Permission.findOne({ name: perm.name });
        
        if (existing) {
          results.skipped.push(perm.name);
        } else {
          const created = await Permission.create(perm);
          results.created.push(created);
        }
      } catch (error: any) {
        results.errors.push({ name: perm.name, error: error.message });
      }
    }
    
    clearPermissionCache();
    
    res.json({
      success: true,
      data: results,
      message: `Created ${results.created.length}, Skipped ${results.skipped.length}, Errors ${results.errors.length}`
    });
  } catch (error) {
    console.error('Error bulk creating permissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error bulk creating permissions' 
    });
  }
};
