// src/controllers/analyticsController.ts
import { Request, Response } from 'express';
import Employee from '../models/Employee';
import Project from '../models/Project';
import Task from '../models/Task';
import Attendance from '../models/Attendance';
import DepartmentBudget from '../models/DepartmentBudget';
import { GLBudget } from '../models/GLBudget';
import Chat from '../models/Chat';
import FileShare from '../models/FileShare';
import Contact from '../models/Contact';
import { registerCacheInvalidator } from '../utils/dashboardCache';

let comprehensiveCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 120000; // 2 minutes

registerCacheInvalidator(() => {
  comprehensiveCache = null;
});

/**
 * Get dashboard analytics data
 * @route GET /api/analytics/dashboard
 * @access Private
 */
export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Employee metrics
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    
    // Project metrics
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: 'active' });
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    
    // Task metrics
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const pendingTasks = await Task.countDocuments({ status: { $in: ['pending', 'in-progress'] } });
    
    // Attendance metrics
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: new Date(today.setHours(0, 0, 0, 0)) }
    });
    
    const dashboardData = {
      employeeMetrics: {
        total: totalEmployees,
        active: activeEmployees,
        attendanceToday: todayAttendance
      },
      projectMetrics: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects
      },
      taskMetrics: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks
      }
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ success: false, message: 'Server error fetching analytics data' });
  }
};

/**
 * Get productivity trends
 * @route GET /api/analytics/productivity-trends
 * @access Private
 */
