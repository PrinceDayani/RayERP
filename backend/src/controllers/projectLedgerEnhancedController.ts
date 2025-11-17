//path: backend/src/controllers/projectLedgerEnhancedController.ts

import { Request, Response } from 'express';
import { ProjectBudgetActual, ProjectProfitability } from '../models/ProjectLedger';
import ProjectJournalEntry from '../models/ProjectLedger';
import { logger } from '../utils/logger';

// Get Project Budget vs Actual
export const getProjectBudgetVsActual = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { fiscalYear } = req.query;

    let budgetActual = await ProjectBudgetActual.findOne({ projectId });

    if (!budgetActual) {
      budgetActual = new ProjectBudgetActual({
        projectId,
        fiscalYear: fiscalYear || new Date().getFullYear().toString()
      });
      await budgetActual.save();
    }

    res.json(budgetActual);
  } catch (error) {
    logger.error('Error fetching budget vs actual:', error);
    res.status(500).json({ message: 'Failed to fetch budget vs actual' });
  }
};

// Update Project Budget
export const updateProjectBudget = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { budgetedRevenue, budgetedCost, categories } = req.body;

    let budgetActual = await ProjectBudgetActual.findOne({ projectId });

    if (!budgetActual) {
      budgetActual = new ProjectBudgetActual({
        projectId,
        fiscalYear: new Date().getFullYear().toString()
      });
    }

    budgetActual.budgetedRevenue = budgetedRevenue;
    budgetActual.budgetedCost = budgetedCost;
    budgetActual.budgetedProfit = budgetedRevenue - budgetedCost;
    budgetActual.categories = categories || [];
    budgetActual.lastUpdated = new Date();

    // Calculate variance
    budgetActual.variance = budgetActual.actualRevenue - budgetActual.actualCost - budgetActual.budgetedProfit;
    budgetActual.variancePercent = budgetActual.budgetedProfit ? (budgetActual.variance / budgetActual.budgetedProfit) * 100 : 0;
    budgetActual.utilizationPercent = budgetActual.budgetedCost ? (budgetActual.actualCost / budgetActual.budgetedCost) * 100 : 0;

    // Generate alerts
    budgetActual.alerts = [];
    if (budgetActual.utilizationPercent >= 90) {
      budgetActual.alerts.push({
        type: 'critical',
        message: 'Budget utilization exceeded 90%',
        threshold: 90,
        current: budgetActual.utilizationPercent,
        createdAt: new Date()
      });
    } else if (budgetActual.utilizationPercent >= 80) {
      budgetActual.alerts.push({
        type: 'warning',
        message: 'Budget utilization exceeded 80%',
        threshold: 80,
        current: budgetActual.utilizationPercent,
        createdAt: new Date()
      });
    }

    await budgetActual.save();
    logger.info(`Budget updated for project ${projectId}`);

    res.json(budgetActual);
  } catch (error) {
    logger.error('Error updating budget:', error);
    res.status(500).json({ message: 'Failed to update budget' });
  }
};

// Recalculate Actuals from Journal Entries
export const recalculateActuals = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const journalEntries = await ProjectJournalEntry.find({
      projectId,
      status: { $in: ['posted', 'approved'] }
    });

    let actualRevenue = 0;
    let actualCost = 0;

    journalEntries.forEach(entry => {
      entry.lines.forEach(line => {
        if (line.accountCode.startsWith('4')) { // Revenue accounts
          actualRevenue += line.credit - line.debit;
        } else if (line.accountCode.startsWith('5') || line.accountCode.startsWith('6')) { // Expense accounts
          actualCost += line.debit - line.credit;
        }
      });
    });

    let budgetActual = await ProjectBudgetActual.findOne({ projectId });
    if (!budgetActual) {
      budgetActual = new ProjectBudgetActual({
        projectId,
        fiscalYear: new Date().getFullYear().toString()
      });
    }

    budgetActual.actualRevenue = actualRevenue;
    budgetActual.actualCost = actualCost;
    budgetActual.actualProfit = actualRevenue - actualCost;
    budgetActual.variance = budgetActual.actualProfit - budgetActual.budgetedProfit;
    budgetActual.variancePercent = budgetActual.budgetedProfit ? (budgetActual.variance / budgetActual.budgetedProfit) * 100 : 0;
    budgetActual.utilizationPercent = budgetActual.budgetedCost ? (budgetActual.actualCost / budgetActual.budgetedCost) * 100 : 0;
    budgetActual.lastUpdated = new Date();

    await budgetActual.save();
    logger.info(`Actuals recalculated for project ${projectId}`);

    res.json(budgetActual);
  } catch (error) {
    logger.error('Error recalculating actuals:', error);
    res.status(500).json({ message: 'Failed to recalculate actuals' });
  }
};

