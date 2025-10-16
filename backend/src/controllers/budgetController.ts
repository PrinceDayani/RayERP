import { Request, Response } from 'express';
import Budget from '../models/Budget';
import MasterBudget from '../models/MasterBudget';
import Project from '../models/Project';
import mongoose from 'mongoose';

export const getBudgets = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { status, needsApproval } = req.query;
    let query: any = {};
    
    if (projectId) query.projectId = projectId;
    if (status) query.status = status;
    if (needsApproval === 'true') query.status = { $in: ['pending', 'approved', 'rejected'] };

    const budgets = await Budget.find(query)
      .populate('projectId', 'name')
      .populate('createdBy', 'name email')
      .populate('approvals.userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets', error });
  }
};

export const getAllBudgets = async (req: Request, res: Response) => {
  try {
    const { status, budgetType, fiscalYear } = req.query;
    let query: any = {};
    
    if (status) query.status = status;
    if (budgetType) query.budgetType = budgetType;
    if (fiscalYear) query.fiscalYear = fiscalYear;

    const budgets = await Budget.find(query)
      .populate('projectId', 'name')
      .populate('createdBy', 'name email')
      .populate('approvals.userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets', error });
  }
};

export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const budgets = await Budget.find({ status: 'pending' })
      .populate('projectId', 'name')
      .populate('createdBy', 'name email')
      .populate('approvals.userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending approvals', error });
  }
};

export const getBudgetById = async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.budgetId || req.params.id;
    const budget = await Budget.findById(budgetId)
      .populate('projectId', 'name')
      .populate('createdBy', 'name email')
      .populate('approvals.userId', 'name email');

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
    const projectId = req.params.id || req.body.projectId;
    const { projectName, totalBudget, currency, categories, budgetType } = req.body;
    const userId = (req as any).user?._id || (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

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
      projectId: projectId || new mongoose.Types.ObjectId(),
      projectName: projectName || 'Budget',
      totalBudget: Number(totalBudget) || 0,
      currency: currency || 'INR',
      categories: processedCategories,
      createdBy: userId,
      status: 'draft',
      fiscalYear: new Date().getFullYear(),
      fiscalPeriod: 'Q1',
      budgetType: budgetType || 'project'
    };

    const budget = new Budget(budgetData);
    const savedBudget = await budget.save();
    
    // Update project budget fields
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      const totalSpent = processedCategories.reduce((sum: number, cat: any) => sum + (cat.spentAmount || 0), 0);
      await Project.findByIdAndUpdate(projectId, {
        budget: Number(totalBudget) || 0,
        spentBudget: totalSpent
      });
    }
    
    const { io } = require('../server');
    if (io) {
      io.emit('budget:created', { projectId, budget: savedBudget });
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
    const budgetId = req.params.budgetId || req.params.id;
    const { projectName, totalBudget, currency, categories } = req.body;
    const userId = (req as any).user?._id || (req as any).user?.id;

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.createdBy.toString() !== userId.toString() && budget.status !== 'draft') {
      return res.status(403).json({ message: 'Cannot update budget that is not in draft status' });
    }

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
      projectName: projectName || budget.projectName,
      totalBudget: Number(totalBudget) || budget.totalBudget,
      currency: currency || budget.currency,
      categories: processedCategories,
      updatedAt: new Date()
    };

    const updatedBudget = await Budget.findByIdAndUpdate(
      budgetId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Update project budget fields
    if (updatedBudget && mongoose.Types.ObjectId.isValid(updatedBudget.projectId.toString())) {
      const totalSpent = processedCategories.reduce((sum: number, cat: any) => sum + (cat.spentAmount || 0), 0);
      await Project.findByIdAndUpdate(updatedBudget.projectId, {
        budget: Number(totalBudget) || budget.totalBudget,
        spentBudget: totalSpent
      });
    }

    const { io } = require('../server');
    if (io) {
      io.emit('budget:updated', { budgetId, budget: updatedBudget });
    }

    res.json({ 
      success: true,
      message: 'Budget updated successfully',
      data: updatedBudget 
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
    const budgetId = req.params.budgetId || req.params.id;
    const userId = (req as any).user?._id || (req as any).user?.id;

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.createdBy.toString() !== userId.toString() && budget.status !== 'draft') {
      return res.status(403).json({ message: 'Cannot delete budget that is not in draft status' });
    }

    const projectId = budget.projectId;
    await Budget.findByIdAndDelete(budgetId);

    // Reset project budget fields
    if (projectId && mongoose.Types.ObjectId.isValid(projectId.toString())) {
      await Project.findByIdAndUpdate(projectId, {
        budget: 0,
        spentBudget: 0
      });
    }

    const { io } = require('../server');
    if (io) {
      io.emit('budget:deleted', { budgetId });
    }

    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting budget', error });
  }
};