export const getProductivityTrends = async (req: Request, res: Response) => {
  try {
    const { period = '30d', department } = req.query;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const productivityData = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          ...(department && department !== 'all' ? { department } : {})
        }
      },
      {
        $group: {
          _id: {
            week: { $week: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          avgHours: { $avg: '$estimatedHours' }
        }
      },
      {
        $project: {
          week: { $concat: ['W', { $toString: '$_id.week' }] },
          productivity: {
            $multiply: [
              { $divide: ['$completedTasks', '$totalTasks'] },
              100
            ]
          },
          tasks: '$totalTasks',
          hours: '$avgHours'
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    res.json({ success: true, data: productivityData });
  } catch (error) {
    console.error('Error fetching productivity trends:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get project dues
 * @route GET /api/analytics/project-dues
 * @access Private
 */
export const getProjectDues = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const projectDues = await Project.find({
      endDate: { $lte: thirtyDaysFromNow },
      status: { $ne: 'completed' }
    })
    .select('name endDate status progress priority')
    .sort({ endDate: 1 })
    .limit(10);

    const formattedDues = projectDues.map(project => {
      const dueDate = new Date(project.endDate);
      const remainingDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let status = 'On Track';
      if (remainingDays < 0) status = 'Delayed';
      else if (remainingDays <= 3) status = 'At Risk';

      return {
        name: project.name,
        dueDate: dueDate.toISOString().split('T')[0],
        remainingDays: Math.max(0, remainingDays),
        status,
        progress: project.progress || 0,
        priority: project.priority || 'Medium'
      };
    });

    res.json({ success: true, data: formattedDues });
  } catch (error) {
    console.error('Error fetching project dues:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get top performers
 * @route GET /api/analytics/top-performers
 * @access Private
 */
export const getTopPerformers = async (req: Request, res: Response) => {
  try {
    const { period = '30d', limit = 5 } = req.query;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topPerformers = await Task.aggregate([
      {
        $match: {
          assignedTo: { $exists: true },
          updatedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $project: {
          name: { $concat: ['$employee.firstName', ' ', '$employee.lastName'] },
          tasksCompleted: '$completedTasks',
          efficiency: {
            $multiply: [
              { $divide: ['$completedTasks', '$totalTasks'] },
              100
            ]
          },
          department: '$employee.department'
        }
      },
      { $sort: { efficiency: -1, tasksCompleted: -1 } },
      { $limit: parseInt(limit as string) }
    ]);

    res.json({ success: true, data: topPerformers });
  } catch (error) {
    console.error('Error fetching top performers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get budget analytics
 * @route GET /api/analytics/budget-analytics
 * @access Private
 */
export const getBudgetAnalytics = async (req: Request, res: Response) => {
  try {
    // Department Budget Analytics
    const departmentBudgets = await DepartmentBudget.find()
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 });

    const totalDepartmentBudget = departmentBudgets.reduce((sum, b) => sum + b.totalBudget, 0);
    const totalDepartmentSpent = departmentBudgets.reduce((sum, b) => sum + b.spentBudget, 0);
    const departmentUtilization = totalDepartmentBudget > 0 ? 
      ((totalDepartmentSpent / totalDepartmentBudget) * 100) : 0;

    // GL Budget Analytics
    const glBudgets = await GLBudget.find()
      .populate('accountId', 'name accountNumber')
      .sort({ createdAt: -1 });

    const totalGLBudget = glBudgets.reduce((sum, b) => sum + b.budgetAmount, 0);
    const totalGLActual = glBudgets.reduce((sum, b) => sum + (b.actualAmount || 0), 0);
    const glUtilization = totalGLBudget > 0 ? 
      ((totalGLActual / totalGLBudget) * 100) : 0;

    // Budget Status Distribution
    const budgetStatusCounts = {
      draft: departmentBudgets.filter(b => b.status === 'draft').length,
      approved: departmentBudgets.filter(b => b.status === 'approved').length,
      active: departmentBudgets.filter(b => b.status === 'active').length
    };

    // Top spending departments
    const topSpendingDepartments = departmentBudgets
      .map(budget => ({
        department: (budget.departmentId as any)?.name || 'Unknown',
        allocated: budget.totalBudget,
        spent: budget.spentBudget,
        utilization: budget.totalBudget > 0 ? 
          ((budget.spentBudget / budget.totalBudget) * 100) : 0
      }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    const budgetAnalytics = {
      departmentBudgets: {
        total: totalDepartmentBudget,
        spent: totalDepartmentSpent,
        remaining: totalDepartmentBudget - totalDepartmentSpent,
        utilization: Math.round(departmentUtilization * 100) / 100,
        count: departmentBudgets.length
      },
      glBudgets: {
        total: totalGLBudget,
        actual: totalGLActual,
        variance: totalGLBudget - totalGLActual,
        utilization: Math.round(glUtilization * 100) / 100,
        count: glBudgets.length
      },
      statusDistribution: budgetStatusCounts,
      topSpendingDepartments
    };

    res.json({ success: true, data: budgetAnalytics });
  } catch (error) {
    console.error('Error fetching budget analytics:', error);
    res.status(500).json({ success: false, message: 'Server error fetching budget analytics' });
  }
};

/**
 * Get comprehensive analytics for analytics page
 * @route GET /api/dashboard/comprehensive-analytics
 * @access Private
 */
export const getComprehensiveAnalytics = async (req: Request, res: Response) => {
  try {
    if (comprehensiveCache && Date.now() - comprehensiveCache.timestamp < CACHE_TTL) {
      return res.json({ success: true, data: comprehensiveCache.data, cached: true });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      employees,
      projects,
      tasks,
      attendance,
      chats,
      files,
      contacts
    ] = await Promise.all([
      Employee.aggregate([{
        $facet: {
          total: [{ $count: 'count' }],
          active: [{ $match: { status: 'active' } }, { $count: 'count' }],
          byDept: [{ $group: { _id: '$department', count: { $sum: 1 } } }]
        }
      }]),
      Project.aggregate([{
        $facet: {
          total: [{ $count: 'count' }],
          recent: [{ $sort: { updatedAt: -1 } }, { $limit: 4 }, {
            $project: { name: 1, progress: 1, status: 1, priority: 1, endDate: 1 }
          }]
        }
      }]),
      Task.aggregate([{
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          weekly: [{
            $match: { createdAt: { $gte: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000) } }
          }, {
            $group: {
              _id: { $week: '$createdAt' },
              tasks: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
            }
          }, { $sort: { _id: 1 } }],
          topPerformers: [{
            $match: { status: 'completed', completedAt: { $gte: thirtyDaysAgo }, assignedTo: { $exists: true } }
          }, {
            $group: { _id: '$assignedTo', tasksCompleted: { $sum: 1 } }
          }, { $sort: { tasksCompleted: -1 } }, { $limit: 4 }, {
            $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'emp' }
          }, { $unwind: '$emp' }, {
            $project: { name: '$emp.name', tasksCompleted: 1, department: '$emp.department' }
          }]
        }
      }]),
      Attendance.aggregate([{
        $match: { date: { $gte: sevenDaysAgo } }
      }, {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }, { $sort: { _id: 1 } }]),
      Chat.aggregate([{
        $match: { lastMessageTime: { $gte: sevenDaysAgo } }
      }, {
        $project: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$lastMessageTime' } },
          messageCount: { $size: '$messages' }
        }
      }, {
        $group: { _id: '$day', messages: { $sum: '$messageCount' } }
      }, { $sort: { _id: 1 } }]),
      FileShare.aggregate([{
        $match: { createdAt: { $gte: thirtyDaysAgo } }
      }, {
        $group: { _id: '$fileType', shared: { $sum: 1 } }
      }]),
      Contact.countDocuments()
    ]);

    const taskStatusMap = tasks[0].byStatus.reduce((acc: any, t: any) => ({ ...acc, [t._id]: t.count }), {});
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const analyticsData = {
      realTimeData: {
        activeUsers: employees[0].active[0]?.count || 0,
        onlineEmployees: employees[0].active[0]?.count || 0,
        activeChats: chats.length,
        pendingTasks: taskStatusMap['todo'] || 0
      },
      productivityData: tasks[0].weekly.slice(-4).map((w: any, i: number) => ({
        week: `W${i + 1}`,
        productivity: w.tasks > 0 ? Math.round((w.completed / w.tasks) * 100) : 0,
        tasks: w.tasks
      })),
      taskDistribution: [
        { name: 'Completed', value: taskStatusMap['completed'] || 0, color: '#10b981' },
        { name: 'In Progress', value: taskStatusMap['in-progress'] || 0, color: '#3b82f6' },
        { name: 'Pending', value: taskStatusMap['todo'] || 0, color: '#f59e0b' },
        { name: 'Overdue', value: 0, color: '#ef4444' }
      ],
      chatMetrics: chats.map((c: any) => {
        const date = new Date(c._id);
        return { day: dayNames[date.getDay()], messages: c.messages };
      }),
      fileShareData: files.map((f: any) => ({ type: f._id || 'Other', shared: f.shared })),
      departmentPerformance: employees[0].byDept.map((d: any) => ({
        name: d._id || 'Unassigned',
        employees: d.count
      })),
      projectProgress: projects[0].recent.map((p: any) => {
        const days = p.endDate ? Math.ceil((new Date(p.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
        return {
          name: p.name,
          progress: p.progress || 0,
          status: p.status === 'completed' ? 'On Track' : 'On Track',
          priority: p.priority || 'Medium',
          dueDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : 'N/A',
          remainingDays: days > 0 ? days : 0
        };
      }),
      topPerformers: tasks[0].topPerformers.map((p: any) => ({
        name: p.name,
        tasksCompleted: p.tasksCompleted,
        department: p.department || 'Unassigned'
      })),
      attendanceData: attendance.map((a: any) => {
        const date = new Date(a._id);
        return { day: dayNames[date.getDay()], rate: a.total > 0 ? Math.round((a.present / a.total) * 100) : 0 };
      }),

      metrics: {
        totalEmployees: employees[0].total[0]?.count || 0,
        activeEmployees: employees[0].active[0]?.count || 0,
        totalProjects: projects[0].total[0]?.count || 0,
        totalTasks: Object.values(taskStatusMap).reduce((a: any, b: any) => a + b, 0),
        completedTasks: taskStatusMap['completed'] || 0,
        filesShared: files.reduce((sum: number, f: any) => sum + f.shared, 0),
        totalContacts: contacts
      },
      timestamp: new Date().toISOString()
    };

    comprehensiveCache = { data: analyticsData, timestamp: Date.now() };
    res.json({ success: true, data: analyticsData });
  } catch (error: any) {
    console.error('Comprehensive analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getDashboardAnalytics,
  getProductivityTrends,
  getProjectDues,
  getTopPerformers,
  getBudgetAnalytics,
  getComprehensiveAnalytics
};