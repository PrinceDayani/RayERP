import { Request, Response } from 'express';
import BudgetTemplate from '../models/BudgetTemplate';
import Budget from '../models/Budget';
import mongoose from 'mongoose';

// Create template from scratch
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { templateName, description, category, structure, tags, isPublic } = req.body;
    const userId = req.user?.userId;

    const template = await BudgetTemplate.create({
      templateName,
      description,
      category,
      structure,
      tags: tags || [],
      isPublic: isPublic || false,
      createdBy: userId
    });

    const populatedTemplate = await BudgetTemplate.findById(template._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Template created successfully',
      template: populatedTemplate
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating template', error: error.message });
  }
};

// Create template from existing budget
export const createTemplateFromBudget = async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;
    const { templateName, description, isPublic } = req.body;
    const userId = req.user?.userId;

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const template = await BudgetTemplate.create({
      templateName,
      description,
      category: budget.budgetType || 'custom',
      structure: {
        budgetName: budget.budgetName,
        totalAmount: budget.totalAmount,
        categories: budget.categories || [],
        fiscalYear: budget.fiscalYear
      },
      isPublic: isPublic || false,
      createdBy: userId
    });

    const populatedTemplate = await BudgetTemplate.findById(template._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Template created from budget successfully',
      template: populatedTemplate
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating template from budget', error: error.message });
  }
};

// Get all templates
export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const { category, isPublic, search } = req.query;
    const userId = req.user?.userId;

    const filter: any = { isActive: true };
    
    // Show public templates + user's own templates
    filter.$or = [
      { isPublic: true },
      { createdBy: userId }
    ];

    if (category) filter.category = category;
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
    if (search) {
      filter.$and = [
        filter.$or ? { $or: filter.$or } : {},
        {
          $or: [
            { templateName: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search as string, 'i')] } }
          ]
        }
      ];
      delete filter.$or;
    }

    const templates = await BudgetTemplate.find(filter)
      .populate('createdBy', 'name email')
      .sort({ usageCount: -1, createdAt: -1 });

    res.json({ templates, count: templates.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
};

// Get template by ID
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    const template = await BudgetTemplate.findById(templateId)
      .populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ template });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching template', error: error.message });
  }
};

// Update template
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { templateName, description, structure, tags, isPublic } = req.body;
    const userId = req.user?.userId;

    const template = await BudgetTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    if (template.createdBy.toString() !== userId?.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this template' });
    }

    if (templateName) template.templateName = templateName;
    if (description) template.description = description;
    if (structure) template.structure = structure;
    if (tags) template.tags = tags;
    if (isPublic !== undefined) template.isPublic = isPublic;

    await template.save();

    const populatedTemplate = await BudgetTemplate.findById(templateId)
      .populate('createdBy', 'name email');

    res.json({
      message: 'Template updated successfully',
      template: populatedTemplate
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating template', error: error.message });
  }
};

// Delete template
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const userId = req.user?.userId;

    const template = await BudgetTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    if (template.createdBy.toString() !== userId?.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this template' });
    }

    template.isActive = false;
    await template.save();

    res.json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting template', error: error.message });
  }
};

// Clone budget from template
export const cloneBudgetFromTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { budgetName, fiscalYear, departmentId, projectId, totalAmount } = req.body;
    const userId = req.user?.userId;

    const template = await BudgetTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Calculate categories based on percentages if totalAmount provided
    const finalAmount = totalAmount || template.structure.totalAmount;
    const categories = template.structure.categories.map(cat => ({
      name: cat.name,
      allocatedAmount: cat.percentage ? (finalAmount * cat.percentage / 100) : cat.allocatedAmount,
      percentage: cat.percentage
    }));

    const budget = await Budget.create({
      budgetName: budgetName || template.structure.budgetName,
      totalAmount: finalAmount,
      allocatedAmount: 0,
      fiscalYear: fiscalYear || template.structure.fiscalYear,
      departmentId,
      projectId,
      budgetType: template.category === 'custom' ? 'department' : template.category,
      categories,
      status: 'draft',
      createdBy: userId
    });

    // Increment template usage count
    template.usageCount += 1;
    await template.save();

    const populatedBudget = await Budget.findById(budget._id)
      .populate('departmentId', 'name')
      .populate('projectId', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Budget created from template successfully',
      budget: populatedBudget
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error cloning budget from template', error: error.message });
  }
};

// Clone existing budget
export const cloneBudget = async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;
    const { budgetName, fiscalYear, departmentId, projectId } = req.body;
    const userId = req.user?.userId;

    const sourceBudget = await Budget.findById(budgetId);
    if (!sourceBudget) {
      return res.status(404).json({ message: 'Source budget not found' });
    }

    const clonedBudget = await Budget.create({
      budgetName: budgetName || `${sourceBudget.budgetName} (Copy)`,
      totalAmount: sourceBudget.totalAmount,
      allocatedAmount: 0,
      fiscalYear: fiscalYear || sourceBudget.fiscalYear,
      departmentId: departmentId || sourceBudget.departmentId,
      projectId: projectId || sourceBudget.projectId,
      budgetType: sourceBudget.budgetType,
      categories: sourceBudget.categories,
      status: 'draft',
      createdBy: userId
    });

    const populatedBudget = await Budget.findById(clonedBudget._id)
      .populate('departmentId', 'name')
      .populate('projectId', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Budget cloned successfully',
      budget: populatedBudget
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error cloning budget', error: error.message });
  }
};

// Get popular templates
export const getPopularTemplates = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const templates = await BudgetTemplate.find({
      isActive: true,
      isPublic: true
    })
      .populate('createdBy', 'name email')
      .sort({ usageCount: -1 })
      .limit(Number(limit));

    res.json({ templates, count: templates.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching popular templates', error: error.message });
  }
};
