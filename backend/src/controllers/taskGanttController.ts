import { Request, Response } from 'express';
import Task from '../models/Task';
import { logger } from '../utils/logger';
import { calculateCriticalPath, persistCriticalPath } from '../utils/criticalPath';
import Project from '../models/Project';
import mongoose from 'mongoose';

export const getGanttChartData = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId as string)) {
      return res.status(400).json({ success: false, message: 'A valid project ID is required' });
    }

    const project = await Project.findById(projectId).select('startDate name').lean();
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const tasks = await Task.find({ project: projectId, isTemplate: { $ne: true } })
      .select('title status priority dependencies estimatedHours actualHours durationDays scheduledStart dueDate assignedTo parentTask subtasks')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: 1 })
      .lean();

    // Dates come from the same forward/backward pass as the critical path, so
    // the chart and the critical-path endpoint cannot disagree. Previously
    // start dates were guessed from createdAt.
    const schedule = calculateCriticalPath(tasks as any, project.startDate || new Date());
    await persistCriticalPath(projectId as string, schedule);
    const byId = new Map(schedule.tasks.map(t => [t.id, t]));

    const ganttData = tasks.map((task: any) => {
      const id = task._id.toString();
      const scheduled = byId.get(id);
      const assignee = task.assignedTo as any;

      let progress = 0;
      if (task.status === 'completed') progress = 100;
      else if (task.status === 'review') progress = 90;
      else if (task.status === 'in-progress') {
        progress = task.estimatedHours && task.actualHours
          ? Math.min(90, (task.actualHours / task.estimatedHours) * 100)
          : 50;
      }

      return {
        id: task._id,
        text: task.title,
        start_date: scheduled?.earliestStart ?? project.startDate,
        end_date: scheduled?.earliestFinish ?? task.dueDate,
        duration: scheduled?.durationDays ?? 1,
        totalFloat: scheduled?.totalFloat ?? null,
        isCritical: scheduled?.isCritical ?? false,
        progress: progress / 100,
        status: task.status,
        priority: task.priority,
        assignee: assignee?.name || 'Unassigned',
        parent: task.parentTask ? task.parentTask.toString() : null,
        dependencies: (task.dependencies || []).map((d: any) => ({
          id: (d.taskId?._id || d.taskId)?.toString(),
          type: d.type
        })),
        type: task.subtasks && task.subtasks.length > 0 ? 'project' : 'task',
        open: true
      };
    });

    return res.json({
      success: true,
      data: {
        data: ganttData,
        links: ganttData.flatMap(task =>
          task.dependencies
            .filter((dep: any) => dep.id)
            .map((dep: any) => ({
              id: `${dep.id}_${task.id}`,
              source: dep.id,
              target: task.id,
              type: mapDependencyType(dep.type)
            }))
        ),
        criticalPath: schedule.criticalPath,
        cyclicTaskIds: schedule.cyclicTaskIds,
        assumedDurationTaskIds: schedule.assumedDurationTaskIds,
        projectTimeline: {
          start: schedule.projectStart,
          end: schedule.projectFinish,
          duration: schedule.projectDurationDays
        }
      }
    });
  } catch (error) {
    logger.error('Gantt chart error:', { message: (error as any)?.message });
    return res.status(500).json({ success: false, message: 'Error building Gantt chart data' });
  }
};


export const updateGanttTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, progress } = req.body;
    
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    if (start_date) task.createdAt = new Date(start_date);
    if (end_date) task.dueDate = new Date(end_date);
    
    if (progress !== undefined) {
      if (progress === 1) task.status = 'completed';
      else if (progress > 0.5) task.status = 'in-progress';
      else if (progress > 0) task.status = 'in-progress';
      else task.status = 'todo';
    }
    
    await task.save();
    
    const { io } = await import('../server');
    io.emit('task:gantt:updated', { taskId: id, start_date, end_date, progress });
    
    res.json({ success: true, task });
  } catch (error) {
    logger.error('Gantt update error:', { message: error?.message });
    res.status(500).json({ message: 'Error updating task from Gantt', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

function mapDependencyType(type: string): string {
  switch (type) {
    case 'finish-to-start': return '0'; // Gantt standard
    case 'start-to-start': return '1';
    case 'finish-to-finish': return '2';
    case 'start-to-finish': return '3';
    default: return '0';
  }
}
