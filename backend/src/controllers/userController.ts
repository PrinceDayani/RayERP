import { Request, Response } from 'express';
import User from '../models/User';
import { Role } from '../models/Role';
import { logger } from '../utils/logger';
import { emitToUser } from '../utils/socket.utils';

// Get all users (admin access)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().populate('role').select('-password');
    const Employee = (await import('../models/Employee')).default;
    
    const usersWithDetails = await Promise.all(users.map(async (user) => {
      const employee = await Employee.findOne({ user: user._id });
      return {
        id: user._id.toString(),
        _id: user._id,
        name: user.name || `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim(),
        firstName: employee?.firstName || user.name?.split(' ')[0] || '',
        lastName: employee?.lastName || user.name?.split(' ')[1] || '',
        email: user.email,
        phone: employee?.phone,
        role: user.role,
        department: employee?.department,
        avatarUrl: (employee as any)?.avatarUrl,
        status: user.status || 'active',
        lastLogin: user.lastLogin || 'Never'
      };
    }));
    
    res.status(200).json(usersWithDetails);
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
    
    // Log password reset activity
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: req.user?._id?.toString() || 'system',
      userName: req.user?.name || 'System Admin',
      action: 'update',
      resource: `User Password: ${user.name}`,
      resourceType: 'user',
      resourceId: user._id.toString(),
      details: `Password reset for user ${user.name} (${user.email})`,
      metadata: {
        targetUserId: user._id,
        targetUserEmail: user.email,
        resetBy: req.user?.name || 'System Admin'
      },
      category: 'security',
      severity: 'high',
      visibility: 'management',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });
    
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

// Change user password (Admin with permission)
export const changeUserPassword = async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    const targetUser = await User.findById(userId).populate('role');
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const targetRole = targetUser.role as any;
    if (targetRole?.name?.toLowerCase() === 'root') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change Root user password'
      });
    }
    
    if (req.user) {
      const currentUserRole = req.user.role as any;
      if (targetRole.level >= currentUserRole.level) {
        return res.status(403).json({
          success: false,
          message: 'Cannot change password for user with equal or higher role level'
        });
      }
    }
    
    targetUser.password = newPassword;
    await targetUser.save();
    
    logger.info(`Password changed for user ${targetUser.email} by ${req.user?.name}`);
    
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: req.user?._id?.toString() || 'system',
      userName: req.user?.name || 'Admin',
      action: 'update',
      resource: `User Password: ${targetUser.name}`,
      resourceType: 'user',
      resourceId: targetUser._id.toString(),
      details: `Changed password for user ${targetUser.name} (${targetUser.email})`,
      metadata: {
        targetUserId: targetUser._id,
        targetUserEmail: targetUser.email,
        changedBy: req.user?.name || 'Admin'
      },
      category: 'security',
      severity: 'high',
      visibility: 'management',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    logger.error(`Change user password error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error changing password'
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
    
    // Log bulk role update activity
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: req.user?._id?.toString() || 'system',
      userName: req.user?.name || 'System Admin',
      action: 'update',
      resource: 'User Roles (Bulk)',
      resourceType: 'user',
      details: `Bulk updated ${updated} user roles to ${newRole.name}`,
      metadata: {
        updatedCount: updated,
        newRoleName: newRole.name,
        newRoleId: newRole._id,
        targetUserIds: userIds
      },
      category: 'user',
      severity: 'medium',
      visibility: 'management',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });
    
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
    
    // Log role update activity
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: req.user?._id?.toString() || 'system',
      userName: req.user?.name || 'System Admin',
      action: 'update',
      resource: `User Role: ${updatedUser.name}`,
      resourceType: 'user',
      resourceId: updatedUser._id.toString(),
      details: `Updated role for user ${updatedUser.name} from ${targetUserCurrentRole.name} to ${newRole.name}`,
      metadata: {
        targetUserId: updatedUser._id,
        targetUserEmail: updatedUser.email,
        oldRoleName: targetUserCurrentRole.name,
        newRoleName: newRole.name,
        updatedBy: req.user?.name || 'System Admin'
      },
      category: 'user',
      severity: 'medium',
      visibility: 'management',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });
    
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


// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).populate('role').select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const Employee = (await import('../models/Employee')).default;
    const employee = await Employee.findOne({ user: userId });
    
    const userProfile = {
      _id: user._id,
      firstName: employee?.firstName || user.name?.split(' ')[0] || '',
      lastName: employee?.lastName || user.name?.split(' ')[1] || '',
      email: user.email,
      phone: employee?.phone,
      role: (user.role as any)?.name || 'employee',
      department: employee?.department,
      avatarUrl: (employee as any)?.avatarUrl,
      name: user.name,
      status: user.status
    };
    
    res.status(200).json(userProfile);
  } catch (error: any) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error retrieving profile' });
  }
};

// Get complete profile with employee data and projects
export const getCompleteProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).populate('role').select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const Employee = (await import('../models/Employee')).default;
    const Project = (await import('../models/Project')).default;
    
    const employee = await Employee.findOne({ user: userId });
    
    let projects = [];
    if (employee) {
      projects = await Project.find({
        $or: [
          { members: userId },
          { team: employee._id }
        ]
      }).select('name description status priority startDate endDate progress').lean();
    }
    
    const completeProfile = {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      employee: employee ? {
        _id: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        department: employee.department,
        position: employee.position,
        hireDate: employee.hireDate,
        status: employee.status,
        skills: employee.skillsEnhanced || employee.skills || [],
        avatarUrl: (employee as any).avatarUrl,
        address: employee.address,
        bio: (employee as any).bio,
        socialLinks: (employee as any).socialLinks,
        documents: (employee as any).documents || [],
        notificationSettings: (employee as any).notificationSettings,
        timezone: (employee as any).timezone,
        supervisor: (employee as any).supervisor
      } : null,
      projects: projects
    };
    
    res.status(200).json(completeProfile);
  } catch (error: any) {
    logger.error(`Get complete profile error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error retrieving complete profile' });
  }
};

// Update current user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, phone, avatarUrl, skills, address } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (name) user.name = name;
    await user.save();
    
    const Employee = (await import('../models/Employee')).default;
    const employee = await Employee.findOne({ user: userId });
    if (employee) {
      if (phone) employee.phone = phone;
      if (avatarUrl !== undefined) (employee as any).avatarUrl = avatarUrl;
      if (skills) employee.skills = skills;
      if (address) employee.address = address;
      await employee.save();
    }
    
    const updatedUser = await User.findById(userId).populate('role').select('-password');
    
    // Log profile update activity
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: userId,
      userName: user.name,
      action: 'update',
      resource: 'User Profile',
      resourceType: 'user',
      resourceId: userId,
      details: `Updated profile information`,
      metadata: {
        updatedFields: Object.keys(req.body),
        hasAvatar: !!avatarUrl
      },
      category: 'user',
      severity: 'low',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error: any) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    // Log password change activity
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: userId,
      userName: user.name,
      action: 'update',
      resource: 'User Password',
      resourceType: 'user',
      resourceId: userId,
      details: `Changed password`,
      metadata: {
        changedAt: new Date().toISOString()
      },
      category: 'security',
      severity: 'medium',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });
    
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    logger.error(`Change password error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error changing password' });
  }
};

