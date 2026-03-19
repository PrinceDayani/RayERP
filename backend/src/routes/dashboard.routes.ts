import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import Employee from '../models/Employee';
import Project from '../models/Project';
import Task from '../models/Task';
import { Invoice } from '../models/Finance';
import Budget from '../models/Budget';
import Notification from '../models/Notification';
import ActivityLog from '../models/ActivityLog';
import User from '../models/User';
import { Role } from '../models/Role';
import { io } from '../server';
import { registerCacheInvalidator } from '../utils/dashboardCache';

const router = express.Router();

// In-memory cache with 5min TTL
let statsCache: { data: any; timestamp: number } | null = null;
let analyticsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 300000; // 5 minutes

// Cache invalidation helper
const invalidateCache = () => {
  statsCache = null;
  analyticsCache = null;
};

// Register cache invalidator
registerCacheInvalidator(invalidateCache);

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
        {
          $facet: {
            total: [{ $count: 'count' }],
            active: [{ $match: { status: 'active' } }, { $count: 'count' }]
          }
        }
      ]),
      Project.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            active: [{ $match: { status: 'active' } }, { $count: 'count' }],
            completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
            financials: [{ $group: { _id: null, revenue: { $sum: '$budget' }, expenses: { $sum: '$spentBudget' } } }]
          }
        }
      ]),
      Task.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
            inProgress: [{ $match: { status: 'in-progress' } }, { $count: 'count' }],
            pending: [{ $match: { status: 'todo' } }, { $count: 'count' }]
          }
        }
      ]),
      Invoice.aggregate([
        {
          $group: {
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
          }
        }
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

      // Currency information
      currency: 'INR',
      currencySymbol: '₹',

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
    // Return cached data if fresh
    if (analyticsCache && Date.now() - analyticsCache.timestamp < CACHE_TTL) {
      return res.json({ success: true, data: analyticsCache.data, cached: true });
    }

    const currentYear = new Date().getFullYear();
    const [projects, taskDistribution, employees, recentActivityLogs] = await Promise.all([
      Project.find().select('name progress status').lean().limit(5).sort({ updatedAt: -1 }),
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Employee.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ]),
      ActivityLog.find()
        .sort({ timestamp: -1 })
        .limit(20)
        .populate('user', 'name')
        .populate('projectId', 'name')
        .lean()
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

    // Format recent activity
    const recentActivity = recentActivityLogs.map(log => ({
      id: log._id.toString(),
      type: log.resourceType || 'system',
      description: log.action || log.details || 'Activity',
      time: new Date(log.timestamp).toLocaleString()
    }));

    const analyticsData = {
      projectProgress,
      taskDistribution: taskDist,
      monthlyRevenue: monthlyRevenueData,
      teamProductivity: teamProductivityData,
      recentActivity,
      timestamp: new Date().toISOString()
    };

    // Cache the result
    analyticsCache = { data: analyticsData, timestamp: Date.now() };

    res.json({ success: true, data: analyticsData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

// Clear cache endpoint (for admin)
router.post('/clear-cache', protect, requirePermission('system.manage'), (req, res) => {
  invalidateCache();
  res.json({ success: true, message: 'Dashboard cache cleared' });
});

// Get personalized user dashboard data
router.get('/user-dashboard', protect, requirePermission('dashboard.view'), async (req, res) => {
  try {
    const userId = (req.user as any)?._id || (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const user = await User.findById(userId).populate('role');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const employee = await Employee.findOne({ user: userId });

    const userRole = user.role as any;
    const permissions = new Set<string>(userRole?.permissions || []);

    // Build project query — always include owner (userId), optionally employee-based fields
    const projectOrConditions: any[] = [{ owner: userId }];
    if (employee?._id) {
      projectOrConditions.push({ managers: employee._id }, { team: employee._id });
    }

    const userProjects = await Project.find({
      $or: projectOrConditions,
      status: { $in: ['planning', 'active', 'on-hold'] }
    }).select('name status progress budget spentBudget currency startDate endDate').lean().limit(10);

    const projectIds = userProjects.map(p => p._id);

    // Tasks require an employee record since assignedTo refs Employee
    const userTasks = employee?._id ? await Task.find({
      assignedTo: employee._id,
      status: { $ne: 'completed' }
    }).populate('project', 'name').sort({ dueDate: 1 }).limit(20).lean() : [];

    // Get personalized notifications
    const notifications = await Notification.find({
      userId: userId,
      read: false
    }).sort({ createdAt: -1 }).limit(10).lean();

    // Get project activity for user's projects
    const projectActivity = await ActivityLog.find({
      projectId: { $in: projectIds },
      resourceType: { $in: ['project', 'task', 'file', 'comment', 'budget'] }
    }).sort({ timestamp: -1 }).limit(20).lean();

    // Get user's own activity
    const userActivity = await ActivityLog.find({
      user: userId
    }).sort({ timestamp: -1 }).limit(10).lean();

    // Task statistics
    const taskStats = {
      total: userTasks.length,
      todo: userTasks.filter(t => t.status === 'todo').length,
      inProgress: userTasks.filter(t => t.status === 'in-progress').length,
      review: userTasks.filter(t => t.status === 'review').length,
      blocked: userTasks.filter(t => t.status === 'blocked').length,
      overdue: userTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length
    };

    const responseData: any = {
      projects: userProjects,
      tasks: userTasks,
      taskStats,
      notifications,
      projectActivity,
      userActivity,
      permissions: {
        finance: permissions.has('finance.view') || permissions.has('*'),
        budget: permissions.has('budget.view') || permissions.has('*'),
        projects: permissions.has('projects.view') || permissions.has('*'),
        tasks: permissions.has('tasks.view') || permissions.has('*')
      }
    };

    // Add budget data if user has budget permission
    if (permissions.has('budget.view') || permissions.has('*')) {
      const userBudgets = await Budget.find({
        $or: [
          { createdBy: userId },
          { projectId: { $in: projectIds } },
          { 'approvals.userId': userId }
        ],
        status: { $in: ['draft', 'pending', 'approved', 'active'] }
      }).select('budgetName projectName departmentName status totalBudget actualSpent utilizationPercentage approvals').lean().limit(10);

      responseData.budgets = userBudgets.map(b => ({
        ...b,
        userApprovalStatus: Array.isArray(b.approvals) 
          ? b.approvals.find((a: any) => a.userId?.toString() === userId.toString())?.status || 'not-required'
          : 'not-required'
      }));
    }

    // Add financial data if user has finance permission
    if (permissions.has('finance.view') || permissions.has('*')) {
      const [salesStats, projectFinancials] = await Promise.all([
        Invoice.aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' },
              totalPaid: { $sum: '$paidAmount' },
              count: { $sum: 1 }
            }
          }
        ]),
        Project.aggregate([
          { $match: { _id: { $in: projectIds } } },
          {
            $group: {
              _id: null,
              totalBudget: { $sum: '$budget' },
              totalSpent: { $sum: '$spentBudget' }
            }
          }
        ])
      ]);

      responseData.financials = {
        salesRevenue: salesStats[0]?.totalRevenue || 0,
        salesPaid: salesStats[0]?.totalPaid || 0,
        salesPending: (salesStats[0]?.totalRevenue || 0) - (salesStats[0]?.totalPaid || 0),
        salesCount: salesStats[0]?.count || 0,
        projectBudget: projectFinancials[0]?.totalBudget || 0,
        projectSpent: projectFinancials[0]?.totalSpent || 0
      };
    }

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('User dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user dashboard data', error: error.message });
  }
});

export default router;
