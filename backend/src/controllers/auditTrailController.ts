import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';
import mongoose from 'mongoose';
import { Parser } from 'json2csv';
const { validationResult } = require('express-validator');

interface AuditFilter {
  module?: string;
  action?: string;
  userEmail?: { $regex: string; $options: string };
  ipAddress?: { $regex: string; $options: string };
  status?: string;
  timestamp?: {
    $gte?: Date;
    $lte?: Date;
  };
}

const sanitizeRegex = (input: string): string => {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 100);
};

const getClientIp = (req: Request): string => {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
         req.socket.remoteAddress || 
         'unknown';
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array(), code: 'VALIDATION_ERROR' });
    }

    const {
      page = 1,
      limit = 50,
      module,
      action,
      user,
      ipAddress,
      status,
      startDate,
      endDate
    } = req.query;

    const filter: AuditFilter = {};
    if (module && module !== 'all') filter.module = module as string;
    if (action && action !== 'all') filter.action = action as string;
    if (user) filter.userEmail = { $regex: sanitizeRegex(user as string), $options: 'i' };
    if (ipAddress) filter.ipAddress = { $regex: sanitizeRegex(ipAddress as string), $options: 'i' };
    if (status && status !== 'all') filter.status = status as string;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        const start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid start date', code: 'INVALID_DATE' });
        }
        filter.timestamp.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid end date', code: 'INVALID_DATE' });
        }
        filter.timestamp.$lte = end;
      }
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .select('-__v')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching audit logs:', error.message);
    }
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs', code: 'SERVER_ERROR' });
  }
};

export const getAuditStats = async (req: Request, res: Response) => {
  try {
    const [totalLogs, successCount, failedCount, uniqueUsers, topModules, topUsers] = await Promise.all([
      AuditLog.countDocuments().catch(() => 0),
      AuditLog.countDocuments({ status: 'Success' }).catch(() => 0),
      AuditLog.countDocuments({ status: 'Failed' }).catch(() => 0),
      AuditLog.distinct('userId').then(ids => ids.length).catch(() => 0),
      AuditLog.aggregate([
        { $group: { _id: '$module', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).then(results => 
        results.map(r => ({ module: r._id || 'Unknown', count: r.count }))
      ).catch(() => []),
      AuditLog.aggregate([
        { $group: { _id: '$userEmail', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).then(results => 
        results.map(r => ({ user: r._id || 'Unknown', count: r.count }))
      ).catch(() => [])
    ]);

    res.json({
      success: true,
      data: {
        totalLogs,
        successfulActions: successCount,
        failedActions: failedCount,
        uniqueUsers,
        topModules,
        topUsers
      }
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', code: 'SERVER_ERROR' });
  }
};

export const getAuditLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format', code: 'INVALID_ID' });
    }

    const log = await AuditLog.findById(id).select('-__v').lean();
    
    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching audit log:', error.message);
    }
    res.status(500).json({ success: false, message: 'Failed to fetch audit log', code: 'SERVER_ERROR' });
  }
};

export const createAuditLog = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array(), code: 'VALIDATION_ERROR' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    const { action, module, recordId, oldValue, newValue, additionalData } = req.body;

    const sanitize = (str: string | undefined): string => {
      if (!str) return '';
      return str.replace(/[\n\r]/g, ' ').substring(0, 5000);
    };

    const log = await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      action,
      module: sanitize(module),
      recordId: sanitize(recordId),
      oldValue: sanitize(oldValue),
      newValue: sanitize(newValue),
      ipAddress: getClientIp(req),
      userAgent: (req.get('User-Agent') || 'unknown').substring(0, 500),
      status: 'Success',
      additionalData: additionalData ? JSON.parse(JSON.stringify(additionalData)) : undefined
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating audit log:', error.message);
    }
    res.status(500).json({ success: false, message: 'Failed to create audit log', code: 'SERVER_ERROR' });
  }
};

export const getSecurityEvents = async (req: Request, res: Response) => {
  try {
    const events = await AuditLog.find({
      $or: [
        { status: 'Failed' },
        { action: 'LOGIN', status: 'Failed' }
      ]
    })
      .select('-__v')
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: events });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching security events:', error.message);
    }
    res.status(500).json({ success: false, message: 'Failed to fetch security events', code: 'SERVER_ERROR' });
  }
};

