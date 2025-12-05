import { Request, Response } from 'express';
import Budget from '../models/Budget';
import BudgetTransfer from '../models/BudgetTransfer';
import BudgetAlert from '../models/BudgetAlert';
import BudgetApprovalWorkflow from '../models/BudgetApprovalWorkflow';
import mongoose from 'mongoose';

// Get dashboard overview
export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    const { fiscalYear } = req.query;
    const filter: any = {};
    if (fiscalYear) filter.fiscalYear = fiscalYear;

    const [
      totalBudgets,
      activeBudgets,
      totalAmount,
      totalAllocated,
      pendingApprovals,
      activeAlerts
    ] = await Promise.all([
      Budget.countDocuments(filter),
      Budget.countDocuments({ ...filter, status: 'active' }),
      Budget.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Budget.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$allocatedAmount' } } }
      ]),
      BudgetApprovalWorkflow.countDocuments({ status: 'pending' }),
      BudgetAlert.countDocuments({ isAcknowledged: false })
    ]);

    const totalBudgetAmount = totalAmount[0]?.total || 0;
    const totalAllocatedAmount = totalAllocated[0]?.total || 0;
    const availableAmount = totalBudgetAmount - totalAllocatedAmount;
    const utilizationRate = totalBudgetAmount > 0 ? (totalAllocatedAmount / totalBudgetAmount) * 100 : 0;

    res.json({
      overview: {
        totalBudgets,
        activeBudgets,
        totalBudgetAmount,
        totalAllocatedAmount,
        availableAmount,
        utilizationRate: utilizationRate.toFixed(2),
        pendingApprovals,
        activeAlerts
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching dashboard overview', error: error.message });
  }
};

// Get budget by status
export const getBudgetsByStatus = async (req: Request, res: Response) => {
  try {
    const { fiscalYear } = req.query;
    const filter: any = {};
    if (fiscalYear) filter.fiscalYear = fiscalYear;

    const statusData = await Budget.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({ statusData });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching budgets by status', error: error.message });
  }
};

// Get budget by department
export const getBudgetsByDepartment = async (req: Request, res: Response) => {
  try {
    const { fiscalYear } = req.query;
    const filter: any = {};
    if (fiscalYear) filter.fiscalYear = fiscalYear;

    const departmentData = await Budget.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$departmentId',
          departmentName: { $first: '$department.name' },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          allocatedAmount: { $sum: '$allocatedAmount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.json({ departmentData });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching budgets by department', error: error.message });
  }
};

// Get utilization trends
export const getUtilizationTrends = async (req: Request, res: Response) => {
  try {
    const { fiscalYear, months = 12 } = req.query;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    const trends = await Budget.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          ...(fiscalYear && { fiscalYear })
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalBudget: { $sum: '$totalAmount' },
          totalAllocated: { $sum: '$allocatedAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          totalBudget: 1,
          totalAllocated: 1,
          utilizationRate: {
            $multiply: [
              { $divide: ['$totalAllocated', '$totalBudget'] },
              100
            ]
          },
          count: 1
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    res.json({ trends });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching utilization trends', error: error.message });
  }
};

// Get top budgets
export const getTopBudgets = async (req: Request, res: Response) => {
  try {
    const { limit = 10, sortBy = 'totalAmount', fiscalYear } = req.query;
    const filter: any = {};
    if (fiscalYear) filter.fiscalYear = fiscalYear;

    const sortField = sortBy === 'utilization' ? 'allocatedAmount' : 'totalAmount';

    const topBudgets = await Budget.find(filter)
      .populate('departmentId', 'name')
      .populate('projectId', 'name')
      .sort({ [sortField]: -1 })
      .limit(Number(limit))
      .select('budgetName totalAmount allocatedAmount fiscalYear status');

    const budgetsWithUtilization = topBudgets.map(b => ({
      ...b.toObject(),
      utilizationRate: ((b.allocatedAmount / b.totalAmount) * 100).toFixed(2)
    }));

    res.json({ topBudgets: budgetsWithUtilization });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching top budgets', error: error.message });
  }
};

// Get budget alerts summary
export const getAlertsSummary = async (req: Request, res: Response) => {
  try {
    const alertsSummary = await BudgetAlert.aggregate([
      { $match: { isAcknowledged: false } },
      {
        $group: {
          _id: '$alertType',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentAlerts = await BudgetAlert.find({ isAcknowledged: false })
      .populate('budget', 'budgetName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      summary: alertsSummary,
      recentAlerts
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching alerts summary', error: error.message });
  }
};

// Get transfer activity
export const getTransferActivity = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const transfers = await BudgetTransfer.find({
      createdAt: { $gte: startDate },
      status: 'completed'
    })
      .populate('fromBudget', 'budgetName')
      .populate('toBudget', 'budgetName')
      .sort({ createdAt: -1 })
      .limit(20);

    const totalTransferred = await BudgetTransfer.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      transfers,
      summary: {
        totalTransferred: totalTransferred[0]?.total || 0,
        transferCount: totalTransferred[0]?.count || 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching transfer activity', error: error.message });
  }
};

// Get approval workflow stats
export const getApprovalStats = async (req: Request, res: Response) => {
  try {
    const stats = await BudgetApprovalWorkflow.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const pendingApprovals = await BudgetApprovalWorkflow.find({ status: 'pending' })
      .populate('budget', 'budgetName')
      .populate('requestedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats,
      pendingApprovals
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching approval stats', error: error.message });
  }
};

// Get fiscal year comparison
export const getFiscalYearComparison = async (req: Request, res: Response) => {
  try {
    const { years } = req.query;
    const fiscalYears = years ? (years as string).split(',') : [];

    if (fiscalYears.length === 0) {
      return res.status(400).json({ message: 'Fiscal years required' });
    }

    const comparison = await Budget.aggregate([
      { $match: { fiscalYear: { $in: fiscalYears } } },
      {
        $group: {
          _id: '$fiscalYear',
          totalBudgets: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalAllocated: { $sum: '$allocatedAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ comparison });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching fiscal year comparison', error: error.message });
  }
};

// Get budget health score
export const getBudgetHealthScore = async (req: Request, res: Response) => {
  try {
    const { fiscalYear } = req.query;
    const filter: any = {};
    if (fiscalYear) filter.fiscalYear = fiscalYear;

    const budgets = await Budget.find(filter);
    const alerts = await BudgetAlert.countDocuments({ isAcknowledged: false });
    const pendingApprovals = await BudgetApprovalWorkflow.countDocuments({ status: 'pending' });

    let healthScore = 100;

    // Deduct points for over-utilized budgets
    const overUtilized = budgets.filter(b => (b.allocatedAmount / b.totalAmount) > 0.95).length;
    healthScore -= overUtilized * 5;

    // Deduct points for active alerts
    healthScore -= Math.min(alerts * 2, 20);

    // Deduct points for pending approvals
    healthScore -= Math.min(pendingApprovals * 1, 10);

    healthScore = Math.max(0, healthScore);

    res.json({
      healthScore,
      factors: {
        overUtilizedBudgets: overUtilized,
        activeAlerts: alerts,
        pendingApprovals
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error calculating health score', error: error.message });
  }
};
