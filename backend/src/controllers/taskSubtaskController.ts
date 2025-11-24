//path: backend/src/controllers/taskSubtaskController.ts

import { Request, Response } from 'express';
import Task from '../models/Task';

export const addSubtask = async (req: Request, res: Response) => {
  try {
    const { title, description, assignedTo, assignedBy } = req.body;
    const parentTask = await Task.findById(req.params.id);
    
    if (!parentTask) return res.status(404).json({ message: 'Parent task not found' });
    
    const subtask = await Task.create({
      title,
      description,
      project: parentTask.project,
      assignedTo,
      assignedBy,
      parentTask: parentTask._id,
      status: 'todo',
      priority: parentTask.priority
    });
    
    parentTask.subtasks.push(subtask._id);
    await parentTask.save();
    
    const { io } = await import('../server');
    io.emit('task:subtask:added', { taskId: parentTask._id, subtask });
    
    res.json({ success: true, subtask });
  } catch (error) {
    console.error('Add subtask error:', error);
    res.status(500).json({ message: 'Error adding subtask', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateChecklistItem = async (req: Request, res: Response) => {
  try {
    const { itemId, completed, completedBy } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const item = task.checklist.find(c => c._id?.toString() === itemId);
    if (!item) return res.status(404).json({ message: 'Checklist item not found' });
    
    item.completed = completed;
    if (completed) {
      item.completedBy = completedBy;
      item.completedAt = new Date();
    } else {
      item.completedBy = undefined;
      item.completedAt = undefined;
    }
    
    await task.save();
    
    const { io } = await import('../server');
    io.emit('task:checklist:updated', { taskId: task._id, item });
    
    res.json({ success: true, checklist: task.checklist });
  } catch (error) {
    console.error('Update checklist error:', error);
    res.status(500).json({ message: 'Error updating checklist', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const addChecklistItem = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Text is required' });
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.checklist.push({ text: text.trim(), completed: false });
    await task.save();
    
    const { io } = await import('../server');
    io.emit('task:checklist:added', { taskId: task._id, item: task.checklist[task.checklist.length - 1] });
    
    res.json({ success: true, checklist: task.checklist });
  } catch (error) {
    console.error('Add checklist error:', error);
    res.status(500).json({ message: 'Error adding checklist item', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getSubtaskProgress = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id).populate('subtasks', 'status');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const total = task.subtasks.length;
    const completed = task.subtasks.filter((s: any) => s.status === 'completed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    res.json({ total, completed, progress });
  } catch (error) {
    console.error('Subtask progress error:', error);
    res.status(500).json({ message: 'Error fetching progress', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteChecklistItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.checklist = task.checklist.filter(c => c._id?.toString() !== itemId);
    await task.save();
    const { io } = await import('../server');
    io.emit('task:checklist:deleted', { taskId: task._id, itemId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting', error: error instanceof Error ? error.message : 'Unknown' });
  }
};

export const deleteSubtask = async (req: Request, res: Response) => {
  try {
    const { subtaskId } = req.params;
    const parentTask = await Task.findById(req.params.id);
    if (!parentTask) return res.status(404).json({ message: 'Task not found' });
    await Task.findByIdAndDelete(subtaskId);
    parentTask.subtasks = parentTask.subtasks.filter(s => s.toString() !== subtaskId);
    await parentTask.save();
    const { io } = await import('../server');
    io.emit('task:subtask:deleted', { taskId: parentTask._id, subtaskId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting', error: error instanceof Error ? error.message : 'Unknown' });
  }
};
