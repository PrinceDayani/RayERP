import { Request, Response } from 'express';
import Task from '../models/Task';

export const bulkDelete = async (req: Request, res: Response) => {
  try {
    const { taskIds } = req.body;
    
    if (!taskIds?.length) return res.status(400).json({ message: 'Task IDs required' });
    
    const result = await Task.deleteMany({ _id: { $in: taskIds } });
    
    const { io } = await import('../server');
    io.emit('tasks:bulk:deleted', { taskIds, count: result.deletedCount });
    
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Error bulk deleting tasks', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const bulkAssign = async (req: Request, res: Response) => {
  try {
    const { taskIds, assignedTo } = req.body;
    
    if (!taskIds?.length || !assignedTo) {
      return res.status(400).json({ message: 'Task IDs and assignee required' });
    }
    
    await Task.updateMany(
      { _id: { $in: taskIds } },
      { assignedTo }
    );
    
    const tasks = await Task.find({ _id: { $in: taskIds } })
      .populate('assignedTo', 'firstName lastName');
    
    const { io } = await import('../server');
    io.emit('tasks:bulk:assigned', { taskIds, assignedTo });
    
    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Bulk assign error:', error);
    res.status(500).json({ message: 'Error bulk assigning tasks', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const bulkStatusChange = async (req: Request, res: Response) => {
  try {
    const { taskIds, status } = req.body;
    
    if (!taskIds?.length || !status) {
      return res.status(400).json({ message: 'Task IDs and status required' });
    }
    
    const validStatuses = ['todo', 'in-progress', 'review', 'completed', 'blocked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    await Task.updateMany(
      { _id: { $in: taskIds } },
      { status }
    );
    
    const tasks = await Task.find({ _id: { $in: taskIds } });
    
    const { io } = await import('../server');
    io.emit('tasks:bulk:status:changed', { taskIds, status });
    
    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Bulk status change error:', error);
    res.status(500).json({ message: 'Error changing task statuses', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const bulkPriorityChange = async (req: Request, res: Response) => {
  try {
    const { taskIds, priority } = req.body;
    
    if (!taskIds?.length || !priority) {
      return res.status(400).json({ message: 'Task IDs and priority required' });
    }
    
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority' });
    }
    
    await Task.updateMany(
      { _id: { $in: taskIds } },
      { priority }
    );
    
    const tasks = await Task.find({ _id: { $in: taskIds } });
    
    const { io } = await import('../server');
    io.emit('tasks:bulk:priority:changed', { taskIds, priority });
    
    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Bulk priority change error:', error);
    res.status(500).json({ message: 'Error changing task priorities', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const bulkAddTags = async (req: Request, res: Response) => {
  try {
    const { taskIds, tags } = req.body;
    
    if (!taskIds?.length || !tags?.length) {
      return res.status(400).json({ message: 'Task IDs and tags required' });
    }
    
    const tasks = await Task.find({ _id: { $in: taskIds } });
    
    for (const task of tasks) {
      for (const tag of tags) {
        if (!task.tags.some(t => t.name === tag.name)) {
          task.tags.push({ name: tag.name, color: tag.color || '#3b82f6' });
        }
      }
      await task.save();
    }
    
    const { io } = await import('../server');
    io.emit('tasks:bulk:tags:added', { taskIds, tags });
    
    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Bulk add tags error:', error);
    res.status(500).json({ message: 'Error adding tags to tasks', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const bulkSetDueDate = async (req: Request, res: Response) => {
  try {
    const { taskIds, dueDate } = req.body;
    
    if (!taskIds?.length || !dueDate) {
      return res.status(400).json({ message: 'Task IDs and due date required' });
    }
    
    await Task.updateMany(
      { _id: { $in: taskIds } },
      { dueDate: new Date(dueDate) }
    );
    
    const tasks = await Task.find({ _id: { $in: taskIds } });
    
    const { io } = await import('../server');
    io.emit('tasks:bulk:dueDate:set', { taskIds, dueDate });
    
    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Bulk set due date error:', error);
    res.status(500).json({ message: 'Error setting due dates', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const bulkClone = async (req: Request, res: Response) => {
  try {
    const { taskIds } = req.body;
    
    if (!taskIds?.length) return res.status(400).json({ message: 'Task IDs required' });
    
    const tasks = await Task.find({ _id: { $in: taskIds } });
    const clonedTasks = [];
    
    for (const task of tasks) {
      const { _id, createdAt, updatedAt, ...taskData } = task.toObject();
      const cloned = new Task({ 
        ...taskData, 
        title: `${taskData.title} (Copy)`,
        status: 'todo',
        actualHours: 0,
        timeEntries: [],
        comments: []
      });
      await cloned.save();
      clonedTasks.push(cloned);
    }
    
    const { io } = await import('../server');
    io.emit('tasks:bulk:cloned', { originalIds: taskIds, clonedTasks });
    
    res.json({ success: true, clonedTasks });
  } catch (error) {
    console.error('Bulk clone error:', error);
    res.status(500).json({ message: 'Error cloning tasks', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const bulkArchive = async (req: Request, res: Response) => {
  try {
    const { taskIds } = req.body;
    
    if (!taskIds?.length) return res.status(400).json({ message: 'Task IDs required' });
    
    // Add archived field to tasks (requires schema update)
    await Task.updateMany(
      { _id: { $in: taskIds } },
      { $set: { archived: true } }
    );
    
    const { io } = await import('../server');
    io.emit('tasks:bulk:archived', { taskIds });
    
    res.json({ success: true, archivedCount: taskIds.length });
  } catch (error) {
    console.error('Bulk archive error:', error);
    res.status(500).json({ message: 'Error archiving tasks', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
