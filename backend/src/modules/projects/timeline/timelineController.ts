import { Request, Response } from 'express';
import Project from '../../../models/Project';
import Task from '../../../models/Task';
import { getEntityTimeline } from '../../../utils/timelineHelper';

export const getProjectTimeline = async (req: Request, res: Response) => {
  try {
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

    let query: any = {};
    
    const roleName = typeof user.role === 'object' && 'name' in user.role ? user.role.name : null;
    const rolePermissions = (typeof user.role === 'object' && 'permissions' in user.role ? user.role.permissions : []) as string[];
    
    if (roleName === 'Root' || rolePermissions.includes('projects.view_all')) {
      query = {};
    } else {
      const Employee = (await import('../../../models/Employee')).default;
      const employee = await Employee.findOne({ user: user._id });
      
      const conditions: any[] = [{ owner: user._id }];
      
      if (employee) {
        conditions.push({ team: employee._id });
        conditions.push({ managers: employee._id });
      }
      
      query = { $or: conditions };
    }

    const projects = await Project.find(query).select('name startDate endDate status');
    const projectIds = projects.map(p => p._id);
    
    const allTasks = await Task.find({ project: { $in: projectIds } })
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
