import { Request, Response } from 'express';
import DepartmentBudget from '../models/DepartmentBudget';
import Department from '../models/Department';

export const getDepartmentBudgets = async (req: Request, res: Response) => {
  try {
    const { departmentId, fiscalYear, status } = req.query;
    const filter: any = {};

    if (departmentId) filter.departmentId = departmentId;
    if (fiscalYear) filter.fiscalYear = fiscalYear;
    if (status) filter.status = status;

    const budgets = await DepartmentBudget.find(filter)
      .populate('departmentId', 'name')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: budgets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentBudgetById = async (req: Request, res: Response) => {
  try {
    const budget = await DepartmentBudget.findById(req.params.id)
      .populate('departmentId', 'name')
      .populate('approvedBy', 'firstName lastName');

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

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
      notes
    });

    res.status(201).json({ success: true, data: budget, message: 'Budget created successfully' });
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

    budget.status = 'approved';
    budget.approvedBy = (req as any).user._id;
    budget.approvedAt = new Date();
    await budget.save();

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

    res.json({ success: true, data: budget, message: 'Expense recorded successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBudgetSummary = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;

    const budgets = await DepartmentBudget.find({ departmentId });
    
    const totalAllocated = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentBudget, 0);
    const totalRemaining = totalAllocated - totalSpent;

    res.json({
      success: true,
      data: {
        totalAllocated,
        totalSpent,
        totalRemaining,
        utilizationRate: totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(2) : 0,
        budgetCount: budgets.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
