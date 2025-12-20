import { Request, Response } from 'express';
import { BudgetLedgerIntegration } from '../utils/budgetLedgerIntegration';
import Budget from '../models/Budget';
import ProjectJournalEntry from '../models/ProjectLedger';
import ChartOfAccount from '../models/ChartOfAccount';
import { Ledger } from '../models/Ledger';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// Record project expense with real-time budget and ledger updates
export const recordProjectExpense = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { amount, category, description, accountCode } = req.body;
    const userId = (req as any).user?.id || (req as any).user?._id;

    if (!projectId || !amount || !category || !description || !accountCode) {
      return res.status(400).json({ 
        message: 'Missing required fields: projectId, amount, category, description, accountCode' 
      });
    }

    const result = await BudgetLedgerIntegration.syncProjectExpenseToBudget({
      projectId: new mongoose.Types.ObjectId(projectId),
      amount: Number(amount),
      category,
      description,
      accountCode,
      userId: new mongoose.Types.ObjectId(userId)
    });

    res.status(201).json({
      success: true,
      message: 'Project expense recorded and synced successfully',
      data: result
    });

  } catch (error: any) {
    logger.error('Record project expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording project expense',
      error: error.message
    });
  }
};

// Get integrated financial dashboard
export const getIntegratedDashboard = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    // Get budget data
    const budget = await Budget.findOne({
      projectId,
      status: { $in: ['approved', 'active'] }
    });

    // Get project ledger data
    let projectQuery: any = { projectId };
    if (startDate && endDate) {
      projectQuery.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const projectEntries = await ProjectJournalEntry.find(projectQuery)
      .sort({ date: -1 })
      .limit(50);

    // Get general ledger data related to project
    const generalLedgerEntries = await Ledger.find({
      reference: { $regex: projectId }
    })
      .populate('accountId', 'code name type')
      .sort({ date: -1 })
      .limit(50);

    // Calculate real-time metrics
    const totalProjectDebits = projectEntries.reduce((sum, entry) => sum + entry.totalDebit, 0);
    const totalProjectCredits = projectEntries.reduce((sum, entry) => sum + entry.totalCredit, 0);

    const categoryBreakdown = budget ? budget.categories.map(cat => ({
      type: cat.type,
      allocated: cat.allocatedAmount,
      spent: cat.spentAmount,
      remaining: cat.allocatedAmount - cat.spentAmount,
      utilizationPercentage: cat.allocatedAmount > 0 ? (cat.spentAmount / cat.allocatedAmount) * 100 : 0
    })) : [];

    // Budget variance analysis
    const variance = budget ? await BudgetLedgerIntegration.analyzeBudgetVariance(
      new mongoose.Types.ObjectId(projectId)
    ) : null;

    const dashboard = {
      projectId,
      budget: budget ? {
        id: budget._id,
        totalBudget: budget.totalBudget,
        actualSpent: budget.actualSpent,
        remainingBudget: budget.remainingBudget,
        utilizationPercentage: budget.utilizationPercentage,
        status: budget.status,
        currency: budget.currency
      } : null,
      projectLedger: {
        totalEntries: projectEntries.length,
        totalDebits: totalProjectDebits,
        totalCredits: totalProjectCredits,
        recentEntries: projectEntries.slice(0, 10)
      },
      generalLedger: {
        affectedAccounts: generalLedgerEntries.length,
        recentEntries: generalLedgerEntries.slice(0, 10)
      },
      categoryBreakdown,
      variance,
      realTimeMetrics: {
        budgetHealth: budget ? (budget.utilizationPercentage <= 100 ? 'healthy' : 'over-budget') : 'no-budget',
        cashFlow: totalProjectCredits - totalProjectDebits,
        lastUpdated: new Date()
      }
    };

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error: any) {
    logger.error('Integrated dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching integrated dashboard',
      error: error.message
    });
  }
};

// Sync all project budgets with ledger data
export const syncAllBudgets = async (req: Request, res: Response) => {
  try {
    const results = await BudgetLedgerIntegration.syncAllProjectBudgets();
    
    res.json({
      success: true,
      message: 'Budget synchronization completed',
      data: {
        totalProcessed: results.length,
        successful: results.filter(r => r.synced).length,
        failed: results.filter(r => !r.synced).length,
        results
      }
    });

  } catch (error: any) {
    logger.error('Sync all budgets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing budgets',
      error: error.message
    });
  }
};

// Get budget variance analysis
export const getBudgetVarianceAnalysis = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const analysis = await BudgetLedgerIntegration.analyzeBudgetVariance(
      new mongoose.Types.ObjectId(projectId)
    );

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'No active budget found for project'
      });
    }

    res.json({
      success: true,
      data: analysis
    });

  } catch (error: any) {
    logger.error('Budget variance analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing budget variance',
      error: error.message
    });
  }
};

