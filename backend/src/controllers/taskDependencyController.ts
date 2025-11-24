//path: backend/src/controllers/taskDependencyController.ts

import { Request, Response } from 'express';
import Task from '../models/Task';

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
    console.error('Add dependency error:', error);
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
    console.error('Remove dependency error:', error);
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
    console.error('Dependency graph error:', error);
    res.status(500).json({ message: 'Error fetching dependency graph', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getCriticalPath = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    
    if (!projectId) return res.status(400).json({ message: 'Project ID required' });
    
    const tasks = await Task.find({ project: projectId, isTemplate: false })
      .select('title status dependencies estimatedHours dueDate')
      .populate('dependencies.taskId', 'estimatedHours');
    
    const criticalPath = calculateCriticalPath(tasks);
    
    res.json({ criticalPath, totalDuration: criticalPath.reduce((sum, t) => sum + t.duration, 0) });
  } catch (error) {
    console.error('Critical path error:', error);
    res.status(500).json({ message: 'Error calculating critical path', error: error instanceof Error ? error.message : 'Unknown error' });
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
    console.error('Check blocked error:', error);
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

function calculateCriticalPath(tasks: any[]): any[] {
  const taskMap = new Map(tasks.map(t => [t._id.toString(), t]));
  const visited = new Set<string>();
  const path: any[] = [];
  
  function dfs(taskId: string, currentPath: any[], currentDuration: number) {
    if (visited.has(taskId)) return;
    visited.add(taskId);
    
    const task = taskMap.get(taskId);
    if (!task) return;
    
    const newPath = [...currentPath, { id: task._id, title: task.title, duration: task.estimatedHours || 0 }];
    const newDuration = currentDuration + (task.estimatedHours || 0);
    
    if (task.dependencies.length === 0) {
      if (newDuration > path.reduce((sum, t) => sum + t.duration, 0)) {
        path.length = 0;
        path.push(...newPath);
      }
    } else {
      task.dependencies.forEach((dep: any) => {
        dfs(dep.taskId.toString(), newPath, newDuration);
      });
    }
  }
  
  tasks.forEach(task => {
    if (task.dependencies.length === 0) {
      dfs(task._id.toString(), [], 0);
    }
  });
  
  return path;
}
