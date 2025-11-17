import { Request, Response } from 'express';
import Budget from '../models/Budget';
import Project from '../models/Project';

export const createBudget = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const budgetData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Validate project exists
    if (budgetData.projectId) {
      const project = await Project.findById(budgetData.projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      budgetData.projectName = project.name;
    }

    const budget = new Budget(budgetData);
    await budget.save();

    res.status(201).json({
      success: true,
      data: budget,
      message: 'Budget created successfully'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getBudgets = async (req: Request, res: Response) => {
  try {
    const { 
      projectId, 
      budgetType, 
      status, 
      fiscalYear,
      page = 1, 
      limit = 10 
    } = req.query;

    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (budgetType) filter.budgetType = budgetType;
    if (status) filter.status = status;
    if (fiscalYear) filter.fiscalYear = Number(fiscalYear);

    const skip = (Number(page) - 1) * Number(limit);

    const [budgets, total] = await Promise.all([
      Budget.find(filter)
        .populate('projectId', 'name description')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Budget.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: budgets,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBudgetById = async (req: Request, res: Response) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate('projectId', 'name description')
      .populate('createdBy', 'name email')
      .populate('approvals.userId', 'name email');

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBudget = async (req: Request, res: Response) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    // Prevent modification of approved budgets
    if (budget.status === 'approved' && req.body.status !== 'closed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot modify approved budget. Please create a new version.' 
      });
    }

    Object.assign(budget, req.body);
    await budget.save();

    res.json({
      success: true,
      data: budget,
      message: 'Budget updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteBudget = async (req: Request, res: Response) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    // Prevent deletion of approved budgets
    if (budget.status === 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete approved budget' 
      });
    }

    await Budget.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveBudget = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { comments } = req.body;
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    // Find the current approval level
    const currentApproval = budget.approvals.find(
      approval => approval.userId.toString() === req.user!.id && approval.status === 'pending'
    );

    if (!currentApproval) {
      return res.status(400).json({ 
        success: false, 
        message: 'No pending approval found for this user' 
      });
    }

    // Update approval
    currentApproval.status = 'approved';
    currentApproval.approvedAt = new Date();
    currentApproval.comments = comments;

    // Check if all approvals are complete
    const allApproved = budget.approvals.every(approval => approval.status === 'approved');
    
    if (allApproved) {
      budget.status = 'approved';
      budget.status = 'approved';
    }

    await budget.save();

    res.json({
      success: true,
      data: budget,
      message: 'Budget approved successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectBudget = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { comments } = req.body;
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    // Find the current approval level
    const currentApproval = budget.approvals.find(
      approval => approval.userId.toString() === req.user!.id && approval.status === 'pending'
    );

    if (!currentApproval) {
      return res.status(400).json({ 
        success: false, 
        message: 'No pending approval found for this user' 
      });
    }

    // Update approval
    currentApproval.status = 'rejected';
    currentApproval.approvedAt = new Date();
    currentApproval.comments = comments;

    budget.status = 'rejected';
    budget.status = 'rejected';

    await budget.save();

    res.json({
      success: true,
      data: budget,
      message: 'Budget rejected'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBudgetSummary = async (req: Request, res: Response) => {
  try {
    const { projectId, fiscalYear } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (fiscalYear) filter.fiscalYear = Number(fiscalYear);

    const budgets = await Budget.find(filter);

    const summary = {
      totalBudgets: budgets.length,
      totalBudgetAmount: budgets.reduce((sum, b) => sum + b.totalBudget, 0),
      totalSpent: budgets.reduce((sum, b) => sum + b.actualSpent, 0),
      totalRemaining: budgets.reduce((sum, b) => sum + b.remainingBudget, 0),
      averageUtilization: budgets.length > 0 
        ? budgets.reduce((sum, b) => sum + b.utilizationPercentage, 0) / budgets.length 
        : 0,
      statusBreakdown: budgets.reduce((acc: any, budget) => {
        acc[budget.status] = (acc[budget.status] || 0) + 1;
        return acc;
      }, {}),
      categoryBreakdown: budgets.reduce((acc: any, budget) => {
        budget.categories.forEach(cat => {
          if (!acc[cat.type]) {
            acc[cat.type] = { allocated: 0, spent: 0, count: 0 };
          }
          acc[cat.type].allocated += cat.allocatedAmount;
          acc[cat.type].spent += cat.spentAmount;
          acc[cat.type].count += 1;
        });
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBudgetSpending = async (req: Request, res: Response) => {
  try {
    const { categoryName, amount } = req.body;
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    const category = budget.categories.find(cat => cat.name === categoryName);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.spentAmount += amount;
    await budget.save();

    res.json({
      success: true,
      data: budget,
      message: 'Budget spending updated'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  approveBudget,
  rejectBudget,
  getBudgetSummary,
  updateBudgetSpending
};