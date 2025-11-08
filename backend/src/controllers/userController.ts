import { Request, Response } from 'express';
import User from '../models/User';
import { Role } from '../models/Role';
import { logger } from '../utils/logger';
import { emitToUser } from '../utils/socket.utils';

// Get all users (admin access)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().populate('role').select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error: any) {
    logger.error(`Get all users error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving users'
    });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).populate('role').select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error: any) {
    logger.error(`Get user by ID error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving user'
    });
  }
};

// Reset user password (SuperAdmin only)
export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;
    
    logger.info(`Reset password request for user ${userId}`);
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      logger.error(`User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.password = newPassword;
    user.markModified('password');
    await user.save({ validateBeforeSave: true });
    
    logger.info(`Password reset successfully for user ${user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error: any) {
    logger.error(`Reset password error: ${error.message}`, error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Error resetting password'
    });
  }
};

// Bulk update user roles
export const bulkUpdateUserRoles = async (req: Request, res: Response) => {
  try {
    const { userIds, roleId } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }
    
    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'Role ID is required'
      });
    }
    
    const newRole = await Role.findById(roleId);
    if (!newRole) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }
    
    if (newRole.name?.toLowerCase() === 'root') {
      return res.status(403).json({
        success: false,
        message: 'Cannot assign Root role to users'
      });
    }
    
    if (req.user) {
      const currentUserRole = (req.user.role as any);
      
      if (newRole.level >= currentUserRole.level) {
        return res.status(403).json({
          success: false,
          message: 'You cannot assign a role equal to or higher than your own'
        });
      }
    }
    
    let updated = 0;
    for (const userId of userIds) {
      const userToUpdate = await User.findById(userId).populate('role');
      if (!userToUpdate) continue;
      
      const targetUserCurrentRole = (userToUpdate.role as any);
      
      if (targetUserCurrentRole.name?.toLowerCase() === 'root') continue;
      
      if (req.user) {
        const currentUserRole = (req.user.role as any);
        if (targetUserCurrentRole.level >= currentUserRole.level) continue;
      }
      
      await User.findByIdAndUpdate(userId, { role: roleId });
      
      emitToUser(userId, 'roleUpdated', {
        userId: userId,
        newRole: newRole
      });
      
      updated++;
    }
    
    logger.info(`Bulk updated ${updated} user roles to ${newRole.name}`);
    
    res.status(200).json({
      success: true,
      message: `Successfully updated ${updated} user(s)`,
      updated
    });
  } catch (error: any) {
    logger.error(`Bulk update user roles error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error bulk updating user roles'
    });
  }
};

// Update user role
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.body;
    const userId = req.params.id;
    
    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'Role ID is required'
      });
    }
    
    const newRole = await Role.findById(roleId);
    if (!newRole) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }
    
    const userToUpdate = await User.findById(userId).populate('role');
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const targetUserCurrentRole = (userToUpdate.role as any);
    
    if (targetUserCurrentRole.name?.toLowerCase() === 'root') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify Root user role'
      });
    }
    
    if (newRole.name?.toLowerCase() === 'root') {
      return res.status(403).json({
        success: false,
        message: 'Cannot assign Root role to other users'
      });
    }
    
    if (req.user) {
      const currentUserRole = (req.user.role as any);
      
      if (targetUserCurrentRole.level >= currentUserRole.level) {
        return res.status(403).json({
          success: false,
          message: 'You cannot modify a user with equal or higher role level'
        });
      }
      
      if (newRole.level >= currentUserRole.level) {
        return res.status(403).json({
          success: false,
          message: 'You cannot assign a role equal to or higher than your own'
        });
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: roleId },
      { new: true, runValidators: true }
    ).populate('role').select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    logger.info(`Updated role for user ${updatedUser.email} to ${newRole.name}`);
    
    emitToUser(userId, 'roleUpdated', {
      userId: userId,
      newRole: updatedUser.role
    });
    
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (error: any) {
    logger.error(`Update user role error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user role'
    });
  }
};