//path: backend/src/controllers/taskController.ts

import { Request, Response } from 'express';
import Task from '../models/Task';
import Project from '../models/Project';
import { createTimelineEvent, getEntityTimeline } from '../utils/timelineHelper';
import { logActivity } from '../utils/activityLogger';

const emitProjectStats = async () => {
  try {
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: 'active' });
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    const overdueTasks = await Task.countDocuments({ 
      dueDate: { $lt: new Date() }, 
      status: { $ne: 'completed' } 
    });
    
    const stats = {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueTasks,
      totalTasks: await Task.countDocuments(),
      completedTasks: await Task.countDocuments({ status: 'completed' })
    };
    
    const { io } = await import('../server');
    io.emit('project:stats', stats);
  } catch (error) {
    console.error('Error emitting project stats:', error);
  }
};

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
    
    let tasks;
    if (roleName === 'Root' || roleName === 'Super Admin') {
      // Root and Super Admin can see all tasks
      tasks = await Task.find({ isTemplate: { $ne: true } })
        .populate('project', 'name')
        .populate('assignedTo', 'firstName lastName')
        .populate('assignedBy', 'firstName lastName')
        .populate('dependencies.taskId', 'title')
        .populate('subtasks', 'title status')
        .populate('parentTask', 'title');
    } else {
      // Get user's employee record to find assigned tasks
      const Employee = (await import('../models/Employee')).default;
      const employee = await Employee.findOne({ user: user._id });
      
      if (!employee) {
        return res.json([]);
      }

      // Find projects user is assigned to
      const Project = (await import('../models/Project')).default;
      const userProjects = await Project.find({
        $or: [
          { members: user._id },
          { owner: user._id },
          { team: user._id },
          { manager: user._id }
        ]
      }).select('_id');
      
      const projectIds = userProjects.map(p => p._id);

      // Only show tasks from assigned projects OR tasks directly assigned to the employee
      tasks = await Task.find({ 
        isTemplate: { $ne: true },
        $or: [
          { project: { $in: projectIds } },
          { assignedTo: employee._id },
          { assignedBy: employee._id }
        ]
      })
        .populate('project', 'name')
        .populate('assignedTo', 'firstName lastName')
        .populate('assignedBy', 'firstName lastName')
        .populate('dependencies.taskId', 'title')
        .populate('subtasks', 'title status')
        .populate('parentTask', 'title');
    }
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const task = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName')
      .populate('comments.user', 'firstName lastName');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
    
    // Root and Super Admin can see all tasks
    if (roleName !== 'Root' && roleName !== 'Super Admin') {
      // Get user's employee record
      const Employee = (await import('../models/Employee')).default;
      const employee = await Employee.findOne({ user: user._id });
      
      // Check if user is assigned to this task
      const isAssigned = employee && task.assignedTo && 
        (task.assignedTo as any)._id.toString() === employee._id.toString();
      
      // Check if user has access to the project
      const Project = (await import('../models/Project')).default;
      const project = await Project.findById(task.project);
      const hasProjectAccess = project && (
        project.members.some(m => m.toString() === user._id.toString()) ||
        project.owner.toString() === user._id.toString() ||
        (project.team && project.team.some((t: any) => t.toString() === user._id.toString())) ||
        (project.manager && project.manager.toString() === user._id.toString())
      );
      
      // Check if user created the task
      const isCreator = employee && task.assignedBy && 
        (task.assignedBy as any)._id.toString() === employee._id.toString();
      
      if (!isAssigned && !hasProjectAccess && !isCreator) {
        return res.status(403).json({ message: 'Access denied: You are not assigned to this task or project' });
      }
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const task = new Task(req.body);
    await task.save();
    await task.populate('project', 'name');
    await task.populate('assignedTo', 'firstName lastName');
    await task.populate('assignedBy', 'firstName lastName');
    
    // Safely get assignedBy ID
    const assignedById = task.assignedBy ? 
                        (task.assignedBy as any)._id.toString() : 
                        req.body.assignedBy;
    
    if (!assignedById) {
      return res.status(400).json({ message: 'AssignedBy user is required for timeline event' });
    }
    
    await createTimelineEvent(
      'task',
      task._id.toString(),
      'created',
      'Task Created',
      `Task "${task.title}" was created`,
      assignedById
    );
    
    const { io } = await import('../server');
    io.emit('task:created', task);
    await emitProjectStats();
    
    // Send notification if task is assigned
    if (task.assignedTo) {
      const { NotificationEmitter } = await import('../utils/notificationEmitter');
      const Employee = (await import('../models/Employee')).default;
      const employee = await Employee.findById(task.assignedTo).populate('user');
      if (employee?.user) {
        const userId = (employee.user as any)._id.toString();
        await NotificationEmitter.taskAssigned(task, userId);
      }
    }
    
    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    await RealTimeEmitter.emitActivityLog({
      type: 'task',
      message: `New task "${task.title}" created`,
      user: req.user?.name || 'System',
      userId: req.user?._id?.toString(),
      metadata: { taskId: task._id, taskTitle: task.title, status: task.status }
    });
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ message: 'Error creating task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('project', 'name')
     .populate('assignedTo', 'firstName lastName')
     .populate('assignedBy', 'firstName lastName');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Safely get user ID for timeline
    const updatedBy = req.body.updatedBy || 
                     (task.assignedBy ? (task.assignedBy as any)._id.toString() : null);
    
    if (!updatedBy) {
      return res.status(400).json({ message: 'Unable to determine user for timeline event' });
    }
    
    if (oldTask.status !== task.status) {
      await createTimelineEvent(
        'task',
        task._id.toString(),
        'status_changed',
        'Status Updated',
        `Task status changed from "${oldTask.status}" to "${task.status}"`,
        updatedBy,
        {
          field: 'status',
          oldValue: oldTask.status,
          newValue: task.status
        }
      );
    } else {
      await createTimelineEvent(
        'task',
        task._id.toString(),
        'updated',
        'Task Updated',
        `Task "${task.title}" was updated`,
        updatedBy
      );
    }
    
    const { io } = await import('../server');
    io.emit('task:updated', task);
    await emitProjectStats();
    
    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    await RealTimeEmitter.emitActivityLog({
      type: 'task',
      message: `Task "${task.title}" updated`,
      user: req.user?.name || 'System',
      userId: req.user?._id?.toString(),
      metadata: { taskId: task._id, taskTitle: task.title, status: task.status }
    });
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ message: 'Error updating task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Safely get assignedBy ID
    const assignedById = task.assignedBy ? 
      (task.assignedBy as any)._id.toString() : null;
    
    if (assignedById) {
      await createTimelineEvent(
        'task',
        req.params.id,
        'deleted',
        'Task Deleted',
        `Task "${task.title}" was deleted`,
        assignedById
      );
    }
    
    const { io } = await import('../server');
    io.emit('task:deleted', { id: req.params.id });
    await emitProjectStats();
    
    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    await RealTimeEmitter.emitActivityLog({
      type: 'task',
      message: `Task "${task.title}" deleted`,
      user: req.user?.name || 'System',
      userId: req.user?._id?.toString(),
      metadata: { taskId: task._id, taskTitle: task.title }
    });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const addTaskComment = async (req: Request, res: Response) => {
  try {
    const { comment, user } = req.body;
    
    if (!comment || !user) {
      return res.status(400).json({ message: 'Comment and user are required' });
    }
    
    const task = await Task.findById(req.params.id).populate('project', 'name');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    task.comments.push({ user, comment, mentions: [], createdAt: new Date() });
    await task.save();
    await task.populate('comments.user', 'firstName lastName');
    
    try {
      await createTimelineEvent(
        'task',
        req.params.id,
        'comment_added',
        'Comment Added',
        comment,
        user
      );
    } catch (timelineError) {
      console.error('Timeline event creation failed:', timelineError);
    }

    // Log activity
    const currentUser = (req as any).user;
    const Employee = (await import('../models/Employee')).default;
    const employee = await Employee.findById(user);
    await logActivity({
      userId: currentUser?.id || user,
      userName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
      action: 'comment',
      resource: `Task: ${task.title}`,
      resourceType: 'comment',
      resourceId: task._id,
      projectId: task.project._id,
      details: `Commented on task "${task.title}": ${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}`,
      visibility: 'project_team',
      metadata: { comment, taskTitle: task.title }
    });
    
    const { io } = await import('../server');
    io.emit('task:comment:added', { taskId: req.params.id, comment: task.comments[task.comments.length - 1] });
    res.json(task);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(400).json({ message: 'Error adding comment', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getTaskStats = async (req: Request, res: Response) => {
  try {
    const { getTaskStats } = await import('../utils/taskUtils');
    const stats = await getTaskStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task stats', error });
  }
};

export const getTaskTimeline = async (req: Request, res: Response) => {
  try {
    // Validate that the task exists
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const timeline = await getEntityTimeline('task', req.params.id);
    res.json(timeline);
  } catch (error) {
    console.error('Error fetching task timeline:', error);
    res.status(500).json({ message: 'Error fetching task timeline', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const addTimelineEntry = async (req: Request, res: Response) => {
  try {
    const { type, description, user } = req.body;
    
    if (!type || !description || !user) {
      return res.status(400).json({ message: 'Type, description, and user are required' });
    }
    
    // Validate that the task exists
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    await createTimelineEvent(
      'task',
      req.params.id,
      type as any,
      'Manual Entry',
      description,
      user
    );
    
    const { io } = await import('../server');
    io.emit('task:timeline:added', { 
      taskId: req.params.id, 
      entry: { type, description, user, timestamp: new Date() }
    });
    
    res.json({ message: 'Timeline entry added successfully' });
  } catch (error) {
    console.error('Error adding timeline entry:', error);
    res.status(400).json({ message: 'Error adding timeline entry', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { status, user } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Clean up invalid tags before saving
    task.tags = task.tags.filter(tag => tag.name && tag.name.trim());
    
    const oldStatus = task.status;
    task.status = status;
    await task.save({ validateBeforeSave: true });
    
    await task.populate('project', 'name');
    await task.populate('assignedTo', 'firstName lastName');
    await task.populate('assignedBy', 'firstName lastName');
    
    // Safely get user ID
    const userId = user || (task.assignedBy ? 
                           (task.assignedBy._id?.toString() || task.assignedBy.toString()) : 
                           null);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required for timeline event' });
    }
    
    try {
      await createTimelineEvent(
        'task',
        task._id.toString(),
        'status_changed',
        'Status Updated',
        `Task status changed from "${oldStatus}" to "${status}"`,
        userId,
        {
          field: 'status',
          oldValue: oldStatus,
          newValue: status
        }
      );
    } catch (timelineError) {
      console.error('Timeline event creation failed:', timelineError);
      // Continue execution even if timeline fails
    }
    
    const { io } = await import('../server');
    io.emit('task:status:updated', task);
    await emitProjectStats();
    
    // Emit dashboard stats update
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    await RealTimeEmitter.emitActivityLog({
      type: 'task',
      message: `Task "${task.title}" status changed to ${status}`,
      user: req.user?.name || 'System',
      userId: req.user?._id?.toString(),
      metadata: { taskId: task._id, taskTitle: task.title, oldStatus: oldStatus, newStatus: status }
    });
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(400).json({ message: 'Error updating task status', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const cloneTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const { _id, createdAt, updatedAt, ...taskData } = task.toObject();
    const clonedTask = new Task({ ...taskData, title: `${taskData.title} (Copy)` });
    await clonedTask.save();
    await clonedTask.populate('project assignedTo assignedBy');
    
    const { io } = await import('../server');
    io.emit('task:created', clonedTask);
    res.status(201).json(clonedTask);
  } catch (error) {
    res.status(400).json({ message: 'Error cloning task', error });
  }
};

export const bulkUpdateTasks = async (req: Request, res: Response) => {
  try {
    const { taskIds, updates } = req.body;
    if (!taskIds?.length) return res.status(400).json({ message: 'Task IDs required' });
    
    await Task.updateMany({ _id: { $in: taskIds } }, updates);
    const tasks = await Task.find({ _id: { $in: taskIds } }).populate('project assignedTo assignedBy');
    
    const { io } = await import('../server');
    io.emit('tasks:bulk:updated', tasks);
    res.json(tasks);
  } catch (error) {
    res.status(400).json({ message: 'Error bulk updating tasks', error });
  }
};

export const addWatcher = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    if (!task.watchers.includes(userId)) {
      task.watchers.push(userId);
      await task.save();
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: 'Error adding watcher', error });
  }
};

export const removeWatcher = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.watchers = task.watchers.filter(w => w.toString() !== userId);
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: 'Error removing watcher', error });
  }
};

export const getTaskTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await Task.find({ isTemplate: true });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching templates', error });
  }
};

export const createFromTemplate = async (req: Request, res: Response) => {
  try {
    const template = await Task.findById(req.params.id);
    if (!template || !template.isTemplate) return res.status(404).json({ message: 'Template not found' });
    
    const { _id, createdAt, updatedAt, isTemplate, templateName, ...taskData } = template.toObject();
    const task = new Task({ ...taskData, ...req.body });
    await task.save();
    await task.populate('project assignedTo assignedBy');
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: 'Error creating from template', error });
  }
};

export const startTimeTracking = async (req: Request, res: Response) => {
  try {
    const { user, description } = req.body;
    
    if (!user) return res.status(400).json({ message: 'User ID is required' });
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const activeEntry = task.timeEntries.find(e => e.user.toString() === user && !e.endTime);
    if (activeEntry) return res.status(400).json({ message: 'Timer already running for this user' });
    
    task.timeEntries.push({ user, startTime: new Date(), duration: 0, description: description?.trim() });
    await task.save();
    
    const { io } = await import('../server');
    io.emit('task:timer:started', { taskId: task._id, userId: user });
    
    res.json({ success: true, entry: task.timeEntries[task.timeEntries.length - 1] });
  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(500).json({ message: 'Error starting timer', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const stopTimeTracking = async (req: Request, res: Response) => {
  try {
    const { user } = req.body;
    
    if (!user) return res.status(400).json({ message: 'User ID is required' });
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const entry = task.timeEntries.find(e => e.user.toString() === user && !e.endTime);
    if (!entry) return res.status(400).json({ message: 'No active timer found for this user' });
    
    entry.endTime = new Date();
    entry.duration = Math.max(1, Math.round((entry.endTime.getTime() - entry.startTime.getTime()) / 1000 / 60));
    task.actualHours = Number(task.timeEntries.reduce((sum, e) => sum + (e.duration / 60), 0).toFixed(2));
    await task.save();
    
    const { io } = await import('../server');
    io.emit('task:timer:stopped', { taskId: task._id, userId: user, duration: entry.duration });
    
    res.json({ success: true, entry, actualHours: task.actualHours });
  } catch (error) {
    console.error('Error stopping timer:', error);
    res.status(500).json({ message: 'Error stopping timer', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const addAttachment = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { uploadedBy } = req.body;
    
    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    if (!uploadedBy) return res.status(400).json({ message: 'Uploader ID is required' });
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      // Clean up uploaded file if task not found
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../uploads', file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const attachment = {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      uploadedBy,
      uploadedAt: new Date()
    };
    
    task.attachments.push(attachment);
    await task.save();
    
    const { io } = await import('../server');
    const addedAttachment = task.attachments[task.attachments.length - 1] as any;
    io.emit('task:attachment:added', { taskId: task._id, attachment: addedAttachment });
    
    const responseAttachment = task.attachments[task.attachments.length - 1] as any;
    res.json({ success: true, attachment: responseAttachment });
  } catch (error) {
    console.error('Error adding attachment:', error);
    // Clean up file on error
    if (req.file) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.join(__dirname, '../../uploads', req.file.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    res.status(500).json({ message: 'Error adding attachment', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const removeAttachment = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const attachmentIndex = task.attachments.findIndex(a => 
      (a as any)._id?.toString() === req.params.attachmentId);
    if (attachmentIndex === -1) return res.status(404).json({ message: 'Attachment not found' });
    
    const attachment = task.attachments[attachmentIndex];
    task.attachments = task.attachments.filter((_, index) => index !== attachmentIndex);
    await task.save();
    
    // Delete file from disk
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../uploads', attachment.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue even if file deletion fails
    }
    
    const { io } = await import('../server');
    io.emit('task:attachment:removed', { taskId: task._id, attachmentId: req.params.attachmentId });
    
    res.json({ success: true, message: 'Attachment removed successfully' });
  } catch (error) {
    console.error('Error removing attachment:', error);
    res.status(500).json({ message: 'Error removing attachment', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const addTag = async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    
    if (!name?.trim()) return res.status(400).json({ message: 'Tag name is required' });
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const trimmedName = name.trim();
    if (task.tags.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      return res.status(400).json({ message: 'Tag already exists' });
    }
    
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const validColor = color && hexColorRegex.test(color) ? color : '#3b82f6';
    
    task.tags.push({ name: trimmedName, color: validColor });
    await task.save();
    
    const { io } = await import('../server');
    io.emit('task:tag:added', { taskId: task._id, tag: task.tags[task.tags.length - 1] });
    
    res.json({ success: true, tag: task.tags[task.tags.length - 1] });
  } catch (error) {
    console.error('Error adding tag:', error);
    res.status(500).json({ message: 'Error adding tag', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const removeTag = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    
    if (!name) return res.status(400).json({ message: 'Tag name is required' });
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const initialLength = task.tags.length;
    task.tags = task.tags.filter(t => t.name !== name);
    
    if (task.tags.length === initialLength) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    
    await task.save();
    
    const { io } = await import('../server');
    io.emit('task:tag:removed', { taskId: task._id, tagName: name });
    
    res.json({ success: true, message: 'Tag removed successfully' });
  } catch (error) {
    console.error('Error removing tag:', error);
    res.status(500).json({ message: 'Error removing tag', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};