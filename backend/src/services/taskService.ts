//path: backend/src/services/taskService.ts

import mongoose from 'mongoose';
import Task from '../models/Task';
import Project from '../models/Project';
import { createTimelineEvent } from '../utils/timelineHelper';
import { emitProjectStats } from '../utils/socketEvents';
import { recalculateProjectProgress } from '../utils/projectProgress';
import { logger } from '../utils/logger';

// Thrown for expected failures so callers can map them to a status code
// without inspecting error strings.
export class TaskServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'TaskServiceError';
  }
}

// Fields a client may set on a task. Everything outside this list -- project,
// taskType, isTemplate, assignedBy, and the collections mutated through their
// own endpoints -- is ignored, so a request body cannot reassign a task to a
// different project or overwrite its comment and time-entry history.
const CLIENT_WRITABLE_FIELDS = [
  'title',
  'description',
  'status',
  'priority',
  'assignedTo',
  'dueDate',
  'estimatedHours',
  'actualHours',
  'order',
  'column',
  'tags',
  'blockedBy',
  'isRecurring',
  'recurrencePattern',
  'customFields'
] as const;

export const pickWritableFields = (body: any): Record<string, any> => {
  const update: Record<string, any> = {};
  for (const field of CLIENT_WRITABLE_FIELDS) {
    if (body?.[field] !== undefined) update[field] = body[field];
  }
  return update;
};

export const TASK_DETAIL_POPULATE = [
  { path: 'project', select: 'name' },
  { path: 'assignedTo', select: 'name email' },
  { path: 'assignedBy', select: 'name email' },
  { path: 'comments.user', select: 'name email' },
  { path: 'watchers', select: 'name email' },
  { path: 'dependencies.taskId', select: 'title' },
  { path: 'subtasks', select: 'title status' },
  { path: 'parentTask', select: 'title' }
];

// Both route trees expose a projectId alongside the populated project ref;
// the project-scoped tree relied on this shape before consolidation.
export const shapeTask = (task: any) => {
  const plain = typeof task?.toObject === 'function' ? task.toObject() : task;
  const project = plain?.project;
  return {
    ...plain,
    projectId: project?._id ? project._id.toString() : project?.toString()
  };
};

// Locates a task, optionally constraining it to a project. Callers reaching
// through /projects/:id/tasks must not be able to address tasks in another
// project by id.
export const findTask = async (taskId: string, projectId?: string) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new TaskServiceError(400, 'Invalid task id');
  }

  const filter: any = { _id: taskId };
  if (projectId) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new TaskServiceError(400, 'Invalid project id');
    }
    filter.project = projectId;
    filter.taskType = 'project';
  }

  const task = await Task.findOne(filter);
  if (!task) throw new TaskServiceError(404, 'Task not found');
  return task;
};

export const assertProjectExists = async (projectId: string) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new TaskServiceError(400, 'Invalid project id');
  }
  const project = await Project.findById(projectId).select('_id name').lean();
  if (!project) throw new TaskServiceError(404, 'Project not found');
  return project;
};

const emit = async (event: string, payload: any) => {
  const { io } = await import('../server');
  io.emit(event, payload);
};

const recordTimeline = (
  taskId: string,
  eventType: 'created' | 'updated' | 'status_changed' | 'deleted' | 'comment_added',
  title: string,
  description: string,
  actorId: string,
  metadata?: { field?: string; oldValue?: any; newValue?: any }
) => {
  if (!actorId) return;
  createTimelineEvent('task', taskId, eventType, title, description, actorId, metadata).catch(
    (err: any) => logger.error('Timeline event failed', { taskId, message: err?.message })
  );
};

export interface ActorContext {
  userId: string;
  userName?: string;
}

export const createTask = async (
  body: any,
  actor: ActorContext,
  projectId?: string
) => {
  const data: any = pickWritableFields(body);

  if (projectId) {
    await assertProjectExists(projectId);
    data.project = projectId;
    data.taskType = 'project';
  } else {
    data.taskType = body?.taskType === 'project' ? 'project' : 'individual';
    if (data.taskType === 'project') {
      if (!body?.project) throw new TaskServiceError(400, 'Project is required for project tasks');
      await assertProjectExists(body.project);
      data.project = body.project;
    }
  }

  // The creator is the authenticated user, never a client-supplied id.
  data.assignedBy = actor.userId;
  if (!data.assignedTo) data.assignedTo = actor.userId;
  data.assignmentType = data.assignedTo?.toString() === actor.userId ? 'self-assigned' : 'assigned';

  const task = new Task(data);
  await task.save();
  await task.populate(TASK_DETAIL_POPULATE);

  const shaped = shapeTask(task);

  recordTimeline(
    task._id.toString(),
    'created',
    'Task Created',
    `Task "${task.title}" was created`,
    actor.userId
  );

  await emit('task:created', shaped);
  await emitProjectStats();
  await recalculateProjectProgress(task.project);

  return shaped;
};

