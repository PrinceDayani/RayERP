import { Request, Response } from 'express';
import ProjectProgressSnapshot from '../models/ProjectProgressSnapshot';
import FinancialEntry from '../models/FinancialEntry';
import DailyReport from '../models/DailyReport';
import Project from '../models/Project';
import Task from '../models/Task';

// Get progress summary for a reporting-based project
export const getProgressSummary = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Financial progress
    const [paymentsMade, paymentsReceived] = await Promise.all([
      FinancialEntry.aggregate([
        { $match: { project: project._id, entryType: { $in: ['payment-made', 'expense'] }, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      FinancialEntry.aggregate([
        { $match: { project: project._id, entryType: 'payment-received', status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalSpent = paymentsMade[0]?.total || 0;
    const totalReceived = paymentsReceived[0]?.total || 0;
    const budget = project.budget || 1;
    const financialProgress = Math.min(Math.round((totalSpent / budget) * 100), 100);

    // Task progress (for comparison)
    const [totalTasks, completedTasks] = await Promise.all([
      Task.countDocuments({ project: project._id, isTemplate: { $ne: true } }),
      Task.countDocuments({ project: project._id, status: 'completed', isTemplate: { $ne: true } })
    ]);
    const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Reporting stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentReports, unresolvedBlockers] = await Promise.all([
      DailyReport.countDocuments({ project: project._id, reportDate: { $gte: sevenDaysAgo } }),
      DailyReport.aggregate([
        { $match: { project: project._id } },
        { $unwind: '$blockers' },
        { $match: { 'blockers.isResolved': false } },
        { $count: 'count' }
      ])
    ]);

    // Determine effective progress based on project type
    const effectiveProgress = project.projectType === 'reporting' ? financialProgress : taskProgress;

    // Health score
    let healthScore: 'healthy' | 'at-risk' | 'critical' = 'healthy';
    const blockerCount = unresolvedBlockers[0]?.count || 0;
    if (blockerCount >= 5 || (project.projectType === 'reporting' && recentReports === 0)) {
      healthScore = 'critical';
    } else if (blockerCount >= 2 || financialProgress > taskProgress + 30) {
      healthScore = 'at-risk';
    }

    res.json({
      success: true,
      data: {
        projectId: project._id,
        projectName: project.name,
        projectType: project.projectType,
        progressMode: project.progressMode,
        effectiveProgress,
        financial: {
          budget,
          currency: project.currency,
          totalSpent,
          totalReceived,
          remaining: budget - totalSpent,
          progress: financialProgress
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          progress: taskProgress
        },
        reporting: {
          reportsLast7Days: recentReports,
          unresolvedBlockers: blockerCount
        },
        healthScore
      }
    });
  } catch (error: any) {
    console.error('Get progress summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate and store a progress snapshot
export const generateProgressSnapshot = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { period = 'daily' } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Financial calculations
    const [paymentsMade, paymentsReceived] = await Promise.all([
      FinancialEntry.aggregate([
        { $match: { project: project._id, entryType: { $in: ['payment-made', 'expense'] }, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      FinancialEntry.aggregate([
        { $match: { project: project._id, entryType: 'payment-received', status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalSpent = paymentsMade[0]?.total || 0;
    const totalReceived = paymentsReceived[0]?.total || 0;
    const budget = project.budget || 1;
    const financialProgress = Math.min(Math.round((totalSpent / budget) * 100), 100);

    // Task progress
    const [totalTasks, completedTasks] = await Promise.all([
      Task.countDocuments({ project: project._id, isTemplate: { $ne: true } }),
      Task.countDocuments({ project: project._id, status: 'completed', isTemplate: { $ne: true } })
    ]);
    const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Report stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [reportCount, blockerData] = await Promise.all([
      DailyReport.countDocuments({ project: project._id, reportDate: { $gte: today } }),
      DailyReport.aggregate([
        { $match: { project: project._id } },
        { $unwind: '$blockers' },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unresolved: { $sum: { $cond: [{ $eq: ['$blockers.isResolved', false] }, 1, 0] } }
          }
        }
      ])
    ]);

    const blockerCount = blockerData[0]?.total || 0;
    const unresolvedBlockers = blockerData[0]?.unresolved || 0;

    // Health score
    let healthScore: 'healthy' | 'at-risk' | 'critical' = 'healthy';
    if (unresolvedBlockers >= 5) healthScore = 'critical';
    else if (unresolvedBlockers >= 2) healthScore = 'at-risk';

    // Department breakdown
    const deptBreakdown = await FinancialEntry.aggregate([
      { $match: { project: project._id, status: 'approved', department: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$department',
          spent: { $sum: { $cond: [{ $in: ['$entryType', ['payment-made', 'expense']] }, '$amount', 0] } },
          received: { $sum: { $cond: [{ $eq: ['$entryType', 'payment-received'] }, '$amount', 0] } }
        }
      }
    ]);

    const effectiveProgress = project.projectType === 'reporting' ? financialProgress : taskProgress;

    const snapshotDate = new Date();
    snapshotDate.setHours(0, 0, 0, 0);

    // Upsert snapshot for today
    const snapshot = await ProjectProgressSnapshot.findOneAndUpdate(
      { project: project._id, snapshotDate, period },
      {
        project: project._id,
        snapshotDate,
        period,
        taskProgress,
        financialProgress,
        effectiveProgress,
        totalBudget: budget,
        totalSpent,
        totalReceived,
        reportCount,
        blockerCount,
        unresolvedBlockers,
        healthScore,
        departmentBreakdown: deptBreakdown.map(d => ({
          department: d._id,
          allocated: 0,
          spent: d.spent,
          received: d.received,
          progress: budget > 0 ? Math.round((d.spent / budget) * 100) : 0
        })),
        generatedAt: new Date()
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Also update the project's progress field
    await Project.findByIdAndUpdate(projectId, { progress: effectiveProgress });

    res.json({ success: true, data: snapshot });
  } catch (error: any) {
    console.error('Generate progress snapshot error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get historical snapshots for a project
export const getProgressHistory = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { period = 'daily', startDate, endDate, limit = 30 } = req.query;

    const filter: any = { project: projectId, period };

    if (startDate && endDate) {
      filter.snapshotDate = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    } else if (startDate) {
      filter.snapshotDate = { $gte: new Date(startDate as string) };
    }

    const snapshots = await ProjectProgressSnapshot.find(filter)
      .sort({ snapshotDate: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: snapshots });
  } catch (error: any) {
    console.error('Get progress history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