export const approveBudget = async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.budgetId || req.params.id;
    const { comments } = req.body;
    const userId = (req as any).user._id || (req as any).user.id;
    const userName = (req as any).user.name;

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.status !== 'pending') {
      return res.status(400).json({ message: 'Budget is not pending approval' });
    }

    const existingApproval = budget.approvals.find(approval => 
      approval.userId.toString() === userId.toString()
    );
    
    if (existingApproval) {
      existingApproval.status = 'approved';
      existingApproval.comments = comments;
      existingApproval.approvedAt = new Date();
    } else {
      budget.approvals.push({
        userId,
        userName,
        status: 'approved',
        comments,
        approvedAt: new Date()
      });
    }

    budget.status = 'approved';
    await budget.save();

    const { io } = require('../server');
    if (io) {
      io.emit('budget:approved', { budgetId, budget });
    }

    res.json({ success: true, message: 'Budget approved successfully', data: budget });
  } catch (error) {
    res.status(500).json({ message: 'Error approving budget', error });
  }
};

export const rejectBudget = async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.budgetId || req.params.id;
    const { comments } = req.body;
    const userId = (req as any).user._id || (req as any).user.id;
    const userName = (req as any).user.name;

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.status !== 'pending') {
      return res.status(400).json({ message: 'Budget is not pending approval' });
    }

    const existingApproval = budget.approvals.find(approval => 
      approval.userId.toString() === userId.toString()
    );
    
    if (existingApproval) {
      existingApproval.status = 'rejected';
      existingApproval.comments = comments;
      existingApproval.approvedAt = new Date();
    } else {
      budget.approvals.push({
        userId,
        userName,
        status: 'rejected',
        comments,
        approvedAt: new Date()
      });
    }

    budget.status = 'rejected';
    await budget.save();

    const { io } = require('../server');
    if (io) {
      io.emit('budget:rejected', { budgetId, budget });
    }

    res.json({ success: true, message: 'Budget rejected successfully', data: budget });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting budget', error });
  }
};

export const submitForApproval = async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.budgetId || req.params.id;
    const userId = (req as any).user._id || (req as any).user.id;

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only budget creator can submit for approval' });
    }

    if (budget.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft budgets can be submitted for approval' });
    }

    budget.status = 'pending';
    await budget.save();

    const { io } = require('../server');
    if (io) {
      io.emit('budget:submitted', { budgetId, budget });
    }

    res.json({ success: true, message: 'Budget submitted for approval', data: budget });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting budget for approval', error });
  }
};

export const getBudgetAnalytics = async (req: Request, res: Response) => {
  try {
    const { fiscalYear } = req.query;
    const filter: any = {};
    if (fiscalYear) filter.fiscalYear = fiscalYear;

    const totalBudgets = await Budget.countDocuments(filter);
    const pendingApprovals = await Budget.countDocuments({ ...filter, status: 'pending' });
    const approvedBudgets = await Budget.countDocuments({ ...filter, status: 'approved' });
    const rejectedBudgets = await Budget.countDocuments({ ...filter, status: 'rejected' });
    const draftBudgets = await Budget.countDocuments({ ...filter, status: 'draft' });

    const totalBudgetAmount = await Budget.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$totalBudget' } } }
    ]);

    const totalSpent = await Budget.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$actualSpent' } } }
    ]);

    const budgetsByStatus = await Budget.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalBudget' } } }
    ]);

    const budgetsByType = await Budget.aggregate([
      { $match: filter },
      { $group: { _id: '$budgetType', count: { $sum: 1 }, totalAmount: { $sum: '$totalBudget' } } }
    ]);

    res.json({
      summary: {
        totalBudgets,
        pendingApprovals,
        approvedBudgets,
        rejectedBudgets,
        draftBudgets,
        totalBudgetAmount: totalBudgetAmount[0]?.total || 0,
        totalSpent: totalSpent[0]?.total || 0
      },
      budgetsByStatus,
      budgetsByType
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budget analytics', error });
  }
};

