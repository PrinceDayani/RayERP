import express from 'express';
import { protect } from '../middleware/auth.middleware';
import Employee from '../models/Employee';
import Project from '../models/Project';
import Task from '../models/Task';
import { io } from '../server';

const router = express.Router();

// Get real-time dashboard stats
router.get('/stats', protect, async (req, res) => {
  try {
    const [employees, projects, tasks] = await Promise.all([
      Employee.find(),
      Project.find(),
      Task.find()
    ]);

    const stats = {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'active').length,
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
      pendingTasks: tasks.filter(t => t.status === 'todo').length,
      revenue: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      expenses: projects.reduce((sum, p) => sum + (p.spentBudget || 0), 0),
      profit: 0,
      timestamp: new Date().toISOString()
    };

    stats.profit = stats.revenue - stats.expenses;

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

// Get real-time analytics
router.get('/analytics', protect, async (req, res) => {
  try {
    const [projects, tasks] = await Promise.all([
      Project.find().populate('tasks'),
      Task.find()
    ]);

    const projectProgress = projects.slice(0, 5).map(p => ({
      name: p.name,
      progress: p.progress || 0,
      status: p.status
    }));

    const taskDistribution = [
      { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length },
      { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length },
      { name: 'Pending', value: tasks.filter(t => t.status === 'todo').length }
    ];

    res.json({
      success: true,
      data: {
        projectProgress,
        taskDistribution,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

export default router;
