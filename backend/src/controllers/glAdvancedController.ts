import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';
import Scenario from '../models/Scenario';
import JournalEntry from '../models/JournalEntry';
import { AccountLedger } from '../models/AccountLedger';
import mongoose from 'mongoose';

// Audit Trail
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, userId, startDate, endDate, limit = 100 } = req.query;
    const query: any = {};
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }
    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(Number(limit)).populate('userId', 'name email');
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createAuditLog = async (userId: string, userName: string, action: string, entityType: string, entityId: string, changes: any, req?: any) => {
  await AuditLog.create({
    userId, userName, action, entityType, entityId, changes,
    ipAddress: req?.ip, userAgent: req?.get('user-agent')
  });
};

// Advanced Reports - Cash Flow
export const getCashFlowReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const match: any = { isPosted: true };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate as string);
      if (endDate) match.date.$lte = new Date(endDate as string);
    }
    
    const entries = await JournalEntry.find(match).populate('lines.accountId');
    const operating: any = { inflow: 0, outflow: 0 };
    const investing: any = { inflow: 0, outflow: 0 };
    const financing: any = { inflow: 0, outflow: 0 };

    entries.forEach(entry => {
      entry.lines.forEach((line: any) => {
        const acc = line.accountId;
        if (!acc) return;
        const category = acc.category || 'operating';
        if (line.debit > 0) {
          if (category === 'investing') investing.outflow += line.debit;
          else if (category === 'financing') financing.outflow += line.debit;
          else operating.outflow += line.debit;
        }
        if (line.credit > 0) {
          if (category === 'investing') investing.inflow += line.credit;
          else if (category === 'financing') financing.inflow += line.credit;
          else operating.inflow += line.credit;
        }
      });
    });

    res.json({
      operating: { ...operating, net: operating.inflow - operating.outflow },
      investing: { ...investing, net: investing.inflow - investing.outflow },
      financing: { ...financing, net: financing.inflow - financing.outflow },
      netCashFlow: (operating.inflow - operating.outflow) + (investing.inflow - investing.outflow) + (financing.inflow - financing.outflow)
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Funds Flow Report
export const getFundsFlowReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const match: any = { isPosted: true };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate as string);
      if (endDate) match.date.$lte = new Date(endDate as string);
    }

    const entries = await JournalEntry.find(match).populate('lines.accountId');
    const sources: any[] = [];
    const applications: any[] = [];

    entries.forEach(entry => {
      entry.lines.forEach((line: any) => {
        const acc = line.accountId;
        if (!acc) return;
        if (acc.type === 'liability' || acc.type === 'equity') {
          if (line.credit > 0) sources.push({ account: acc.name, amount: line.credit });
        }
        if (acc.type === 'asset') {
          if (line.debit > 0) applications.push({ account: acc.name, amount: line.debit });
        }
      });
    });

    res.json({ sources, applications, totalSources: sources.reduce((s, i) => s + i.amount, 0), totalApplications: applications.reduce((s, i) => s + i.amount, 0) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Ratio Analysis
export const getRatioAnalysis = async (req: Request, res: Response) => {
  try {
    const { asOfDate } = req.query;
    const date = asOfDate ? new Date(asOfDate as string) : new Date();
    
    const accounts = await AccountLedger.find({ isActive: true }).populate('accountId');
    let currentAssets = 0, currentLiabilities = 0, totalAssets = 0, totalLiabilities = 0, equity = 0, revenue = 0, expenses = 0;

    accounts.forEach(acc => {
      const account = acc.accountId as any;
      if (!account) return;
      const balance = acc.currentBalance || 0;
      if (account.type === 'asset') {
        totalAssets += balance;
        if (account.subType === 'current') currentAssets += balance;
      } else if (account.type === 'liability') {
        totalLiabilities += balance;
        if (account.subType === 'current') currentLiabilities += balance;
      } else if (account.type === 'equity') equity += balance;
      else if (account.type === 'revenue') revenue += balance;
      else if (account.type === 'expense') expenses += balance;
    });

    const netIncome = revenue - expenses;
    res.json({
      currentRatio: currentLiabilities ? (currentAssets / currentLiabilities).toFixed(2) : 0,
      debtToEquity: equity ? (totalLiabilities / equity).toFixed(2) : 0,
      returnOnAssets: totalAssets ? ((netIncome / totalAssets) * 100).toFixed(2) : 0,
      returnOnEquity: equity ? ((netIncome / equity) * 100).toFixed(2) : 0,
      profitMargin: revenue ? ((netIncome / revenue) * 100).toFixed(2) : 0
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Data Import/Export
export const exportData = async (req: Request, res: Response) => {
  try {
    const { type, format = 'json', startDate, endDate } = req.query;
    let data: any;
    const match: any = {};
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate as string);
      if (endDate) match.date.$lte = new Date(endDate as string);
    }

    if (type === 'journals') data = await JournalEntry.find(match);
    else if (type === 'accounts') data = await AccountLedger.find();
    else return res.status(400).json({ message: 'Invalid type' });

    if (format === 'csv') {
      const csv = data.map((d: any) => Object.values(d.toObject()).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}.csv`);
      return res.send(csv);
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const importData = async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    if (!Array.isArray(data)) return res.status(400).json({ message: 'Data must be array' });

    let imported = 0;
    if (type === 'journals') {
      for (const item of data) {
        await JournalEntry.create(item);
        imported++;
      }
    } else if (type === 'accounts') {
      for (const item of data) {
        await AccountLedger.create(item);
        imported++;
      }
    }
    res.json({ imported, total: data.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Scenario Management
export const getScenarios = async (req: Request, res: Response) => {
  try {
    const scenarios = await Scenario.find().populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(scenarios);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createScenario = async (req: Request, res: Response) => {
  try {
    const scenario = await Scenario.create({ ...req.body, createdBy: (req as any).user.userId });
    res.status(201).json(scenario);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateScenario = async (req: Request, res: Response) => {
  try {
    const scenario = await Scenario.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(scenario);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteScenario = async (req: Request, res: Response) => {
  try {
    await Scenario.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const applyScenario = async (req: Request, res: Response) => {
  try {
    const scenario = await Scenario.findById(req.params.id).populate('entries');
    if (!scenario) return res.status(404).json({ message: 'Not found' });
    
    const results = [];
    for (const entry of scenario.entries as any[]) {
      const newEntry = await JournalEntry.create({ ...entry.toObject(), _id: new mongoose.Types.ObjectId(), isPosted: false, reference: `SCENARIO-${scenario.name}` });
      results.push(newEntry);
    }
    res.json({ applied: results.length, entries: results });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Batch Operations
export const batchPostEntries = async (req: Request, res: Response) => {
  try {
    const { entryIds } = req.body;
    if (!Array.isArray(entryIds)) return res.status(400).json({ message: 'entryIds must be array' });

    const results = { success: 0, failed: 0, errors: [] as any[] };
    for (const id of entryIds) {
      try {
        await JournalEntry.findByIdAndUpdate(id, { isPosted: true });
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({ id, error: error.message });
      }
    }
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const batchDeleteEntries = async (req: Request, res: Response) => {
  try {
    const { entryIds } = req.body;
    if (!Array.isArray(entryIds)) return res.status(400).json({ message: 'entryIds must be array' });

    const result = await JournalEntry.deleteMany({ _id: { $in: entryIds }, isPosted: false });
    res.json({ deleted: result.deletedCount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
