import { Request, Response } from 'express';
import DepartmentBudget from '../models/DepartmentBudget';
import Department from '../models/Department';
import ApprovalRequest from '../models/ApprovalRequest';
import ApprovalConfig from '../models/ApprovalConfig';

const CACHE_TTL = 300000;
const cache = new Map<string, { data: any; timestamp: number }>();

const getCacheKey = (prefix: string, params?: any) => 
  params ? `${prefix}:${JSON.stringify(params)}` : prefix;

const getCache = (key: string) => {
  const cached = cache.get(key);
  return cached && Date.now() - cached.timestamp < CACHE_TTL ? cached.data : null;
};

const setCache = (key: string, data: any) => 
  cache.set(key, { data, timestamp: Date.now() });

const clearBudgetCache = () => cache.clear();

const determineApprovalLevels = async (amount: number, entityType: string) => {
  const config = await ApprovalConfig.findOne({ entityType, isActive: true });
  
  if (!config) {
    throw new Error('Approval configuration not found');
  }

  return config.levels
    .filter(level => amount >= level.amountThreshold || level.level === 1)
    .map(level => ({
      level: level.level,
      approverRole: level.approverRole,
      approverIds: [],
      amountThreshold: level.amountThreshold,
      status: 'PENDING'
    }));
};

export const getDepartmentBudgets = async (req: Request, res: Response) => {
  try {
    const { departmentId, fiscalYear, status } = req.query;
    const cacheKey = getCacheKey('budgets', { departmentId, fiscalYear, status });
    const cached = getCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const filter: any = {};

    if (departmentId) filter.departmentId = departmentId;
    if (fiscalYear) filter.fiscalYear = fiscalYear;
    if (status) filter.status = status;

    const budgets = await DepartmentBudget.find(filter)
      .populate('departmentId', 'name')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    setCache(cacheKey, budgets);
    res.json({ success: true, data: budgets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentBudgetById = async (req: Request, res: Response) => {
  try {
    const cacheKey = getCacheKey('budget', req.params.id);
    const cached = getCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const budget = await DepartmentBudget.findById(req.params.id)
      .populate('departmentId', 'name')
      .populate('approvedBy', 'firstName lastName');

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    setCache(cacheKey, budget);
    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartmentBudget = async (req: Request, res: Response) => {
  try {
    const { departmentId, fiscalYear, totalBudget, categories, notes } = req.body;

    if (!departmentId || !fiscalYear || !totalBudget) {
      return res.status(400).json({ 
        success: false, 
        message: 'Department, fiscal year, and total budget are required' 
      });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const existing = await DepartmentBudget.findOne({ departmentId, fiscalYear });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Budget already exists for this department and fiscal year' 
      });
    }

    const allocatedBudget = categories?.reduce((sum: number, cat: any) => sum + (cat.allocated || 0), 0) || 0;

    const budget = await DepartmentBudget.create({
      departmentId,
      fiscalYear,
      totalBudget,
      allocatedBudget,
      categories: categories || [],
      notes,
      status: 'draft'
    });

    const levels = await determineApprovalLevels(totalBudget, 'DepartmentBudget');
    await ApprovalRequest.create({
      entityType: 'DepartmentBudget',
      entityId: budget._id,
      title: `Department Budget - ${department.name} FY ${fiscalYear}`,
      description: `Department Budget for ${department.name} - FY ${fiscalYear}`,
      amount: totalBudget,
      requestedBy: (req as any).user.id,
      approvalLevels: levels,
      totalLevels: levels.length,
      priority: totalBudget > 200000 ? 'HIGH' : totalBudget > 50000 ? 'MEDIUM' : 'LOW',
      metadata: { departmentId, fiscalYear }
    });

    console.log('Department created successfully:', department);
    clearBudgetCache();
    res.status(201).json({ success: true, data: budget, message: 'Budget created and sent for approval' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDepartmentBudget = async (req: Request, res: Response) => {
  try {
    const { totalBudget, categories, notes, status } = req.body;

    const budget = await DepartmentBudget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    if (totalBudget !== undefined) budget.totalBudget = totalBudget;
    if (categories) {
      budget.categories = categories;
      budget.allocatedBudget = categories.reduce((sum: number, cat: any) => sum + (cat.allocated || 0), 0);
    }
    if (notes !== undefined) budget.notes = notes;
    if (status) budget.status = status;

    await budget.save();

    // If budget amount changed significantly, create new approval request
    if (totalBudget && Math.abs(totalBudget - budget.totalBudget) > budget.totalBudget * 0.1) {
      const department = await Department.findById(budget.departmentId);
      const levels = await determineApprovalLevels(totalBudget, 'DepartmentBudget');
      await ApprovalRequest.create({
        entityType: 'DepartmentBudget',
        entityId: budget._id,
        title: `Budget Adjustment - ${department?.name} FY ${budget.fiscalYear}`,
        description: `Budget Adjustment for ${department?.name} - FY ${budget.fiscalYear}`,
        amount: totalBudget,
        requestedBy: (req as any).user.id,
        approvalLevels: levels,
        totalLevels: levels.length,
        priority: totalBudget > 200000 ? 'HIGH' : totalBudget > 50000 ? 'MEDIUM' : 'LOW',
        metadata: { departmentId: budget.departmentId, fiscalYear: budget.fiscalYear }
      });
    }

    clearBudgetCache();
    res.json({ success: true, data: budget, message: 'Budget updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDepartmentBudget = async (req: Request, res: Response) => {
  try {
    const budget = await DepartmentBudget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    await DepartmentBudget.findByIdAndDelete(req.params.id);
    clearBudgetCache();
    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveBudget = async (req: Request, res: Response) => {
  try {
    const budget = await DepartmentBudget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    const ApprovalRequest = require('../models/ApprovalRequest').default;
    const approval = await ApprovalRequest.findOne({
      entityType: 'DepartmentBudget',
      entityId: budget._id,
      status: 'APPROVED'
    });

    if (!approval) {
      return res.status(400).json({ 
        success: false, 
        message: 'Budget must be approved through approval workflow first' 
      });
    }

    budget.status = 'approved';
    budget.approvedBy = (req as any).user._id;
    budget.approvedAt = new Date();
    await budget.save();

    clearBudgetCache();
    res.json({ success: true, data: budget, message: 'Budget approved successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordExpense = async (req: Request, res: Response) => {
  try {
    const { categoryName, amount } = req.body;

    if (!categoryName || !amount) {
      return res.status(400).json({ success: false, message: 'Category and amount are required' });
    }

    const budget = await DepartmentBudget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    const category = budget.categories.find(c => c.name === categoryName);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.spent += amount;
    budget.spentBudget += amount;
    await budget.save();

    clearBudgetCache();
    res.json({ success: true, data: budget, message: 'Expense recorded successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBudgetSummary = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    const cacheKey = getCacheKey('budget-summary', departmentId);
    const cached = getCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const budgets = await DepartmentBudget.find({ departmentId });
    
    const totalAllocated = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentBudget, 0);
    const totalRemaining = totalAllocated - totalSpent;

    const summary = {
      totalAllocated,
      totalSpent,
      totalRemaining,
      utilizationRate: totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(2) : 0,
      budgetCount: budgets.length
    };

    setCache(cacheKey, summary);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