// Upload avatar
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    const Employee = (await import('../models/Employee')).default;
    const employee = await Employee.findOne({ user: userId });
    
    if (employee) {
      (employee as any).avatarUrl = avatarUrl;
      await employee.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl: avatarUrl
    });
  } catch (error: any) {
    logger.error(`Upload avatar error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error uploading avatar' });
  }
};

// Update user status
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { status, reason } = req.body;
    const userId = req.params.id;
    
    const validStatuses = ['active', 'inactive', 'disabled', 'pending_approval'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, inactive, disabled, pending_approval'
      });
    }
    
    const targetUser = await User.findById(userId).populate('role');
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const targetRole = targetUser.role as any;
    if (targetRole?.name?.toLowerCase() === 'root') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change Root user status'
      });
    }
    
    if (req.user?._id?.toString() === userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change your own status'
      });
    }
    
    if (req.user) {
      const currentUserRole = req.user.role as any;
      if (targetRole.level >= currentUserRole.level) {
        return res.status(403).json({
          success: false,
          message: 'Cannot change status for user with equal or higher role level'
        });
      }
    }
    
    const oldStatus = targetUser.status || 'active';
    const requiresApproval = (oldStatus === 'active' && status === 'disabled') || 
                             (oldStatus === 'disabled' && status === 'active');
    
    if (requiresApproval) {
      const UserStatusRequest = (await import('../models/UserStatusRequest')).default;
      const existingRequest = await UserStatusRequest.findOne({
        user: userId,
        status: 'pending'
      });
      
      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'A pending status change request already exists for this user',
          requiresApproval: true
        });
      }
      
      const request = await UserStatusRequest.create({
        user: userId,
        requestedBy: req.user?._id,
        currentStatus: oldStatus,
        requestedStatus: status,
        reason: reason || 'No reason provided'
      });
      
      logger.info(`Status change request created for user ${targetUser.email} from ${oldStatus} to ${status}`);
      
      const { logActivity } = await import('../utils/activityLogger');
      await logActivity({
        userId: req.user?._id?.toString() || 'system',
        userName: req.user?.name || 'Admin',
        action: 'create',
        resource: `User Status Request: ${targetUser.name}`,
        resourceType: 'user',
        resourceId: request._id.toString(),
        details: `Requested status change for ${targetUser.name} from ${oldStatus} to ${status}`,
        metadata: {
          targetUserId: targetUser._id,
          targetUserEmail: targetUser.email,
          oldStatus,
          requestedStatus: status,
          reason,
          requestId: request._id
        },
        category: 'user',
        severity: 'medium',
        visibility: 'management',
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
      });
      
      return res.status(200).json({
        success: true,
        message: 'Status change request submitted for approval',
        requiresApproval: true,
        request: {
          _id: request._id,
          status: request.status,
          requestedStatus: status
        }
      });
    }
    
    targetUser.status = status;
    await targetUser.save();
    
    const updatedUser = await User.findById(userId).populate('role').select('-password');
    
    logger.info(`Status changed for user ${targetUser.email} from ${oldStatus} to ${status} by ${req.user?.name}`);
    
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: req.user?._id?.toString() || 'system',
      userName: req.user?.name || 'Admin',
      action: 'update',
      resource: `User Status: ${targetUser.name}`,
      resourceType: 'user',
      resourceId: targetUser._id.toString(),
      details: `Changed status for user ${targetUser.name} from ${oldStatus} to ${status}`,
      metadata: {
        targetUserId: targetUser._id,
        targetUserEmail: targetUser.email,
        oldStatus,
        newStatus: status,
        changedBy: req.user?.name || 'Admin'
      },
      category: 'user',
      severity: status === 'disabled' ? 'high' : 'medium',
      visibility: 'management',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });
    
    emitToUser(userId, 'statusUpdated', {
      userId: userId,
      newStatus: status,
      message: `Your account status has been changed to ${status.replace('_', ' ')}`
    });
    
    res.status(200).json({
      success: true,
      message: `User status updated to ${status.replace('_', ' ')}`,
      user: updatedUser
    });
  } catch (error: any) {
    logger.error(`Update user status error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user status'
    });
  }
};

