import { Request, Response } from 'express';
import { GLBudget } from '../models/GLBudget';
import { BudgetTemplate } from '../models/BudgetTemplate';
import { Account } from '../models/Account';

export const createBudget = async (req: Request, res: Response) => {
  try {
    const { accountId, fiscalYear, budgetAmount, period, periodBreakdown, templateId } = req.body;
    
    const existing = await GLBudget.findOne({ accountId, fiscalYear, period: period || 'yearly' });
    if (existing) return res.status(400).json({ success: false, message: 'Budget already exists for this account and period' });
    
    const budget = await GLBudget.create({
      accountId,
      fiscalYear,
      budgetAmount,
      period: period || 'yearly',
      periodBreakdown: periodBreakdown || [],
      templateId,
      createdBy: req.user._id,
      variance: budgetAmount,
      utilizationPercent: 0
    });

    await budget.populate('accountId createdBy');
    res.status(201).json({ success: true, data: budget });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getBudgets = async (req: Request, res: Response) => {
  try {
    const { fiscalYear, accountId, status } = req.query;
    const filter: any = {};
    if (fiscalYear) filter.fiscalYear = fiscalYear;
    if (accountId) filter.accountId = accountId;
    if (status) filter.status = status;

    const budgets = await GLBudget.find(filter)
      .populate('accountId createdBy')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: budgets });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getBudgetById = async (req: Request, res: Response) => {
  try {
    const budget = await GLBudget.findById(req.params.id)
      .populate('accountId createdBy revisions.revisedBy approvals.approver');
    
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateBudget = async (req: Request, res: Response) => {
  try {
    const budget = await GLBudget.findById(req.params.id);
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
    
    if (budget.status === 'frozen') {
      return res.status(400).json({ success: false, message: 'Cannot update frozen budget' });
    }

    Object.assign(budget, req.body);
    await budget.save();
    await budget.populate('accountId createdBy');

    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const reviseBudget = async (req: Request, res: Response) => {
  try {
    const { newAmount, reason } = req.body;
    const budget = await GLBudget.findById(req.params.id);
    
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });

    const revisionNumber = budget.revisions.length + 1;
    budget.revisions.push({
      revisionNumber,
      revisionDate: new Date(),
      previousAmount: budget.budgetAmount,
      newAmount,
      reason,
      revisedBy: req.user._id
    });

    budget.budgetAmount = newAmount;
    budget.variance = newAmount - budget.actualAmount;
    budget.utilizationPercent = newAmount > 0 ? (budget.actualAmount / newAmount) * 100 : 0;
    
    await budget.save();
    await budget.populate('accountId createdBy revisions.revisedBy');

    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const submitForApproval = async (req: Request, res: Response) => {
  try {
    const { approvers } = req.body;
    const budget = await GLBudget.findById(req.params.id);
    
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });

    budget.approvals = approvers.map((approverId: string, index: number) => ({
      level: index + 1,
      approver: approverId,
      status: 'pending'
    }));
    budget.status = 'pending_approval';
    
    await budget.save();
    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const approveBudget = async (req: Request, res: Response) => {
  try {
    const { level, comments } = req.body;
    const budget = await GLBudget.findById(req.params.id);
    
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });

    const approval = budget.approvals.find(a => a.level === level);
    if (!approval) return res.status(404).json({ success: false, message: 'Approval level not found' });

    approval.status = 'approved';
    approval.comments = comments;
    approval.date = new Date();

    const allApproved = budget.approvals.every(a => a.status === 'approved');
    if (allApproved) budget.status = 'approved';

    await budget.save();
    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectBudget = async (req: Request, res: Response) => {
  try {
    const { level, comments } = req.body;
    const budget = await GLBudget.findById(req.params.id);
    
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });

    const approval = budget.approvals.find(a => a.level === level);
    if (!approval) return res.status(404).json({ success: false, message: 'Approval level not found' });

    approval.status = 'rejected';
    approval.comments = comments;
    approval.date = new Date();
    budget.status = 'rejected';

    await budget.save();
    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const freezeBudget = async (req: Request, res: Response) => {
  try {
    const budget = await GLBudget.findById(req.params.id);
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });

    budget.status = 'frozen';
    await budget.save();
    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateActuals = async (req: Request, res: Response) => {
  try {
    const { actualAmount, period } = req.body;
    const budget = await GLBudget.findById(req.params.id);
    
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });

    if (period && budget.periodBreakdown.length > 0) {
      const periodData = budget.periodBreakdown.find(p => p.period === period);
      if (periodData) {
        periodData.actualAmount = actualAmount;
        periodData.variance = periodData.budgetAmount - actualAmount;
      }
      budget.actualAmount = budget.periodBreakdown.reduce((sum, p) => sum + p.actualAmount, 0);
    } else {
      budget.actualAmount = actualAmount;
    }

    budget.variance = budget.budgetAmount - budget.actualAmount;
    budget.utilizationPercent = (budget.actualAmount / budget.budgetAmount) * 100;

    // Update alerts
    budget.alerts.threshold80 = budget.utilizationPercent >= 80;
    budget.alerts.threshold90 = budget.utilizationPercent >= 90;
    budget.alerts.threshold100 = budget.utilizationPercent >= 100;
    budget.alerts.overspending = budget.utilizationPercent > 100;

    await budget.save();
    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getComparison = async (req: Request, res: Response) => {
  try {
    const { fiscalYear1, fiscalYear2, accountId } = req.query;
    
    const budgets1 = await GLBudget.find({ fiscalYear: fiscalYear1, ...(accountId && { accountId }) }).populate('accountId');
    const budgets2 = await GLBudget.find({ fiscalYear: fiscalYear2, ...(accountId && { accountId }) }).populate('accountId');

    const comparison = budgets1.map(b1 => {
      const b2 = budgets2.find(b => b.accountId._id.toString() === b1.accountId._id.toString());
      return {
        account: b1.accountId,
        year1: { fiscalYear: fiscalYear1, budget: b1.budgetAmount, actual: b1.actualAmount },
        year2: b2 ? { fiscalYear: fiscalYear2, budget: b2.budgetAmount, actual: b2.actualAmount } : null,
        variance: b2 ? b1.budgetAmount - b2.budgetAmount : 0
      };
    });

    res.json({ success: true, data: comparison });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const budgets = await GLBudget.find({
      $or: [
        { 'alerts.threshold80': true },
        { 'alerts.threshold90': true },
        { 'alerts.threshold100': true },
        { 'alerts.overspending': true }
      ]
    }).populate('accountId');

    res.json({ success: true, data: budgets });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createFromTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId, fiscalYear, totalBudget } = req.body;
    const template = await BudgetTemplate.findById(templateId).populate('accounts.accountId');
    
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

    const budgets = [];
    for (const acc of (template as any).accounts) {
      const budgetAmount = acc.fixedAmount || (totalBudget * acc.percentage / 100);
      const budget = await GLBudget.create({
        accountId: acc.accountId,
        fiscalYear,
        budgetAmount,
        templateId,
        createdBy: req.user._id,
        variance: budgetAmount,
        utilizationPercent: 0
      });
      budgets.push(budget);
    }

    res.status(201).json({ success: true, data: budgets });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const copyFromPreviousYear = async (req: Request, res: Response) => {
  try {
    const { fromYear, toYear, adjustmentPercent } = req.body;
    const previousBudgets = await GLBudget.find({ fiscalYear: fromYear });

    const newBudgets = [];
    for (const prev of previousBudgets) {
      const adjustment = adjustmentPercent ? (1 + adjustmentPercent / 100) : 1;
      const budget = await GLBudget.create({
        accountId: prev.accountId,
        fiscalYear: toYear,
        budgetAmount: prev.budgetAmount * adjustment,
        period: prev.period,
        periodBreakdown: prev.periodBreakdown.map(p => ({
          period: p.period,
          budgetAmount: p.budgetAmount * adjustment,
          actualAmount: 0,
          variance: p.budgetAmount * adjustment
        })),
        createdBy: req.user._id,
        variance: prev.budgetAmount * adjustment,
        utilizationPercent: 0
      });
      newBudgets.push(budget);
    }

    res.status(201).json({ success: true, data: newBudgets });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteBudget = async (req: Request, res: Response) => {
  try {
    const budget = await GLBudget.findById(req.params.id);
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
    
    if (budget.status === 'frozen') {
      return res.status(400).json({ success: false, message: 'Cannot delete frozen budget' });
    }

    await budget.deleteOne();
    res.json({ success: true, message: 'Budget deleted' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
