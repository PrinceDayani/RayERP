import { Request, Response } from 'express';
import Expense from '../models/Expense';

export const createExpense = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const expense = new Expense({
      ...req.body,
      createdBy: req.user.id
    });
    
    await expense.save();
    res.status(201).json({ success: true, data: expense });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, category, projectId } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (projectId) filter.projectId = projectId;

    const expenses = await Expense.find(filter)
      .populate('employeeId', 'name email')
      .populate('approvedBy', 'name')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Expense.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: expenses,
      pagination: { page: Number(page), limit: Number(limit), total }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('employeeId', 'name email')
      .populate('approvedBy', 'name')
      .populate('projectId', 'name');
    
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveExpense = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const { status, notes } = req.body;
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        status,
        notes,
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      { new: true }
    );
    
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExpenseCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Expense.distinct('category');
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};