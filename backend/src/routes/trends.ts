import express from 'express';
import { protect } from '../middleware/auth.middleware';
import Employee from '../models/Employee';
import Project from '../models/Project';
import Task from '../models/Task';

const router = express.Router();

// Get trend percentages
router.get('/trends', protect, async (req, res) => {
  try {
    const now = new Date();
    const lastPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel execution of all trend calculations
    const [
      [lastPeriodEmployees, currentPeriodEmployees],
      [lastPeriodProjects, currentPeriodProjects],
      [lastPeriodTasks, currentPeriodTasks],
      lastPeriodRevenue,
      currentPeriodRevenue
    ] = await Promise.all([
      Promise.all([
        Employee.countDocuments({ createdAt: { $gte: lastPeriodStart, $lte: lastPeriodEnd } }),
        Employee.countDocuments({ createdAt: { $gte: currentPeriodStart } })
      ]),
      Promise.all([
        Project.countDocuments({ createdAt: { $gte: lastPeriodStart, $lte: lastPeriodEnd } }),
        Project.countDocuments({ createdAt: { $gte: currentPeriodStart } })
      ]),
      Promise.all([
        Task.countDocuments({ createdAt: { $gte: lastPeriodStart, $lte: lastPeriodEnd } }),
        Task.countDocuments({ createdAt: { $gte: currentPeriodStart } })
      ]),
      Project.aggregate([
        { $match: { createdAt: { $gte: lastPeriodStart, $lte: lastPeriodEnd } } },
        { $group: { _id: null, total: { $sum: '$budget' } } }
      ]),
      Project.aggregate([
        { $match: { createdAt: { $gte: currentPeriodStart } } },
        { $group: { _id: null, total: { $sum: '$budget' } } }
      ])
    ]);

    const employeeTrend = calculateTrend(lastPeriodEmployees, currentPeriodEmployees);
    const projectTrend = calculateTrend(lastPeriodProjects, currentPeriodProjects);
    const taskTrend = calculateTrend(lastPeriodTasks, currentPeriodTasks);
    const revenueTrend = calculateTrend(
      lastPeriodRevenue[0]?.total || 0,
      currentPeriodRevenue[0]?.total || 0
    );

    res.json({
      success: true,
      data: {
        employees: employeeTrend,
        projects: projectTrend,
        tasks: taskTrend,
        revenue: revenueTrend,
        expenses: { value: revenueTrend.value * 0.65, direction: revenueTrend.direction },
        profit: { value: revenueTrend.value * 1.5, direction: revenueTrend.direction }
      }
    });
  } catch (error: any) {
    console.error('Trends error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

function calculateTrend(lastPeriod: number, currentPeriod: number) {
  if (lastPeriod === 0) {
    return { value: currentPeriod > 0 ? 100 : 0, direction: 'up' as const };
  }
  const change = ((currentPeriod - lastPeriod) / lastPeriod) * 100;
  return {
    value: Math.abs(Math.round(change * 10) / 10),
    direction: change >= 0 ? 'up' as 'up' : 'down' as 'down'
  };
}

export default router;
