import express from 'express';
import { protect } from '../middleware/auth.middleware';
import Employee from '../models/Employee';
import Project from '../models/Project';
import Task from '../models/Task';
import { io } from '../server';

const router = express.Router();

// In-memory cache with 30s TTL
let statsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 30000;

// Get real-time dashboard stats - OPTIMIZED
router.get('/stats', protect, async (req, res) => {
  try {
    // Return cached data if fresh
    if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
      return res.json({ success: true, data: statsCache.data, cached: true });
    }

    // Use aggregation for ultra-fast counting
    const [employeeStats, projectStats, taskStats] = await Promise.all([
      Employee.aggregate([
        { $facet: {
          total: [{ $count: 'count' }],
          active: [{ $match: { status: 'active' } }, { $count: 'count' }]
        }}
      ]),
      Project.aggregate([
        { $facet: {
          total: [{ $count: 'count' }],
          active: [{ $match: { status: 'active' } }, { $count: 'count' }],
          completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
          financials: [{ $group: { _id: null, revenue: { $sum: '$budget' }, expenses: { $sum: '$spentBudget' } } }]
        }}
      ]),
      Task.aggregate([
        { $facet: {
          total: [{ $count: 'count' }],
          completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
          inProgress: [{ $match: { status: 'in-progress' } }, { $count: 'count' }],
          pending: [{ $match: { status: 'todo' } }, { $count: 'count' }]
        }}
      ])
    ]);

    const stats = {
      totalEmployees: employeeStats[0].total[0]?.count || 0,
      activeEmployees: employeeStats[0].active[0]?.count || 0,
      totalProjects: projectStats[0].total[0]?.count || 0,
      activeProjects: projectStats[0].active[0]?.count || 0,
      completedProjects: projectStats[0].completed[0]?.count || 0,
      totalTasks: taskStats[0].total[0]?.count || 0,
      completedTasks: taskStats[0].completed[0]?.count || 0,
      inProgressTasks: taskStats[0].inProgress[0]?.count || 0,
      pendingTasks: taskStats[0].pending[0]?.count || 0,
      revenue: projectStats[0].financials[0]?.revenue || 0,
      expenses: projectStats[0].financials[0]?.expenses || 0,
      profit: (projectStats[0].financials[0]?.revenue || 0) - (projectStats[0].financials[0]?.expenses || 0),
      timestamp: new Date().toISOString()
    };

    // Cache the result
    statsCache = { data: stats, timestamp: Date.now() };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

// Get real-time analytics - OPTIMIZED
router.get('/analytics', protect, async (req, res) => {
  try {
    const [projects, taskDistribution] = await Promise.all([
      Project.find().select('name progress status').lean().limit(5).sort({ updatedAt: -1 }),
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const projectProgress = projects.map(p => ({
      name: p.name,
      progress: p.progress || 0,
      status: p.status
    }));

    const taskMap = taskDistribution.reduce((acc, t) => ({ ...acc, [t._id]: t.count }), {} as any);
    const taskDist = [
      { name: 'Completed', value: taskMap['completed'] || 0 },
      { name: 'In Progress', value: taskMap['in-progress'] || 0 },
      { name: 'Pending', value: taskMap['todo'] || 0 }
    ];

    res.json({
      success: true,
      data: {
        projectProgress,
        taskDistribution: taskDist,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

// Clear cache endpoint (for admin)
router.post('/clear-cache', protect, (req, res) => {
  statsCache = null;
  res.json({ success: true, message: 'Cache cleared' });
});

export default router;
