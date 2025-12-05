import { Request, Response } from 'express';
import Budget from '../models/Budget';

export const generateCustomReport = async (req: Request, res: Response) => {
  try {
    const {
      fiscalYear,
      fiscalPeriod,
      budgetType,
      status,
      projectIds,
      departmentIds,
      groupBy,
      metrics,
      dateRange
    } = req.body;

    // Build filter
    const filter: any = {};
    if (fiscalYear) filter.fiscalYear = fiscalYear;
    if (fiscalPeriod) filter.fiscalPeriod = fiscalPeriod;
    if (budgetType) filter.budgetType = budgetType;
    if (status) filter.status = status;
    if (projectIds?.length) filter.projectId = { $in: projectIds };
    if (departmentIds?.length) filter.departmentId = { $in: departmentIds };
    if (dateRange) {
      filter.createdAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    const budgets = await Budget.find(filter);

    // Calculate metrics
    const reportData: any = {
      filters: { fiscalYear, fiscalPeriod, budgetType, status },
      summary: {
        totalBudgets: budgets.length,
        totalAllocated: budgets.reduce((sum, b) => sum + b.totalBudget, 0),
        totalSpent: budgets.reduce((sum, b) => sum + b.actualSpent, 0),
        totalRemaining: budgets.reduce((sum, b) => sum + b.remainingBudget, 0),
        avgUtilization: budgets.length > 0 
          ? budgets.reduce((sum, b) => sum + b.utilizationPercentage, 0) / budgets.length 
          : 0
      }
    };

    // Group by logic
    if (groupBy === 'budgetType') {
      reportData.groups = budgets.reduce((acc: any, b) => {
        if (!acc[b.budgetType]) {
          acc[b.budgetType] = { count: 0, allocated: 0, spent: 0, remaining: 0 };
        }
        acc[b.budgetType].count++;
        acc[b.budgetType].allocated += b.totalBudget;
        acc[b.budgetType].spent += b.actualSpent;
        acc[b.budgetType].remaining += b.remainingBudget;
        return acc;
      }, {});
    } else if (groupBy === 'status') {
      reportData.groups = budgets.reduce((acc: any, b) => {
        if (!acc[b.status]) {
          acc[b.status] = { count: 0, allocated: 0, spent: 0, remaining: 0 };
        }
        acc[b.status].count++;
        acc[b.status].allocated += b.totalBudget;
        acc[b.status].spent += b.actualSpent;
        acc[b.status].remaining += b.remainingBudget;
        return acc;
      }, {});
    } else if (groupBy === 'category') {
      reportData.groups = {};
      budgets.forEach(b => {
        b.categories.forEach(cat => {
          if (!reportData.groups[cat.type]) {
            reportData.groups[cat.type] = { count: 0, allocated: 0, spent: 0 };
          }
          reportData.groups[cat.type].count++;
          reportData.groups[cat.type].allocated += cat.allocatedAmount;
          reportData.groups[cat.type].spent += cat.spentAmount;
        });
      });
    }

    // Custom metrics
    if (metrics?.includes('variance')) {
      reportData.variance = budgets.map(b => ({
        budgetId: b._id,
        name: b.projectName || b.departmentName,
        variance: b.totalBudget - b.actualSpent,
        variancePercentage: b.totalBudget > 0 
          ? ((b.totalBudget - b.actualSpent) / b.totalBudget) * 100 
          : 0
      }));
    }

    if (metrics?.includes('topSpenders')) {
      reportData.topSpenders = budgets
        .sort((a, b) => b.actualSpent - a.actualSpent)
        .slice(0, 10)
        .map(b => ({
          budgetId: b._id,
          name: b.projectName || b.departmentName,
          spent: b.actualSpent,
          utilization: b.utilizationPercentage
        }));
    }

    res.json({
      success: true,
      data: reportData,
      generatedAt: new Date()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveCustomReport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { name, description, filters, groupBy, metrics } = req.body;

    const BudgetReport = require('../models/BudgetReport').default;
    const report = new BudgetReport({
      name,
      description,
      reportType: 'custom',
      filters,
      groupBy,
      metrics,
      createdBy: req.user.id
    });

    await report.save();

    res.status(201).json({
      success: true,
      data: report,
      message: 'Custom report saved successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { generateCustomReport, saveCustomReport };
