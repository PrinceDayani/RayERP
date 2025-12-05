import { Request, Response } from 'express';
import Budget from '../models/Budget';
import Project from '../models/Project';
import { emitBudgetCreated, emitBudgetUpdated, emitBudgetDeleted, emitBudgetApproved, emitBudgetRejected } from '../utils/budgetSocketEvents';

export const createBudget = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Check if user's department has finance.view permission
    const User = require('../models/User').default;
    const Department = require('../models/Department').default;
    
    const user = await User.findById(req.user.id).populate('role');
    
    // Root and Super Admin bypass department checks
    const isRootOrSuperAdmin = user?.role?.name === 'Root' || user?.role?.name === 'Super Admin';
    
    // Root and Super Admin can create budgets without department restrictions
    let createdByDepartment = undefined;
    
    if (!isRootOrSuperAdmin) {
      // For non-root users, check if they have an employee record with department
      const Employee = require('../models/Employee').default;
      const employee = await Employee.findOne({ user: req.user.id });
      
      if (!employee || !employee.department) {
        return res.status(403).json({ 
          success: false, 
          message: 'User must be associated with a department to create budgets' 
        });
      }

      // Find department by name from employee record
      const department = await Department.findOne({ name: employee.department });
      if (!department || !department.permissions?.includes('finance.view')) {
        return res.status(403).json({ 
          success: false, 
          message: 'Your department does not have financial permissions to create budgets' 
        });
      }
      
      createdByDepartment = department._id;
    }

    const budgetData = {
      ...req.body,
      createdBy: req.user.id,
      createdByDepartment
    };

    // Validate: Budget must have project OR department (except special budgets)
    if (budgetData.budgetType !== 'special') {
      if (!budgetData.projectId && !budgetData.departmentId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Budget must be assigned to either a Project or Department' 
        });
      }
    }

    // Validate project exists if projectId is provided
    if (budgetData.projectId) {
      const project = await Project.findById(budgetData.projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      budgetData.projectName = project.name;
    }

    // Validate department exists if departmentId is provided
    if (budgetData.departmentId) {
      const dept = await Department.findById(budgetData.departmentId);
      if (!dept) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      budgetData.departmentName = dept.name;
    }

    console.log('💾 Creating budget with data:', JSON.stringify(budgetData, null, 2));
    
    const budget = new Budget(budgetData);
    await budget.save();

    emitBudgetCreated(budget._id.toString());

    res.status(201).json({
      success: true,
      data: budget,
      message: 'Budget created successfully'
    });
  } catch (error: any) {
    console.error('❌ Budget creation error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Validation errors:', error.errors);
    res.status(400).json({ 
      success: false, 
      message: error.message,
      errors: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : undefined
    });
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
    const budget = await Budget.findById(req.params.id);

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

    emitBudgetUpdated(budget._id.toString());

    res.json({
      success: true,
      data: budget,
      message: 'Budget updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const requestBudgetDeletion = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    // Only draft budgets can be deleted
    if (budget.status !== 'draft') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only draft budgets can be deleted' 
      });
    }

    // Mark for deletion approval
    budget.deleteApprovalStatus = 'pending';
    budget.deleteRequestedBy = new (require('mongoose').Types.ObjectId)(req.user.id);
    budget.deleteRequestedAt = new Date();
    await budget.save();

    res.json({
      success: true,
      message: 'Budget deletion request submitted for Director approval',
      data: budget
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveBudgetDeletion = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    if (budget.deleteApprovalStatus !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'No pending deletion request for this budget' 
      });
    }

    await Budget.findByIdAndDelete(req.params.id);

    emitBudgetDeleted(req.params.id);

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBudget = requestBudgetDeletion;

