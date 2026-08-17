//path: backend/src/controllers/taskController.ts

import { Request, Response } from 'express';
import Task from '../models/Task';
import Project from '../models/Project';
import { createTimelineEvent, getEntityTimeline } from '../utils/timelineHelper';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';
import { parseListParams, escapeRegex } from '../utils/helpers';
import * as taskService from '../services/taskService';
import { TaskServiceError } from '../services/taskService';

const actorOf = (req: Request) => ({
  userId: req.user!._id.toString(),
  userName: req.user?.name
});

const fail = (res: Response, error: any, fallback: string) => {
  if (error instanceof TaskServiceError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  logger.error(fallback, { message: error?.message });
  return res.status(500).json({ success: false, message: fallback });
};

const ok = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data });

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
    const task = await taskService.createTask(req.body, actorOf(req));
    return ok(res, task, 201);
  } catch (error) {
    return fail(res, error, 'Error creating task');
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, actorOf(req));
    return ok(res, task);
  } catch (error) {
    return fail(res, error, 'Error updating task');
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    await taskService.deleteTask(req.params.id, actorOf(req));
    return ok(res, { message: 'Task deleted successfully' });
  } catch (error) {
    return fail(res, error, 'Error deleting task');
  }
};

export const addTaskComment = async (req: Request, res: Response) => {
  try {
    const { comment } = await taskService.addComment(
      req.params.id,
      req.body?.comment,
      actorOf(req),
      undefined,
      Array.isArray(req.body?.mentions) ? req.body.mentions : []
    );
    return ok(res, comment, 201);
  } catch (error) {
    return fail(res, error, 'Error adding comment');
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
    const { task, oldStatus } = await taskService.updateTaskStatus(
      req.params.id,
      req.body?.status,
      actorOf(req)
    );

    const { RealTimeEmitter } = await import('../utils/realTimeEmitter');
    await RealTimeEmitter.emitDashboardStats();
    await RealTimeEmitter.emitActivityLog({
      type: 'task',
      message: `Task "${task.title}" status changed to ${task.status}`,
      user: req.user?.name || 'System',
      userId: req.user?._id?.toString(),
      metadata: { taskId: task._id, taskTitle: task.title, oldStatus, newStatus: task.status }
    });

    return ok(res, task);
  } catch (error) {
    return fail(res, error, 'Error updating task status');
  }
};

export const cloneTask = async (req: Request, res: Response) => {
  try {
    const clone = await taskService.cloneTask(req.params.id, actorOf(req));
    return ok(res, clone, 201);
  } catch (error) {
    return fail(res, error, 'Error cloning task');
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
    const watchers = await taskService.addWatcher(req.params.id, req.body?.userId);
    return ok(res, watchers);
  } catch (error) {
    return fail(res, error, 'Error adding watcher');
  }
};

export const removeWatcher = async (req: Request, res: Response) => {
  try {
    const watchers = await taskService.removeWatcher(req.params.id, req.body?.userId);
    return ok(res, watchers);
  } catch (error) {
    return fail(res, error, 'Error removing watcher');
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
    const entry = await taskService.startTimer(req.params.id, actorOf(req), req.body?.description);
    return ok(res, entry);
  } catch (error) {
    return fail(res, error, 'Error starting time tracking');
  }
};

export const stopTimeTracking = async (req: Request, res: Response) => {
  try {
    const result = await taskService.stopTimer(req.params.id, actorOf(req));
    return ok(res, result);
  } catch (error) {
    return fail(res, error, 'Error stopping time tracking');
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
    const tag = await taskService.addTag(req.params.id, {
      name: req.body?.name,
      color: req.body?.color
    });
    return ok(res, tag, 201);
  } catch (error) {
    return fail(res, error, 'Error adding tag');
  }
};

export const removeTag = async (req: Request, res: Response) => {
  try {
    const tags = await taskService.removeTag(req.params.id, req.body?.name);
    return ok(res, tags);
  } catch (error) {
    return fail(res, error, 'Error removing tag');
  }
};

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
