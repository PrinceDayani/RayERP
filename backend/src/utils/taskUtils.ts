//path: backend/src/utils/taskUtils.ts
import Task from '../models/Task';
import Project from '../models/Project';
import { logger } from './logger';

export const getTaskStats = async () => {
  try {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
    const todoTasks = await Task.countDocuments({ status: 'todo' });
    const reviewTasks = await Task.countDocuments({ status: 'review' });
    const overdueTasks = await Task.countDocuments({ 
      dueDate: { $lt: new Date() }, 
      status: { $ne: 'completed' } 
    });

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  } catch (error: any) {
    logger.error('Error calculating task stats', { message: error?.message });
    return null;
  }
};

export const getTasksByProject = async (projectId: string) => {
  try {
    return await Task.find({ project: projectId })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });
  } catch (error: any) {
    logger.error('Error fetching tasks by project', { message: error?.message });
    return [];
  }
};

export const getTasksByUser = async (userId: string) => {
  try {
    return await Task.find({ assignedTo: userId })
      .populate('project', 'name')
      .populate('assignedBy', 'name email')
      .sort({ dueDate: 1 });
  } catch (error: any) {
    logger.error('Error fetching tasks by user', { message: error?.message });
    return [];
  }
};