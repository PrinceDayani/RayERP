//path: backend/src/utils/taskReminders.ts

import cron from 'node-cron';
import Task from '../models/Task';
import { NotificationEmitter } from './notificationEmitter';

export const initializeTaskReminders = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // 24h before reminders
      const tasks24h = await Task.find({
        dueDate: { $gte: now, $lte: tomorrow },
        status: { $nin: ['completed', 'blocked'] },
        reminderSent24h: false
      }).populate('assignedTo project');

      for (const task of tasks24h) {
        await NotificationEmitter.taskDueSoon(task);
        task.reminderSent24h = true;
        await task.save();
      }

      // Due date reminders
      const tasksDue = await Task.find({
        dueDate: { $gte: now, $lte: new Date(now.getTime() + 60 * 60 * 1000) },
        status: { $nin: ['completed', 'blocked'] },
        reminderSentOnDue: false
      }).populate('assignedTo project');

      for (const task of tasksDue) {
        await NotificationEmitter.taskDueToday(task);
        task.reminderSentOnDue = true;
        await task.save();
      }

      // Overdue reminders
      const tasksOverdue = await Task.find({
        dueDate: { $lt: now },
        status: { $nin: ['completed', 'blocked'] },
        reminderSentOverdue: false
      }).populate('assignedTo project');

      for (const task of tasksOverdue) {
        await NotificationEmitter.taskOverdue(task);
        task.reminderSentOverdue = true;
        await task.save();
      }
    } catch (error) {
      console.error('Task reminder error:', error);
    }
  });
};
