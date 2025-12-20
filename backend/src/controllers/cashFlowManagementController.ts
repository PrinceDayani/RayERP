import { Request, Response } from 'express';
import { Ledger } from '../models/Ledger';
import { CashFlowRule } from '../models/CashFlowRule';
import ChartOfAccount from '../models/ChartOfAccount';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// Get entries needing review
export const getEntriesNeedingReview = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [entries, total] = await Promise.all([
      Ledger.find({ needsReview: true })
        .populate('accountId', 'name code')
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Ledger.countDocuments({ needsReview: true })
    ]);

    logger.info(`Retrieved ${entries.length} entries needing review`);

    res.json({
      success: true,
      data: entries,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error: any) {
    logger.error('Get entries needing review error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve entries', error: error.message });
  }
};

// Override category manually
export const overrideCategory = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (!req.user) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { ledgerId } = req.params;
    const { category, reason } = req.body;

    const ledger = await Ledger.findById(ledgerId).session(session);
    if (!ledger) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Ledger entry not found' });
    }

    const oldCategory = ledger.cashFlowCategory || 'NONE';

    // Add to history
    if (!ledger.categoryHistory) ledger.categoryHistory = [];
    ledger.categoryHistory.push({
      from: oldCategory,
      to: category,
      changedBy: req.user.id,
      changedAt: new Date(),
      reason
    });

    ledger.cashFlowCategory = category;
    ledger.manualCategoryOverride = true;
    ledger.overriddenBy = req.user.id;
    ledger.overriddenAt = new Date();
    ledger.overrideReason = reason;
    ledger.needsReview = false;

    await ledger.save({ session });
    await session.commitTransaction();

    logger.info(`Category overridden for ledger ${ledgerId}: ${oldCategory} -> ${category} by user ${req.user.id}`);

    res.json({ success: true, data: ledger });
  } catch (error: any) {
    await session.abortTransaction();
    logger.error('Override category error:', error);
    res.status(500).json({ success: false, message: 'Failed to override category', error: error.message });
  } finally {
    session.endSession();
  }
};

// Batch update categories
export const batchUpdateCategories = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (!req.user) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { ledgerIds, category, reason } = req.body;

    if (!Array.isArray(ledgerIds) || ledgerIds.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'ledgerIds array is required' });
    }

    if (ledgerIds.length > 1000) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Maximum 1000 entries can be updated at once' });
    }

    // Update each entry with history
    const ledgers = await Ledger.find({ _id: { $in: ledgerIds } }).session(session);
    
    for (const ledger of ledgers) {
      if (!ledger.categoryHistory) ledger.categoryHistory = [];
      ledger.categoryHistory.push({
        from: ledger.cashFlowCategory || 'NONE',
        to: category,
        changedBy: req.user.id,
        changedAt: new Date(),
        reason
      });
      
      ledger.cashFlowCategory = category;
      ledger.manualCategoryOverride = true;
      ledger.overriddenBy = req.user.id;
      ledger.overriddenAt = new Date();
      ledger.overrideReason = reason;
      ledger.needsReview = false;
      
      await ledger.save({ session });
    }

    await session.commitTransaction();

    logger.info(`Batch updated ${ledgers.length} entries to ${category} by user ${req.user.id}`);

    res.json({ success: true, updated: ledgers.length });
  } catch (error: any) {
    await session.abortTransaction();
    logger.error('Batch update error:', error);
    res.status(500).json({ success: false, message: 'Failed to batch update', error: error.message });
  } finally {
    session.endSession();
  }
};

// Create cash flow rule
export const createCashFlowRule = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const ruleData = { ...req.body, createdBy: req.user.id, applicationCount: 0 };
    const rule = new CashFlowRule(ruleData);
    await rule.save();

    logger.info(`Cash flow rule created: ${rule.name} by user ${req.user.id}`);

    res.status(201).json({ success: true, data: rule });
  } catch (error: any) {
    logger.error('Create rule error:', error);
    res.status(400).json({ success: false, message: 'Failed to create rule', error: error.message });
  }
};

