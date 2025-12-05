import { Request, Response } from 'express';
import Budget from '../models/Budget';

export const compareBudgets = async (req: Request, res: Response) => {
  try {
    const { budgetIds } = req.body;

    if (!budgetIds || !Array.isArray(budgetIds) || budgetIds.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least 2 budget IDs are required for comparison' 
      });
    }

    if (budgetIds.length > 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum 10 budgets can be compared at once' 
      });
    }

    const budgets = await Budget.find({ _id: { $in: budgetIds } });

    if (budgets.length !== budgetIds.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'One or more budgets not found' 
      });
    }

    // Exchange rates for currency conversion
    const exchangeRates: any = { USD: 1, INR: 83.12, EUR: 0.92, GBP: 0.79 };
    const baseCurrency = budgets[0].currency;

    const convertCurrency = (amount: number, from: string, to: string) => {
      if (from === to) return amount;
      const amountInUSD = amount / exchangeRates[from];
      return amountInUSD * exchangeRates[to];
    };

    // Calculate comparison metrics
    const comparison = {
      totalBudget: {
        values: budgets.map(b => convertCurrency(b.totalBudget, b.currency, baseCurrency)),
        highest: 0,
        lowest: 0,
        average: 0,
        variance: 0
      },
      actualSpent: {
        values: budgets.map(b => convertCurrency(b.actualSpent, b.currency, baseCurrency)),
        highest: 0,
        lowest: 0,
        average: 0,
        total: 0
      },
      utilization: {
        values: budgets.map(b => b.utilizationPercentage),
        highest: 0,
        lowest: 0,
        average: 0
      },
      efficiency: {
        mostEfficient: '',
        leastEfficient: '',
        averageEfficiency: 0
      }
    };

    // Calculate statistics
    comparison.totalBudget.highest = Math.max(...comparison.totalBudget.values);
    comparison.totalBudget.lowest = Math.min(...comparison.totalBudget.values);
    comparison.totalBudget.average = comparison.totalBudget.values.reduce((a, b) => a + b, 0) / budgets.length;
    comparison.totalBudget.variance = comparison.totalBudget.highest - comparison.totalBudget.lowest;

    comparison.actualSpent.highest = Math.max(...comparison.actualSpent.values);
    comparison.actualSpent.lowest = Math.min(...comparison.actualSpent.values);
    comparison.actualSpent.average = comparison.actualSpent.values.reduce((a, b) => a + b, 0) / budgets.length;
    comparison.actualSpent.total = comparison.actualSpent.values.reduce((a, b) => a + b, 0);

    comparison.utilization.highest = Math.max(...comparison.utilization.values);
    comparison.utilization.lowest = Math.min(...comparison.utilization.values);
    comparison.utilization.average = comparison.utilization.values.reduce((a, b) => a + b, 0) / budgets.length;

    // Efficiency analysis
    const efficiencyScores = budgets.map((b, idx) => ({
      id: b._id,
      name: b.projectName || b.departmentName,
      score: b.utilizationPercentage <= 100 ? (100 - Math.abs(85 - b.utilizationPercentage)) : 0
    }));
    efficiencyScores.sort((a, b) => b.score - a.score);
    comparison.efficiency.mostEfficient = efficiencyScores[0].name;
    comparison.efficiency.leastEfficient = efficiencyScores[efficiencyScores.length - 1].name;
    comparison.efficiency.averageEfficiency = efficiencyScores.reduce((a, b) => a + b.score, 0) / budgets.length;

    // Category-level comparison
    const categoryComparison: any = {};
    budgets.forEach(b => {
      b.categories.forEach(cat => {
        if (!categoryComparison[cat.type]) {
          categoryComparison[cat.type] = { budgets: [], totalAllocated: 0, totalSpent: 0, avgUtilization: 0 };
        }
        const allocated = convertCurrency(cat.allocatedAmount, cat.currency || b.currency, baseCurrency);
        const spent = convertCurrency(cat.spentAmount, cat.currency || b.currency, baseCurrency);
        categoryComparison[cat.type].budgets.push({
          budgetName: b.projectName || b.departmentName,
          allocated,
          spent,
          utilization: allocated > 0 ? (spent / allocated) * 100 : 0
        });
        categoryComparison[cat.type].totalAllocated += allocated;
        categoryComparison[cat.type].totalSpent += spent;
      });
    });

    Object.keys(categoryComparison).forEach(type => {
      const cat = categoryComparison[type];
      cat.avgUtilization = cat.totalAllocated > 0 ? (cat.totalSpent / cat.totalAllocated) * 100 : 0;
    });

    // Variance and insights
    const insights = [];
    if (comparison.totalBudget.variance > comparison.totalBudget.average * 0.5) {
      insights.push({ type: 'warning', message: 'High budget variance detected - consider standardization' });
    }
    if (comparison.utilization.average < 50) {
      insights.push({ type: 'info', message: 'Low average utilization - budgets may be overallocated' });
    }
    if (comparison.utilization.average > 90) {
      insights.push({ type: 'warning', message: 'High utilization - consider increasing budget allocations' });
    }
    const overBudget = budgets.filter(b => b.utilizationPercentage > 100);
    if (overBudget.length > 0) {
      insights.push({ type: 'critical', message: `${overBudget.length} budget(s) exceeded allocation` });
    }

    res.json({
      success: true,
      data: {
        budgets: budgets.map(b => ({
          id: b._id,
          name: b.projectName || b.departmentName,
          type: b.budgetType,
          fiscalYear: b.fiscalYear,
          fiscalPeriod: b.fiscalPeriod,
          currency: b.currency,
          totalBudget: b.totalBudget,
          actualSpent: b.actualSpent,
          remainingBudget: b.remainingBudget,
          utilizationPercentage: b.utilizationPercentage,
          status: b.status,
          categories: b.categories.map(cat => ({
            name: cat.name,
            type: cat.type,
            allocated: cat.allocatedAmount,
            spent: cat.spentAmount,
            utilization: cat.allocatedAmount > 0 ? (cat.spentAmount / cat.allocatedAmount) * 100 : 0
          })),
          createdAt: b.createdAt
        })),
        comparison,
        categoryComparison,
        insights,
        baseCurrency,
        comparedAt: new Date()
      }
    });
  } catch (error: any) {
    console.error('Budget comparison error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const compareByPeriod = async (req: Request, res: Response) => {
  try {
    const { budgetId, periods } = req.body;

    if (!budgetId || !periods || !Array.isArray(periods) || periods.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Budget ID and at least 2 periods are required' 
      });
    }

    const budgets = await Budget.find({
      $or: [
        { _id: budgetId },
        { parentBudgetId: budgetId }
      ]
    }).sort({ fiscalYear: 1, fiscalPeriod: 1 });

    if (budgets.length === 0) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    const periodComparison = budgets.map(b => ({
      period: `${b.fiscalYear} ${b.fiscalPeriod}`,
      totalBudget: b.totalBudget,
      actualSpent: b.actualSpent,
      utilizationPercentage: b.utilizationPercentage,
      status: b.status
    }));

    // Calculate trends
    const trends = {
      budgetGrowth: budgets.length > 1 ? 
        ((budgets[budgets.length - 1].totalBudget - budgets[0].totalBudget) / budgets[0].totalBudget) * 100 : 0,
      spendingTrend: budgets.length > 1 ?
        ((budgets[budgets.length - 1].actualSpent - budgets[0].actualSpent) / budgets[0].actualSpent) * 100 : 0,
      utilizationTrend: budgets.length > 1 ?
        budgets[budgets.length - 1].utilizationPercentage - budgets[0].utilizationPercentage : 0
    };

    res.json({
      success: true,
      data: {
        periodComparison,
        trends,
        totalPeriods: budgets.length
      }
    });
  } catch (error: any) {
    console.error('Period comparison error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { compareBudgets, compareByPeriod };
