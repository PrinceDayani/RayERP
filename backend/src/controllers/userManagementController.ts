import { Request, Response } from 'express';
import User from '../models/User';
import { Role } from '../models/Role';
import { logger } from '../utils/logger';
import { logActivity } from '../utils/activityLogger';

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, roleId } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    let role;
    if (roleId) {
      role = await Role.findById(roleId);
      if (!role) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }
      
      if (role.name?.toLowerCase() === 'root') {
        return res.status(403).json({ success: false, message: 'Cannot assign Root role' });
      }
      
      if (req.user) {
        const currentUserRole = (req.user.role as any);
        if (role.level >= currentUserRole.level) {
          return res.status(403).json({ success: false, message: 'Cannot assign role equal to or higher than your own' });
        }
      }
    } else {
      role = await Role.findOne({ name: 'Employee' });
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role: role?._id,
      status: 'active'
    });
    
    const createdUser = await User.findById(user._id).populate('role').select('-password');
    
    await logActivity({
      userId: req.user?._id?.toString() || 'system',
      userName: req.user?.name || 'System',
      action: 'create',
      resource: `User: ${name}`,
      resourceType: 'user',
      resourceId: user._id.toString(),
      details: `Created user ${name} (${email})`,
      metadata: { email, roleName: role?.name },
      category: 'user',
      severity: 'medium',
      visibility: 'management',
      ipAddress: req.ip || 'unknown'
    });
    
    logger.info(`User created: ${email}`);
    
    res.status(201).json({ success: true, message: 'User created successfully', user: createdUser });
  } catch (error: any) {
    logger.error(`Create user error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Error creating user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { name, email, roleId, status } = req.body;
    
    const user = await User.findById(userId).populate('role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userRole = (user.role as any);
    if (userRole.name?.toLowerCase() === 'root') {
      return res.status(403).json({ success: false, message: 'Cannot modify Root user' });
    }
    
    if (req.user) {
      const currentUserRole = (req.user.role as any);
      if (userRole.level >= currentUserRole.level) {
        return res.status(403).json({ success: false, message: 'Cannot modify user with equal or higher role level' });
      }
    }
    
    if (roleId) {
      const newRole = await Role.findById(roleId);
      if (!newRole) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }
      
      if (newRole.name?.toLowerCase() === 'root') {
        return res.status(403).json({ success: false, message: 'Cannot assign Root role' });
      }
      
      if (req.user) {
        const currentUserRole = (req.user.role as any);
        if (newRole.level >= currentUserRole.level) {
          return res.status(403).json({ success: false, message: 'Cannot assign role equal to or higher than your own' });
        }
      }
      
      user.role = newRole._id as any;
    }
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (status) user.status = status;
    
    await user.save();
    
    const updatedUser = await User.findById(userId).populate('role').select('-password');
    
    await logActivity({
      userId: req.user?._id?.toString() || 'system',
      userName: req.user?.name || 'System',
      action: 'update',
      resource: `User: ${user.name}`,
      resourceType: 'user',
      resourceId: userId,
      details: `Updated user ${user.name}`,
      metadata: { updatedFields: Object.keys(req.body) },
      category: 'user',
      severity: 'medium',
      visibility: 'management',
      ipAddress: req.ip || 'unknown'
    });
    
    logger.info(`User updated: ${user.email}`);
    
    res.status(200).json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (error: any) {
    logger.error(`Update user error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Error updating user' });
  }
};
