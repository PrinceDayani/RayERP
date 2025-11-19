import { Request, Response } from 'express';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Employee from '../models/Employee';
import Project from '../models/Project';
import Task from '../models/Task';
import Contact from '../models/Contact';
import User from '../models/User';
import Attendance from '../models/Attendance';
import Department from '../models/Department';
import Budget from '../models/Budget';
import { Role } from '../models/Role';
import Account from '../models/Account';
import ActivityLog from '../models/ActivityLog';
import Chat from '../models/Chat';
import Leave from '../models/Leave';
import Transaction from '../models/Transaction';
import Invoice from '../models/Invoice';
import Payment from '../models/Payment';
import Expense from '../models/Expense';
import { Settings } from '../models/Settings';
import BackupLog from '../models/BackupLog';
import BackupSchedule from '../models/BackupSchedule';


// Enhanced backup creation with logging and advanced options
export const createSystemBackup = async (req: Request, res: Response) => {
  const startTime = new Date();
  const backupId = crypto.randomUUID();
  
  // Create backup log entry
  const backupLog = new BackupLog({
    backupId,
    type: 'manual',
    backupType: req.query.backupType || 'full',
    status: 'in-progress',
    startTime,
    isEncrypted: req.query.encrypt === 'true',
    createdBy: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    },
    modules: req.query.modules ? req.query.modules.toString().split(',') : []
  });
  
  try {
    await backupLog.save();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupType = req.query.backupType as string || 'full';
    const backupFileName = `${backupType}-backup-${timestamp}.zip`;
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${backupFileName}"`);
    
    const archive = archiver('zip', { zlib: { level: 9 } });
    let totalSize = 0;
    
    archive.on('progress', (progress) => {
      totalSize = progress.entries.processed;
    });
    
    archive.on('error', async (err) => {
      await BackupLog.findByIdAndUpdate(backupLog._id, {
        status: 'failed',
        endTime: new Date(),
        errorMessage: err.message
      });
      throw err;
    });
    
    archive.pipe(res);
    
    // Selective data fetching based on modules
    const modules = req.query.modules ? req.query.modules.toString().split(',') : ['hr', 'projects', 'finance', 'contacts', 'users', 'system'];
    
    let dataToBackup: any = {};
    
    if (backupType === 'database' || backupType === 'full') {
      if (modules.includes('hr')) {
        const [employees, attendance, leaves] = await Promise.all([
          Employee.find().lean(),
          Attendance.find().lean(),
          Leave.find().lean()
        ]);
        dataToBackup = { ...dataToBackup, employees, attendance, leaves };
      }
      
      if (modules.includes('projects')) {
        const [projects, tasks] = await Promise.all([
          Project.find().lean(),
          Task.find().lean()
        ]);
        dataToBackup = { ...dataToBackup, projects, tasks };
      }
      
      if (modules.includes('finance')) {
        const [budgets, accounts, transactions, invoices, payments, expenses] = await Promise.all([
          Budget.find().lean(),
          Account.find().lean(),
          Transaction.find().lean(),
          Invoice.find().lean(),
          Payment.find().lean(),
          Expense.find().lean()
        ]);
        dataToBackup = { ...dataToBackup, budgets, accounts, transactions, invoices, payments, expenses };
      }
      
      if (modules.includes('contacts')) {
        const contacts = await Contact.find().lean();
        dataToBackup = { ...dataToBackup, contacts };
      }
      
      if (modules.includes('users')) {
        const [users, roles] = await Promise.all([
          User.find().select('-password').lean(),
          Role.find().lean()
        ]);
        dataToBackup = { ...dataToBackup, users, roles };
      }
      
      if (modules.includes('system')) {
        const [departments, settings, activityLogs, chats] = await Promise.all([
          Department.find().lean(),
          Settings.find().lean(),
          ActivityLog.find().lean(),
          Chat.find().lean()
        ]);
        dataToBackup = { ...dataToBackup, departments, settings, activityLogs, chats };
      }
      
      // Add data files to archive
      for (const [key, data] of Object.entries(dataToBackup)) {
        let content = JSON.stringify(data, null, 2);
        if (req.query.encrypt === 'true') {
          const cipher = crypto.createCipher('aes-256-cbc', process.env.BACKUP_ENCRYPTION_KEY || 'default-key');
          content = cipher.update(content, 'utf8', 'hex') + cipher.final('hex');
        }
        archive.append(content, { name: `${key}.json` });
      }
    }
    
    // Add files if requested
    if (backupType === 'files' || backupType === 'full') {
      const uploadsPath = path.join(__dirname, '../../uploads');
      if (fs.existsSync(uploadsPath)) {
        archive.directory(uploadsPath, 'uploads');
      }
      
      const publicUploadsPath = path.join(__dirname, '../../public/uploads');
      if (fs.existsSync(publicUploadsPath)) {
        archive.directory(publicUploadsPath, 'public-uploads');
      }
    }
    
    // Add metadata
    const metadata = {
      backupId,
      backupDate: startTime.toISOString(),
      version: '2.0.0',
      backupType,
      modules,
      isEncrypted: req.query.encrypt === 'true',
      createdBy: req.user.name,
      totalRecords: Object.keys(dataToBackup).reduce((acc, key) => {
        acc[key] = Array.isArray(dataToBackup[key]) ? dataToBackup[key].length : 0;
        return acc;
      }, {} as any)
    };
    archive.append(JSON.stringify(metadata, null, 2), { name: 'backup-info.json' });
    
    // Finalize and update log
    archive.on('end', async () => {
      const endTime = new Date();
      await BackupLog.findByIdAndUpdate(backupLog._id, {
        status: 'success',
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        size: archive.pointer()
      });
    });
    
    await archive.finalize();
    
  } catch (error) {
    console.error('Backup creation error:', error);
    await BackupLog.findByIdAndUpdate(backupLog._id, {
      status: 'failed',
      endTime: new Date(),
      errorMessage: error.message
    });
    res.status(500).json({ message: 'Failed to create backup', error: error.message });
  }
};

