import { Request, Response } from 'express';
import { Currency, ExchangeRate } from '../models/Currency';
import TaxConfig from '../models/TaxConfig';
import AuditLog from '../models/AuditLog';
import ApprovalWorkflow from '../models/ApprovalWorkflow';
import FinancialDocument from '../models/FinancialDocument';
import SmartAlert from '../models/SmartAlert';
import { JournalEntry } from '../models/JournalEntry';
import Account from '../models/Account';
import FiscalYear from '../models/FiscalYear';

// Multi-Currency
export const getCurrencies = async (req: Request, res: Response) => {
  try {
    const currencies = await Currency.find();
    res.json({ currencies });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createCurrency = async (req: Request, res: Response) => {
  try {
    const currency = await Currency.create(req.body);
    res.status(201).json({ currency });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getExchangeRates = async (req: Request, res: Response) => {
  try {
    const rates = await ExchangeRate.find().sort({ date: -1 }).limit(100);
    res.json({ rates });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createExchangeRate = async (req: Request, res: Response) => {
  try {
    const rate = await ExchangeRate.create(req.body);
    res.status(201).json({ rate });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Tax Management
export const getTaxConfigs = async (req: Request, res: Response) => {
  try {
    const taxes = await TaxConfig.find();
    res.json({ taxes });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTaxConfig = async (req: Request, res: Response) => {
  try {
    const tax = await TaxConfig.create(req.body);
    res.status(201).json({ tax });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Aging Analysis
export const getAgingAnalysis = async (req: Request, res: Response) => {
  try {
    const { type = 'receivables' } = req.query;
    const accountType = type === 'receivables' ? 'ACCOUNTS_RECEIVABLE' : 'ACCOUNTS_PAYABLE';
    
    const accounts = await Account.find({ type: accountType });
    const now = new Date();
    
    const aging = await Promise.all(accounts.map(async (acc) => {
      const entries = await JournalEntry.find({
        'lines.accountId': acc._id,
        isPosted: true
      }).sort({ date: 1 });
      
      let current = 0, days30 = 0, days60 = 0, days90 = 0, over90 = 0;
      
      entries.forEach(entry => {
        const daysDiff = Math.floor((now.getTime() - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24));
        const line = entry.lines.find((li: any) => li.accountId.toString() === acc._id.toString());
        const amount = line ? (line.debit || line.credit) : 0;
        
        if (daysDiff <= 30) current += amount;
        else if (daysDiff <= 60) days30 += amount;
        else if (daysDiff <= 90) days60 += amount;
        else if (daysDiff <= 120) days90 += amount;
        else over90 += amount;
      });
      
      return { account: acc.name, current, days30, days60, days90, over90 };
    }));
    
    res.json({ aging: aging.filter(a => a.current + a.days30 + a.days60 + a.days90 + a.over90 > 0) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Year-End Closing
export const getFinancialYears = async (req: Request, res: Response) => {
  try {
    const years = await FiscalYear.find().sort({ startDate: -1 });
    res.json({ years });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createFinancialYear = async (req: Request, res: Response) => {
  try {
    const year = await FiscalYear.create(req.body);
    res.status(201).json({ year });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const closeFinancialYear = async (req: Request, res: Response) => {
  try {
    const { yearId } = req.body;
    const userId = (req as any).user.id;
    
    const fiscalYear = await FiscalYear.findById(yearId);
    if (!fiscalYear) return res.status(404).json({ message: 'Fiscal year not found' });
    if (fiscalYear.status === 'CLOSED') return res.status(400).json({ message: 'Year already closed' });
    
    const accounts = await Account.find();
    const openingBalances = await Promise.all(accounts.map(async (acc) => {
      const entries = await JournalEntry.find({
        'lines.accountId': acc._id,
        isPosted: true,
        date: { $gte: fiscalYear.startDate, $lte: fiscalYear.endDate }
      });
      
      let balance = 0;
      entries.forEach(entry => {
        entry.lines.forEach((line: any) => {
          if (line.accountId.toString() === acc._id.toString()) {
            balance += line.debit - line.credit;
          }
        });
      });
      
      return { accountId: acc._id, balance };
    }));
    
    fiscalYear.status = 'CLOSED';
    fiscalYear.closedBy = userId;
    fiscalYear.closedAt = new Date();
    fiscalYear.openingBalances = openingBalances.filter(ob => ob.balance !== 0);
    await fiscalYear.save();
    
    const nextYearStart = new Date(fiscalYear.endDate);
    nextYearStart.setDate(nextYearStart.getDate() + 1);
    const nextYearEnd = new Date(nextYearStart);
    nextYearEnd.setFullYear(nextYearEnd.getFullYear() + 1);
    nextYearEnd.setDate(nextYearEnd.getDate() - 1);
    
    const nextYear = await FiscalYear.create({
      year: `${nextYearStart.getFullYear()}-${(nextYearStart.getFullYear() + 1).toString().slice(-2)}`,
      startDate: nextYearStart,
      endDate: nextYearEnd,
      status: 'OPEN',
      openingBalances: fiscalYear.openingBalances
    });
    
    res.json({ message: 'Year closed successfully', closedYear: fiscalYear, nextYear });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Audit Trail
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, entityType } = req.query;
    const query = entityType ? { entityType } : {};
    
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('userId', 'name email');
    
    const total = await AuditLog.countDocuments(query);
    
    res.json({ logs, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Approval Workflows
export const getApprovals = async (req: Request, res: Response) => {
  try {
    const approvals = await ApprovalWorkflow.find()
      .populate('requestedBy', 'name email')
      .populate('approvers.userId', 'name email')
      .sort({ requestedAt: -1 });
    
    res.json({ approvals });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createApproval = async (req: Request, res: Response) => {
  try {
    const approval = await ApprovalWorkflow.create({ ...req.body, requestedBy: (req as any).user.id });
    res.status(201).json({ approval });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateApprovalStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user.id;
    
    const approval = await ApprovalWorkflow.findById(id);
    if (!approval) return res.status(404).json({ message: 'Approval not found' });
    
    const approver = approval.approvers.find(a => a.userId.toString() === userId);
    if (approver) {
      approver.status = status;
      approver.approvedAt = new Date();
    }
    
    await approval.save();
    res.json({ approval });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Document Manager
export const getDocuments = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.query;
    const query: any = {};
    if (entityType) query['linkedTo.entityType'] = entityType;
    if (entityId) query['linkedTo.entityId'] = entityId;
    
    const documents = await FinancialDocument.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 });
    
    res.json({ documents });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const document = await FinancialDocument.create({ ...req.body, uploadedBy: (req as any).user.id });
    res.status(201).json({ document });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Smart Alerts
export const getAlerts = async (req: Request, res: Response) => {
  try {
    const { isResolved = false } = req.query;
    const alerts = await SmartAlert.find({ isResolved: isResolved === 'true' })
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({ alerts });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const resolveAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const alert = await SmartAlert.findByIdAndUpdate(
      id,
      { isResolved: true, resolvedBy: (req as any).user.id, resolvedAt: new Date() },
      { new: true }
    );
    
    res.json({ alert });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const detectDuplicates = async (req: Request, res: Response) => {
  try {
    const entries = await JournalEntry.aggregate([
      { $group: { _id: { amount: '$totalDebit', date: '$date' }, count: { $sum: 1 }, entries: { $push: '$$ROOT' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    for (const dup of entries) {
      const existing = await SmartAlert.findOne({ 
        entityType: 'JOURNAL_ENTRY', 
        entityId: dup.entries[0]._id,
        type: 'DUPLICATE'
      });
      
      if (!existing) {
        await SmartAlert.create({
          type: 'DUPLICATE',
          severity: 'MEDIUM',
          message: `Duplicate entry detected: ${dup.count} entries with amount ${dup._id.amount}`,
          entityType: 'JOURNAL_ENTRY',
          entityId: dup.entries[0]._id
        });
      }
    }
    
    res.json({ duplicates: entries.length, entries });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const autoDetectAnomalies = async (req: Request, res: Response) => {
  try {
    const recentEntries = await JournalEntry.find({ isPosted: true }).sort({ date: -1 }).limit(100);
    const amounts = recentEntries.map(e => e.totalDebit);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / amounts.length);
    
    let alertsCreated = 0;
    for (const entry of recentEntries) {
      if (Math.abs(entry.totalDebit - avg) > 3 * stdDev) {
        const existing = await SmartAlert.findOne({ entityType: 'JOURNAL_ENTRY', entityId: entry._id, type: 'ANOMALY' });
        if (!existing) {
          await SmartAlert.create({
            type: 'ANOMALY',
            severity: 'HIGH',
            message: `Unusual transaction amount: ₹${entry.totalDebit.toFixed(2)} (avg: ₹${avg.toFixed(2)})`,
            entityType: 'JOURNAL_ENTRY',
            entityId: entry._id
          });
          alertsCreated++;
        }
      }
    }
    
    res.json({ message: `Detected ${alertsCreated} anomalies`, alertsCreated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
