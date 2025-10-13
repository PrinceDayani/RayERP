import { Request, Response } from 'express';
import User, { UserRole } from '../models/User';
import { logger } from '../utils/logger';
import { emitToUser } from '../utils/socket.utils';

// Get all users (admin access)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    
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
    const user = await User.findById(req.params.id).select('-password');
    
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

// Update user role
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;
    
    // Validate role
    if (!Object.values(UserRole).includes(role as UserRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }
    
    // Get user to update
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Role update permission checks
    if (req.user) {
      // Cannot update a user with higher role than yourself
      const roleHierarchy = {
        [UserRole.ROOT]: 4,
        [UserRole.SUPER_ADMIN]: 3,
        [UserRole.ADMIN]: 2,
        [UserRole.NORMAL]: 1
      };
      
      const currentUserRole = req.user.role as UserRole;
      const targetUserCurrentRole = userToUpdate.role;
      
      // Check if trying to update a user with higher or equal role
      if (roleHierarchy[targetUserCurrentRole] >= roleHierarchy[currentUserRole]) {
        return res.status(403).json({
          success: false,
          message: 'You cannot modify a user with equal or higher role than yours'
        });
      }
      
      // Check if trying to assign a role higher than or equal to your own
      if (roleHierarchy[role as UserRole] >= roleHierarchy[currentUserRole]) {
        return res.status(403).json({
          success: false,
          message: 'You cannot assign a role equal to or higher than your own'
        });
      }
      
      // Only ROOT can assign ROOT role
      if (role === UserRole.ROOT && req.user.role !== UserRole.ROOT) {
        return res.status(403).json({
          success: false,
          message: 'Only ROOT users can assign ROOT role'
        });
      }
    }
    
    // Update user role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    logger.info(`Updated role for user ${updatedUser.email} to ${role}`);
    
    // Emit roleUpdated event to the affected user
    emitToUser(userId, 'roleUpdated', {
      userId: userId,
      newRole: role
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