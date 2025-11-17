// src/controllers/analyticsController.ts
import { Request, Response } from 'express';
import Employee from '../models/Employee';
import Project from '../models/Project';
import Task from '../models/Task';
import Attendance from '../models/Attendance';

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

export default {
  getDashboardAnalytics,
  getProductivityTrends,
  getProjectDues,
  getTopPerformers
};