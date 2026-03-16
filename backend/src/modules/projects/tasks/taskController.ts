import { Request, Response } from 'express';
import Task from '../../../models/Task';
import Project from '../../../models/Project';
import { createTimelineEvent } from '../../../utils/timelineHelper';

export const getProjectTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find({ project: req.params.id, taskType: 'project' })
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName')
      .populate('comments.user', 'firstName lastName')
      .populate('dependencies.taskId', 'title')
      .populate('subtasks', 'title status')
      .populate('parentTask', 'title')
      .populate('watchers', 'firstName lastName');
    
    const transformedTasks = tasks.map(task => ({
      ...task.toObject(),
      projectId: task.project?.toString()
    }));
    
    res.json(transformedTasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project tasks', error });
  }
};

export const createProjectTask = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const taskData = { 
      ...req.body, 
      project: projectId,
      taskType: 'project'
    };
    const task = new Task(taskData);
    await task.save();
    await task.populate('project', 'name');
    await task.populate('assignedTo', 'firstName lastName');
    await task.populate('assignedBy', 'firstName lastName');
    
    const assignedById = task.assignedBy ? 
                        (task.assignedBy._id?.toString() || task.assignedBy.toString()) : 
                        req.body.assignedBy;
    
    if (assignedById) {
      await createTimelineEvent(
        'task',
        task._id.toString(),
        'created',
        'Task Created',
        `Task "${task.title}" was created in project "${project.name}"`,
        assignedById
      ).catch(console.error);
    }
    
    const transformedTask = {
      ...task.toObject(),
      projectId: task.project?.toString()
    };
    
    const { io } = await import('../../../server');
    io.emit('task:created', transformedTask);
    
    res.status(201).json(transformedTask);
  } catch (error) {
    console.error('Error creating project task:', error);
    res.status(400).json({ message: 'Error creating project task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateProjectTask = async (req: Request, res: Response) => {
  try {
    const { id: projectId, taskId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const task = await Task.findOneAndUpdate(
      { _id: taskId, project: projectId, taskType: 'project' },
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'firstName lastName')
     .populate('assignedBy', 'firstName lastName')
     .populate('comments.user', 'firstName lastName')
     .populate('watchers', 'firstName lastName');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const userId = req.body.updatedBy || task.assignedBy?.toString();
    if (userId) {
      await createTimelineEvent(
        'task',
        task._id.toString(),
        'updated',
        'Task Updated',
        `Task "${task.title}" was updated`,
        userId
      ).catch(console.error);
    }
    
    const transformedTask = {
      ...task.toObject(),
      projectId: task.project?.toString()
    };
    
    const { io } = await import('../../../server');
    io.emit('task:updated', transformedTask);
    
    res.json(transformedTask);
  } catch (error) {
    console.error('Error updating project task:', error);
    res.status(400).json({ message: 'Error updating project task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteProjectTask = async (req: Request, res: Response) => {
  try {
    const { id: projectId, taskId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const task = await Task.findOne({ _id: taskId, project: projectId, taskType: 'project' });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    await Task.findOneAndDelete({ _id: taskId, project: projectId, taskType: 'project' });
    
    const userId = req.body.deletedBy || task.assignedBy?.toString();
    if (userId) {
      await createTimelineEvent(
        'task',
        taskId,
        'deleted',
        'Task Deleted',
        `Task "${task.title}" was deleted`,
        userId
      ).catch(console.error);
    }
    
    const { io } = await import('../../../server');
    io.emit('task:deleted', { id: taskId });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting project task:', error);
    res.status(500).json({ message: 'Error deleting project task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const reorderTasks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tasks } = req.body;
    
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const updatePromises = tasks.map((task: any) => 
      Task.findByIdAndUpdate(task.id, { 
        order: task.order, 
        column: task.column,
        status: task.status 
      })
    );
    
    await Promise.all(updatePromises);
    
    const { io } = await import('../../../server');
    io.emit('project:tasks:reordered', { projectId: id, tasks });
    
    res.json({ success: true, message: 'Tasks reordered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error reordering tasks', error });
  }
};

export const addProjectTaskComment = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { comment, user } = req.body;
    
    if (!comment || !user) {
      return res.status(400).json({ message: 'Comment and user are required' });
    }
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    task.comments.push({ user, comment, mentions: [], createdAt: new Date() });
    await task.save();
    await task.populate('comments.user', 'firstName lastName');
    
    const { io } = await import('../../../server');
    io.emit('task:comment:added', { taskId, comment: task.comments[task.comments.length - 1] });
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: 'Error adding comment', error });
  }
};

export const startProjectTaskTimer = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { user, description } = req.body;
    
    if (!user) return res.status(400).json({ message: 'User ID is required' });
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const activeEntry = task.timeEntries.find(e => e.user.toString() === user && !e.endTime);
    if (activeEntry) return res.status(400).json({ message: 'Timer already running' });
    
    task.timeEntries.push({ user, startTime: new Date(), duration: 0, description });
    await task.save();
    
    const { io } = await import('../../../server');
    io.emit('task:timer:started', { taskId, userId: user });
    
    res.json({ success: true, entry: task.timeEntries[task.timeEntries.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Error starting timer', error });
  }
};

export const stopProjectTaskTimer = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { user } = req.body;
    
    if (!user) return res.status(400).json({ message: 'User ID is required' });
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const entry = task.timeEntries.find(e => e.user.toString() === user && !e.endTime);
    if (!entry) return res.status(400).json({ message: 'No active timer found' });
    
    entry.endTime = new Date();
    entry.duration = Math.max(1, Math.round((entry.endTime.getTime() - entry.startTime.getTime()) / 1000 / 60));
    task.actualHours = Number(task.timeEntries.reduce((sum, e) => sum + (e.duration / 60), 0).toFixed(2));
    await task.save();
    
    const { io } = await import('../../../server');
    io.emit('task:timer:stopped', { taskId, userId: user, duration: entry.duration });
    
    res.json({ success: true, entry, actualHours: task.actualHours });
  } catch (error) {
    res.status(500).json({ message: 'Error stopping timer', error });
  }
};

export const addProjectTaskTag = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { name, color } = req.body;
    
    if (!name?.trim()) return res.status(400).json({ message: 'Tag name is required' });
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const trimmedName = name.trim();
    if (task.tags.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      return res.status(400).json({ message: 'Tag already exists' });
    }
    
    task.tags.push({ name: trimmedName, color: color || '#3b82f6' });
    await task.save();
    
    res.json({ success: true, tag: task.tags[task.tags.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Error adding tag', error });
  }
};

export const removeProjectTaskTag = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { name } = req.body;
    
    if (!name) return res.status(400).json({ message: 'Tag name is required' });
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.tags = task.tags.filter(t => t.name !== name);
    await task.save();
    
    res.json({ success: true, message: 'Tag removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing tag', error });
  }
};

export const addProjectTaskAttachment = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const file = req.file;
    const { uploadedBy } = req.body;
    
    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    if (!uploadedBy) return res.status(400).json({ message: 'Uploader ID is required' });
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
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
    
    res.json({ success: true, attachment: task.attachments[task.attachments.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Error adding attachment', error });
  }
};

export const addProjectTaskChecklist = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    
    if (!text?.trim()) return res.status(400).json({ message: 'Checklist text is required' });
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.checklist.push({ text: text.trim(), completed: false });
    await task.save();
    
    res.json({ success: true, item: task.checklist[task.checklist.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Error adding checklist item', error });
  }
};

export const updateProjectTaskChecklist = async (req: Request, res: Response) => {
  try {
    const { taskId, itemId } = req.params;
    const { completed, completedBy } = req.body;
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const item = task.checklist.find((i: any) => i._id?.toString() === itemId);
    if (!item) return res.status(404).json({ message: 'Checklist item not found' });
    
    item.completed = completed;
    if (completed && completedBy) {
      item.completedBy = completedBy;
      item.completedAt = new Date();
    }
    await task.save();
    
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ message: 'Error updating checklist item', error });
  }
};

export const addProjectTaskWatcher = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;
    
    if (!userId) return res.status(400).json({ message: 'User ID is required' });
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    if (!task.watchers.includes(userId)) {
      task.watchers.push(userId);
      await task.save();
    }
    
    res.json({ success: true, watchers: task.watchers });
  } catch (error) {
    res.status(500).json({ message: 'Error adding watcher', error });
  }
};

export const removeProjectTaskWatcher = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;
    
    if (!userId) return res.status(400).json({ message: 'User ID is required' });
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.watchers = task.watchers.filter(w => w.toString() !== userId);
    await task.save();
    
    res.json({ success: true, watchers: task.watchers });
  } catch (error) {
    res.status(500).json({ message: 'Error removing watcher', error });
  }
};

