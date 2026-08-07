//path: backend/src/controllers/taskController.ts

import { Request, Response } from 'express';
import Task from '../models/Task';
import Project from '../models/Project';
import { createTimelineEvent, getEntityTimeline } from '../utils/timelineHelper';
import { logActivity } from '../utils/activityLogger';
import { logger } from '../utils/logger';
import { emitProjectStats } from '../utils/socketEvents';
import mongoose from 'mongoose';
import { recalculateProjectProgress } from '../utils/projectProgress';
import { parseListParams, escapeRegex } from '../utils/helpers';

const TASK_SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  dueDate: { dueDate: 1 },
  created: { createdAt: -1 },
  recent: { updatedAt: -1 },
  title: { title: 1 },
  order: { order: 1 }
};

const TASK_LIST_POPULATE = [
  { path: 'project', select: 'name' },
  { path: 'assignedTo', select: 'name email' },
  { path: 'assignedBy', select: 'name email' },
  { path: 'dependencies.taskId', select: 'title' },
  { path: 'subtasks', select: 'title status' },
  { path: 'parentTask', select: 'title' }
];

// Ids of soft-deleted projects, so their tasks stop surfacing in task lists.
// Project queries already exclude them, but a task can also be reached through
// assignedTo/assignedBy without going via its project.
const getDeletedProjectIds = async (): Promise<any[]> => {
  const ProjectModel = (await import('../models/Project')).default;
  const deleted = await ProjectModel.find({ deletedAt: { $ne: null } })
    .select('_id')
    .lean();
  return deleted.map(p => p._id);
};

