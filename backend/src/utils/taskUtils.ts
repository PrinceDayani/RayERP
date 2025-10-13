//path: backend/src/utils/taskUtils.ts
import Task from '../models/Task';
import Project from '../models/Project';

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
  } catch (error) {
    console.error('Error calculating task stats:', error);
    return null;
  }
};

export const getTasksByProject = async (projectId: string) => {
  try {
    return await Task.find({ project: projectId })
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error fetching tasks by project:', error);
    return [];
  }
};

export const getTasksByUser = async (userId: string) => {
  try {
    return await Task.find({ assignedTo: userId })
      .populate('project', 'name')
      .populate('assignedBy', 'firstName lastName')
      .sort({ dueDate: 1 });
  } catch (error) {
    console.error('Error fetching tasks by user:', error);
    return [];
  }
};