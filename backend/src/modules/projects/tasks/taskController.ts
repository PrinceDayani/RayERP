//path: backend/src/modules/projects/tasks/taskController.ts
//
// Project-scoped task endpoints (/api/projects/:id/tasks). Task behaviour
// lives in services/taskService so this tree and /api/tasks cannot drift;
// these handlers only translate HTTP in and out.

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Task from '../../../models/Task';
import { logger } from '../../../utils/logger';
import * as taskService from '../../../services/taskService';
import { TaskServiceError, findTask, shapeTask } from '../../../services/taskService';

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

export const getProjectTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find({ project: req.params.id, taskType: 'project' })
      .populate(taskService.TASK_DETAIL_POPULATE)
      .sort({ order: 1 })
      .lean();

    return ok(res, tasks.map(shapeTask));
  } catch (error) {
    return fail(res, error, 'Error fetching project tasks');
  }
};

export const createProjectTask = async (req: Request, res: Response) => {
  try {
    const task = await taskService.createTask(req.body, actorOf(req), req.params.id);
    return ok(res, task, 201);
  } catch (error) {
    return fail(res, error, 'Error creating project task');
  }
};

export const updateProjectTask = async (req: Request, res: Response) => {
  try {
    const task = await taskService.updateTask(
      req.params.taskId,
      req.body,
      actorOf(req),
      req.params.id
    );
    return ok(res, task);
  } catch (error) {
    return fail(res, error, 'Error updating project task');
  }
};

export const deleteProjectTask = async (req: Request, res: Response) => {
  try {
    await taskService.deleteTask(req.params.taskId, actorOf(req), req.params.id);
    return ok(res, { message: 'Task deleted successfully' });
  } catch (error) {
    return fail(res, error, 'Error deleting project task');
  }
};

export const reorderTasks = async (req: Request, res: Response) => {
  try {
    const result = await taskService.reorderProjectTasks(req.params.id, req.body?.tasks);
    return ok(res, result);
  } catch (error) {
    return fail(res, error, 'Error reordering tasks');
  }
};

export const addProjectTaskComment = async (req: Request, res: Response) => {
  try {
    const { comment } = await taskService.addComment(
      req.params.taskId,
      req.body?.comment,
      actorOf(req),
      req.params.id,
      Array.isArray(req.body?.mentions) ? req.body.mentions : []
    );
    return ok(res, comment, 201);
  } catch (error) {
    return fail(res, error, 'Error adding comment');
  }
};

export const startProjectTaskTimer = async (req: Request, res: Response) => {
  try {
    const entry = await taskService.startTimer(
      req.params.taskId,
      actorOf(req),
      req.body?.description,
      req.params.id
    );
    return ok(res, entry);
  } catch (error) {
    return fail(res, error, 'Error starting timer');
  }
};

export const stopProjectTaskTimer = async (req: Request, res: Response) => {
  try {
    const result = await taskService.stopTimer(req.params.taskId, actorOf(req), req.params.id);
    return ok(res, result);
  } catch (error) {
    return fail(res, error, 'Error stopping timer');
  }
};

export const addProjectTaskTag = async (req: Request, res: Response) => {
  try {
    const tag = await taskService.addTag(
      req.params.taskId,
      { name: req.body?.name, color: req.body?.color },
      req.params.id
    );
    return ok(res, tag, 201);
  } catch (error) {
    return fail(res, error, 'Error adding tag');
  }
};

export const removeProjectTaskTag = async (req: Request, res: Response) => {
  try {
    const tags = await taskService.removeTag(req.params.taskId, req.body?.name, req.params.id);
    return ok(res, tags);
  } catch (error) {
    return fail(res, error, 'Error removing tag');
  }
};

export const addProjectTaskAttachment = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const task = await findTask(req.params.taskId, req.params.id);

    // Uploader is the authenticated user, never a client-supplied id.
    task.attachments.push({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      uploadedBy: new mongoose.Types.ObjectId(req.user!._id.toString()),
      uploadedAt: new Date()
    } as any);

    await task.save();
    return ok(res, task.attachments[task.attachments.length - 1], 201);
  } catch (error) {
    return fail(res, error, 'Error adding attachment');
  }
};

export const removeProjectTaskAttachment = async (req: Request, res: Response) => {
  try {
    const { attachmentId } = req.params;
    const task = await findTask(req.params.taskId, req.params.id);

    const attachment = task.attachments.find(
      (a: any) => a._id?.toString() === attachmentId
    );
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    task.attachments = task.attachments.filter(
      (a: any) => a._id?.toString() !== attachmentId
    ) as any;
    await task.save();

    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../../uploads', attachment.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (fileError) {
      logger.error('Error deleting attachment file', { message: (fileError as any)?.message });
    }

    return ok(res, { message: 'Attachment removed successfully' });
  } catch (error) {
    return fail(res, error, 'Error removing attachment');
  }
};

export const addProjectTaskChecklist = async (req: Request, res: Response) => {
  try {
    const text = req.body?.text;
    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'Checklist text is required' });
    }

    const task = await findTask(req.params.taskId, req.params.id);
    task.checklist.push({ text: text.trim(), completed: false } as any);
    await task.save();

    return ok(res, task.checklist[task.checklist.length - 1], 201);
  } catch (error) {
    return fail(res, error, 'Error adding checklist item');
  }
};