export const removeProjectTaskAttachment = async (req: Request, res: Response) => {
  try {
    const { taskId, attachmentId } = req.params;
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const attachmentIndex = task.attachments.findIndex(a => (a as any)._id?.toString() === attachmentId);
    if (attachmentIndex === -1) return res.status(404).json({ message: 'Attachment not found' });
    
    const attachment = task.attachments[attachmentIndex];
    task.attachments = task.attachments.filter((_, index) => index !== attachmentIndex);
    await task.save();
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../../uploads', attachment.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
    }
    
    res.json({ success: true, message: 'Attachment removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing attachment', error });
  }
};

export const deleteProjectTaskChecklist = async (req: Request, res: Response) => {
  try {
    const { taskId, itemId } = req.params;
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.checklist = task.checklist.filter((c: any) => c._id?.toString() !== itemId);
    await task.save();
    
    res.json({ success: true, message: 'Checklist item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting checklist item', error });
  }
};

export const addProjectTaskSubtask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { title, description, assignedTo, assignedBy } = req.body;
    
    const parentTask = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!parentTask) return res.status(404).json({ message: 'Parent task not found' });
    
    const subtask = await Task.create({
      title,
      description,
      taskType: 'project',
      assignmentType: 'assigned',
      project: parentTask.project,
      assignedTo,
      assignedBy,
      parentTask: parentTask._id,
      status: 'todo',
      priority: parentTask.priority
    });
    
    parentTask.subtasks.push(subtask._id);
    await parentTask.save();
    
    res.json({ success: true, subtask });
  } catch (error) {
    res.status(500).json({ message: 'Error adding subtask', error });
  }
};

