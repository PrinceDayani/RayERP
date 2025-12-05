import { Request, Response } from 'express';
import BudgetApprovalWorkflow from '../models/BudgetApprovalWorkflow';
import Budget from '../models/Budget';

// Create approval workflow for budget
export const createApprovalWorkflow = async (req: Request, res: Response) => {
  try {
    const { budgetId, totalBudget } = req.body;
    
    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    // Determine approval levels based on amount
    const levels = [];
    if (totalBudget < 100000) {
      levels.push({ level: 1, name: 'Manager Approval', requiredRole: 'Manager', amountThreshold: 100000, approvers: [], status: 'pending' });
    } else if (totalBudget < 500000) {
      levels.push(
        { level: 1, name: 'Manager Approval', requiredRole: 'Manager', amountThreshold: 100000, approvers: [], status: 'pending' },
        { level: 2, name: 'Director Approval', requiredRole: 'Director', amountThreshold: 500000, approvers: [], status: 'pending' }
      );
    } else {
      levels.push(
        { level: 1, name: 'Manager Approval', requiredRole: 'Manager', amountThreshold: 100000, approvers: [], status: 'pending' },
        { level: 2, name: 'Director Approval', requiredRole: 'Director', amountThreshold: 500000, approvers: [], status: 'pending' },
        { level: 3, name: 'CFO Approval', requiredRole: 'CFO', amountThreshold: 1000000, approvers: [], status: 'pending' }
      );
    }

    const workflow = new BudgetApprovalWorkflow({
      budgetId,
      totalLevels: levels.length,
      levels,
      autoApproveUnder: 100000,
      status: totalBudget < 100000 ? 'approved' : 'in-progress'
    });

    await workflow.save();

    // Auto-approve if under threshold
    if (totalBudget < 100000) {
      budget.status = 'approved';
      await budget.save();
    }

    res.status(201).json({ success: true, data: workflow });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get workflow for budget
export const getWorkflow = async (req: Request, res: Response) => {
  try {
    const workflow = await BudgetApprovalWorkflow.findOne({ budgetId: req.params.budgetId })
      .populate('levels.approvedBy', 'name email');
    
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    res.json({ success: true, data: workflow });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve at specific level
export const approveLevel = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { budgetId, level } = req.params;
    const { comments } = req.body;

    const workflow = await BudgetApprovalWorkflow.findOne({ budgetId });
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    const currentLevel = workflow.levels.find(l => l.level === Number(level));
    if (!currentLevel) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }

    if (currentLevel.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Level already processed' });
    }

    // Update level
    currentLevel.status = 'approved';
    currentLevel.approvedBy = new (require('mongoose').Types.ObjectId)(req.user.id);
    currentLevel.approvedAt = new Date();
    currentLevel.comments = comments;

    // Check if all levels approved
    const allApproved = workflow.levels.every(l => l.status === 'approved');
    
    if (allApproved) {
      workflow.status = 'approved';
      workflow.completedAt = new Date();
      
      // Update budget status
      const budget = await Budget.findById(budgetId);
      if (budget) {
        budget.status = 'approved';
        await budget.save();
      }
    } else {
      workflow.currentLevel = Number(level) + 1;
    }

    await workflow.save();

    res.json({ success: true, data: workflow, message: 'Level approved successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject at specific level
export const rejectLevel = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { budgetId, level } = req.params;
    const { comments } = req.body;

    const workflow = await BudgetApprovalWorkflow.findOne({ budgetId });
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    const currentLevel = workflow.levels.find(l => l.level === Number(level));
    if (!currentLevel) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }

    currentLevel.status = 'rejected';
    currentLevel.approvedBy = new (require('mongoose').Types.ObjectId)(req.user.id);
    currentLevel.approvedAt = new Date();
    currentLevel.comments = comments;

    workflow.status = 'rejected';
    workflow.completedAt = new Date();

    await workflow.save();

    // Update budget status
    const budget = await Budget.findById(budgetId);
    if (budget) {
      budget.status = 'rejected';
      await budget.save();
    }

    res.json({ success: true, data: workflow, message: 'Level rejected' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get pending approvals for user
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const User = require('../models/User').default;
    const user = await User.findById(req.user.id).populate('role');
    const userRole = user?.role?.name;

    const workflows = await BudgetApprovalWorkflow.find({
      status: 'in-progress',
      'levels.status': 'pending',
      'levels.requiredRole': userRole
    }).populate('budgetId');

    res.json({ success: true, data: workflows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  createApprovalWorkflow,
  getWorkflow,
  approveLevel,
  rejectLevel,
  getPendingApprovals
};
