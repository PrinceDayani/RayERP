import { Request, Response } from 'express';
import User from '../models/User';
import Employee from '../models/Employee';
import ActivityLog from '../models/ActivityLog';
import AdminSettings from '../models/AdminSettings';
import { logger } from '../utils/logger';

// Get admin stats
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const pendingApprovals = await User.countDocuments({ status: 'pending' });
    const systemAlerts = await ActivityLog.countDocuments({ status: 'error' });

    res.json({
      totalUsers,
      activeUsers,
      pendingApprovals,
      systemAlerts
    });
  } catch (error: any) {
    logger.error(`Get admin stats error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get all users for admin
export const getAdminUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password').populate('role').sort({ createdAt: -1 });
    
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      roles: user.role ? [user.role] : [],
      status: user.status || 'active',
      lastLogin: user.lastLogin || user.createdAt
    }));

    res.json(formattedUsers);
  } catch (error: any) {
    logger.error(`Get admin users error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Create user
export const createAdminUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role });
    
    // Log activity
    await ActivityLog.create({
      user: req.user?.name || 'Admin',
      action: 'create',
      resource: 'user',
      status: 'success',
      details: `Created user: ${email}`,
      ipAddress: req.ip || 'unknown'
    });

    res.status(201).json({
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
      lastLogin: user.createdAt
    });
  } catch (error: any) {
    logger.error(`Create admin user error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Update user
export const updateAdminUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).populate('role').select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log activity
    await ActivityLog.create({
      user: req.user?.name || 'Admin',
      action: 'update',
      resource: 'user',
      status: 'success',
      details: `Updated user: ${user.email}`,
      ipAddress: req.ip || 'unknown'
    });

    res.json({
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      roles: user.role ? [user.role] : [],
      status: user.status || 'active',
      lastLogin: user.lastLogin || user.createdAt
    });
  } catch (error: any) {
    logger.error(`Update admin user error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Delete user
export const deleteAdminUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete associated employee if exists
    const employee = await Employee.findOne({ user: userId });
    if (employee) {
      await Employee.findByIdAndDelete(employee._id);
    }

    await User.findByIdAndDelete(userId);

    // Log activity
    await ActivityLog.create({
      user: req.user?.name || 'Admin',
      action: 'delete',
      resource: 'user',
      status: 'success',
      details: `Deleted user: ${user.email}${employee ? ' and associated employee' : ''}`,
      ipAddress: req.ip || 'unknown'
    });

    res.json({ message: `User${employee ? ' and associated employee' : ''} deleted successfully` });
  } catch (error: any) {
    logger.error(`Delete admin user error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get activity logs
export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const { action, status, limit = 100 } = req.query;
    
    const filter: any = {};
    if (action && action !== 'all') filter.action = action;
    if (status && status !== 'all') filter.status = status;

    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string));

    const formattedLogs = logs.map(log => ({
      id: log._id.toString(),
      timestamp: log.timestamp.toISOString(),
      user: log.user,
      action: log.action,
      resource: log.resource,
      status: log.status,
      details: log.details,
      ipAddress: log.ipAddress
    }));

    res.json(formattedLogs);
  } catch (error: any) {
    logger.error(`Get activity logs error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get admin settings
export const getAdminSettings = async (req: Request, res: Response) => {
  try {
    let settings = await AdminSettings.findOne();
    
    if (!settings) {
      // Create default settings
      settings = await AdminSettings.create({});
    }

    res.json(settings);
  } catch (error: any) {
    logger.error(`Get admin settings error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Update general settings
export const updateGeneralSettings = async (req: Request, res: Response) => {
  try {
    const settings = await AdminSettings.findOneAndUpdate(
      {},
      { $set: { general: req.body } },
      { new: true, upsert: true }
    );

    await ActivityLog.create({
      user: req.user?.name || 'Admin',
      action: 'update',
      resource: 'settings',
      status: 'success',
      details: 'Updated general settings',
      ipAddress: req.ip || 'unknown'
    });

    res.json(settings?.general);
  } catch (error: any) {
    logger.error(`Update general settings error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Update security settings
export const updateSecuritySettings = async (req: Request, res: Response) => {
  try {
    const settings = await AdminSettings.findOneAndUpdate(
      {},
      { $set: { security: req.body } },
      { new: true, upsert: true }
    );

    await ActivityLog.create({
      user: req.user?.name || 'Admin',
      action: 'update',
      resource: 'settings',
      status: 'success',
      details: 'Updated security settings',
      ipAddress: req.ip || 'unknown'
    });

    res.json(settings?.security);
  } catch (error: any) {
    logger.error(`Update security settings error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const settings = await AdminSettings.findOneAndUpdate(
      {},
      { $set: { notifications: req.body } },
      { new: true, upsert: true }
    );

    await ActivityLog.create({
      user: req.user?.name || 'Admin',
      action: 'update',
      resource: 'settings',
      status: 'success',
      details: 'Updated notification settings',
      ipAddress: req.ip || 'unknown'
    });

    res.json(settings?.notifications);
  } catch (error: any) {
    logger.error(`Update notification settings error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Update backup settings
export const updateBackupSettings = async (req: Request, res: Response) => {
  try {
    const settings = await AdminSettings.findOneAndUpdate(
      {},
      { $set: { backup: req.body } },
      { new: true, upsert: true }
    );

    await ActivityLog.create({
      user: req.user?.name || 'Admin',
      action: 'update',
      resource: 'settings',
      status: 'success',
      details: 'Updated backup settings',
      ipAddress: req.ip || 'unknown'
    });

    res.json(settings?.backup);
  } catch (error: any) {
    logger.error(`Update backup settings error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Trigger manual backup
export const triggerManualBackup = async (req: Request, res: Response) => {
  try {
    // Simulate backup process
    const timestamp = new Date().toISOString();
    
    // Update last backup date in settings
    await AdminSettings.findOneAndUpdate(
      {},
      { $set: { 'backup.lastBackupDate': timestamp } },
      { upsert: true }
    );

    await ActivityLog.create({
      user: req.user?.name || 'Admin',
      action: 'create',
      resource: 'backup',
      status: 'success',
      details: 'Manual backup triggered',
      ipAddress: req.ip || 'unknown'
    });

    res.json({ success: true, timestamp });
  } catch (error: any) {
    logger.error(`Trigger manual backup error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};