// Get Project Profitability Analysis
export const getProjectProfitability = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    let profitability = await ProjectProfitability.findOne({ projectId });

    if (!profitability) {
      profitability = new ProjectProfitability({
        projectId,
        period: new Date().getFullYear().toString()
      });
      await profitability.save();
    }

    res.json(profitability);
  } catch (error) {
    logger.error('Error fetching profitability:', error);
    res.status(500).json({ message: 'Failed to fetch profitability' });
  }
};

// Calculate Project Profitability
export const calculateProfitability = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const journalEntries = await ProjectJournalEntry.find({
      projectId,
      status: { $in: ['posted', 'approved'] }
    });

    let revenue = 0;
    let directCosts = 0;
    let indirectCosts = 0;

    // Monthly trend data
    const monthlyData: { [key: string]: any } = {};

    journalEntries.forEach(entry => {
      const month = entry.date.toISOString().substring(0, 7);
      
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, cost: 0 };
      }

      entry.lines.forEach(line => {
        if (line.accountCode.startsWith('4')) { // Revenue
          const amount = line.credit - line.debit;
          revenue += amount;
          monthlyData[month].revenue += amount;
        } else if (line.accountCode.startsWith('5')) { // Direct costs
          const amount = line.debit - line.credit;
          directCosts += amount;
          monthlyData[month].cost += amount;
        } else if (line.accountCode.startsWith('6')) { // Indirect costs
          const amount = line.debit - line.credit;
          indirectCosts += amount;
          monthlyData[month].cost += amount;
        }
      });
    });

    const totalCosts = directCosts + indirectCosts;
    const grossProfit = revenue - directCosts;
    const netProfit = revenue - totalCosts;
    const grossMargin = revenue ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue ? (netProfit / revenue) * 100 : 0;
    const roi = totalCosts ? (netProfit / totalCosts) * 100 : 0;
    const breakEvenPoint = grossMargin ? (indirectCosts / (grossMargin / 100)) : 0;

    // Build profit trend
    const profitTrend = Object.keys(monthlyData).sort().map(month => ({
      month,
      revenue: monthlyData[month].revenue,
      cost: monthlyData[month].cost,
      profit: monthlyData[month].revenue - monthlyData[month].cost,
      margin: monthlyData[month].revenue ? ((monthlyData[month].revenue - monthlyData[month].cost) / monthlyData[month].revenue) * 100 : 0
    }));

    let profitability = await ProjectProfitability.findOne({ projectId });
    if (!profitability) {
      profitability = new ProjectProfitability({ projectId, period: new Date().getFullYear().toString() });
    }

    profitability.revenue = revenue;
    profitability.directCosts = directCosts;
    profitability.indirectCosts = indirectCosts;
    profitability.totalCosts = totalCosts;
    profitability.grossProfit = grossProfit;
    profitability.grossMargin = grossMargin;
    profitability.netProfit = netProfit;
    profitability.netMargin = netMargin;
    profitability.roi = roi;
    profitability.breakEvenPoint = breakEvenPoint;
    profitability.profitTrend = profitTrend;

    await profitability.save();
    logger.info(`Profitability calculated for project ${projectId}`);

    res.json(profitability);
  } catch (error) {
    logger.error('Error calculating profitability:', error);
    res.status(500).json({ message: 'Failed to calculate profitability' });
  }
};

// Get Project Financial Dashboard
export const getProjectFinancialDashboard = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const [budgetActual, profitability] = await Promise.all([
      ProjectBudgetActual.findOne({ projectId }),
      ProjectProfitability.findOne({ projectId })
    ]);

    const journalEntries = await ProjectJournalEntry.find({
      projectId,
      status: { $in: ['posted', 'approved'] }
    }).sort({ date: -1 }).limit(10);

    res.json({
      budgetActual: budgetActual || null,
      profitability: profitability || null,
      recentEntries: journalEntries,
      summary: {
        budgetUtilization: budgetActual?.utilizationPercent || 0,
        profitMargin: profitability?.netMargin || 0,
        roi: profitability?.roi || 0,
        variance: budgetActual?.variance || 0
      }
    });
  } catch (error) {
    logger.error('Error fetching financial dashboard:', error);
    res.status(500).json({ message: 'Failed to fetch financial dashboard' });
  }
};