export const updateTask = async (
  taskId: string,
  body: any,
  actor: ActorContext,
  projectId?: string
) => {
  const existing = await findTask(taskId, projectId);
  const update = pickWritableFields(body);
  const oldStatus = existing.status;

  const task = await Task.findOneAndUpdate({ _id: existing._id }, update, {
    new: true,
    runValidators: true
  }).populate(TASK_DETAIL_POPULATE);

  if (!task) throw new TaskServiceError(404, 'Task not found');

  const shaped = shapeTask(task);

  if (update.status && update.status !== oldStatus) {
    recordTimeline(
      task._id.toString(),
      'status_changed',
      'Status Updated',
      `Task status changed from "${oldStatus}" to "${task.status}"`,
      actor.userId,
      { field: 'status', oldValue: oldStatus, newValue: task.status }
    );
  } else {
    recordTimeline(
      task._id.toString(),
      'updated',
      'Task Updated',
      `Task "${task.title}" was updated`,
      actor.userId
    );
  }

  await emit('task:updated', shaped);
  await emitProjectStats();
  await recalculateProjectProgress(task.project);

  return shaped;
};

export const updateTaskStatus = async (
  taskId: string,
  status: string,
  actor: ActorContext,
  projectId?: string
) => {
  if (!status) throw new TaskServiceError(400, 'Status is required');

  const task = await findTask(taskId, projectId);
  const oldStatus = task.status;

  // Drops tag entries that predate the required-name validation, which would
  // otherwise fail the save on an unrelated status change.
  task.tags = task.tags.filter(tag => tag.name && tag.name.trim());
  task.status = status as any;
  await task.save({ validateBeforeSave: true });
  await task.populate(TASK_DETAIL_POPULATE);

  const shaped = shapeTask(task);

  recordTimeline(
    task._id.toString(),
    'status_changed',
    'Status Updated',
    `Task status changed from "${oldStatus}" to "${status}"`,
    actor.userId,
    { field: 'status', oldValue: oldStatus, newValue: status }
  );

  await emit('task:status:updated', shaped);
  await emitProjectStats();
  await recalculateProjectProgress(task.project);

  return { task: shaped, oldStatus };
};

export const deleteTask = async (
  taskId: string,
  actor: ActorContext,
  projectId?: string
) => {
  const task = await findTask(taskId, projectId);
  const { title, project } = task;

  await Task.deleteOne({ _id: task._id });

  recordTimeline(
    taskId,
    'deleted',
    'Task Deleted',
    `Task "${title}" was deleted`,
    actor.userId
  );

  await emit('task:deleted', { id: taskId });
  await emitProjectStats();
  await recalculateProjectProgress(project);

  return { title };
};

export const addComment = async (
  taskId: string,
  comment: string,
  actor: ActorContext,
  projectId?: string,
  mentions: string[] = []
) => {
  if (!comment?.trim()) throw new TaskServiceError(400, 'Comment is required');

  const task = await findTask(taskId, projectId);

  // Comment author is the authenticated user, never a client-supplied id.
  task.comments.push({
    user: new mongoose.Types.ObjectId(actor.userId),
    comment: comment.trim(),
    mentions: mentions
      .filter(m => mongoose.Types.ObjectId.isValid(m))
      .map(m => new mongoose.Types.ObjectId(m)),
    createdAt: new Date()
  } as any);

  await task.save();
  await task.populate(TASK_DETAIL_POPULATE);

  const added = task.comments[task.comments.length - 1];

  recordTimeline(
    task._id.toString(),
    'comment_added',
    'Comment Added',
    `A comment was added to "${task.title}"`,
    actor.userId
  );

  await emit('task:comment:added', { taskId, comment: added });

  return { task: shapeTask(task), comment: added };
};

export const startTimer = async (
  taskId: string,
  actor: ActorContext,
  description?: string,
  projectId?: string
) => {
  const task = await findTask(taskId, projectId);

  // A user may only start their own timer.
  const active = task.timeEntries.find(
    e => e.user.toString() === actor.userId && !e.endTime
  );
  if (active) throw new TaskServiceError(400, 'Timer already running');

  task.timeEntries.push({
    user: new mongoose.Types.ObjectId(actor.userId),
    startTime: new Date(),
    duration: 0,
    description
  } as any);

  await task.save();
  await emit('task:timer:started', { taskId, userId: actor.userId });

  return task.timeEntries[task.timeEntries.length - 1];
};