export const approveBudget = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Check if user is Director or has budgets.approve permission
    const User = require('../models/User').default;
    const user = await User.findById(req.user.id).populate('role');
    
    const isDirector = user?.role?.name === 'Director' || user?.role?.name === 'Root';
    const hasApprovePermission = req.user.permissions?.includes('budgets.approve') || req.user.permissions?.includes('*');
    
    if (!isDirector && !hasApprovePermission) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only Directors or users with special approval permission can approve budgets' 
      });
    }

    const { comments } = req.body;
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Find the current approval level
    const currentApproval = budget.approvals?.find(
      approval => approval.userId?.toString() === req.user!.id && approval.status === 'pending'
    );

    if (currentApproval) {
      // Update existing approval
      currentApproval.status = 'approved';
      currentApproval.approvedAt = new Date();
      currentApproval.comments = comments;

      // Check if all approvals are complete
      const allApproved = budget.approvals.every(approval => approval.status === 'approved');
      
      if (allApproved) {
        budget.status = 'approved';
      }
    } else {
      // No approval workflow, add new approval record and approve directly
      budget.approvals = budget.approvals || [];
      budget.approvals.push({
        userId: userId,
        userName: req.user.name || req.user.email,
        status: 'approved',
        approvedAt: new Date(),
        comments
      } as any);
      budget.status = 'approved';
    }

    await budget.save();

    emitBudgetApproved(budget._id.toString());

    res.json({
      success: true,
      data: budget,
      message: 'Budget approved successfully'
    });
  } catch (error: any) {
    console.error('Approve budget error:', error);
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

    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Find the current approval level
    const currentApproval = budget.approvals?.find(
      approval => approval.userId?.toString() === req.user!.id && approval.status === 'pending'
    );

    if (currentApproval) {
      // Update existing approval
      currentApproval.status = 'rejected';
      currentApproval.approvedAt = new Date();
      currentApproval.comments = comments;
    } else {
      // No approval workflow, add new approval record
      budget.approvals = budget.approvals || [];
      budget.approvals.push({
        userId: userId,
        userName: req.user.name || req.user.email,
        status: 'rejected',
        approvedAt: new Date(),
        comments
      } as any);
    }

    budget.status = 'rejected';

    await budget.save();

    emitBudgetRejected(budget._id.toString());

    res.json({
      success: true,
      data: budget,
      message: 'Budget rejected'
    });
  } catch (error: any) {
    console.error('Reject budget error:', error);
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

export const allocateBudget = async (req: Request, res: Response) => {
  try {
    const { categoryName, allocatedAmount } = req.body;
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    if (budget.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only approved budgets can be allocated' 
      });
    }

    const category = budget.categories.find(cat => cat.name === categoryName);
    if (category) {
      category.allocatedAmount = allocatedAmount;
    } else {
      budget.categories.push({
        name: categoryName,
        type: req.body.categoryType || 'overhead',
        allocatedAmount,
        spentAmount: 0,
        items: []
      } as any);
    }

    await budget.save();

    res.json({
      success: true,
      data: budget,
      message: 'Budget allocated successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const trackBudgetUtilization = async (req: Request, res: Response) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    const tracking = {
      budgetId: budget._id,
      projectName: budget.projectName,
      fiscalYear: budget.fiscalYear,
      fiscalPeriod: budget.fiscalPeriod,
      totalBudget: budget.totalBudget,
      actualSpent: budget.actualSpent,
      remainingBudget: budget.remainingBudget,
      utilizationPercentage: budget.utilizationPercentage,
      status: budget.status,
      budgetStatus: budget.actualSpent > budget.totalBudget ? 'over' : 
                    budget.utilizationPercentage > 90 ? 'warning' : 'on-track',
      categoryBreakdown: budget.categories.map(cat => ({
        name: cat.name,
        type: cat.type,
        allocated: cat.allocatedAmount,
        spent: cat.spentAmount,
        remaining: cat.allocatedAmount - cat.spentAmount,
        utilization: cat.allocatedAmount > 0 ? 
          ((cat.spentAmount / cat.allocatedAmount) * 100).toFixed(2) : 0
      })),
      alerts: [
        ...(budget.utilizationPercentage > 90 ? [{
          type: 'warning',
          message: 'Budget utilization exceeds 90%'
        }] : []),
        ...(budget.actualSpent > budget.totalBudget ? [{
          type: 'critical',
          message: 'Budget exceeded'
        }] : [])
      ]
    };

    res.json({
      success: true,
      data: tracking
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
  updateBudgetSpending,
  allocateBudget,
  trackBudgetUtilization,
  requestBudgetDeletion,
  approveBudgetDeletion
};