//path: backend/src/controllers/projectAnalyticsController.ts

import { Request, Response } from 'express';
import Project from '../models/Project';
import Task from '../models/Task';
import mongoose from 'mongoose';

export const getBurndownChart = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await Task.find({ project: req.params.id });
    if (tasks.length === 0) {
      return res.json({ burndownData: [], totalTasks: 0, totalDays: 0 });
    }

    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalTasks = tasks.length;

    const burndownData = [];
    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const completedTasks = tasks.filter(t => 
        t.status === 'completed' && new Date(t.updatedAt) <= currentDate
      ).length;
      
      burndownData.push({
        date: currentDate.toISOString().split('T')[0],
        ideal: Math.max(0, totalTasks - (totalTasks / totalDays) * i),
        actual: totalTasks - completedTasks,
        completed: completedTasks
      });
    }

    res.json({ burndownData, totalTasks, totalDays });
  } catch (error) {
    console.error('Burndown chart error:', error);
    res.status(500).json({ message: 'Error fetching burndown chart', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getVelocity = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await Task.find({ project: req.params.id });
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    const weeklyVelocity: { [key: string]: number } = {};
    completedTasks.forEach(task => {
      const weekStart = new Date(task.updatedAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyVelocity[weekKey] = (weeklyVelocity[weekKey] || 0) + (task.estimatedHours || 1);
    });

    const velocityData = Object.entries(weeklyVelocity).map(([week, hours]) => ({
      week,
      velocity: hours,
      tasksCompleted: completedTasks.filter(t => {
        const taskWeek = new Date(t.updatedAt);
        taskWeek.setDate(taskWeek.getDate() - taskWeek.getDay());
        return taskWeek.toISOString().split('T')[0] === week;
      }).length
    }));

    const avgVelocity = velocityData.length > 0 
      ? velocityData.reduce((sum, v) => sum + v.velocity, 0) / velocityData.length 
      : 0;

    res.json({ velocityData, avgVelocity, totalCompleted: completedTasks.length });
  } catch (error) {
    console.error('Velocity error:', error);
    res.status(500).json({ message: 'Error fetching velocity', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getResourceUtilization = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id).populate('team', 'firstName lastName');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await Task.find({ project: req.params.id }).populate('assignedTo', 'firstName lastName');
    
    const utilization = tasks.reduce((acc: any, task) => {
      const userId = task.assignedTo?._id?.toString();
      if (!userId) return acc;
      
      if (!acc[userId]) {
        acc[userId] = {
          user: task.assignedTo,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          estimatedHours: 0,
          actualHours: 0,
          utilizationRate: 0
        };
      }
      
      acc[userId].totalTasks++;
      acc[userId].estimatedHours += task.estimatedHours || 0;
      acc[userId].actualHours += task.actualHours || 0;
      
      if (task.status === 'completed') acc[userId].completedTasks++;
      if (task.status === 'in-progress') acc[userId].inProgressTasks++;
      
      return acc;
    }, {});

    const utilizationData = Object.values(utilization).map((u: any) => ({
      ...u,
      utilizationRate: u.estimatedHours > 0 ? (u.actualHours / u.estimatedHours) * 100 : 0,
      completionRate: u.totalTasks > 0 ? (u.completedTasks / u.totalTasks) * 100 : 0
    }));

    res.json({ utilizationData, teamSize: project.team?.length || 0 });
  } catch (error) {
    console.error('Resource utilization error:', error);
    res.status(500).json({ message: 'Error fetching resource utilization', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getPerformanceIndices = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await Task.find({ project: req.params.id });
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    if (tasks.length === 0) {
      return res.json({ cpi: 0, spi: 0, costVariance: 0, scheduleVariance: 0, plannedValue: project.budget, earnedValue: 0, actualCost: project.spentBudget || 0, status: 'no-data' });
    }
    
    const plannedValue = project.budget || 0;
    const earnedValue = (completedTasks.length / tasks.length) * plannedValue;
    const actualCost = project.spentBudget || 0;
    
    const cpi = actualCost > 0 ? earnedValue / actualCost : earnedValue > 0 ? 1 : 0;
    
    const now = new Date();
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const totalDuration = Math.max(1, end.getTime() - start.getTime());
    const elapsedDuration = Math.max(0, now.getTime() - start.getTime());
    const plannedProgress = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
    const actualProgress = Math.max(0, Math.min(100, project.progress || 0));
    
    const spi = plannedProgress > 0 ? actualProgress / plannedProgress : actualProgress > 0 ? 1 : 0;
    
    const costVariance = earnedValue - actualCost;
    const scheduleVariance = earnedValue - (plannedProgress / 100) * project.budget;
    
    res.json({
      cpi: parseFloat(cpi.toFixed(2)),
      spi: parseFloat(spi.toFixed(2)),
      costVariance: parseFloat(costVariance.toFixed(2)),
      scheduleVariance: parseFloat(scheduleVariance.toFixed(2)),
      plannedValue: parseFloat(plannedValue.toFixed(2)),
      earnedValue: parseFloat(earnedValue.toFixed(2)),
      actualCost: parseFloat(actualCost.toFixed(2)),
      status: cpi >= 1 && spi >= 1 ? 'on-track' : cpi < 1 ? 'over-budget' : 'behind-schedule'
    });
  } catch (error) {
    console.error('Performance indices error:', error);
    res.status(500).json({ message: 'Error fetching performance indices', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getRiskAssessment = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await Task.find({ project: req.params.id });
    const now = new Date();
    
    const risks = [];
    
    // Budget risk
    const budgetUsage = project.budget > 0 ? ((project.spentBudget || 0) / project.budget) * 100 : 0;
    if (budgetUsage > 90) {
      risks.push({
        type: 'budget',
        severity: 'high',
        message: 'Budget usage exceeds 90%',
        value: budgetUsage
      });
    } else if (budgetUsage > 75) {
      risks.push({
        type: 'budget',
        severity: 'medium',
        message: 'Budget usage exceeds 75%',
        value: budgetUsage
      });
    }
    
    // Schedule risk
    const endDate = new Date(project.endDate);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const incompleteTasks = tasks.filter(t => t.status !== 'completed').length;
    
    if (daysRemaining < 0) {
      risks.push({
        type: 'schedule',
        severity: 'critical',
        message: 'Project is overdue',
        value: Math.abs(daysRemaining)
      });
    } else if (daysRemaining < 7 && incompleteTasks > 0) {
      risks.push({
        type: 'schedule',
        severity: 'high',
        message: `${incompleteTasks} tasks remaining with less than 7 days`,
        value: daysRemaining
      });
    }
    
    // Overdue tasks risk
    const overdueTasks = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
    ).length;
    
    if (overdueTasks > 0) {
      risks.push({
        type: 'tasks',
        severity: overdueTasks > 5 ? 'high' : 'medium',
        message: `${overdueTasks} overdue tasks`,
        value: overdueTasks
      });
    }
    
    // Blocked tasks risk
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
    if (blockedTasks > 0) {
      risks.push({
        type: 'tasks',
        severity: 'medium',
        message: `${blockedTasks} blocked tasks`,
        value: blockedTasks
      });
    }
    
    const overallRisk = risks.some(r => r.severity === 'critical') ? 'critical' :
                        risks.some(r => r.severity === 'high') ? 'high' :
                        risks.some(r => r.severity === 'medium') ? 'medium' : 'low';
    
    res.json({
      overallRisk,
      risks,
      riskCount: risks.length,
      projectHealth: overallRisk === 'low' ? 'healthy' : overallRisk === 'medium' ? 'at-risk' : 'critical'
    });
  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({ message: 'Error fetching risk assessment', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