export const deleteProjectTaskSubtask = async (req: Request, res: Response) => {
  try {
    const { taskId, subtaskId } = req.params;
    
    const parentTask = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!parentTask) return res.status(404).json({ message: 'Task not found' });
    
    await Task.findByIdAndDelete(subtaskId);
    parentTask.subtasks = parentTask.subtasks.filter(s => s.toString() !== subtaskId);
    await parentTask.save();
    
    res.json({ success: true, message: 'Subtask deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting subtask', error });
  }
};

export const getProjectTaskSubtaskProgress = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' }).populate('subtasks', 'status');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const total = task.subtasks.length;
    const completed = task.subtasks.filter((s: any) => s.status === 'completed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    res.json({ total, completed, progress });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress', error });
  }
};

export const addProjectTaskDependency = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { dependsOn, type = 'finish-to-start' } = req.body;
    
    if (!dependsOn) return res.status(400).json({ message: 'Dependency task ID required' });
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const dependencyTask = await Task.findById(dependsOn);
    if (!dependencyTask) return res.status(404).json({ message: 'Dependency task not found' });
    
    if (!task.dependencies.some(d => d.taskId.toString() === dependsOn)) {
      task.dependencies.push({ taskId: dependsOn, type });
      await task.save();
    }
    
    res.json({ success: true, dependencies: task.dependencies });
  } catch (error) {
    res.status(500).json({ message: 'Error adding dependency', error });
  }
};

export const removeProjectTaskDependency = async (req: Request, res: Response) => {
  try {
    const { taskId, dependencyId } = req.params;
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.dependencies = task.dependencies.filter(d => d.taskId.toString() !== dependencyId);
    await task.save();
    
    res.json({ success: true, dependencies: task.dependencies });
  } catch (error) {
    res.status(500).json({ message: 'Error removing dependency', error });
  }
};

export const updateProjectTaskStatus = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status, user } = req.body;
    
    if (!status) return res.status(400).json({ message: 'Status is required' });
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const oldStatus = task.status;
    task.status = status;
    await task.save();
    
    await task.populate('project', 'name');
    await task.populate('assignedTo', 'firstName lastName');
    await task.populate('assignedBy', 'firstName lastName');
    
    const userId = user || task.assignedBy?.toString();
    if (userId) {
      const { createTimelineEvent } = await import('../../../utils/timelineHelper');
      await createTimelineEvent(
        'task',
        task._id.toString(),
        'status_changed',
        'Status Updated',
        `Task status changed from "${oldStatus}" to "${status}"`,
        userId,
        { field: 'status', oldValue: oldStatus, newValue: status }
      ).catch(console.error);
    }
    
    const { io } = await import('../../../server');
    io.emit('task:status:updated', task);
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error });
  }
};

export const cloneProjectTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const { _id, createdAt, updatedAt, ...taskData } = task.toObject();
    const clonedTask = new Task({ 
      ...taskData, 
      title: `${taskData.title} (Copy)`,
      status: 'todo'
    });
    await clonedTask.save();
    await clonedTask.populate('project assignedTo assignedBy');
    
    res.status(201).json(clonedTask);
  } catch (error) {
    res.status(400).json({ message: 'Error cloning task', error });
  }
};

export const getProjectTaskTimeline = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    const task = await Task.findOne({ _id: taskId, taskType: 'project' });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const { getEntityTimeline } = await import('../../../utils/timelineHelper');
    const timeline = await getEntityTimeline('task', taskId);
    
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching timeline', error });
  }
};
