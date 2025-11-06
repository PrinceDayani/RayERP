//path: backend/src/controllers/projectController.ts
import { Request, Response } from 'express';
import Project from '../models/Project';
import Task from '../models/Task';
import { createTimelineEvent, getEntityTimeline } from '../utils/timelineHelper';
// Socket will be imported dynamically to avoid circular dependency

// Helper function to emit updated project stats
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

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let query = {};
    
    // Root user can see all projects
    if (user.role === 'root') {
      query = {};
    }
    // Super admin can see projects they own
    else if (user.role === 'super_admin') {
      query = { owner: user._id };
    }
    // Members can only see projects they're assigned to
    else {
      query = { members: user._id };
    }

    const projects = await Project.find(query)
      .populate('manager', 'firstName lastName')
      .populate('team', 'firstName lastName')
      .populate('owner', 'name email')
      .populate('members', 'name email');
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'firstName lastName')
      .populate('team', 'firstName lastName')
      .populate('owner', 'name email')
      .populate('members', 'name email');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project', error });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const projectData = {
      ...req.body,
      owner: user._id,
      members: req.body.members || []
    };
    
    const project = new Project(projectData);
    await project.save();
    await project.populate('manager', 'firstName lastName');
    await project.populate('team', 'firstName lastName');
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    
    // Safely get manager ID
    const managerId = project.manager ? 
                     (project.manager._id?.toString() || project.manager.toString()) : 
                     req.body.manager;
    
    if (!managerId) {
      return res.status(400).json({ message: 'Manager is required for timeline event' });
    }
    
    // Create timeline event
    await createTimelineEvent(
      'project',
      project._id.toString(),
      'created',
      'Project Created',
      `Project "${project.name}" was created`,
      managerId
    );
    
    // Emit socket events
    const { io } = await import('../server');
    io.emit('project:created', project);
    await emitProjectStats();
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(400).json({ message: 'Error creating project', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const oldProject = await Project.findById(req.params.id);
    if (!oldProject) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('manager', 'firstName lastName')
     .populate('team', 'firstName lastName')
     .populate('owner', 'name email')
     .populate('members', 'name email');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found after update' });
    }
    
    // Safely get manager ID for timeline
    const managerId = req.body.updatedBy || 
                     (project.manager ? 
                      (project.manager._id?.toString() || project.manager.toString()) : 
                      null);
    
    if (!managerId) {
      return res.status(400).json({ message: 'Unable to determine user for timeline event' });
    }
    
    // Create timeline event
    if (oldProject.status !== project.status) {
      await createTimelineEvent(
        'project',
        project._id.toString(),
        'status_changed',
        'Status Updated',
        `Project status changed from "${oldProject.status}" to "${project.status}"`,
        managerId,
        {
          field: 'status',
          oldValue: oldProject.status,
          newValue: project.status
        }
      );
    } else {
      await createTimelineEvent(
        'project',
        project._id.toString(),
        'updated',
        'Project Updated',
        `Project "${project.name}" was updated`,
        managerId
      );
    }
    
    // Emit socket events
    const { io } = await import('../server');
    io.emit('project:updated', project);
    await emitProjectStats();
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(400).json({ message: 'Error updating project', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateProjectStatus = async (req: Request, res: Response) => {
  try {
    const { status, user } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const oldStatus = project.status;
    project.status = status;
    await project.save();
    await project.populate('manager', 'firstName lastName');
    await project.populate('team', 'firstName lastName');
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    
    // Safely get user ID
    const userId = user || (project.manager ? 
                           (project.manager._id?.toString() || project.manager.toString()) : 
                           null);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required for timeline event' });
    }
    
    await createTimelineEvent(
      'project',
      project._id.toString(),
      'status_changed',
      'Status Updated',
      `Project status changed from "${oldStatus}" to "${status}"`,
      userId,
      { field: 'status', oldValue: oldStatus, newValue: status }
    );
    
    const { io } = await import('../server');
    io.emit('project:status:updated', project);
    await emitProjectStats();
    res.json(project);
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(400).json({ message: 'Error updating project status', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    await Task.deleteMany({ project: req.params.id });
    
    // Safely get manager ID
    const managerId = project.manager ? project.manager.toString() : null;
    
    if (managerId) {
      // Create timeline event
      await createTimelineEvent(
        'project',
        req.params.id,
        'deleted',
        'Project Deleted',
        `Project "${project.name}" was deleted`,
        managerId
      );
    }
    
    // Emit socket events
    const { io } = await import('../server');
    io.emit('project:deleted', { id: req.params.id });
    await emitProjectStats();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getProjectTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find({ project: req.params.id })
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName');
    
    // Transform tasks to include projectId for frontend compatibility
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
    
    // Validate that the project exists
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
    
    // Create timeline event for task creation
    const assignedById = task.assignedBy ? 
                        (task.assignedBy._id?.toString() || task.assignedBy.toString()) : 
                        req.body.assignedBy;
    
    if (assignedById) {
      try {
        await createTimelineEvent(
          'task',
          task._id.toString(),
          'created',
          'Task Created',
          `Task "${task.title}" was created in project "${project.name}"`,
          assignedById
        );
      } catch (timelineError) {
        console.error('Timeline event creation failed:', timelineError);
      }
    }
    
    // Transform task to include projectId for frontend compatibility
    const transformedTask = {
      ...task.toObject(),
      projectId: task.project.toString()
    };
    
    // Emit socket events
    const { io } = await import('../server');
    io.emit('task:created', transformedTask);
    await emitProjectStats();
    res.status(201).json(transformedTask);
  } catch (error) {
    console.error('Error creating project task:', error);
    res.status(400).json({ message: 'Error creating project task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getProjectStats = async (req: Request, res: Response) => {
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
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project stats', error });
  }
};

export const getProjectTimelineData = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'firstName lastName')
      .select('title status priority dueDate createdAt');
    
    const timelineData = {
      project: {
        id: project._id,
        name: project.name,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status
      },
      tasks: tasks.map(task => ({
        id: task._id,
        name: task.title,
        startDate: task.createdAt,
        endDate: task.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        progress: task.status === 'completed' ? 100 : task.status === 'in-progress' ? 50 : 0,
        status: task.status,
        priority: task.priority,
        assignees: task.assignedTo
      }))
    };
    
    res.json(timelineData);
  } catch (error) {
    console.error('Error fetching project timeline data:', error);
    res.status(500).json({ message: 'Error fetching project timeline data', error });
  }
};

export const getAllProjectsTimelineData = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let query = {};
    if (user.role === 'root') {
      query = {};
    } else if (user.role === 'super_admin') {
      query = { owner: user._id };
    } else {
      query = { members: user._id };
    }

    const projects = await Project.find(query).select('name startDate endDate status');
    const allTasks = await Task.find()
      .populate('assignedTo', 'firstName lastName')
      .select('title status priority dueDate createdAt project');
    
    const timelineData = {
      projects: projects.map(p => ({
        id: p._id,
        name: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status
      })),
      tasks: allTasks.map(task => ({
        id: task._id,
        name: task.title,
        startDate: task.createdAt,
        endDate: task.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        progress: task.status === 'completed' ? 100 : task.status === 'in-progress' ? 50 : 0,
        status: task.status,
        priority: task.priority,
        projectId: task.project
      }))
    };
    
    res.json(timelineData);
  } catch (error) {
    console.error('Error fetching all projects timeline data:', error);
    res.status(500).json({ message: 'Error fetching timeline data', error });
  }
};

export const updateProjectTask = async (req: Request, res: Response) => {
  try {
    const { id: projectId, taskId } = req.params;
    
    // Validate that the project exists
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
    
    // Create timeline event
    const userId = req.body.updatedBy || task.assignedBy?.toString();
    if (userId) {
      await createTimelineEvent(
        'task',
        task._id.toString(),
        'updated',
        'Task Updated',
        `Task "${task.title}" was updated`,
        userId
      );
    }
    
    // Transform task to include projectId for frontend compatibility
    const transformedTask = {
      ...task.toObject(),
      projectId: task.project.toString()
    };
    
    // Emit socket events
    const { io } = await import('../server');
    io.emit('task:updated', transformedTask);
    await emitProjectStats();
    res.json(transformedTask);
  } catch (error) {
    console.error('Error updating project task:', error);
    res.status(400).json({ message: 'Error updating project task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteProjectTask = async (req: Request, res: Response) => {
  try {
    const { id: projectId, taskId } = req.params;
    
    // Validate that the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // First find the task to get its data before deletion
    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Now delete the task
    await Task.findOneAndDelete({ _id: taskId, project: projectId });
    
    // Create timeline event
    const userId = req.body.deletedBy || task.assignedBy?.toString();
    if (userId) {
      await createTimelineEvent(
        'task',
        taskId,
        'deleted',
        'Task Deleted',
        `Task "${task.title}" was deleted`,
        userId
      );
    }
    
    // Emit socket events
    const { io } = await import('../server');
    io.emit('task:deleted', { id: taskId });
    await emitProjectStats();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting project task:', error);
    res.status(500).json({ message: 'Error deleting project task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getProjectTimeline = async (req: Request, res: Response) => {
  try {
    // Validate that the project exists
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const timeline = await getEntityTimeline('project', req.params.id);
    res.json(timeline);
  } catch (error) {
    console.error('Error fetching project timeline:', error);
    res.status(500).json({ message: 'Error fetching project timeline', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const addProjectMember = async (req: Request, res: Response) => {
  try {
    const { memberId } = req.body;
    const projectId = req.params.id;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.members.includes(memberId)) {
      return res.status(400).json({ success: false, message: 'User is already a member' });
    }

    project.members.push(memberId);
    await project.save();
    await project.populate('members', 'name email');
    
    res.json({ success: true, message: 'Member added successfully', members: project.members });
  } catch (error) {
    console.error('Error adding project member:', error);
    res.status(500).json({ success: false, message: 'Error adding member', error });
  }
};

export const removeProjectMember = async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const projectId = req.params.id;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.members = project.members.filter(id => id.toString() !== memberId);
    await project.save();
    await project.populate('members', 'name email');
    
    res.json({ success: true, message: 'Member removed successfully', members: project.members });
  } catch (error) {
    console.error('Error removing project member:', error);
    res.status(500).json({ success: false, message: 'Error removing member', error });
  }
};

export const getProjectMembers = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    res.json({ 
      success: true, 
      owner: project.owner,
      members: project.members 
    });
  } catch (error) {
    console.error('Error fetching project members:', error);
    res.status(500).json({ success: false, message: 'Error fetching members', error });
  }
};

export const getProjectActivity = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { type } = req.query;
    
    // Validate that the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Mock activity data for now - replace with actual activity model later
    const activities = [
      {
        _id: '1',
        type: 'project_updated',
        title: 'Project Updated',
        description: `Project "${project.name}" was updated`,
        user: {
          _id: project.manager?.toString() || 'unknown',
          firstName: 'Project',
          lastName: 'Manager'
        },
        project: projectId,
        createdAt: new Date().toISOString()
      }
    ];
    
    // Filter by type if provided
    const filteredActivities = type ? 
      activities.filter(activity => activity.type === type) : 
      activities;
    
    res.json(filteredActivities);
  } catch (error) {
    console.error('Error fetching project activity:', error);
    res.status(500).json({ message: 'Error fetching project activity', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};