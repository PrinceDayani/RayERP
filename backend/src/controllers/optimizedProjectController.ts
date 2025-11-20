import { Request, Response } from 'express';
import { QuickQuery } from '../utils/quickQuery';
import Project from '../models/Project';
import Task from '../models/Task';

// Ultra-fast project operations
export const getProjectsFast = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Auth required' });
    }

    // Simple query without heavy population
    let filter = {};
    const roleName = typeof user.role === 'object' && user.role && 'name' in user.role ? user.role.name : null;
    
    if (roleName !== 'Root' && roleName !== 'Super Admin') {
      filter = { $or: [{ members: user._id }, { owner: user._id }] };
    }

    const projects = await QuickQuery.findFast(Project, filter, Number(limit));
    const total = await QuickQuery.countFast(Project, filter);

    res.json({
      success: true,
      data: projects,
      total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
};

export const getProjectByIdFast = async (req: Request, res: Response) => {
  try {
    const project = await QuickQuery.findByIdFast(Project, req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
};

export const updateProjectFast = async (req: Request, res: Response) => {
  try {
    const project = await QuickQuery.updateFast(Project, req.params.id, req.body);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
};

export const getProjectTasksFast = async (req: Request, res: Response) => {
  try {
    const tasks = await QuickQuery.findFast(Task, { project: req.params.id }, 50);
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
};