// Get all rules
export const getCashFlowRules = async (req: Request, res: Response) => {
  try {
    const rules = await CashFlowRule.find()
      .sort({ priority: -1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .lean();
    
    res.json({ success: true, data: rules });
  } catch (error: any) {
    logger.error('Get rules error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve rules', error: error.message });
  }
};

// Update rule
export const updateCashFlowRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const rule = await CashFlowRule.findByIdAndUpdate(ruleId, req.body, { new: true, runValidators: true });
    
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    logger.info(`Cash flow rule updated: ${ruleId}`);

    res.json({ success: true, data: rule });
  } catch (error: any) {
    logger.error('Update rule error:', error);
    res.status(500).json({ success: false, message: 'Failed to update rule', error: error.message });
  }
};

// Delete rule
export const deleteCashFlowRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const rule = await CashFlowRule.findByIdAndDelete(ruleId);
    
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    logger.info(`Cash flow rule deleted: ${ruleId}`);
    
    res.json({ success: true, message: 'Rule deleted successfully' });
  } catch (error: any) {
    logger.error('Delete rule error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete rule', error: error.message });
  }
};

// Cash flow reconciliation
export const getCashFlowReconciliation = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Get cash accounts
    const cashAccounts = await ChartOfAccount.find({ type: 'ASSET', subType: 'cash', isActive: true }).lean();
    
    if (cashAccounts.length === 0) {
      return res.status(404).json({ success: false, message: 'No cash accounts found' });
    }
    
    const cashAccountIds = cashAccounts.map(a => a._id);

    // Opening balance
    const openingEntries = await Ledger.find({ 
      accountId: { $in: cashAccountIds },
      date: { $lt: start }
    }).lean();
    const openingBalance = openingEntries.reduce((sum, e) => sum + e.debit - e.credit, 0);

    // Cash flow by category
    const cashFlowEntries = await Ledger.find({
      accountId: { $in: cashAccountIds },
      date: { $gte: start, $lte: end },
      cashFlowCategory: { $in: ['OPERATING', 'INVESTING', 'FINANCING'] }
    }).lean();

    const operating = cashFlowEntries
      .filter(e => e.cashFlowCategory === 'OPERATING')
      .reduce((sum, e) => sum + e.debit - e.credit, 0);
    
    const investing = cashFlowEntries
      .filter(e => e.cashFlowCategory === 'INVESTING')
      .reduce((sum, e) => sum + e.debit - e.credit, 0);
    
    const financing = cashFlowEntries
      .filter(e => e.cashFlowCategory === 'FINANCING')
      .reduce((sum, e) => sum + e.debit - e.credit, 0);

    const netCashFlow = operating + investing + financing;
    const calculatedClosing = openingBalance + netCashFlow;

    // Actual closing balance
    const closingEntries = await Ledger.find({ 
      accountId: { $in: cashAccountIds },
      date: { $lte: end }
    }).lean();
    const actualClosing = closingEntries.reduce((sum, e) => sum + e.debit - e.credit, 0);

    const variance = actualClosing - calculatedClosing;
    const isReconciled = Math.abs(variance) < 0.01;

    logger.info(`Cash flow reconciliation: variance=${variance}, reconciled=${isReconciled}`);

    res.json({
      success: true,
      data: {
        openingBalance: Math.round(openingBalance * 100) / 100,
        operating: Math.round(operating * 100) / 100,
        investing: Math.round(investing * 100) / 100,
        financing: Math.round(financing * 100) / 100,
        netCashFlow: Math.round(netCashFlow * 100) / 100,
        calculatedClosing: Math.round(calculatedClosing * 100) / 100,
        actualClosing: Math.round(actualClosing * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        isReconciled
      }
    });
  } catch (error: any) {
    logger.error('Reconciliation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate reconciliation', error: error.message });
  }
};

