import express from 'express';
import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  approveBudget,
  rejectBudget,
  getBudgetSummary,
  allocateBudget,
  trackBudgetUtilization,
  requestBudgetDeletion,
  approveBudgetDeletion
} from '../controllers/budgetController';

// Alias existing functions for route compatibility
const getAllBudgets = getBudgets;
const submitForApproval = async (req: any, res: any) => {
  try {
    const budget = await require('../models/Budget').default.findByIdAndUpdate(
      req.params.id,
      { status: 'pending' },
      { new: true }
    );
    res.json({ success: true, data: budget, message: 'Budget submitted for approval' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
const getPendingApprovals = async (req: any, res: any) => {
  try {
    const budgets = await require('../models/Budget').default.find({ status: 'pending' });
    res.json({ success: true, data: budgets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getBudgetAnalytics = getBudgetSummary;
const getBudgetsByProject = async (req: any, res: any) => {
  try {
    const budgets = await require('../models/Budget').default.find({ projectId: req.params.projectId });
    res.json({ success: true, data: budgets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getBudgetsByStatus = async (req: any, res: any) => {
  try {
    const budgets = await require('../models/Budget').default.find({ status: req.params.status });
    res.json({ success: true, data: budgets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getProjectBudgetsWithApprovals = async (req: any, res: any) => {
  try {
    // Extract projectId from parent route params
    const projectId = req.params.id;
    
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    // Find all budgets for this project
    const budgets = await require('../models/Budget').default.find({ projectId });
    
    // If no budgets found, return empty array
    if (!budgets || budgets.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Return the first budget (or all budgets if needed)
    res.json(budgets[0] || budgets);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const createMasterBudget = createBudget;
const getMasterBudgets = async (req: any, res: any) => {
  try {
    const budgets = await require('../models/Budget').default.find({ budgetType: 'master' });
    res.json({ success: true, data: budgets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getBudgetHierarchy = getBudgets;
const syncProjectBudgets = async (req: any, res: any) => {
  res.json({ success: true, message: 'Budget sync functionality not implemented yet' });
};
const checkBudgets = getBudgetSummary;
const unapproveBudget = async (req: any, res: any) => {
  try {
    const budget = await require('../models/Budget').default.findByIdAndUpdate(
      req.params.id,
      { status: 'draft' },
      { new: true }
    );
    res.json({ success: true, data: budget, message: 'Budget unapproved' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
const unrejectBudget = async (req: any, res: any) => {
  try {
    const budget = await require('../models/Budget').default.findByIdAndUpdate(
      req.params.id,
      { status: 'draft' },
      { new: true }
    );
    res.json({ success: true, data: budget, message: 'Budget rejection removed' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
import { 
  canViewBudgets, 
  canCreateBudgets, 
  canEditBudgets, 
  canDeleteBudgets, 
  canApproveBudgets, 
  canAllocateBudgets, 
  canTrackBudgets 
} from '../middleware/budgetAuth';
import { getConsolidatedView, createMasterBudget as createMasterBudgetConsolidation } from '../controllers/budgetConsolidationController';
import { bulkRollover } from '../controllers/budgetRolloverController';
import { compareBudgets, compareByPeriod } from '../controllers/budgetComparisonController';

const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication to all budget routes
router.use(authenticateToken);

// General budget routes (not project-specific) - specific routes BEFORE dynamic :id
router.get('/all', canViewBudgets, getAllBudgets);
router.get('/pending', canViewBudgets, getPendingApprovals);
router.get('/analytics', canTrackBudgets, getBudgetAnalytics);
router.get('/check', canTrackBudgets, checkBudgets);
router.get('/consolidation', canViewBudgets, getConsolidatedView);
router.post('/consolidation/master', canCreateBudgets, createMasterBudgetConsolidation);
router.post('/bulk-rollover', canCreateBudgets, bulkRollover);
router.post('/compare', canViewBudgets, compareBudgets);
router.post('/compare-period', canViewBudgets, compareByPeriod);
router.get('/project/:projectId', canViewBudgets, getBudgetsByProject);
router.get('/status/:status', canViewBudgets, getBudgetsByStatus);
router.post('/create', canCreateBudgets, createBudget);
router.post('/sync-projects', canApproveBudgets, syncProjectBudgets);
router.get('/:id', canViewBudgets, getBudgetById);
router.get('/:id/track', canTrackBudgets, trackBudgetUtilization);
router.put('/:id', canEditBudgets, updateBudget);
router.post('/:id/request-delete', canDeleteBudgets, requestBudgetDeletion);
router.delete('/:id/approve-delete', canApproveBudgets, approveBudgetDeletion);

// Approval routes
router.post('/:id/approve', canApproveBudgets, approveBudget);
router.post('/:id/reject', canApproveBudgets, rejectBudget);
router.post('/:id/unapprove', canApproveBudgets, unapproveBudget);
router.post('/:id/unreject', canApproveBudgets, unrejectBudget);
router.post('/:id/submit', canEditBudgets, submitForApproval);
router.post('/:id/allocate', canAllocateBudgets, allocateBudget);

// Project budget routes - nested under projects/:id/budget
router.get('/', canViewBudgets, getProjectBudgetsWithApprovals);
router.get('/:budgetId', canViewBudgets, (req, res, next) => {
  req.params.id = req.params.budgetId;
  next();
}, getBudgetById);
router.post('/', canCreateBudgets, (req, res, next) => {
  if (req.params.id && !req.body.projectId) {
    req.body.projectId = req.params.id;
  }
  next();
}, createBudget);
router.put('/:budgetId', canEditBudgets, (req, res, next) => {
  req.params.id = req.params.budgetId;
  next();
}, updateBudget);
router.post('/:budgetId/request-delete', canDeleteBudgets, (req, res, next) => {
  req.params.id = req.params.budgetId;
  next();
}, requestBudgetDeletion);
router.delete('/:budgetId/approve-delete', canApproveBudgets, (req, res, next) => {
  req.params.id = req.params.budgetId;
  next();
}, approveBudgetDeletion);
router.post('/:budgetId/approve', canApproveBudgets, (req, res, next) => {
  req.params.id = req.params.budgetId;
  next();
}, approveBudget);
router.post('/:budgetId/reject', canApproveBudgets, (req, res, next) => {
  req.params.id = req.params.budgetId;
  next();
}, rejectBudget);
router.post('/:budgetId/unapprove', canApproveBudgets, (req, res, next) => {
  req.params.id = req.params.budgetId;
  next();
}, unapproveBudget);
router.post('/:budgetId/unreject', canApproveBudgets, (req, res, next) => {
  req.params.id = req.params.budgetId;
  next();
}, unrejectBudget);
router.post('/:budgetId/submit', canEditBudgets, (req, res, next) => {
  req.params.id = req.params.budgetId;
  next();
}, submitForApproval);
router.post('/:budgetId/allocate', canAllocateBudgets, (req, res, next) => {
  req.params.id = req.params.budgetId;
  next();
}, allocateBudget);
router.get('/:budgetId/track', canTrackBudgets, (req, res, next) => {
  req.params.id = req.params.budgetId;
  next();
}, trackBudgetUtilization);

// Master budget routes
router.post('/master', canCreateBudgets, createMasterBudget);
router.get('/master', canViewBudgets, getMasterBudgets);
router.get('/hierarchy', canViewBudgets, getBudgetHierarchy);

export default router;