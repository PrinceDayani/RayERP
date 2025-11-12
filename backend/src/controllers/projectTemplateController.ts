//path: backend/src/controllers/projectTemplateController.ts

import { Request, Response } from 'express';
import ProjectTemplate from '../models/ProjectTemplate';
import Project from '../models/Project';
import Task from '../models/Task';

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { category, isPublic } = req.query;
    const filter: any = {};
    
    if (category) filter.category = category;
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
    
    const templates = await ProjectTemplate.find(filter)
      .populate('createdBy', 'name email')
      .sort('-usageCount -createdAt');
    
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const template = new ProjectTemplate({
      ...req.body,
      createdBy: req.user?._id
    });
    
    await template.save();
    res.status(201).json(template);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const exportProjectAsTemplate = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const tasks = await Task.find({ project: project._id, parentTask: null });
    
    const template = new ProjectTemplate({
      name: `${project.name} Template`,
      description: project.description,
      category: 'other',
      isPublic: false,
      createdBy: req.user?._id,
      projectData: {
        name: project.name,
        description: project.description,
        priority: project.priority,
        estimatedDuration: Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24)),
        budget: project.budget,
        tags: project.tags
      },
      taskTemplates: tasks.map(task => ({
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        daysFromStart: 0,
        tags: task.tags
      })),
      customFields: []
    });
    
    await template.save();
    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const cloneProject = async (req: Request, res: Response) => {
  try {
    const sourceProject = await Project.findById(req.params.id);
    if (!sourceProject) return res.status(404).json({ message: 'Project not found' });
    
    const { name, startDate } = req.body;
    const start = new Date(startDate);
    const duration = sourceProject.endDate.getTime() - sourceProject.startDate.getTime();
    const end = new Date(start.getTime() + duration);
    
    const newProject = new Project({
      name: name || `${sourceProject.name} (Copy)`,
      description: sourceProject.description,
      status: 'planning',
      priority: sourceProject.priority,
      startDate: start,
      endDate: end,
      budget: sourceProject.budget,
      spentBudget: 0,
      progress: 0,
      manager: req.body.manager || sourceProject.manager,
      team: req.body.team || sourceProject.team,
      owner: req.user?._id,
      members: req.body.members || sourceProject.members,
      client: sourceProject.client,
      tags: sourceProject.tags
    });
    
    await newProject.save();
    
    const sourceTasks = await Task.find({ project: sourceProject._id });
    const taskMap = new Map();
    
    for (const task of sourceTasks) {
      const newTask = new Task({
        title: task.title,
        description: task.description,
        status: 'todo',
        priority: task.priority,
        project: newProject._id,
        assignedTo: task.assignedTo,
        assignedBy: req.user?._id,
        dueDate: task.dueDate ? new Date(start.getTime() + (task.dueDate.getTime() - sourceProject.startDate.getTime())) : undefined,
        estimatedHours: task.estimatedHours,
        actualHours: 0,
        tags: task.tags
      });
      
      await newTask.save();
      taskMap.set(task._id.toString(), newTask._id);
    }
    
    res.status(201).json({ project: newProject, tasksCloned: taskMap.size });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createProjectFromTemplate = async (req: Request, res: Response) => {
  try {
    const template = await ProjectTemplate.findById(req.params.templateId);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    
    const { name, startDate, manager, team, members } = req.body;
    const start = new Date(startDate);
    const end = new Date(start.getTime() + template.projectData.estimatedDuration * 24 * 60 * 60 * 1000);
    
    const project = new Project({
      name: name || template.projectData.name,
      description: template.projectData.description,
      status: 'planning',
      priority: template.projectData.priority,
      startDate: start,
      endDate: end,
      budget: template.projectData.budget,
      spentBudget: 0,
      progress: 0,
      manager,
      team: team || [],
      owner: req.user?._id,
      members: members || [],
      tags: template.projectData.tags
    });
    
    await project.save();
    
    for (const taskTemplate of template.taskTemplates) {
      const dueDate = new Date(start.getTime() + taskTemplate.daysFromStart * 24 * 60 * 60 * 1000);
      
      const task = new Task({
        title: taskTemplate.title,
        description: taskTemplate.description,
        status: 'todo',
        priority: taskTemplate.priority,
        project: project._id,
        assignedTo: manager,
        assignedBy: req.user?._id,
        dueDate,
        estimatedHours: taskTemplate.estimatedHours,
        actualHours: 0,
        tags: taskTemplate.tags
      });
      
      await task.save();
    }
    
    template.usageCount += 1;
    await template.save();
    
    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
