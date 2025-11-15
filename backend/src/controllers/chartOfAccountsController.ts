import { Request, Response } from 'express';
import { Account } from '../models/Account';
import { AccountTemplate, AccountMapping, OpeningBalance } from '../models/AccountTemplate';
import JournalEntry from '../models/JournalEntry';

// Account Templates
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await AccountTemplate.find({ isActive: true });
    res.json({ success: true, data: templates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const applyTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const template = await AccountTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const createdAccounts = [];
    for (const acc of template.accounts) {
      const existing = await Account.findOne({ code: acc.code });
      if (!existing) {
        const account = await Account.create({
          ...acc,
          balance: 0,
          isActive: true
        });
        createdAccounts.push(account);
      }
    }

    res.json({ success: true, data: createdAccounts, count: createdAccounts.length });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Account Mapping
export const createMapping = async (req: Request, res: Response) => {
  try {
    const mapping = await AccountMapping.create(req.body);
    res.status(201).json({ success: true, data: mapping });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMappings = async (req: Request, res: Response) => {
  try {
    const { externalSystem } = req.query;
    const filter: any = { isActive: true };
    if (externalSystem) filter.externalSystem = externalSystem;

    const mappings = await AccountMapping.find(filter).populate('internalAccountId', 'code name');
    res.json({ success: true, data: mappings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Opening Balances
export const setOpeningBalance = async (req: Request, res: Response) => {
  try {
    const { accountId, fiscalYear, debitBalance, creditBalance } = req.body;
    const userId = (req as any).user?.id;

    const existing = await OpeningBalance.findOne({ accountId, fiscalYear });
    if (existing) {
      existing.debitBalance = debitBalance;
      existing.creditBalance = creditBalance;
      await existing.save();
      return res.json({ success: true, data: existing });
    }

    const opening = await OpeningBalance.create({
      accountId,
      fiscalYear,
      debitBalance,
      creditBalance,
      createdBy: userId
    });

    // Update account balance
    const account = await Account.findById(accountId);
    if (account) {
      account.openingBalance = debitBalance - creditBalance;
      account.balance = account.openingBalance;
      await account.save();
    }

    res.status(201).json({ success: true, data: opening });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOpeningBalances = async (req: Request, res: Response) => {
  try {
    const { fiscalYear } = req.query;
    const filter: any = {};
    if (fiscalYear) filter.fiscalYear = fiscalYear;

    const balances = await OpeningBalance.find(filter).populate('accountId', 'code name type');
    res.json({ success: true, data: balances });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk Operations
export const bulkImportAccounts = async (req: Request, res: Response) => {
  try {
    const { accounts } = req.body;
    const results = [];
    const errors = [];

    for (const acc of accounts) {
      try {
        const existing = await Account.findOne({ code: acc.code });
        if (existing) {
          errors.push({ code: acc.code, error: 'Account code already exists' });
          continue;
        }

        const account = await Account.create(acc);
        results.push(account);
      } catch (error: any) {
        errors.push({ code: acc.code, error: error.message });
      }
    }

    res.json({ success: true, data: results, errors, imported: results.length, failed: errors.length });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const exportAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await Account.find({ isActive: true }).populate('parentId', 'code name');
    
    const csv = [
      'Code,Name,Type,SubType,Category,Parent Code,Opening Balance,Current Balance,Is Group,Active',
      ...accounts.map((acc: any) => 
        `${acc.code},${acc.name},${acc.type},${acc.subType || ''},${acc.category || ''},${acc.parentId?.code || ''},${acc.openingBalance || 0},${acc.balance},${acc.isGroup},${acc.isActive}`
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=chart-of-accounts.csv');
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Account Restrictions
export const setAccountRestriction = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { allowPosting, restrictionReason } = req.body;

    const account = await Account.findByIdAndUpdate(
      accountId,
      { 
        allowPosting: allowPosting !== undefined ? allowPosting : true,
        restrictionReason: restrictionReason || ''
      },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.json({ success: true, data: account });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Consolidation Rules
export const getConsolidationReport = async (req: Request, res: Response) => {
  try {
    const { accountIds, startDate, endDate } = req.query;
    const ids = (accountIds as string).split(',');

    const accounts = await Account.find({ _id: { $in: ids } });
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    const query: any = {
      'lines.accountId': { $in: ids },
      isPosted: true
    };

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

    const entries = await JournalEntry.find(query).populate('lines.accountId', 'code name');

    res.json({
      success: true,
      data: {
        accounts: accounts.map(a => ({ code: a.code, name: a.name, balance: a.balance })),
        consolidatedBalance: totalBalance,
        transactionCount: entries.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reconciliation Status
export const updateReconciliationStatus = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { reconciliationStatus, lastReconciledDate, reconciledBalance } = req.body;

    const account = await Account.findByIdAndUpdate(
      accountId,
      {
        reconciliationStatus: reconciliationStatus || 'pending',
        lastReconciledDate: lastReconciledDate ? new Date(lastReconciledDate) : undefined,
        reconciledBalance: reconciledBalance || 0
      },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.json({ success: true, data: account });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getReconciliationReport = async (req: Request, res: Response) => {
  try {
    const accounts = await Account.find({ 
      isActive: true,
      type: { $in: ['asset', 'liability'] }
    }).select('code name balance reconciliationStatus lastReconciledDate reconciledBalance');

    const summary = {
      total: accounts.length,
      reconciled: accounts.filter(a => a.reconciliationStatus === 'reconciled').length,
      pending: accounts.filter(a => a.reconciliationStatus === 'pending').length,
      inProgress: accounts.filter(a => a.reconciliationStatus === 'in_progress').length
    };

    res.json({ success: true, data: { accounts, summary } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