export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const { module, action, user, ipAddress, status, startDate, endDate, format = 'csv' } = req.query;

    const filter: AuditFilter = {};
    if (module && module !== 'all') filter.module = module as string;
    if (action && action !== 'all') filter.action = action as string;
    if (user) filter.userEmail = { $regex: sanitizeRegex(user as string), $options: 'i' };
    if (ipAddress) filter.ipAddress = { $regex: sanitizeRegex(ipAddress as string), $options: 'i' };
    if (status && status !== 'all') filter.status = status as string;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate as string);
      if (endDate) filter.timestamp.$lte = new Date(endDate as string);
    }

    const logs = await AuditLog.find(filter)
      .select('-__v -additionalData')
      .sort({ timestamp: -1 })
      .limit(10000)
      .lean();

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.json`);
      return res.json({ success: true, data: logs, exportedBy: req.user?.email, exportedAt: new Date() });
    }

    const fields = ['timestamp', 'userEmail', 'action', 'module', 'recordId', 'status', 'ipAddress'];
    const parser = new Parser({ fields });
    const csv = parser.parse(logs);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(csv);

    await AuditLog.create({
      userId: req.user?._id,
      userEmail: req.user?.email || 'system',
      action: 'VIEW',
      module: 'AUDIT_EXPORT',
      recordId: `${logs.length} records`,
      ipAddress: getClientIp(req),
      userAgent: (req.get('User-Agent') || 'unknown').substring(0, 500),
      status: 'Success'
    });
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to export audit logs', code: 'SERVER_ERROR' });
  }
};

export const getComplianceMetrics = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenYearsAgo = new Date(now.getTime() - 7 * 365 * 24 * 60 * 60 * 1000);

    const [totalLogs, recentLogs, oldestLog, failedLogins, criticalActions, uniqueUsers] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ timestamp: { $gte: thirtyDaysAgo } }),
      AuditLog.findOne().sort({ timestamp: 1 }).select('timestamp').lean(),
      AuditLog.countDocuments({ action: 'LOGIN', status: 'Failed', timestamp: { $gte: thirtyDaysAgo } }),
      AuditLog.countDocuments({ action: { $in: ['DELETE', 'UPDATE'] }, module: { $in: ['FINANCE', 'ACCOUNTING'] }, timestamp: { $gte: thirtyDaysAgo } }),
      AuditLog.distinct('userId', { timestamp: { $gte: thirtyDaysAgo } })
    ]);

    const retentionCompliance = oldestLog ? (oldestLog.timestamp <= sevenYearsAgo ? 100 : 95) : 100;
    const soxCompliance = failedLogins < 10 && criticalActions > 0 ? 98 : 85;
    const accessControlCompliance = uniqueUsers.length > 0 ? Math.min(100, 90 + uniqueUsers.length) : 90;

    res.json({
      success: true,
      data: {
        soxCompliance,
        dataRetention: retentionCompliance,
        accessControl: accessControlCompliance,
        metrics: {
          totalLogs,
          recentActivity: recentLogs,
          oldestLogDate: oldestLog?.timestamp,
          failedLogins,
          criticalActions,
          activeUsers: uniqueUsers.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching compliance metrics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch compliance metrics', code: 'SERVER_ERROR' });
  }
};

export const cleanupOldLogs = async (req: Request, res: Response) => {
  try {
    if (!req.user || (req.user as any).role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required', code: 'FORBIDDEN' });
    }

    const { days = 2555 } = req.query; // Default 7 years
    const cutoffDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const result = await AuditLog.deleteMany({ timestamp: { $lt: cutoffDate } });

    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DELETE',
      module: 'AUDIT_CLEANUP',
      recordId: `${result.deletedCount} logs`,
      ipAddress: getClientIp(req),
      userAgent: (req.get('User-Agent') || 'unknown').substring(0, 500),
      status: 'Success'
    });

    res.json({ success: true, message: `Deleted ${result.deletedCount} old audit logs`, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    res.status(500).json({ success: false, message: 'Failed to cleanup logs', code: 'SERVER_ERROR' });
  }
};
