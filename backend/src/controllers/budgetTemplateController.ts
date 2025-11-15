import { Request, Response } from 'express';
import { BudgetTemplate } from '../models/BudgetTemplate';

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { projectType } = req.query;
    let query: any = {};

    if (projectType) query.projectType = projectType;

    const templates = await BudgetTemplate.find(query)
      .populate('createdBy', 'name')
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching templates', error });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const template = await BudgetTemplate.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching template', error });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { name, description, projectType, categories, isDefault } = req.body;
    
    // Validate required fields
    if (!name || !projectType) {
      return res.status(400).json({ success: false, message: 'Name and project type are required' });
    }

    const template = new BudgetTemplate({
      name: name.trim(),
      description: description?.trim(),
      projectType: projectType.trim(),
      categories: categories || [],
      isDefault: Boolean(isDefault),
      createdBy: req.user.id
    });

    const savedTemplate = await template.save();
    res.status(201).json({ success: true, data: savedTemplate });
  } catch (error: any) {
    console.error('Template creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating template', 
      error: error.message 
    });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const template = await BudgetTemplate.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Error updating template', error });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const template = await BudgetTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting template', error });
  }
};