const buildTaskFilter = (query: any, search: string | null) => {
  const filter: any = { isTemplate: { $ne: true } };

  const validStatuses = ['todo', 'in-progress', 'review', 'completed', 'blocked'];
  const validPriorities = ['low', 'medium', 'high', 'critical'];

  const statuses = String(query.status || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter((s: string) => validStatuses.includes(s));
  if (statuses.length) filter.status = { $in: statuses };

  const priorities = String(query.priority || '')
    .split(',')
    .map((p: string) => p.trim())
    .filter((p: string) => validPriorities.includes(p));
  if (priorities.length) filter.priority = { $in: priorities };

  if (query.taskType === 'individual' || query.taskType === 'project') {
    filter.taskType = query.taskType;
  }

  if (typeof query.project === 'string' && mongoose.Types.ObjectId.isValid(query.project)) {
    filter.project = new mongoose.Types.ObjectId(query.project);
  }

  if (typeof query.assignedTo === 'string' && mongoose.Types.ObjectId.isValid(query.assignedTo)) {
    filter.assignedTo = new mongoose.Types.ObjectId(query.assignedTo);
  }

  if (query.overdue === 'true') {
    filter.dueDate = { $lt: new Date() };
    filter.status = filter.status
      ? { ...filter.status, $ne: 'completed' }
      : { $ne: 'completed' };
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$and = [{ $or: [{ title: pattern }, { description: pattern }] }];
  }

  return filter;
};

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = user.role as any;
    const { page, limit, skip, paginate, search, sort } = parseListParams(req.query, {
      sortMap: TASK_SORT_MAP,
      defaultSort: 'dueDate'
    });

    const filter: any = buildTaskFilter(req.query, search);

    const deletedProjectIds = await getDeletedProjectIds();
    if (deletedProjectIds.length) {
      filter.project = filter.project
        ? filter.project
        : { $nin: deletedProjectIds };
    }

    // Root/Director see every task; everyone else sees their own plus the
    // tasks of projects they are attached to.
    if (!(userRole?.level >= 80)) {
      const ProjectModel = (await import('../models/Project')).default;
      const assignedProjects = await ProjectModel.find({
        $or: [{ owner: user._id }, { team: user._id }, { managers: user._id }]
      })
        .select('_id')
        .lean();

      const assignedProjectIds = assignedProjects.map(p => p._id);

      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { assignedTo: user._id },
            { assignedBy: user._id },
            { taskType: 'project', project: { $in: assignedProjectIds } }
          ]
        }
      ];
    }

    const query = Task.find(filter).sort(sort).populate(TASK_LIST_POPULATE).lean();
    if (paginate) query.skip(skip).limit(limit);

    const [tasks, total] = await Promise.all([
      query.exec(),
      paginate ? Task.countDocuments(filter) : Promise.resolve(0)
    ]);

    if (!paginate) {
      // Unparameterised calls keep the original bare-array contract.
      return res.json(tasks);
    }

    return res.json({
      success: true,
      data: tasks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error('Error fetching tasks', { message: (error as any)?.message });
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
};

// Id/title pairs for pickers, mirroring /projects/minimal.
export const getTasksMinimal = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = user.role as any;
    const filter: any = { isTemplate: { $ne: true } };

    if (typeof req.query.project === 'string' && mongoose.Types.ObjectId.isValid(req.query.project)) {
      filter.project = new mongoose.Types.ObjectId(req.query.project);
    }

    if (!(userRole?.level >= 80)) {
      filter.$or = [{ assignedTo: user._id }, { assignedBy: user._id }];
    }

    const tasks = await Task.find(filter)
      .select('title status project')
      .sort({ title: 1 })
      .lean();

    res.json({ success: true, data: tasks });
  } catch (error) {
    logger.error('Error fetching minimal tasks', { message: (error as any)?.message });
    res.status(500).json({ success: false, message: 'Error fetching tasks' });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = user.role as any;
    
    // Root/Director get full access
    if (userRole?.level >= 80) {
      const task = await Task.findById(req.params.id)
        .populate('project', 'name')
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .populate('comments.user', 'name email');
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      return res.json(task);
    }

    const task = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('comments.user', 'name email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const userIdStr = user._id.toString();

    // Check if user is assigned to this task
    const isAssigned = task.assignedTo &&
      ((task.assignedTo as any)._id?.toString() || task.assignedTo.toString()) === userIdStr;

    // Check if user has access to the project
    const Project = (await import('../models/Project')).default;
    const project = await Project.findById(task.project);
    const hasProjectAccess = !!project && (
      project.owner.toString() === userIdStr ||
      project.team?.some((t: any) => t.toString() === userIdStr) ||
      project.managers?.some((m: any) => m.toString() === userIdStr)
    );

    // Check if user created the task
    const isCreator = task.assignedBy &&
      ((task.assignedBy as any)._id?.toString() || task.assignedBy.toString()) === userIdStr;

    // For the optional HR-domain department fallback below
    const Employee = (await import('../models/Employee')).default;
    const employee = await Employee.findOne({ user: user._id });
    
    // If assigned to task or project, return full details
    if (isAssigned || hasProjectAccess || isCreator) {
      return res.json(task);
    }
    
    // Check department permission for basic view
    if (!employee) {
      return res.status(403).json({ message: 'Access denied: You are not assigned to this task or project' });
    }

    const Department = (await import('../models/Department')).default;
    const departmentNames = employee.departments || (employee.department ? [employee.department] : []);

    if (departmentNames.length > 0) {
      const departments = await Department.find({ name: { $in: departmentNames }, status: 'active' });
      const hasTaskViewPermission = departments.some(dept => 
        dept.permissions && dept.permissions.includes('tasks.view')
      );
      
      if (hasTaskViewPermission && project) {
        // Check if task's project belongs to user's department
        const projectDepartments = project.departments.map((d: any) => (d && typeof d === 'object' && d.name) ? d.name : d.toString());
        const hasAccessToDepartment = departmentNames.some(dept => projectDepartments.includes(dept));
        
        if (hasAccessToDepartment) {
          // Return basic task info only
          return res.json({
            _id: task._id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            project: task.project,
            isBasicView: true
          });
        }
      }
    }
    
    return res.status(403).json({ message: 'Access denied: You are not assigned to this task or project' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const taskData = { ...req.body };

    if (!taskData.taskType) {
      taskData.taskType = taskData.project ? 'project' : 'individual';
    }

    if (!taskData.assignmentType) {
      taskData.assignmentType = 'assigned';
    }

    if (taskData.assignmentType === 'self-assigned') {
      taskData.assignedTo = user._id;
      taskData.assignedBy = user._id;
    }

    if (!taskData.assignedBy) {
      taskData.assignedBy = user._id;
    }

    if (taskData.assignmentType === 'assigned' && taskData.assignedTo?.toString() !== user._id.toString()) {
      const userRole = user.role as any;
      if (userRole?.level < 50 && userRole?.name?.toLowerCase() !== 'root') {
        return res.status(403).json({ message: 'Insufficient permissions to assign tasks to others' });
      }
    }
    
    const task = new Task(taskData);
    await task.save();
    
    if (task.project) {
      await task.populate('project', 'name');
    }
    await task.populate('assignedTo', 'name email');
    await task.populate('assignedBy', 'name email');
    
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
    await recalculateProjectProgress(task.project);
    
    // Send notification if task is assigned to someone else
    if (task.assignmentType === 'assigned' && task.assignedTo?.toString() !== user._id.toString()) {
      const { NotificationEmitter } = await import('../utils/notificationEmitter');
      await NotificationEmitter.taskAssigned(task, task.assignedTo.toString());
    }
    
    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    await RealTimeEmitter.emitActivityLog({
      type: 'task',
      message: `New task "${task.title}" created`,
      user: req.user?.name || 'System',
      userId: req.user?._id?.toString(),
      metadata: { taskId: task._id, taskTitle: task.title, status: task.status, taskType: task.taskType }
    });
    
    res.status(201).json(task);
  } catch (error) {
    logger.error('Error creating task', { message: error?.message });
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
     .populate('assignedTo', 'name email')
     .populate('assignedBy', 'name email');
    
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
    await recalculateProjectProgress(task.project);
    
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
    logger.error('Error updating task', { message: error?.message });
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
    await recalculateProjectProgress(task.project);
    
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
    logger.error('Error deleting task', { message: error?.message });
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
    await task.populate('comments.user', 'name email');
    
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
      logger.error('Timeline event creation failed', { message: (timelineError as any)?.message });
    }

    // Log activity
    const currentUser = (req as any).user;
    const User = (await import('../models/User')).default;
    const commenter = await User.findById(user).select('name');
    await logActivity({
      userId: currentUser?.id || user,
      userName: commenter?.name || currentUser?.name || 'Unknown',
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
    logger.error('Error adding comment', { message: error?.message });
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
    logger.error('Error fetching task timeline', { message: error?.message });
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
    logger.error('Error adding timeline entry', { message: error?.message });
    res.status(400).json({ message: 'Error adding timeline entry', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

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
    await task.populate('assignedTo', 'name email');
    await task.populate('assignedBy', 'name email');
    
    // Timeline actor is always the authenticated user; never client-supplied.
    const userId = req.user?._id?.toString();

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
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
      logger.error('Timeline event creation failed', { message: (timelineError as any)?.message });
      // Continue execution even if timeline fails
    }
    
    const { io } = await import('../server');
    io.emit('task:status:updated', task);
    await emitProjectStats();
    await recalculateProjectProgress(task.project);
    
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
    logger.error('Error updating task status', { message: error?.message });
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

export const saveAsTemplate = async (req: Request, res: Response) => {
  try {
    const { templateName } = req.body;
    if (!templateName?.trim()) return res.status(400).json({ message: 'Template name required' });
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const { _id, createdAt, updatedAt, timeEntries, comments, actualHours, ...templateData } = task.toObject();
    const template = new Task({ ...templateData, isTemplate: true, templateName: templateName.trim() });
    await template.save();
    
    res.status(201).json({ success: true, template });
  } catch (error) {
    res.status(400).json({ message: 'Error saving template', error });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const template = await Task.findById(req.params.id);
    if (!template || !template.isTemplate) return res.status(404).json({ message: 'Template not found' });
    
    Object.assign(template, req.body);
    template.isTemplate = true;
    await template.save();
    
    res.json({ success: true, template });
  } catch (error) {
    res.status(400).json({ message: 'Error updating template', error });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const template = await Task.findById(req.params.id);
    if (!template || !template.isTemplate) return res.status(404).json({ message: 'Template not found' });
    
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting template', error });
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
    logger.error('Error starting timer', { message: error?.message });
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
    logger.error('Error stopping timer', { message: error?.message });
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
    logger.error('Error adding attachment', { message: error?.message });
    // Clean up file on error
    if (req.file) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.join(__dirname, '../../uploads', req.file.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (cleanupError) {
        logger.error('Error cleaning up file', { message: (cleanupError as any)?.message });
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
      logger.error('Error deleting file', { message: (fileError as any)?.message });
      // Continue even if file deletion fails
    }
    
    const { io } = await import('../server');
    io.emit('task:attachment:removed', { taskId: task._id, attachmentId: req.params.attachmentId });
    
    res.json({ success: true, message: 'Attachment removed successfully' });
  } catch (error) {
    logger.error('Error removing attachment', { message: error?.message });
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
    logger.error('Error adding tag', { message: error?.message });
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
    logger.error('Error removing tag', { message: error?.message });
    res.status(500).json({ message: 'Error removing tag', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Custom Fields
export const addCustomField = async (req: Request, res: Response) => {
  try {
    const { fieldName, fieldType, value, options } = req.body;
    
    if (!fieldName?.trim() || !fieldType) {
      return res.status(400).json({ message: 'Field name and type are required' });
    }
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const existingField = task.customFields.find(f => f.fieldName === fieldName);
    if (existingField) {
      return res.status(400).json({ message: 'Custom field with this name already exists' });
    }
    
    const customField: any = { fieldName, fieldType, value };
    if (fieldType === 'select' || fieldType === 'multiselect') {
      customField.options = options || [];
    }
    
    task.customFields.push(customField);
    await task.save();
    
    const { io } = await import('../server');
    io.emit('task:customField:added', { taskId: task._id, field: task.customFields[task.customFields.length - 1] });
    
    res.json({ success: true, field: task.customFields[task.customFields.length - 1] });
  } catch (error) {
    logger.error('Error adding custom field', { message: error?.message });
    res.status(500).json({ message: 'Error adding custom field', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const removeCustomField = async (req: Request, res: Response) => {
  try {
    const { fieldName } = req.params;
    
    if (!fieldName) return res.status(400).json({ message: 'Field name is required' });
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const initialLength = task.customFields.length;
    task.customFields = task.customFields.filter(f => f.fieldName !== fieldName);
    
    if (task.customFields.length === initialLength) {
      return res.status(404).json({ message: 'Custom field not found' });
    }
    
    await task.save();
    
    const { io } = await import('../server');
    io.emit('task:customField:removed', { taskId: task._id, fieldName });
    
    res.json({ success: true, message: 'Custom field removed successfully' });
  } catch (error) {
    logger.error('Error removing custom field', { message: error?.message });
    res.status(500).json({ message: 'Error removing custom field', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateCustomField = async (req: Request, res: Response) => {
  try {
    const { fieldName } = req.params;
    const { value } = req.body;
    
    if (!fieldName) return res.status(400).json({ message: 'Field name is required' });
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const field = task.customFields.find(f => f.fieldName === fieldName);
    if (!field) return res.status(404).json({ message: 'Custom field not found' });
    
    field.value = value;
    await task.save();
    
    const { io } = await import('../server');
    io.emit('task:customField:updated', { taskId: task._id, fieldName, value });
    
    res.json({ success: true, field });
  } catch (error) {
    logger.error('Error updating custom field', { message: error?.message });
    res.status(500).json({ message: 'Error updating custom field', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
