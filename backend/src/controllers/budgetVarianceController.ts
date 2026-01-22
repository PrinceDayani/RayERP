import { Request, Response } from 'express';
import BudgetVariance from '../models/BudgetVariance';
import Budget from '../models/Budget';
import { analyzeVariances, generateInsights, generateRecommendations, calculateOverallStatus } from '../utils/varianceAnalyzer';

// Generate variance report
export const generateVarianceReport = async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;
    const { startDate, endDate, periodType = 'monthly' } = req.body;
    const userId = req.user?.userId;

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Get actual spending data from transactions
    const Transaction = require('../models/Transaction').default;
    const varianceItems = await Transaction.aggregate([
      { $match: { 
        budgetId: budget._id,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }},
      { $group: {
        _id: '$category',
        actual: { $sum: '$amount' }
      }},
      { $lookup: {
        from: 'budgetcategories',
        localField: '_id',
        foreignField: 'name',
        as: 'budgetInfo'
      }},
      { $project: {
        category: '$_id',
        budgeted: { $ifNull: [{ $arrayElemAt: ['$budgetInfo.allocated', 0] }, 0] },
        actual: 1
      }}
    ]);

    // Analyze variances
    const analyzedItems = analyzeVariances(varianceItems);

    // Calculate totals
    const totalBudgeted = varianceItems.reduce((sum, item) => sum + item.budgeted, 0);
    const totalActual = varianceItems.reduce((sum, item) => sum + item.actual, 0);
    const totalVariance = totalActual - totalBudgeted;
    const totalVariancePercent = totalBudgeted !== 0 ? (totalVariance / totalBudgeted) * 100 : 0;

    // Generate insights and recommendations
    const insights = generateInsights(totalVariance, totalVariancePercent, analyzedItems);
    const recommendations = generateRecommendations(totalVariancePercent, analyzedItems);
    const overallStatus = calculateOverallStatus(totalVariancePercent);

    // Save variance report
    const variance = await BudgetVariance.create({
      budget: budgetId,
      period: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: periodType
      },
      totalBudgeted,
      totalActual,
      totalVariance,
      totalVariancePercent,
      overallStatus,
      items: analyzedItems,
      insights,
      recommendations,
      generatedBy: userId
    });

    const populatedVariance = await BudgetVariance.findById(variance._id)
      .populate('budget', 'budgetName totalAmount fiscalYear')
      .populate('generatedBy', 'name email');

    res.status(201).json({
      message: 'Variance report generated successfully',
      variance: populatedVariance
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating variance report', error: error.message });
  }
};

// Get variance reports for a budget
export const getBudgetVarianceReports = async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;
    const { periodType } = req.query;

    const filter: any = { budget: budgetId };
    if (periodType) filter['period.type'] = periodType;

    const reports = await BudgetVariance.find(filter)
      .populate('budget', 'budgetName fiscalYear')
      .populate('generatedBy', 'name email')
      .sort({ 'period.startDate': -1 });

    res.json({ reports, count: reports.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching variance reports', error: error.message });
  }
};

// Get variance report by ID
export const getVarianceReportById = async (req: Request, res: Response) => {
  try {
    const { varianceId } = req.params;

    const report = await BudgetVariance.findById(varianceId)
      .populate('budget', 'budgetName totalAmount allocatedAmount fiscalYear')
      .populate('generatedBy', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Variance report not found' });
    }

    res.json({ report });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching variance report', error: error.message });
  }
};

// Get variance summary
export const getVarianceSummary = async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;

    const latestReport = await BudgetVariance.findOne({ budget: budgetId })
      .sort({ createdAt: -1 })
      .populate('budget', 'budgetName totalAmount');

    if (!latestReport) {
      return res.status(404).json({ message: 'No variance reports found' });
    }

    const summary = {
      budgetName: (latestReport.budget as any).budgetName,
      period: latestReport.period,
      totalBudgeted: latestReport.totalBudgeted,
      totalActual: latestReport.totalActual,
      totalVariance: latestReport.totalVariance,
      totalVariancePercent: latestReport.totalVariancePercent,
      overallStatus: latestReport.overallStatus,
      topInsights: latestReport.insights.slice(0, 3),
      criticalItems: latestReport.items
        .filter(item => Math.abs(item.variancePercent) > 15)
        .sort((a, b) => Math.abs(b.variancePercent) - Math.abs(a.variancePercent))
        .slice(0, 5)
    };

    res.json({ summary });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching variance summary', error: error.message });
  }
};

// Compare variance trends
export const compareVarianceTrends = async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;
    const { periods = 6 } = req.query;

    const reports = await BudgetVariance.find({ budget: budgetId })
      .sort({ 'period.startDate': -1 })
      .limit(Number(periods))
      .populate('budget', 'budgetName');

    if (reports.length === 0) {
      return res.status(404).json({ message: 'No variance reports found' });
    }

    const trends = reports.reverse().map(report => ({
      period: `${report.period.startDate.toISOString().slice(0, 7)}`,
      variancePercent: report.totalVariancePercent,
      status: report.overallStatus,
      budgeted: report.totalBudgeted,
      actual: report.totalActual
    }));

    const avgVariance = trends.reduce((sum, t) => sum + t.variancePercent, 0) / trends.length;
    const improving = trends.length > 1 && 
      Math.abs(trends[trends.length - 1].variancePercent) < Math.abs(trends[0].variancePercent);

    res.json({
      budgetName: (reports[0].budget as any).budgetName,
      trends,
      avgVariance,
      improving,
      periodsAnalyzed: trends.length
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error comparing variance trends', error: error.message });
  }
};


