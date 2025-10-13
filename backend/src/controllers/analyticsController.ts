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

export default {
  getDashboardAnalytics
};