export const stopTimer = async (
  taskId: string,
  actor: ActorContext,
  projectId?: string
) => {
  const task = await findTask(taskId, projectId);

  const entry = task.timeEntries.find(
    e => e.user.toString() === actor.userId && !e.endTime
  );
  if (!entry) throw new TaskServiceError(400, 'No running timer found');

  entry.endTime = new Date();
  entry.duration = Math.round(
    (entry.endTime.getTime() - new Date(entry.startTime).getTime()) / 60000
  );

  task.actualHours = Number(
    (task.timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / 60).toFixed(2)
  );

  await task.save();
  await emit('task:timer:stopped', { taskId, userId: actor.userId });
  await recalculateProjectProgress(task.project);

  return { entry, actualHours: task.actualHours };
};

export const addTag = async (
  taskId: string,
  tag: { name: string; color?: string },
  projectId?: string
) => {
  if (!tag?.name?.trim()) throw new TaskServiceError(400, 'Tag name is required');

  const task = await findTask(taskId, projectId);
  task.tags.push({ name: tag.name.trim(), color: tag.color || '#3b82f6' } as any);
  await task.save();

  await emit('task:updated', shapeTask(task));
  return task.tags[task.tags.length - 1];
};

export const removeTag = async (taskId: string, tagName: string, projectId?: string) => {
  const task = await findTask(taskId, projectId);
  task.tags = task.tags.filter(t => t.name !== tagName) as any;
  await task.save();

  await emit('task:updated', shapeTask(task));
  return task.tags;
};

export const addWatcher = async (taskId: string, userId: string, projectId?: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new TaskServiceError(400, 'Invalid user id');
  }

  const task = await findTask(taskId, projectId);
  const already = task.watchers.some(w => w.toString() === userId);
  if (!already) {
    task.watchers.push(new mongoose.Types.ObjectId(userId));
    await task.save();
  }

  return task.watchers;
};

export const removeWatcher = async (taskId: string, userId: string, projectId?: string) => {
  const task = await findTask(taskId, projectId);
  task.watchers = task.watchers.filter(w => w.toString() !== userId) as any;
  await task.save();
  return task.watchers;
};

export const cloneTask = async (
  taskId: string,
  actor: ActorContext,
  projectId?: string
) => {
  const source = await findTask(taskId, projectId);

  const {
    _id,
    createdAt,
    updatedAt,
    comments,
    timeEntries,
    attachments,
    ...rest
  } = source.toObject();

  // History belongs to the original task, so the copy starts clean.
  const clone = new Task({
    ...rest,
    title: `${rest.title} (Copy)`,
    status: 'todo',
    actualHours: 0,
    assignedBy: actor.userId,
    comments: [],
    timeEntries: [],
    attachments: [],
    reminderSent24h: false,
    reminderSentOnDue: false,
    reminderSentOverdue: false
  });

  await clone.save();
  await clone.populate(TASK_DETAIL_POPULATE);

  const shaped = shapeTask(clone);
  await emit('task:created', shaped);
  await emitProjectStats();
  await recalculateProjectProgress(clone.project);

  return shaped;
};

// Reorders tasks within a project. Ids are constrained to the project so a
// caller cannot move or restatus tasks belonging to a project they cannot see.
export const reorderProjectTasks = async (
  projectId: string,
  entries: Array<{ id: string; order?: number; column?: string; status?: string }>
) => {
  await assertProjectExists(projectId);

  if (!Array.isArray(entries) || entries.length === 0) {
    throw new TaskServiceError(400, 'tasks must be a non-empty array');
  }

  const validStatuses = ['todo', 'in-progress', 'review', 'completed', 'blocked'];

  const operations = entries
    .filter(entry => entry?.id && mongoose.Types.ObjectId.isValid(entry.id))
    .map(entry => {
      const update: any = {};
      if (typeof entry.order === 'number') update.order = entry.order;
      if (typeof entry.column === 'string') update.column = entry.column;
      if (typeof entry.status === 'string' && validStatuses.includes(entry.status)) {
        update.status = entry.status;
      }

      return {
        updateOne: {
          filter: { _id: entry.id, project: projectId, taskType: 'project' },
          update: { $set: update }
        }
      };
    })
    .filter(op => Object.keys(op.updateOne.update.$set).length > 0);

  if (operations.length === 0) {
    throw new TaskServiceError(400, 'No valid task updates supplied');
  }

  const result = await Task.bulkWrite(operations);

  await emit('project:tasks:reordered', { projectId, count: result.modifiedCount });
  await recalculateProjectProgress(projectId);

  return { matched: result.matchedCount, modified: result.modifiedCount };
};
