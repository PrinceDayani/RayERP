//path: backend/src/controllers/taskAnalyticsController.ts

import { Request, Response } from 'express';
import Task from '../models/Task';
import mongoose from 'mongoose';

export const getTaskAnalytics = async (req: Request, res: Response) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    
    const filter: any = { isTemplate: false };
    if (projectId) filter.project = projectId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const [statusBreakdown, priorityBreakdown, completionRate, avgCompletionTime] = await Promise.all([
      Task.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: filter },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: filter },
        { $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }}
      ]),
      Task.aggregate([
        { $match: { ...filter, status: 'completed', dueDate: { $exists: true } } },
        { $project: {
          duration: { $subtract: ['$updatedAt', '$createdAt'] }
        }},
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
      ])
    ]);

    res.json({
      statusBreakdown,
      priorityBreakdown,
      completionRate: completionRate[0] || { total: 0, completed: 0 },
      avgCompletionTime: avgCompletionTime[0]?.avgDuration || 0
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getBurndownChart = async (req: Request, res: Response) => {
  try {
    const { projectId, sprintStart, sprintEnd } = req.query;
    
    if (!sprintStart || !sprintEnd) {
      return res.status(400).json({ message: 'Sprint start and end dates required' });
    }

    const filter: any = {
      isTemplate: false,
      createdAt: { $lte: new Date(sprintEnd as string) }
    };
    if (projectId) filter.project = projectId;

    const tasks = await Task.find(filter).select('status estimatedHours actualHours updatedAt');
    
    const start = new Date(sprintStart as string);
    const end = new Date(sprintEnd as string);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const idealBurndown = Array.from({ length: days + 1 }, (_, i) => ({
      day: i,
      ideal: totalHours - (totalHours / days) * i,
      actual: 0
    }));

    tasks.forEach(task => {
      if (task.status === 'completed' && task.updatedAt) {
        const dayIndex = Math.floor((task.updatedAt.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex <= days) {
          for (let i = dayIndex; i <= days; i++) {
            idealBurndown[i].actual += task.estimatedHours || 0;
          }
        }
      }
    });

    idealBurndown.forEach((point, i) => {
      point.actual = totalHours - point.actual;
    });

    res.json({ burndown: idealBurndown, totalHours });
  } catch (error) {
    console.error('Burndown error:', error);
    res.status(500).json({ message: 'Error generating burndown chart', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getVelocityMetrics = async (req: Request, res: Response) => {
  try {
    const { projectId, sprints = 5 } = req.query;
    
    const filter: any = { isTemplate: false, status: 'completed' };
    if (projectId) filter.project = projectId;

    const completedTasks = await Task.find(filter)
      .select('estimatedHours actualHours updatedAt')
      .sort({ updatedAt: -1 })
      .limit(Number(sprints) * 20);

    const sprintDuration = 14; // 2 weeks
    const now = new Date();
    const velocityData = [];

    for (let i = 0; i < Number(sprints); i++) {
      const sprintEnd = new Date(now.getTime() - i * sprintDuration * 24 * 60 * 60 * 1000);
      const sprintStart = new Date(sprintEnd.getTime() - sprintDuration * 24 * 60 * 60 * 1000);
      
      const sprintTasks = completedTasks.filter(t => 
        t.updatedAt >= sprintStart && t.updatedAt <= sprintEnd
      );

      velocityData.push({
        sprint: `Sprint ${Number(sprints) - i}`,
        completed: sprintTasks.length,
        estimatedHours: sprintTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
        actualHours: sprintTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)
      });
    }

    const avgVelocity = velocityData.reduce((sum, s) => sum + s.completed, 0) / velocityData.length;

    res.json({ velocity: velocityData.reverse(), avgVelocity });
  } catch (error) {
    console.error('Velocity error:', error);
    res.status(500).json({ message: 'Error calculating velocity', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getTeamPerformance = async (req: Request, res: Response) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    
    const filter: any = { isTemplate: false };
    if (projectId) filter.project = projectId;
    if (startDate || endDate) {
      filter.updatedAt = {};
      if (startDate) filter.updatedAt.$gte = new Date(startDate as string);
      if (endDate) filter.updatedAt.$lte = new Date(endDate as string);
    }

    const performance = await Task.aggregate([
      { $match: filter },
      { $group: {
        _id: '$assignedTo',
        totalTasks: { $sum: 1 },
        completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        totalEstimated: { $sum: '$estimatedHours' },
        totalActual: { $sum: '$actualHours' },
        avgPriority: { $avg: {
          $switch: {
            branches: [
              { case: { $eq: ['$priority', 'low'] }, then: 1 },
              { case: { $eq: ['$priority', 'medium'] }, then: 2 },
              { case: { $eq: ['$priority', 'high'] }, then: 3 },
              { case: { $eq: ['$priority', 'critical'] }, then: 4 }
            ],
            default: 2
          }
        }}
      }},
      { $lookup: {
        from: 'employees',
        localField: '_id',
        foreignField: '_id',
        as: 'employee'
      }},
      { $unwind: '$employee' },
      { $project: {
        name: { $concat: ['$employee.firstName', ' ', '$employee.lastName'] },
        totalTasks: 1,
        completedTasks: 1,
        completionRate: { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] },
        efficiency: { $cond: [
          { $gt: ['$totalEstimated', 0] },
          { $multiply: [{ $divide: ['$totalEstimated', '$totalActual'] }, 100] },
          100
        ]},
        avgPriority: 1
      }},
      { $sort: { completedTasks: -1 } }
    ]);

    res.json({ performance });
  } catch (error) {
    console.error('Team performance error:', error);
    res.status(500).json({ message: 'Error fetching team performance', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
