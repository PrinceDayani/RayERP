import { Request, Response } from 'express';
import Task from '../models/Task';
import mongoose from 'mongoose';

export const getTaskAnalytics = async (req: Request, res: Response) => {
  try {
    const { projectId, userId, startDate, endDate } = req.query;
    
    const filter: any = { isTemplate: false };
    if (projectId) filter.project = projectId;
    if (userId) filter.assignedTo = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }
    
    const tasks = await Task.find(filter);
    
    // Status distribution
    const statusDistribution = {
      todo: tasks.filter(t => t.status === 'todo').length,
      'in-progress': tasks.filter(t => t.status === 'in-progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      blocked: tasks.filter(t => t.status === 'blocked').length
    };
    
    // Priority distribution
    const priorityDistribution = {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
      critical: tasks.filter(t => t.priority === 'critical').length
    };
    
    // Time tracking
    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActual = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const timeVariance = totalActual - totalEstimated;
    const timeAccuracy = totalEstimated > 0 ? ((totalEstimated - Math.abs(timeVariance)) / totalEstimated * 100) : 0;
    
    // Completion metrics
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length * 100) : 0;
    
    // Overdue analysis
    const now = new Date();
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed');
    
    // Average completion time
    const completedWithDates = completedTasks.filter(t => t.createdAt && t.updatedAt);
    const avgCompletionTime = completedWithDates.length > 0
      ? completedWithDates.reduce((sum, t) => {
          const duration = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
          return sum + duration;
        }, 0) / completedWithDates.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;
    
    // Task type distribution
    const taskTypeDistribution = {
      individual: tasks.filter(t => t.taskType === 'individual').length,
      project: tasks.filter(t => t.taskType === 'project').length
    };
    
    // Assignment type distribution
    const assignmentTypeDistribution = {
      assigned: tasks.filter(t => t.assignmentType === 'assigned').length,
      'self-assigned': tasks.filter(t => t.assignmentType === 'self-assigned').length
    };
    
    res.json({
      summary: {
        total: tasks.length,
        completed: completedTasks.length,
        overdue: overdueTasks.length,
        completionRate: Math.round(completionRate * 100) / 100,
        avgCompletionDays: Math.round(avgCompletionTime * 100) / 100
      },
      statusDistribution,
      priorityDistribution,
      taskTypeDistribution,
      assignmentTypeDistribution,
      timeTracking: {
        totalEstimated: Math.round(totalEstimated * 100) / 100,
        totalActual: Math.round(totalActual * 100) / 100,
        variance: Math.round(timeVariance * 100) / 100,
        accuracy: Math.round(timeAccuracy * 100) / 100
      },
      trends: {
        overdueCount: overdueTasks.length,
        overduePercentage: tasks.length > 0 ? Math.round((overdueTasks.length / tasks.length * 100) * 100) / 100 : 0
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getProductivityMetrics = async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate } = req.query;
    
    if (!userId) return res.status(400).json({ message: 'User ID required' });
    
    const filter: any = { assignedTo: userId, isTemplate: false };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }
    
    const tasks = await Task.find(filter);
    const completed = tasks.filter(t => t.status === 'completed');
    
    // Daily completion trend
    const dailyCompletion: { [key: string]: number } = {};
    completed.forEach(task => {
      const date = new Date(task.updatedAt).toISOString().split('T')[0];
      dailyCompletion[date] = (dailyCompletion[date] || 0) + 1;
    });
    
    // Time efficiency
    const tasksWithTime = tasks.filter(t => t.estimatedHours && t.actualHours);
    const avgEfficiency = tasksWithTime.length > 0
      ? tasksWithTime.reduce((sum, t) => {
          const efficiency = (t.estimatedHours / t.actualHours) * 100;
          return sum + efficiency;
        }, 0) / tasksWithTime.length
      : 100;
    
    res.json({
      totalTasks: tasks.length,
      completedTasks: completed.length,
      completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length * 100) * 100) / 100 : 0,
      avgEfficiency: Math.round(avgEfficiency * 100) / 100,
      dailyCompletion,
      totalHoursWorked: Math.round(tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0) * 100) / 100
    });
  } catch (error) {
    console.error('Productivity metrics error:', error);
    res.status(500).json({ message: 'Error fetching productivity metrics', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getProjectAnalytics = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    
    if (!projectId) return res.status(400).json({ message: 'Project ID required' });
    
    const tasks = await Task.find({ project: projectId, isTemplate: false })
      .populate('assignedTo', 'firstName lastName');
    
    // Team performance
    const teamPerformance: { [key: string]: any } = {};
    tasks.forEach(task => {
      const assignee = task.assignedTo as any;
      const userId = assignee?._id?.toString();
      if (!userId) return;
      
      if (!teamPerformance[userId]) {
        teamPerformance[userId] = {
          name: `${assignee.firstName} ${assignee.lastName}`,
          total: 0,
          completed: 0,
          hoursWorked: 0
        };
      }
      
      teamPerformance[userId].total++;
      if (task.status === 'completed') teamPerformance[userId].completed++;
      teamPerformance[userId].hoursWorked += task.actualHours || 0;
    });
    
    // Task velocity (tasks completed per week)
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.updatedAt);
    const weeklyVelocity: { [key: string]: number } = {};
    completedTasks.forEach(task => {
      const week = getWeekNumber(new Date(task.updatedAt));
      weeklyVelocity[week] = (weeklyVelocity[week] || 0) + 1;
    });
    
    res.json({
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      teamPerformance: Object.values(teamPerformance),
      weeklyVelocity,
      avgVelocity: Object.keys(weeklyVelocity).length > 0
        ? Math.round((Object.values(weeklyVelocity).reduce((a, b) => a + b, 0) / Object.keys(weeklyVelocity).length) * 100) / 100
        : 0
    });
  } catch (error) {
    console.error('Project analytics error:', error);
    res.status(500).json({ message: 'Error fetching project analytics', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getBurndownChart = async (req: Request, res: Response) => {
  try {
    const { projectId, sprintStart, sprintEnd } = req.query;
    
    if (!projectId) return res.status(400).json({ message: 'Project ID required' });
    
    const filter: any = { project: projectId, isTemplate: false };
    const tasks = await Task.find(filter);
    
    const start = sprintStart ? new Date(sprintStart as string) : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const end = sprintEnd ? new Date(sprintEnd as string) : new Date();
    
    const totalTasks = tasks.length;
    const dailyData: any[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const completedByDate = tasks.filter(t => 
        t.status === 'completed' && t.updatedAt && new Date(t.updatedAt) <= d
      ).length;
      
      dailyData.push({
        date: d.toISOString().split('T')[0],
        remaining: totalTasks - completedByDate,
        completed: completedByDate,
        ideal: Math.max(0, totalTasks - (totalTasks / ((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))) * ((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)))
      });
    }
    
    res.json({ burndown: dailyData, totalTasks });
  } catch (error) {
    console.error('Burndown chart error:', error);
    res.status(500).json({ message: 'Error generating burndown chart', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getVelocityMetrics = async (req: Request, res: Response) => {
  try {
    const { projectId, weeks = 4 } = req.query;
    
    if (!projectId) return res.status(400).json({ message: 'Project ID required' });
    
    const tasks = await Task.find({ project: projectId, isTemplate: false, status: 'completed' });
    
    const weeklyVelocity: { [key: string]: { completed: number; points: number } } = {};
    
    tasks.forEach(task => {
      if (!task.updatedAt) return;
      const week = getWeekNumber(new Date(task.updatedAt));
      if (!weeklyVelocity[week]) weeklyVelocity[week] = { completed: 0, points: 0 };
      weeklyVelocity[week].completed++;
      weeklyVelocity[week].points += task.estimatedHours || 0;
    });
    
    const velocityData = Object.entries(weeklyVelocity)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-Number(weeks))
      .map(([week, data]) => ({ week, ...data }));
    
    const avgVelocity = velocityData.length > 0
      ? velocityData.reduce((sum, d) => sum + d.completed, 0) / velocityData.length
      : 0;
    
    res.json({ velocity: velocityData, avgVelocity: Math.round(avgVelocity * 100) / 100 });
  } catch (error) {
    console.error('Velocity metrics error:', error);
    res.status(500).json({ message: 'Error calculating velocity', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getTeamPerformance = async (req: Request, res: Response) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    
    const filter: any = { isTemplate: false };
    if (projectId) filter.project = projectId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }
    
    const tasks = await Task.find(filter).populate('assignedTo', 'firstName lastName');
    
    const teamStats: { [key: string]: any } = {};
    
    tasks.forEach(task => {
      const assignee = task.assignedTo as any;
      if (!assignee) return;
      
      const userId = assignee._id.toString();
      if (!teamStats[userId]) {
        teamStats[userId] = {
          id: userId,
          name: `${assignee.firstName} ${assignee.lastName}`,
          total: 0,
          completed: 0,
          inProgress: 0,
          todo: 0,
          hoursEstimated: 0,
          hoursActual: 0
        };
      }
      
      teamStats[userId].total++;
      if (task.status === 'completed') teamStats[userId].completed++;
      if (task.status === 'in-progress') teamStats[userId].inProgress++;
      if (task.status === 'todo') teamStats[userId].todo++;
      teamStats[userId].hoursEstimated += task.estimatedHours || 0;
      teamStats[userId].hoursActual += task.actualHours || 0;
    });
    
    const performance = Object.values(teamStats).map((stats: any) => ({
      ...stats,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total * 100) * 100) / 100 : 0,
      efficiency: stats.hoursEstimated > 0 ? Math.round((stats.hoursEstimated / stats.hoursActual * 100) * 100) / 100 : 100
    }));
    
    res.json({ performance });
  } catch (error) {
    console.error('Team performance error:', error);
    res.status(500).json({ message: 'Error fetching team performance', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}