// Get category statistics
export const getCategoryStatistics = async (req: Request, res: Response) => {
  try {
    const stats = await Ledger.aggregate([
      {
        $match: {
          cashFlowCategory: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$cashFlowCategory',
          count: { $sum: 1 },
          needsReview: {
            $sum: { $cond: ['$needsReview', 1, 0] }
          },
          manualOverrides: {
            $sum: { $cond: ['$manualCategoryOverride', 1, 0] }
          },
          avgConfidence: { $avg: '$categoryConfidence' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const totalEntries = stats.reduce((sum, s) => sum + s.count, 0);
    const totalNeedsReview = stats.reduce((sum, s) => sum + s.needsReview, 0);

    res.json({ 
      success: true, 
      data: {
        byCategory: stats,
        summary: {
          totalEntries,
          totalNeedsReview,
          reviewPercentage: totalEntries > 0 ? Math.round((totalNeedsReview / totalEntries) * 100) : 0
        }
      }
    });
  } catch (error: any) {
    logger.error('Get statistics error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve statistics', error: error.message });
  }
};

// Apply rule to historical data
export const applyRuleToHistoricalData = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (!req.user) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { ruleId } = req.params;
    const { startDate, endDate } = req.body;

    const rule = await CashFlowRule.findById(ruleId).session(session);
    if (!rule || !rule.isActive) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Rule not found or inactive' });
    }

    const query: any = { cashFlowCategory: { $exists: true } };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const ledgers = await Ledger.find(query).session(session);
    
    let applied = 0;
    let updated = 0;
    let failed = 0;

    for (const ledger of ledgers) {
      const account = await ChartOfAccount.findById(ledger.accountId).session(session);
      if (!account || account.type !== 'ASSET' || account.subType !== 'cash') continue;

      const matches = matchesRuleConditions(rule, ledger, account);
      if (matches) {
        applied++;
        try {
          if (!ledger.categoryHistory) ledger.categoryHistory = [];
          ledger.categoryHistory.push({
            from: ledger.cashFlowCategory || 'NONE',
            to: rule.category,
            changedBy: req.user.id,
            changedAt: new Date(),
            reason: `Applied rule: ${rule.name}`
          });

          ledger.cashFlowCategory = rule.category;
          ledger.manualCategoryOverride = true;
          ledger.overriddenBy = req.user.id;
          ledger.overriddenAt = new Date();
          ledger.overrideReason = `Applied rule: ${rule.name}`;
          ledger.needsReview = false;

          await ledger.save({ session });
          updated++;
        } catch (error) {
          failed++;
        }
      }
    }

    rule.lastAppliedAt = new Date();
    rule.applicationCount += updated;
    await rule.save({ session });

    await session.commitTransaction();

    logger.info(`Rule ${ruleId} applied: ${updated} updated, ${failed} failed`);

    res.json({ success: true, data: { applied, updated, failed } });
  } catch (error: any) {
    await session.abortTransaction();
    logger.error('Apply rule error:', error);
    res.status(500).json({ success: false, message: 'Failed to apply rule', error: error.message });
  } finally {
    session.endSession();
  }
};

function matchesRuleConditions(rule: any, ledger: any, account: any): boolean {
  const cond = rule.conditions;
  
  if (cond.accountIds?.length && !cond.accountIds.some((id: any) => id.toString() === account._id.toString())) {
    return false;
  }
  
  if (cond.descriptionContains?.length) {
    const desc = ledger.description.toLowerCase();
    if (!cond.descriptionContains.some((kw: string) => desc.includes(kw.toLowerCase()))) {
      return false;
    }
  }
  
  if (cond.descriptionRegex) {
    const regex = new RegExp(cond.descriptionRegex, 'i');
    if (!regex.test(ledger.description)) {
      return false;
    }
  }
  
  const amount = ledger.debit || ledger.credit;
  if (cond.amountMin !== undefined && amount < cond.amountMin) return false;
  if (cond.amountMax !== undefined && amount > cond.amountMax) return false;
  
  return true;
}

// Variance analysis
export const getVarianceAnalysis = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const cashAccounts = await ChartOfAccount.find({ type: 'ASSET', subType: 'cash', isActive: true }).lean();
    const cashAccountIds = cashAccounts.map(a => a._id);

    const entries = await Ledger.find({
      accountId: { $in: cashAccountIds },
      date: { $gte: start, $lte: end },
      cashFlowCategory: { $in: ['OPERATING', 'INVESTING', 'FINANCING'] }
    }).lean();

    const byCategory = {
      OPERATING: entries.filter(e => e.cashFlowCategory === 'OPERATING').reduce((sum, e) => sum + e.debit - e.credit, 0),
      INVESTING: entries.filter(e => e.cashFlowCategory === 'INVESTING').reduce((sum, e) => sum + e.debit - e.credit, 0),
      FINANCING: entries.filter(e => e.cashFlowCategory === 'FINANCING').reduce((sum, e) => sum + e.debit - e.credit, 0)
    };

    const total = byCategory.OPERATING + byCategory.INVESTING + byCategory.FINANCING;

    const trends = await Ledger.aggregate([
      {
        $match: {
          accountId: { $in: cashAccountIds },
          date: { $gte: start, $lte: end },
          cashFlowCategory: { $in: ['OPERATING', 'INVESTING', 'FINANCING'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            category: '$cashFlowCategory'
          },
          amount: { $sum: { $subtract: ['$debit', '$credit'] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        byCategory,
        total: Math.round(total * 100) / 100,
        trends,
        period: { startDate, endDate }
      }
    });
  } catch (error: any) {
    logger.error('Variance analysis error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate variance analysis', error: error.message });
  }
};

// Export cash flow report
export const exportCashFlowReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const cashAccounts = await ChartOfAccount.find({ type: 'ASSET', subType: 'cash', isActive: true }).lean();
    const cashAccountIds = cashAccounts.map(a => a._id);

    const openingEntries = await Ledger.find({ 
      accountId: { $in: cashAccountIds },
      date: { $lt: start }
    }).lean();
    const openingBalance = openingEntries.reduce((sum, e) => sum + e.debit - e.credit, 0);

    const entries = await Ledger.find({
      accountId: { $in: cashAccountIds },
      date: { $gte: start, $lte: end },
      cashFlowCategory: { $in: ['OPERATING', 'INVESTING', 'FINANCING'] }
    }).populate('accountId', 'name code').lean();

    const operating = entries.filter(e => e.cashFlowCategory === 'OPERATING').reduce((sum, e) => sum + e.debit - e.credit, 0);
    const investing = entries.filter(e => e.cashFlowCategory === 'INVESTING').reduce((sum, e) => sum + e.debit - e.credit, 0);
    const financing = entries.filter(e => e.cashFlowCategory === 'FINANCING').reduce((sum, e) => sum + e.debit - e.credit, 0);
    const netCashFlow = operating + investing + financing;
    const closingBalance = openingBalance + netCashFlow;

    const report = {
      title: 'Cash Flow Statement',
      period: { startDate, endDate },
      openingBalance: Math.round(openingBalance * 100) / 100,
      operating: Math.round(operating * 100) / 100,
      investing: Math.round(investing * 100) / 100,
      financing: Math.round(financing * 100) / 100,
      netCashFlow: Math.round(netCashFlow * 100) / 100,
      closingBalance: Math.round(closingBalance * 100) / 100,
      details: entries.map(e => ({
        date: e.date,
        account: (e.accountId as any).name,
        description: e.description,
        category: e.cashFlowCategory,
        debit: e.debit,
        credit: e.credit,
        net: e.debit - e.credit
      }))
    };

    if (format === 'csv') {
      let csv = 'Date,Account,Description,Category,Debit,Credit,Net\n';
      report.details.forEach(d => {
        csv += `${d.date},${d.account},"${d.description}",${d.category},${d.debit},${d.credit},${d.net}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="cashflow-${startDate}-${endDate}.csv"`);
      return res.send(csv);
    }

    res.json({ success: true, data: report });
  } catch (error: any) {
    logger.error('Export report error:', error);
    res.status(500).json({ success: false, message: 'Failed to export report', error: error.message });
  }
};



