import { Request, Response } from 'express';
import Project from '../models/Project';
import Task from '../models/Task';
import Employee from '../models/Employee';
import mongoose from 'mongoose';

/**
 * @desc    Get project reports
 * @route   GET /api/reports/projects
 * @access  Private
 */
export const getProjectReports = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    const matchFilter: any = {};
    if (from && to) {
      matchFilter.createdAt = {
        $gte: new Date(from as string),
        $lte: new Date(to as string)
      };
    }

    const projectStats = await Project.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget' },
          spentBudget: { $sum: '$spentBudget' }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
          totalBudget: 1,
          spentBudget: 1
        }
      }
    ]);

    const projectProgress = await Project.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          avgProgress: { $avg: '$progress' },
          totalProjects: { $sum: 1 },
          completedProjects: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusBreakdown: projectStats,
        progress: projectProgress[0] || { avgProgress: 0, totalProjects: 0, completedProjects: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @desc    Get task reports
 * @route   GET /api/reports/tasks
 * @access  Private
 */
export const getTaskReports = async (req: Request, res: Response) => {
  try {
    const { from, to, projectId } = req.query;
    
    const matchFilter: any = {};
    if (from && to) {
      matchFilter.createdAt = {
        $gte: new Date(from as string),
        $lte: new Date(to as string)
      };
    }
    if (projectId) {
      matchFilter.project = new mongoose.Types.ObjectId(projectId as string);
    }

    const taskStats = await Task.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalEstimated: { $sum: '$estimatedHours' },
          totalActual: { $sum: '$actualHours' }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
          totalEstimated: 1,
          totalActual: 1
        }
      }
    ]);

    const priorityStats = await Task.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          priority: '$_id',
          count: 1
        }
      }
    ]);

    const overdueTasks = await Task.countDocuments({
      ...matchFilter,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' }
    });

    res.status(200).json({
      success: true,
      data: {
        statusBreakdown: taskStats,
        priorityBreakdown: priorityStats,
        overdueTasks
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching task reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @desc    Get team productivity report
 * @route   GET /api/reports/team-productivity
 * @access  Private
 */
export const getTeamProductivity = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    const matchFilter: any = {};
    if (from && to) {
      matchFilter.createdAt = {
        $gte: new Date(from as string),
        $lte: new Date(to as string)
      };
    }

    // Check if there are any tasks first
    const taskCount = await Task.countDocuments(matchFilter);
    if (taskCount === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const productivity = await Task.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'employees',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $match: {
          'employee.0': { $exists: true }
        }
      },
      { $unwind: '$employee' },
      {
        $group: {
          _id: '$assignedTo',
          name: { $first: { $concat: ['$employee.firstName', ' ', '$employee.lastName'] } },
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalEstimated: { $sum: { $ifNull: ['$estimatedHours', 0] } },
          totalActual: { $sum: { $ifNull: ['$actualHours', 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          employeeId: '$_id',
          name: 1,
          totalTasks: 1,
          completedTasks: 1,
          completionRate: {
            $cond: [
              { $gt: ['$totalTasks', 0] },
              { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] },
              0
            ]
          },
          efficiency: {
            $cond: [
              { $and: [{ $gt: ['$totalEstimated', 0] }, { $gt: ['$totalActual', 0] }] },
              { $multiply: [{ $divide: ['$totalEstimated', '$totalActual'] }, 100] },
              100
            ]
          }
        }
      },
      { $sort: { completionRate: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: productivity
    });
  } catch (error) {
    console.error('Team productivity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team productivity',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * @desc    Get employee reports
 * @route   GET /api/reports/employees
 * @access  Private
 */
export const getEmployeeReports = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    const matchFilter: any = {};
    if (from && to) {
      matchFilter.createdAt = {
        $gte: new Date(from as string),
        $lte: new Date(to as string)
      };
    }

    const employeeStats = await Employee.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1
        }
      }
    ]);

    const departmentStats = await Employee.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          department: '$_id',
          count: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusBreakdown: employeeStats,
        departmentBreakdown: departmentStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};