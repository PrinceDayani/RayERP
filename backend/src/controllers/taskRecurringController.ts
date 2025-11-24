//path: backend/src/controllers/taskRecurringController.ts

import { Request, Response } from 'express';
import Task from '../models/Task';
import cron from 'node-cron';

export const setRecurring = async (req: Request, res: Response) => {
  try {
    const { pattern, enabled } = req.body;
    
    if (!pattern) return res.status(400).json({ message: 'Recurrence pattern required' });
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.isRecurring = enabled;
    task.recurrencePattern = pattern;
    task.nextRecurrence = calculateNextRecurrence(pattern);
    await task.save();
    
    res.json({ success: true, task });
  } catch (error) {
    console.error('Set recurring error:', error);
    res.status(500).json({ message: 'Error setting recurrence', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const processRecurringTasks = async () => {
  try {
    const now = new Date();
    const tasks = await Task.find({
      isRecurring: true,
      nextRecurrence: { $lte: now }
    });
    
    for (const task of tasks) {
      const { _id, createdAt, updatedAt, subtasks, comments, timeEntries, attachments, ...taskData } = task.toObject();
      
      const newTask = await Task.create({
        ...taskData,
        status: 'todo',
        actualHours: 0,
        timeEntries: [],
        comments: [],
        attachments: [],
        reminderSent24h: false,
        reminderSentOnDue: false,
        reminderSentOverdue: false
      });
      
      task.nextRecurrence = calculateNextRecurrence(task.recurrencePattern!);
      await task.save();
      
      const { io } = await import('../server');
      io.emit('task:recurring:created', { originalId: task._id, newTask });
    }
  } catch (error) {
    console.error('Process recurring tasks error:', error);
  }
};

function calculateNextRecurrence(pattern: string): Date {
  const now = new Date();
  
  if (pattern === 'daily') {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } else if (pattern === 'weekly') {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else if (pattern === 'monthly') {
    const next = new Date(now);
    next.setMonth(next.getMonth() + 1);
    return next;
  } else if (pattern.startsWith('custom:')) {
    const days = parseInt(pattern.split(':')[1]);
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }
  
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

export const initializeRecurringTasks = () => {
  cron.schedule('0 0 * * *', processRecurringTasks);
};