export const getBudgetsByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const budgets = await Budget.find({ projectId })
      .populate('createdBy', 'name email')
      .populate('approvals.userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project budgets', error });
  }
};

export const getProjectBudgetsWithApprovals = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const { status, needsApproval } = req.query;
    let query: any = { projectId };
    
    if (status) {
      const statusArray = status.toString().split(',');
      query.status = { $in: statusArray };
    }
    if (needsApproval === 'true') {
      query.status = { $in: ['pending', 'approved', 'rejected'] };
    }

    const budgets = await Budget.find(query)
      .populate('projectId', 'name')
      .populate('createdBy', 'name email')
      .populate('approvals.userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(budgets);
  } catch (error) {
    console.error('Error fetching project budgets:', error);
    res.status(500).json({ message: 'Error fetching project budgets with approvals', error });
  }
};

export const getBudgetsByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const budgets = await Budget.find({ status })
      .populate('projectId', 'name')
      .populate('createdBy', 'name email')
      .populate('approvals.userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets by status', error });
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

export const unapproveBudget = async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.budgetId || req.params.id;
    const { comments } = req.body;
    const userId = (req as any).user._id || (req as any).user.id;
    const userName = (req as any).user.name;

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.status !== 'approved' && budget.status !== 'rejected') {
      return res.status(400).json({ message: 'Only approved or rejected budgets can be unapproved' });
    }

    budget.status = 'pending';
    budget.approvals.push({
      userId,
      userName,
      status: 'pending',
      comments: comments || 'Budget unapproved and returned to pending',
      approvedAt: new Date()
    });

    await budget.save();

    const { io } = require('../server');
    if (io) {
      io.emit('budget:unapproved', { budgetId, budget });
    }

    res.json({ success: true, message: 'Budget unapproved successfully', data: budget });
  } catch (error) {
    res.status(500).json({ message: 'Error unapproving budget', error });
  }
};

export const unrejectBudget = async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.budgetId || req.params.id;
    const { comments } = req.body;
    const userId = (req as any).user._id || (req as any).user.id;
    const userName = (req as any).user.name;

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.status !== 'rejected') {
      return res.status(400).json({ message: 'Only rejected budgets can be unrejected' });
    }

    budget.status = 'pending';
    budget.approvals.push({
      userId,
      userName,
      status: 'pending',
      comments: comments || 'Budget unrejected and returned to pending',
      approvedAt: new Date()
    });

    await budget.save();

    const { io } = require('../server');
    if (io) {
      io.emit('budget:unrejected', { budgetId, budget });
    }

    res.json({ success: true, message: 'Budget unrejected successfully', data: budget });
  } catch (error) {
    res.status(500).json({ message: 'Error unrejecting budget', error });
  }
};

export const syncProjectBudgets = async (req: Request, res: Response) => {
  try {
    const budgets = await Budget.find({ budgetType: 'project' });
    let syncedCount = 0;

    for (const budget of budgets) {
      if (budget.projectId && mongoose.Types.ObjectId.isValid(budget.projectId.toString())) {
        const totalSpent = budget.categories.reduce((sum, cat) => sum + (cat.spentAmount || 0), 0);
        await Project.findByIdAndUpdate(budget.projectId, {
          budget: budget.totalBudget,
          spentBudget: totalSpent
        });
        syncedCount++;
      }
    }

    res.json({ 
      success: true, 
      message: `Synced ${syncedCount} project budgets`,
      syncedCount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error syncing project budgets', error });
  }
};

export const checkBudgets = async (req: Request, res: Response) => {
  try {
    const allBudgets = await Budget.find().populate('projectId', 'name').lean();
    const allProjects = await Project.find().select('_id name budget spentBudget').lean();
    
    const budgetsByProject = allBudgets.map(b => ({
      budgetId: b._id,
      projectId: b.projectId,
      projectName: b.projectName,
      totalBudget: b.totalBudget,
      status: b.status
    }));

    res.json({
      totalBudgets: allBudgets.length,
      totalProjects: allProjects.length,
      budgets: budgetsByProject,
      projects: allProjects
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking budgets', error });
  }
};