// Get pending status requests
export const getPendingStatusRequests = async (req: Request, res: Response) => {
  try {
    const UserStatusRequest = (await import('../models/UserStatusRequest')).default;
    const requests = await UserStatusRequest.find({ status: 'pending' })
      .populate('user', 'name email')
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, requests });
  } catch (error: any) {
    logger.error(`Get pending status requests error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve status request
export const approveStatusRequest = async (req: Request, res: Response) => {
  try {
    const requestId = req.params.id;
    const UserStatusRequest = (await import('../models/UserStatusRequest')).default;
    
    const request = await UserStatusRequest.findById(requestId).populate('user');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }
    
    const targetUser = await User.findById(request.user);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    targetUser.status = request.requestedStatus;
    await targetUser.save();
    
    request.status = 'approved';
    request.approvedBy = req.user?._id;
    request.approvedAt = new Date();
    await request.save();
    
    logger.info(`Status request approved for user ${targetUser.email}`);
    
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: req.user?._id?.toString() || 'system',
      userName: req.user?.name || 'Admin',
      action: 'approve',
      resource: `User Status Request: ${targetUser.name}`,
      resourceType: 'user',
      resourceId: requestId,
      details: `Approved status change for ${targetUser.name} to ${request.requestedStatus}`,
      metadata: {
        targetUserId: targetUser._id,
        requestId,
        newStatus: request.requestedStatus
      },
      category: 'user',
      severity: 'high',
      visibility: 'management',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });
    
    emitToUser(targetUser._id.toString(), 'statusUpdated', {
      userId: targetUser._id,
      newStatus: request.requestedStatus,
      message: `Your account status has been changed to ${request.requestedStatus.replace('_', ' ')}`
    });
    
    res.status(200).json({ success: true, message: 'Request approved', request });
  } catch (error: any) {
    logger.error(`Approve status request error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject status request
export const rejectStatusRequest = async (req: Request, res: Response) => {
  try {
    const requestId = req.params.id;
    const { reason } = req.body;
    const UserStatusRequest = (await import('../models/UserStatusRequest')).default;
    
    const request = await UserStatusRequest.findById(requestId).populate('user');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }
    
    request.status = 'rejected';
    request.approvedBy = req.user?._id;
    request.approvedAt = new Date();
    request.rejectionReason = reason || 'No reason provided';
    await request.save();
    
    logger.info(`Status request rejected for user ${(request.user as any).email}`);
    
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: req.user?._id?.toString() || 'system',
      userName: req.user?.name || 'Admin',
      action: 'reject',
      resource: `User Status Request: ${(request.user as any).name}`,
      resourceType: 'user',
      resourceId: requestId,
      details: `Rejected status change request for ${(request.user as any).name}`,
      metadata: {
        targetUserId: (request.user as any)._id,
        requestId,
        reason
      },
      category: 'user',
      severity: 'medium',
      visibility: 'management',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });
    
    res.status(200).json({ success: true, message: 'Request rejected', request });
  } catch (error: any) {
    logger.error(`Reject status request error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId).populate('role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userRole = (user.role as any);
    if (userRole.name?.toLowerCase() === 'root') {
      return res.status(403).json({ success: false, message: 'Cannot delete Root user' });
    }
    
    if (req.user) {
      const currentUserRole = (req.user.role as any);
      if (userRole.level >= currentUserRole.level) {
        return res.status(403).json({ success: false, message: 'Cannot delete user with equal or higher role level' });
      }
    }
    
    await User.findByIdAndDelete(userId);
    
    logger.info(`User deleted: ${user.email}`);
    
    // Log user deletion activity
    const { logActivity } = await import('../utils/activityLogger');
    await logActivity({
      userId: req.user?._id?.toString() || 'system',
      userName: req.user?.name || 'System Admin',
      action: 'delete',
      resource: `User: ${user.name}`,
      resourceType: 'user',
      resourceId: userId,
      details: `Deleted user ${user.name} (${user.email})`,
      metadata: {
        deletedUserId: user._id,
        deletedUserEmail: user.email,
        deletedUserRole: userRole.name,
        deletedBy: req.user?.name || 'System Admin'
      },
      category: 'user',
      severity: 'high',
      visibility: 'management',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });
    
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    logger.error(`Delete user error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
};
