import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import Employee from '../models/Employee';
import Project from '../models/Project';
import Task from '../models/Task';
import Invoice from '../models/Invoice';
import { io } from '../server';

const router = express.Router();

// In-memory cache with 30s TTL
let statsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 30000;

// Get real-time dashboard stats - OPTIMIZED
router.get('/stats', protect, requirePermission('dashboard.view'), async (req, res) => {
  try {
    // Return cached data if fresh
    if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
      return res.json({ success: true, data: statsCache.data, cached: true });
    }

    // Use aggregation for ultra-fast counting
    const [employeeStats, projectStats, taskStats, salesStats] = await Promise.all([
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
      ]),
      Invoice.aggregate([
        { $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          count: { $sum: 1 },
          overdueCount: { 
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $gt: ['$balanceAmount', 0] }
                  ]
                }, 
                1, 
                0
              ] 
            } 
          },
          overdueAmount: { 
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $gt: ['$balanceAmount', 0] }
                  ]
                }, 
                '$balanceAmount', 
                0
              ] 
            } 
          }
        }}
      ])
    ]);

    // Separate sales and project data for executive view
    const salesRevenue = salesStats[0]?.totalRevenue || 0;
    const salesPaid = salesStats[0]?.totalPaid || 0;
    const salesCount = salesStats[0]?.count || 0;
    const projectRevenue = projectStats[0].financials[0]?.revenue || 0;
    const projectExpenses = projectStats[0].financials[0]?.expenses || 0;

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
      
      // Combined revenue (for backward compatibility)
      revenue: salesRevenue > 0 ? salesRevenue : projectRevenue,
      expenses: projectExpenses,
      profit: (salesRevenue > 0 ? salesRevenue : projectRevenue) - projectExpenses,
      
      // Separated data for executive view
      salesRevenue: salesRevenue,
      salesPaid: salesPaid,
      salesPending: salesRevenue - salesPaid,
      salesCount: salesCount,
      
      projectRevenue: projectRevenue,
      projectExpenses: projectExpenses,
      projectProfit: projectRevenue - projectExpenses,
      
      // Invoice specific metrics
      overdueInvoices: salesStats[0]?.overdueCount || 0,
      overdueAmount: salesStats[0]?.overdueAmount || 0,
      
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
router.get('/analytics', protect, requirePermission('analytics.view'), async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const [projects, taskDistribution, employees] = await Promise.all([
      Project.find().select('name progress status').lean().limit(5).sort({ updatedAt: -1 }),
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Employee.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } }
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

    // Generate monthly revenue data for all 12 months
    const monthlyRevenue = await Project.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(currentYear, 0, 1) }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$budget' },
          expenses: { $sum: '$spentBudget' }
        }
      }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueMap = monthlyRevenue.reduce((acc, m) => ({ ...acc, [m._id]: m }), {} as any);
    const monthlyRevenueData = monthNames.map((month, idx) => ({
      month,
      revenue: revenueMap[idx + 1]?.revenue || 0,
      expenses: revenueMap[idx + 1]?.expenses || 0
    }));

    // Generate team productivity data
    const teamProductivity = await Task.aggregate([
      {
        $lookup: {
          from: 'employees',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$employee.department',
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $ne: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $match: { _id: { $ne: null } } }
    ]);

    const teamProductivityData = teamProductivity.length > 0 ? teamProductivity.map(t => ({
      name: t._id || 'Unassigned',
      completed: t.completed,
      pending: t.pending
    })) : [
      { name: 'Development', completed: 0, pending: 0 },
      { name: 'Design', completed: 0, pending: 0 },
      { name: 'Marketing', completed: 0, pending: 0 },
      { name: 'Sales', completed: 0, pending: 0 }
    ];

    res.json({
      success: true,
      data: {
        projectProgress,
        taskDistribution: taskDist,
        monthlyRevenue: monthlyRevenueData,
        teamProductivity: teamProductivityData,
        recentActivity: [],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

// Clear cache endpoint (for admin)
router.post('/clear-cache', protect, requirePermission('system.manage'), (req, res) => {
  statsCache = null;
  res.json({ success: true, message: 'Cache cleared' });
});

export default router;