// Generate comprehensive financial report
export const generateFinancialReport = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { format = 'json' } = req.query;

    const report = await BudgetLedgerIntegration.generateIntegratedFinancialReport(
      new mongoose.Types.ObjectId(projectId)
    );

    if (format === 'pdf') {
      // TODO: Implement PDF generation
      return res.status(501).json({
        success: false,
        message: 'PDF format not yet implemented'
      });
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error: any) {
    logger.error('Financial report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating financial report',
      error: error.message
    });
  }
};

// Get real-time budget alerts
export const getBudgetAlerts = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;

    let query: any = {
      status: { $in: ['approved', 'active'] }
    };

    if (projectId) {
      query.projectId = projectId;
    }

    const budgets = await Budget.find(query);
    const alerts = [];

    for (const budget of budgets) {
      const analysis = await BudgetLedgerIntegration.analyzeBudgetVariance(budget.projectId);
      
      if (analysis && analysis.alerts.length > 0) {
        alerts.push({
          budgetId: budget._id,
          projectId: budget.projectId,
          projectName: budget.projectName,
          alerts: analysis.alerts,
          severity: budget.utilizationPercentage > 100 ? 'critical' : 
                   budget.utilizationPercentage > 90 ? 'warning' : 'info',
          utilizationPercentage: budget.utilizationPercentage,
          timestamp: new Date()
        });
      }
    }

    res.json({
      success: true,
      data: {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        warningAlerts: alerts.filter(a => a.severity === 'warning').length,
        alerts
      }
    });

  } catch (error: any) {
    logger.error('Budget alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budget alerts',
      error: error.message
    });
  }
};

// Get account balances with project breakdown
export const getAccountBalancesWithProjects = async (req: Request, res: Response) => {
  try {
    const { accountCode } = req.params;
    const { includeProjectBreakdown = 'true' } = req.query;

    const account = await ChartOfAccount.findOne({ code: accountCode });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    let projectBreakdown = [];
    
    if (includeProjectBreakdown === 'true') {
      // Get ledger entries grouped by project
      const ledgerEntries = await Ledger.find({ accountId: ChartOfAccount._id })
        .populate('journalEntryId', 'reference')
        .sort({ date: -1 });

      const projectMap = new Map();
      
      ledgerEntries.forEach(entry => {
        const reference = entry.reference || '';
        const projectMatch = reference.match(/project\/([a-f\d]{24})/i);
        
        if (projectMatch) {
          const projectId = projectMatch[1];
          if (!projectMap.has(projectId)) {
            projectMap.set(projectId, {
              projectId,
              totalDebits: 0,
              totalCredits: 0,
              balance: 0,
              entryCount: 0
            });
          }
          
          const projectData = projectMap.get(projectId);
          projectData.totalDebits += entry.debit;
          projectData.totalCredits += entry.credit;
          projectData.balance += entry.debit - entry.credit;
          projectData.entryCount++;
        }
      });

      projectBreakdown = Array.from(projectMap.values());
    }

    res.json({
      success: true,
      data: {
        account: {
          id: ChartOfAccount._id,
          code: ChartOfAccount.code,
          name: ChartOfAccount.name,
          type: ChartOfAccount.type,
          balance: ChartOfAccount.balance
        },
        projectBreakdown,
        totalProjects: projectBreakdown.length,
        lastUpdated: new Date()
      }
    });

  } catch (error: any) {
    logger.error('Account balances with projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching account balances',
      error: error.message
    });
  }
};

// Real-time budget monitoring status
export const getBudgetMonitoringStatus = async (req: Request, res: Response) => {
  try {
    const activeBudgets = await Budget.countDocuments({
      status: { $in: ['approved', 'active'] }
    });

    const overBudgetCount = await Budget.countDocuments({
      status: { $in: ['approved', 'active'] },
      utilizationPercentage: { $gt: 100 }
    });

    const atRiskCount = await Budget.countDocuments({
      status: { $in: ['approved', 'active'] },
      utilizationPercentage: { $gte: 90, $lte: 100 }
    });

    const totalProjectEntries = await ProjectJournalEntry.countDocuments({
      status: { $in: ['posted', 'approved'] }
    });

    res.json({
      success: true,
      data: {
        monitoring: {
          isActive: true,
          lastCheck: new Date(),
          checkInterval: '5 minutes'
        },
        statistics: {
          activeBudgets,
          overBudgetCount,
          atRiskCount,
          totalProjectEntries,
          healthyBudgets: activeBudgets - overBudgetCount - atRiskCount
        },
        systemStatus: 'operational'
      }
    });

  } catch (error: any) {
    logger.error('Budget monitoring status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monitoring status',
      error: error.message
    });
  }
};
