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
      user: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: 'create',
      resource: 'user',
      resourceType: 'other',
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
      user: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: 'update',
      resource: 'user',
      resourceType: 'other',
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
      user: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: 'delete',
      resource: 'user',
      resourceType: 'other',
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
      user: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: 'update',
      resource: 'settings',
      resourceType: 'other',
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
      user: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: 'update',
      resource: 'settings',
      resourceType: 'other',
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
      user: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: 'update',
      resource: 'settings',
      resourceType: 'other',
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
      user: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: 'update',
      resource: 'settings',
      resourceType: 'other',
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
      user: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: 'create',
      resource: 'backup',
      resourceType: 'other',
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

// Export logs
export const exportLogs = async (req: Request, res: Response) => {
  try {
    logger.info('Export logs request received', { 
      format: req.query.format, 
      user: req.user?.name,
      headers: req.headers.authorization ? 'Bearer token present' : 'No auth header'
    });
    
    const { format } = req.query;
    
    if (!format || !['text', 'pdf', 'excel', 'csv'].includes(format as string)) {
      return res.status(400).json({ error: 'Invalid format. Use text, pdf, excel, or csv' });
    }
    
    const logs = await ActivityLog.find().populate('user', 'name email').sort({ timestamp: -1 }).limit(1000);
    logger.info(`Found ${logs.length} logs to export`);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Log the export activity first
    await ActivityLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: 'export',
      resource: 'logs',
      status: 'success',
      details: `Exported logs as ${format}`,
      ipAddress: req.ip || 'unknown'
    });

    if (format === 'text') {
      const textContent = logs.map(log => 
        `${log.timestamp.toISOString()} | ${log.userName || (log.user as any)?.name || 'Unknown'} | ${log.action} | ${log.resource} | ${log.status || 'success'} | ${log.details || ''}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.txt"');
      res.send(textContent);
    } else if (format === 'pdf') {
      // Generate actual PDF content
      const jsPDF = require('jspdf').jsPDF;
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('ACTIVITY LOGS REPORT', 20, 20);
      
      // Add logs
      let yPosition = 40;
      doc.setFontSize(10);
      
      logs.slice(0, 50).forEach((log, index) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        
        const logText = `${log.timestamp.toISOString()} | ${log.userName || (log.user as any)?.name || 'Unknown'} | ${log.action} | ${log.resource} | ${log.status || 'success'}`;
        doc.text(logText, 20, yPosition);
        yPosition += 5;
      });
      
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.pdf"');
      res.send(pdfBuffer);
    } else if (format === 'excel') {
      // CSV format for Excel compatibility
      const csvContent = [
        'Timestamp,User,Action,Resource,Status,Details,IP Address',
        ...logs.map(log => 
          `"${log.timestamp.toISOString()}","${log.userName || (log.user as any)?.name || 'Unknown'}","${log.action}","${log.resource}","${log.status || 'success'}","${(log.details || '').replace(/"/g, '""')}","${log.ipAddress || 'N/A'}"`
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.csv"');
      res.send(csvContent);
    } else if (format === 'csv') {
      // Pure CSV format
      const csvContent = [
        'Timestamp,User,Action,Resource,Status,Details,IP Address',
        ...logs.map(log => 
          `"${log.timestamp.toISOString()}","${log.userName || (log.user as any)?.name || 'Unknown'}","${log.action}","${log.resource}","${log.status || 'success'}","${(log.details || '').replace(/"/g, '""')}","${log.ipAddress || 'N/A'}"`
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'application/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.csv"');
      res.send(csvContent);
    }
    
    logger.info('Export logs completed successfully', { format, user: req.user?.name });
  } catch (error: any) {
    logger.error(`Export logs error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
};