// Get backup logs with pagination
export const getBackupLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const logs = await BackupLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await BackupLog.countDocuments();
    
    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch backup logs', error: error.message });
  }
};

// Verify backup integrity
export const verifyBackup = async (req: Request, res: Response) => {
  try {
    const { backupId } = req.params;
    
    const backupLog = await BackupLog.findOne({ backupId });
    if (!backupLog) {
      return res.status(404).json({ message: 'Backup not found' });
    }
    
    // Simple verification - check if backup exists and has valid metadata
    const isHealthy = backupLog.status === 'success' && backupLog.size > 0;
    
    await BackupLog.findByIdAndUpdate(backupLog._id, {
      isHealthy,
      metadata: { ...backupLog.metadata, lastVerified: new Date() }
    });
    
    res.json({
      success: true,
      message: isHealthy ? 'Backup is healthy' : 'Backup verification failed',
      isHealthy
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify backup', error: error.message });
  }
};

// Create backup schedule
export const createBackupSchedule = async (req: Request, res: Response) => {
  try {
    const schedule = new BackupSchedule({
      ...req.body,
      createdBy: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    });
    
    await schedule.save();
    res.status(201).json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create backup schedule', error: error.message });
  }
};

// Get backup schedules
export const getBackupSchedules = async (req: Request, res: Response) => {
  try {
    const schedules = await BackupSchedule.find().sort({ createdAt: -1 });
    res.json({ success: true, schedules });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch backup schedules', error: error.message });
  }
};

// Update backup schedule
export const updateBackupSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schedule = await BackupSchedule.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    res.json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update backup schedule', error: error.message });
  }
};

// Delete backup schedule
export const deleteBackupSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schedule = await BackupSchedule.findByIdAndDelete(id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete backup schedule', error: error.message });
  }
};

