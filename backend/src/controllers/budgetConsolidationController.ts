import { Request, Response } from 'express';
import Budget from '../models/Budget';

export const getConsolidatedView = async (req: Request, res: Response) => {
  try {
    console.log('Consolidation request:', req.query);
    const { fiscalYear, fiscalPeriod, currency = 'INR' } = req.query;

    const filter: any = {};
    if (fiscalYear) filter.fiscalYear = Number(fiscalYear);
    if (fiscalPeriod) filter.fiscalPeriod = fiscalPeriod;

    const budgets = await Budget.find(filter);
    console.log(`Found ${budgets.length} budgets`);

    // Exchange rates (should be fetched from API in production)
    const exchangeRates: any = { USD: 1, INR: 83.12, EUR: 0.92, GBP: 0.79 };

    const convertCurrency = (amount: number, from: string, to: string) => {
      if (from === to) return amount;
      const amountInUSD = amount / exchangeRates[from];
      return amountInUSD * exchangeRates[to];
    };

    // Consolidate by budget type
    const consolidation = {
      fiscalYear: fiscalYear || 'All',
      fiscalPeriod: fiscalPeriod || 'All',
      baseCurrency: currency,
      summary: {
        totalBudgets: budgets.length,
        totalAllocated: 0,
        totalSpent: 0,
        totalRemaining: 0,
        avgUtilization: 0
      },
      byType: {
        project: { count: 0, allocated: 0, spent: 0, remaining: 0, utilization: 0 },
        department: { count: 0, allocated: 0, spent: 0, remaining: 0, utilization: 0 },
        special: { count: 0, allocated: 0, spent: 0, remaining: 0, utilization: 0 }
      },
      byStatus: {},
      byCategory: {},
      topProjects: [],
      topDepartments: [],
      alerts: []
    };

    // Process each budget
    budgets.forEach(b => {
      const allocated = convertCurrency(b.totalBudget, b.currency, currency as string);
      const spent = convertCurrency(b.actualSpent, b.currency, currency as string);
      const remaining = convertCurrency(b.remainingBudget, b.currency, currency as string);

      // Summary
      consolidation.summary.totalAllocated += allocated;
      consolidation.summary.totalSpent += spent;
      consolidation.summary.totalRemaining += remaining;

      // By type
      const type = b.budgetType || 'special';
      if (!consolidation.byType[type]) {
        consolidation.byType[type] = { count: 0, allocated: 0, spent: 0, remaining: 0, utilization: 0 };
      }
      consolidation.byType[type].count++;
      consolidation.byType[type].allocated += allocated;
      consolidation.byType[type].spent += spent;
      consolidation.byType[type].remaining += remaining;

      // By status
      if (!consolidation.byStatus[b.status]) {
        consolidation.byStatus[b.status] = { count: 0, allocated: 0, spent: 0 };
      }
      consolidation.byStatus[b.status].count++;
      consolidation.byStatus[b.status].allocated += allocated;
      consolidation.byStatus[b.status].spent += spent;

      // By category
      b.categories.forEach(cat => {
        if (!consolidation.byCategory[cat.type]) {
          consolidation.byCategory[cat.type] = { count: 0, allocated: 0, spent: 0 };
        }
        const catAllocated = convertCurrency(cat.allocatedAmount, cat.currency || b.currency, currency as string);
        const catSpent = convertCurrency(cat.spentAmount, cat.currency || b.currency, currency as string);
        consolidation.byCategory[cat.type].count++;
        consolidation.byCategory[cat.type].allocated += catAllocated;
        consolidation.byCategory[cat.type].spent += catSpent;
      });

      // Alerts
      if (b.utilizationPercentage > 90) {
        consolidation.alerts.push({
          type: 'warning',
          budgetId: b._id,
          name: b.projectName || b.departmentName,
          message: `High utilization: ${b.utilizationPercentage.toFixed(1)}%`
        });
      }
      if (b.actualSpent > b.totalBudget) {
        consolidation.alerts.push({
          type: 'critical',
          budgetId: b._id,
          name: b.projectName || b.departmentName,
          message: 'Budget exceeded'
        });
      }
    });

    // Calculate averages
    consolidation.summary.avgUtilization = budgets.length > 0
      ? budgets.reduce((sum, b) => sum + b.utilizationPercentage, 0) / budgets.length
      : 0;

    Object.keys(consolidation.byType).forEach(type => {
      const typeData = consolidation.byType[type];
      if (typeData.count > 0) {
        typeData.utilization = typeData.allocated > 0 
          ? (typeData.spent / typeData.allocated) * 100 
          : 0;
      }
    });

    // Top projects
    consolidation.topProjects = budgets
      .filter(b => b.budgetType === 'project')
      .sort((a, b) => b.totalBudget - a.totalBudget)
      .slice(0, 10)
      .map(b => ({
        id: b._id,
        name: b.projectName,
        allocated: convertCurrency(b.totalBudget, b.currency, currency as string),
        spent: convertCurrency(b.actualSpent, b.currency, currency as string),
        utilization: b.utilizationPercentage
      }));

    // Top departments
    consolidation.topDepartments = budgets
      .filter(b => b.budgetType === 'department')
      .sort((a, b) => b.totalBudget - a.totalBudget)
      .slice(0, 10)
      .map(b => ({
        id: b._id,
        name: b.departmentName,
        allocated: convertCurrency(b.totalBudget, b.currency, currency as string),
        spent: convertCurrency(b.actualSpent, b.currency, currency as string),
        utilization: b.utilizationPercentage
      }));

    res.json({
      success: true,
      data: consolidation
    });
  } catch (error: any) {
    console.error('Consolidation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error', error: error.toString() });
  }
};

export const createMasterBudget = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { name, fiscalYear, fiscalPeriod, budgetIds, currency } = req.body;

    const budgets = await Budget.find({ _id: { $in: budgetIds } });

    const MasterBudget = require('../models/MasterBudget').default;
    const masterBudget = new MasterBudget({
      name,
      fiscalYear,
      fiscalPeriod,
      currency,
      childBudgets: budgetIds,
      createdBy: req.user.id
    });

    await masterBudget.save();

    res.status(201).json({
      success: true,
      data: masterBudget,
      message: 'Master budget created successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { getConsolidatedView, createMasterBudget };