export const updateProjectTaskChecklist = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const task = await findTask(req.params.taskId, req.params.id);

    const item = task.checklist.find((i: any) => i._id?.toString() === itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' });
    }

    item.completed = !!req.body?.completed;
    if (item.completed) {
      // Completer is the authenticated user, never a client-supplied id.
      item.completedBy = new mongoose.Types.ObjectId(req.user!._id.toString());
      item.completedAt = new Date();
    } else {
      item.completedBy = undefined;
      item.completedAt = undefined;
    }

    await task.save();
    return ok(res, item);
  } catch (error) {
    return fail(res, error, 'Error updating checklist item');
  }
};

export const deleteProjectTaskChecklist = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const task = await findTask(req.params.taskId, req.params.id);

    task.checklist = task.checklist.filter((c: any) => c._id?.toString() !== itemId) as any;
    await task.save();

    return ok(res, { message: 'Checklist item deleted' });
  } catch (error) {
    return fail(res, error, 'Error deleting checklist item');
  }
};

export const addProjectTaskWatcher = async (req: Request, res: Response) => {
  try {
    const watchers = await taskService.addWatcher(
      req.params.taskId,
      req.body?.userId,
      req.params.id
    );
    return ok(res, watchers);
  } catch (error) {
    return fail(res, error, 'Error adding watcher');
  }
};

export const removeProjectTaskWatcher = async (req: Request, res: Response) => {
  try {
    const watchers = await taskService.removeWatcher(
      req.params.taskId,
      req.body?.userId,
      req.params.id
    );
    return ok(res, watchers);
  } catch (error) {
    return fail(res, error, 'Error removing watcher');
  }
};

export const addProjectTaskSubtask = async (req: Request, res: Response) => {
  try {
    const parent = await findTask(req.params.taskId, req.params.id);

    const subtask = await taskService.createTask(
      { ...req.body, priority: req.body?.priority || parent.priority },
      actorOf(req),
      parent.project!.toString()
    );

    await Task.updateOne(
      { _id: parent._id },
      { $addToSet: { subtasks: subtask._id } }
    );
    await Task.updateOne({ _id: subtask._id }, { $set: { parentTask: parent._id } });

    return ok(res, subtask, 201);
  } catch (error) {
    return fail(res, error, 'Error adding subtask');
  }
};

export const deleteProjectTaskSubtask = async (req: Request, res: Response) => {
  try {
    const { subtaskId } = req.params;
    const parent = await findTask(req.params.taskId, req.params.id);

    if (!parent.subtasks.some(s => s.toString() === subtaskId)) {
      return res.status(404).json({ success: false, message: 'Subtask not found on this task' });
    }

    await taskService.deleteTask(subtaskId, actorOf(req));
    await Task.updateOne({ _id: parent._id }, { $pull: { subtasks: subtaskId } });

    return ok(res, { message: 'Subtask deleted' });
  } catch (error) {
    return fail(res, error, 'Error deleting subtask');
  }
};

export const getProjectTaskSubtaskProgress = async (req: Request, res: Response) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      project: req.params.id,
      taskType: 'project'
    }).populate('subtasks', 'status');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const total = task.subtasks.length;
    const completed = task.subtasks.filter((s: any) => s.status === 'completed').length;

    return ok(res, {
      total,
      completed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0
    });
  } catch (error) {
    return fail(res, error, 'Error fetching subtask progress');
  }
};

export const addProjectTaskDependency = async (req: Request, res: Response) => {
  try {
    const { dependsOn, type = 'finish-to-start' } = req.body || {};
    if (!dependsOn) {
      return res.status(400).json({ success: false, message: 'Dependency task ID required' });
    }

    const task = await findTask(req.params.taskId, req.params.id);

    if (dependsOn === req.params.taskId) {
      return res.status(400).json({ success: false, message: 'A task cannot depend on itself' });
    }

    // The dependency must live in the same project.
    const dependency = await Task.findOne({
      _id: dependsOn,
      project: req.params.id,
      taskType: 'project'
    }).select('_id');
    if (!dependency) {
      return res.status(404).json({ success: false, message: 'Dependency task not found in this project' });
    }

    if (!task.dependencies.some(d => d.taskId.toString() === dependsOn)) {
      task.dependencies.push({ taskId: dependency._id, type } as any);
      await task.save();
    }

    return ok(res, task.dependencies);
  } catch (error) {
    return fail(res, error, 'Error adding dependency');
  }
};

export const removeProjectTaskDependency = async (req: Request, res: Response) => {
  try {
    const { dependencyId } = req.params;
    const task = await findTask(req.params.taskId, req.params.id);

    task.dependencies = task.dependencies.filter(
      d => d.taskId.toString() !== dependencyId
    ) as any;
    await task.save();

    return ok(res, task.dependencies);
  } catch (error) {
    return fail(res, error, 'Error removing dependency');
  }
};

export const updateProjectTaskStatus = async (req: Request, res: Response) => {
  try {
    const { task } = await taskService.updateTaskStatus(
      req.params.taskId,
      req.body?.status,
      actorOf(req),
      req.params.id
    );
    return ok(res, task);
  } catch (error) {
    return fail(res, error, 'Error updating status');
  }
};

export const cloneProjectTask = async (req: Request, res: Response) => {
  try {
    const clone = await taskService.cloneTask(req.params.taskId, actorOf(req), req.params.id);
    return ok(res, clone, 201);
  } catch (error) {
    return fail(res, error, 'Error cloning task');
  }
};

export const getProjectTaskTimeline = async (req: Request, res: Response) => {
  try {
    // Confirms the task belongs to this project before exposing its history.
    await findTask(req.params.taskId, req.params.id);

    const { getEntityTimeline } = await import('../../../utils/timelineHelper');
    const timeline = await getEntityTimeline('task', req.params.taskId);

    return ok(res, timeline);
  } catch (error) {
    return fail(res, error, 'Error fetching task timeline');
  }
};
