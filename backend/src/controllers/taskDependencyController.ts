//path: backend/src/controllers/taskDependencyController.ts

import { Request, Response } from 'express';
import Task from '../models/Task';
import { logger } from '../utils/logger';
import { calculateCriticalPath, persistCriticalPath } from '../utils/criticalPath';
import Project from '../models/Project';
import mongoose from 'mongoose';

export const addDependency = async (req: Request, res: Response) => {
  try {
    const { dependsOn, type = 'finish-to-start' } = req.body;
    
    if (!dependsOn) return res.status(400).json({ message: 'Dependency task ID required' });
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const dependencyTask = await Task.findById(dependsOn);
    if (!dependencyTask) return res.status(404).json({ message: 'Dependency task not found' });
    
    // Check for circular dependency
    const hasCircular = await checkCircularDependency(task._id.toString(), dependsOn);
    if (hasCircular) return res.status(400).json({ message: 'Circular dependency detected' });
    
    if (!task.dependencies.some(d => d.taskId.toString() === dependsOn)) {
      task.dependencies.push({ taskId: dependsOn, type });
      await task.save();
    }
    
    const { io } = await import('../server');
    io.emit('task:dependency:added', { taskId: task._id, dependsOn });
    
    res.json({ success: true, task });
  } catch (error) {
    logger.error('Add dependency error:', { message: error?.message });
    res.status(500).json({ message: 'Error adding dependency', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const removeDependency = async (req: Request, res: Response) => {
  try {
    const { dependencyId } = req.params;
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.dependencies = task.dependencies.filter(d => d.taskId.toString() !== dependencyId);
    await task.save();
    
    const { io } = await import('../server');
    io.emit('task:dependency:removed', { taskId: task._id, dependencyId });
    
    res.json({ success: true, task });
  } catch (error) {
    logger.error('Remove dependency error:', { message: error?.message });
    res.status(500).json({ message: 'Error removing dependency', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getDependencyGraph = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    
    const filter: any = { isTemplate: false };
    if (projectId) filter.project = projectId;
    
    const tasks = await Task.find(filter)
      .select('title status dependencies dueDate estimatedHours')
      .populate('dependencies.taskId', 'title status');
    
    const graph = tasks.map(task => ({
      id: task._id,
      title: task.title,
      status: task.status,
      dueDate: task.dueDate,
      dependencies: task.dependencies.map(d => ({
        id: d.taskId,
        type: d.type
      }))
    }));
    
    res.json({ graph });
  } catch (error) {
    logger.error('Dependency graph error:', { message: error?.message });
    res.status(500).json({ message: 'Error fetching dependency graph', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getCriticalPath = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId as string)) {
      return res.status(400).json({ success: false, message: 'A valid project ID is required' });
    }

    const project = await Project.findById(projectId).select('startDate').lean();
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const tasks = await Task.find({ project: projectId, isTemplate: { $ne: true } })
      .select('title status dependencies estimatedHours durationDays scheduledStart dueDate')
      .lean();

    // The schedule is anchored on the project start so offsets line up with
    // the plan rather than with whenever the endpoint happened to be called.
    const result = calculateCriticalPath(tasks as any, project.startDate || new Date());
    await persistCriticalPath(projectId as string, result);

    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Critical path error:', { message: error?.message });
    res.status(500).json({ success: false, message: 'Error calculating critical path' });
  }
};

export const checkBlockedTasks = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id).populate('dependencies.taskId', 'status');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const blockedBy = task.dependencies
      .filter(d => {
        const depTask = d.taskId as any;
        return depTask.status !== 'completed';
      })
      .map(d => ({
        id: (d.taskId as any)._id,
        title: (d.taskId as any).title,
        status: (d.taskId as any).status,
        type: d.type
      }));
    
    res.json({ isBlocked: blockedBy.length > 0, blockedBy });
  } catch (error) {
    logger.error('Check blocked error:', { message: error?.message });
    res.status(500).json({ message: 'Error checking blocked tasks', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

async function checkCircularDependency(taskId: string, dependsOn: string): Promise<boolean> {
  if (taskId === dependsOn) return true;
  
  const dependencyTask = await Task.findById(dependsOn).select('dependencies');
  if (!dependencyTask) return false;
  
  for (const dep of dependencyTask.dependencies) {
    if (dep.taskId.toString() === taskId) return true;
    const hasCircular = await checkCircularDependency(taskId, dep.taskId.toString());
    if (hasCircular) return true;
  }
  
  return false;
}

