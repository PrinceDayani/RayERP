import { Request, Response } from 'express';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
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
import Settings from '../models/Settings';

export const createSystemBackup = async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `erp-backup-${timestamp}.zip`;
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${backupFileName}"`);
    
    // Create archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    // Pipe archive to response
    archive.pipe(res);
    
    // Fetch all data from database
    const [employees, projects, tasks, contacts, users, attendance, departments, budgets, roles, accounts, activityLogs, chats, leaves, transactions, invoices, payments, expenses, settings] = await Promise.all([
      Employee.find().lean(),
      Project.find().lean(),
      Task.find().lean(),
      Contact.find().lean(),
      User.find().select('-password').lean(),
      Attendance.find().lean(),
      Department.find().lean(),
      Budget.find().lean(),
      Role.find().lean(),
      Account.find().lean(),
      ActivityLog.find().lean(),
      Chat.find().lean(),
      Leave.find().lean(),
      Transaction.find().lean(),
      Invoice.find().lean(),
      Payment.find().lean(),
      Expense.find().lean(),
      Settings.find().lean()
    ]);
    
    // Add data files to archive
    archive.append(JSON.stringify(employees, null, 2), { name: 'employees.json' });
    archive.append(JSON.stringify(projects, null, 2), { name: 'projects.json' });
    archive.append(JSON.stringify(tasks, null, 2), { name: 'tasks.json' });
    archive.append(JSON.stringify(contacts, null, 2), { name: 'contacts.json' });
    archive.append(JSON.stringify(users, null, 2), { name: 'users.json' });
    archive.append(JSON.stringify(attendance, null, 2), { name: 'attendance.json' });
    archive.append(JSON.stringify(departments, null, 2), { name: 'departments.json' });
    archive.append(JSON.stringify(budgets, null, 2), { name: 'budgets.json' });
    archive.append(JSON.stringify(roles, null, 2), { name: 'roles.json' });
    archive.append(JSON.stringify(accounts, null, 2), { name: 'accounts.json' });
    archive.append(JSON.stringify(activityLogs, null, 2), { name: 'activity-logs.json' });
    archive.append(JSON.stringify(chats, null, 2), { name: 'chats.json' });
    archive.append(JSON.stringify(leaves, null, 2), { name: 'leaves.json' });
    archive.append(JSON.stringify(transactions, null, 2), { name: 'transactions.json' });
    archive.append(JSON.stringify(invoices, null, 2), { name: 'invoices.json' });
    archive.append(JSON.stringify(payments, null, 2), { name: 'payments.json' });
    archive.append(JSON.stringify(expenses, null, 2), { name: 'expenses.json' });
    archive.append(JSON.stringify(settings, null, 2), { name: 'settings.json' });
    
    // Add backup metadata
    const metadata = {
      backupDate: new Date().toISOString(),
      version: '1.0.0',
      totalRecords: {
        employees: employees.length,
        projects: projects.length,
        tasks: tasks.length,
        contacts: contacts.length,
        users: users.length,
        attendance: attendance.length,
        departments: departments.length,
        budgets: budgets.length,
        roles: roles.length,
        accounts: accounts.length,
        activityLogs: activityLogs.length,
        chats: chats.length,
        leaves: leaves.length,
        transactions: transactions.length,
        invoices: invoices.length,
        payments: payments.length,
        expenses: expenses.length,
        settings: settings.length
      }
    };
    archive.append(JSON.stringify(metadata, null, 2), { name: 'backup-info.json' });
    
    // Add uploaded files if they exist
    const uploadsPath = path.join(__dirname, '../../uploads');
    if (fs.existsSync(uploadsPath)) {
      archive.directory(uploadsPath, 'uploads');
    }
    
    // Also check for public uploads
    const publicUploadsPath = path.join(__dirname, '../../public/uploads');
    if (fs.existsSync(publicUploadsPath)) {
      archive.directory(publicUploadsPath, 'public-uploads');
    }
    
    // Finalize the archive
    await archive.finalize();
    
  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({ message: 'Failed to create backup', error: error.message });
  }
};