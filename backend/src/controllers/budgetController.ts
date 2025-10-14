import { Request, Response } from 'express';
import Budget from '../models/Budget';
import MasterBudget from '../models/MasterBudget';
import Project from '../models/Project';
import mongoose from 'mongoose';

export const getBudgets = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { status, needsApproval } = req.query;
    let query: any = { projectId };

    if (status) query.status = status;
    if (needsApproval === 'true') query.status = { $in: ['pending', 'approved', 'rejected'] };

    const budgets = await Budget.find(query)
      .populate('projectId', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets', error });
  }
};

export const getBudgetById = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const budgetId = req.params.budgetId;
    const budget = await Budget.findOne({ _id: budgetId, projectId })
      .populate('projectId', 'name')
      .populate('createdBy', 'name');

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budget', error });
  }
};

export const createBudget = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { projectName, totalBudget, currency, categories } = req.body;
    const userId = (req as any).user?._id || (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    // Validate categories if provided
    const processedCategories = categories ? categories.map((cat: any) => ({
      name: cat.name || '',
      type: cat.type || 'labor',
      allocatedAmount: cat.allocatedAmount || 0,
      spentAmount: cat.spentAmount || 0,
      items: cat.items ? cat.items.map((item: any) => ({
        name: item.name || '',
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unitCost: Number(item.unitCost) || 0,
        totalCost: Number(item.totalCost) || 0
      })) : []
    })) : [];

    const budgetData = {
      projectId,
      projectName: projectName || 'Project Budget',
      totalBudget: Number(totalBudget) || 0,
      currency: currency || 'USD',
      categories: processedCategories,
      createdBy: userId,
      status: 'draft',
      fiscalYear: new Date().getFullYear(),
      fiscalPeriod: 'Q1',
      budgetType: 'project'
    };

    const budget = new Budget(budgetData);
    const savedBudget = await budget.save();
    
    // Emit socket event for real-time updates
    const { io } = require('../server');
    if (io) {
      io.emit('budget:updated', { projectId, budget: savedBudget });
    }
    
    res.status(201).json({ 
      success: true,
      message: 'Budget created successfully',
      data: savedBudget 
    });
  } catch (error: any) {
    console.error('Budget creation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating budget', 
      error: error.message || 'Unknown error',
      details: error.errors || null
    });
  }
};

export const updateBudget = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const budgetId = req.params.budgetId;
    const { projectName, totalBudget, currency, categories } = req.body;

    const processedCategories = categories ? categories.map((cat: any) => ({
      name: cat.name || '',
      type: cat.type || 'labor',
      allocatedAmount: cat.allocatedAmount || 0,
      spentAmount: cat.spentAmount || 0,
      items: cat.items ? cat.items.map((item: any) => ({
        name: item.name || '',
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unitCost: Number(item.unitCost) || 0,
        totalCost: Number(item.totalCost) || 0
      })) : []
    })) : [];

    const updateData = {
      projectName: projectName || 'Project Budget',
      totalBudget: Number(totalBudget) || 0,
      currency: currency || 'USD',
      categories: processedCategories,
      updatedAt: new Date()
    };

    const budget = await Budget.findOneAndUpdate(
      { _id: budgetId, projectId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Emit socket event for real-time updates
    const { io } = require('../server');
    if (io) {
      io.emit('budget:updated', { projectId, budgetId, budget });
    }

    res.json({ 
      success: true,
      message: 'Budget updated successfully',
      data: budget 
    });
  } catch (error: any) {
    console.error('Budget update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating budget', 
      error: error.message || 'Unknown error'
    });
  }
};

export const deleteBudget = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const budgetId = req.params.budgetId;
    const budget = await Budget.findOneAndDelete({ _id: budgetId, projectId });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting budget', error });
  }
};

export const approveBudget = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const budgetId = req.params.budgetId;
    const { comments } = req.body;
    const userId = (req as any).user.id;
    const userName = (req as any).user.name;

    const budget = await Budget.findOne({ _id: budgetId, projectId });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    budget.status = 'approved';
    budget.approvals.push({
      userId,
      userName,
      status: 'approved',
      comments,
      approvedAt: new Date()
    });

    await budget.save();
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Error approving budget', error });
  }
};

export const rejectBudget = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const budgetId = req.params.budgetId;
    const { comments } = req.body;
    const userId = (req as any).user.id;
    const userName = (req as any).user.name;

    const budget = await Budget.findOne({ _id: budgetId, projectId });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    budget.status = 'rejected';
    budget.approvals.push({
      userId,
      userName,
      status: 'rejected',
      comments,
      approvedAt: new Date()
    });

    await budget.save();
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting budget', error });
  }
};



export const createMasterBudget = async (req: Request, res: Response) => {
  try {
    const { fiscalYear, fiscalPeriod, totalBudget, allocations } = req.body;
    const userId = (req as any).user.id;

    const masterBudget = new MasterBudget({
      fiscalYear,
      fiscalPeriod,
      totalBudget,
      allocations: allocations || [],
      createdBy: userId
    });

    await masterBudget.save();
    res.status(201).json(masterBudget);
  } catch (error) {
    res.status(500).json({ message: 'Error creating master budget', error });
  }
};

export const getMasterBudgets = async (req: Request, res: Response) => {
  try {
    const { fiscalYear, status } = req.query;
    const filter: any = {};
    if (fiscalYear) filter.fiscalYear = fiscalYear;
    if (status) filter.status = status;

    const masterBudgets = await MasterBudget.find(filter)
      .populate('createdBy', 'name')
      .sort({ fiscalYear: -1, fiscalPeriod: 1 });

    res.json(masterBudgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching master budgets', error });
  }
};

export const getBudgetHierarchy = async (req: Request, res: Response) => {
  try {
    const { fiscalYear } = req.query;
    const filter: any = {};
    if (fiscalYear) filter.fiscalYear = fiscalYear;

    const masterBudgets = await MasterBudget.find(filter);
    const projectBudgets = await Budget.find(filter)
      .populate('projectId', 'name')
      .populate('parentBudgetId', 'fiscalYear fiscalPeriod');

    const hierarchy = masterBudgets.map(master => ({
      ...master.toObject(),
      projectBudgets: projectBudgets.filter(pb => 
        pb.parentBudgetId?.toString() === master._id.toString()
      )
    }));

    res.json(hierarchy);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budget hierarchy', error });
  }
};