// Restore from backup
export const restoreFromBackup = async (req: Request, res: Response) => {
  try {
    const { backupId, modules, overwrite = false } = req.body;
    
    if (!req.files || Array.isArray(req.files) || !req.files.backupFile) {
      return res.status(400).json({ message: 'Backup file is required' });
    }
    
    const backupFile = req.files.backupFile as any;
    const restoreId = crypto.randomUUID();
    
    // Create restore log
    const restoreLog = new BackupLog({
      backupId: restoreId,
      type: 'restore',
      status: 'in-progress',
      startTime: new Date(),
      createdBy: {
        id: req.user?.id,
        name: req.user?.name || 'System',
        email: req.user?.email || 'system@erp.com'
      },
      modules: modules || []
    });
    
    await restoreLog.save();
    
    // Extract and parse backup
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(backupFile.data);
    const entries = zip.getEntries();
    
    let restoredCount = 0;
    const errors: string[] = [];
    
    for (const entry of entries) {
      if (entry.entryName.endsWith('.json') && entry.entryName !== 'backup-info.json') {
        try {
          const content = entry.getData().toString('utf8');
          let data = JSON.parse(content);
          
          const collection = entry.entryName.replace('.json', '');
          
          if (!modules || modules.includes(getModuleForCollection(collection))) {
            await restoreCollection(collection, data, overwrite);
            restoredCount++;
          }
        } catch (err) {
          errors.push(`Failed to restore ${entry.entryName}: ${err.message}`);
        }
      }
    }
    
    await BackupLog.findByIdAndUpdate(restoreLog._id, {
      status: errors.length > 0 ? 'partial' : 'success',
      endTime: new Date(),
      metadata: { restoredCount, errors }
    });
    
    res.json({
      success: true,
      message: `Restore completed. ${restoredCount} collections restored.`,
      restoredCount,
      errors
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Restore failed', error: error.message });
  }
};

// Validate backup file
export const validateBackup = async (req: Request, res: Response) => {
  try {
    if (!req.files || Array.isArray(req.files) || !req.files.backupFile) {
      return res.status(400).json({ message: 'Backup file is required' });
    }
    
    const backupFile = req.files.backupFile as any;
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(backupFile.data);
    
    const infoEntry = zip.getEntry('backup-info.json');
    if (!infoEntry) {
      return res.status(400).json({ message: 'Invalid backup file - missing metadata' });
    }
    
    const metadata = JSON.parse(infoEntry.getData().toString('utf8'));
    const entries = zip.getEntries().filter(e => e.entryName.endsWith('.json'));
    
    res.json({
      success: true,
      metadata,
      collections: entries.map(e => e.entryName.replace('.json', '')),
      isValid: true
    });
    
  } catch (error) {
    res.status(400).json({ message: 'Invalid backup file', error: error.message });
  }
};

// Preview restore changes
export const previewRestore = async (req: Request, res: Response) => {
  try {
    const { modules } = req.body;
    
    const preview = {
      willOverwrite: [],
      willCreate: [],
      conflicts: []
    };
    
    for (const module of modules || []) {
      const collections = getCollectionsForModule(module);
      for (const collection of collections) {
        const model = getModelForCollection(collection);
        if (model) {
          const count = await model.countDocuments();
          if (count > 0) {
            preview.willOverwrite.push({ collection, existingRecords: count });
          } else {
            preview.willCreate.push({ collection });
          }
        }
      }
    }
    
    res.json({ success: true, preview });
    
  } catch (error) {
    res.status(500).json({ message: 'Preview failed', error: error.message });
  }
};

// Helper functions
const getModuleForCollection = (collection: string): string => {
  const moduleMap: { [key: string]: string } = {
    employees: 'hr', attendance: 'hr', leaves: 'hr',
    projects: 'projects', tasks: 'projects',
    budgets: 'finance', accounts: 'finance', transactions: 'finance',
    invoices: 'finance', payments: 'finance', expenses: 'finance',
    contacts: 'contacts',
    users: 'users', roles: 'users',
    departments: 'system', settings: 'system', activityLogs: 'system', chats: 'system'
  };
  return moduleMap[collection] || 'system';
};

const getCollectionsForModule = (module: string): string[] => {
  const collections: { [key: string]: string[] } = {
    hr: ['employees', 'attendance', 'leaves'],
    projects: ['projects', 'tasks'],
    finance: ['budgets', 'accounts', 'transactions', 'invoices', 'payments', 'expenses'],
    contacts: ['contacts'],
    users: ['users', 'roles'],
    system: ['departments', 'settings', 'activityLogs', 'chats']
  };
  return collections[module] || [];
};

const getModelForCollection = (collection: string) => {
  const models: { [key: string]: any } = {
    employees: Employee, attendance: Attendance, leaves: Leave,
    projects: Project, tasks: Task,
    budgets: Budget, accounts: Account, transactions: Transaction,
    invoices: Invoice, payments: Payment, expenses: Expense,
    contacts: Contact, users: User, roles: Role,
    departments: Department, settings: Settings, activityLogs: ActivityLog, chats: Chat
  };
  return models[collection];
};

const restoreCollection = async (collection: string, data: any[], overwrite: boolean) => {
  const model = getModelForCollection(collection);
  if (!model) return;
  
  if (overwrite) {
    await model.deleteMany({});
  }
  
  if (data.length > 0) {
    await model.insertMany(data, { ordered: false });
  }
};