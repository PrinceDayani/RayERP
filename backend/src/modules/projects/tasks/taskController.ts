import { Request, Response } from 'express';
import Task from '../../../models/Task';
import Project from '../../../models/Project';
import { createTimelineEvent } from '../../../utils/timelineHelper';

export const getProjectTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find({ project: req.params.id })
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName');
    
    const transformedTasks = tasks.map(task => ({
      ...task.toObject(),
      projectId: task.project.toString()
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
    
    const taskData = { ...req.body, project: projectId };
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
      projectId: task.project.toString()
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
      { _id: taskId, project: projectId },
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'firstName lastName')
     .populate('assignedBy', 'firstName lastName');
    
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
      projectId: task.project.toString()
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
    
    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    await Task.findOneAndDelete({ _id: taskId, project: projectId });
    
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
