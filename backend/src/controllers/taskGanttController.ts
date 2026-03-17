import { Request, Response } from 'express';
import Task from '../models/Task';

export const getGanttChartData = async (req: Request, res: Response) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    
    if (!projectId) return res.status(400).json({ message: 'Project ID required' });
    
    const filter: any = { project: projectId, isTemplate: false };
    
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'firstName lastName')
      .populate('dependencies.taskId', 'title dueDate status')
      .populate('parentTask', 'title')
      .sort({ createdAt: 1 });
    
    // Calculate start and end dates for each task
    const ganttData = tasks.map(task => {
      // Start date: use createdAt or earliest dependency completion
      let startDate = task.createdAt;
      
      // Check dependencies for finish-to-start
      if (task.dependencies.length > 0) {
        const finishToStartDeps = task.dependencies.filter(d => d.type === 'finish-to-start');
        if (finishToStartDeps.length > 0) {
          const latestDepDate = finishToStartDeps.reduce((latest, dep) => {
            const depTask = dep.taskId as any;
            const depDate = depTask.dueDate ? new Date(depTask.dueDate) : new Date();
            return depDate > latest ? depDate : latest;
          }, new Date(0));
          
          if (latestDepDate > startDate) {
            startDate = latestDepDate;
          }
        }
      }
      
      // End date: use dueDate or calculate from estimated hours
      let endDate = task.dueDate || new Date(startDate.getTime() + (task.estimatedHours || 8) * 60 * 60 * 1000);
      
      // Calculate progress percentage
      let progress = 0;
      if (task.status === 'completed') progress = 100;
      else if (task.status === 'in-progress') {
        if (task.estimatedHours && task.actualHours) {
          progress = Math.min(90, (task.actualHours / task.estimatedHours) * 100);
        } else {
          progress = 50;
        }
      } else if (task.status === 'review') progress = 90;
      
      const assignee = task.assignedTo as any;
      
      return {
        id: task._id,
        text: task.title,
        start_date: startDate,
        end_date: endDate,
        duration: task.estimatedHours || 8,
        progress: progress / 100,
        status: task.status,
        priority: task.priority,
        assignee: assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned',
        parent: task.parentTask ? (task.parentTask as any)._id : null,
        dependencies: task.dependencies.map(d => ({
          id: (d.taskId as any)._id,
          type: d.type
        })),
        type: task.subtasks && task.subtasks.length > 0 ? 'project' : 'task',
        open: true
      };
    });
    
    // Calculate project timeline
    const projectStart = ganttData.length > 0
      ? new Date(Math.min(...ganttData.map(t => new Date(t.start_date).getTime())))
      : new Date();
    
    const projectEnd = ganttData.length > 0
      ? new Date(Math.max(...ganttData.map(t => new Date(t.end_date).getTime())))
      : new Date();
    
    res.json({
      data: ganttData,
      links: ganttData.flatMap(task => 
        task.dependencies.map(dep => ({
          id: `${dep.id}_${task.id}`,
          source: dep.id,
          target: task.id,
          type: mapDependencyType(dep.type)
        }))
      ),
      projectTimeline: {
        start: projectStart,
        end: projectEnd,
        duration: Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (error) {
    console.error('Gantt chart error:', error);
    res.status(500).json({ message: 'Error generating Gantt chart', error: error instanceof Error ? error.message : 'Unknown error' });
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
    console.error('Gantt update error:', error);
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
