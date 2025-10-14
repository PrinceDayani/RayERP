import express from 'express';
import {
  getBudgets,
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  approveBudget,
  rejectBudget,
  submitForApproval,
  getPendingApprovals,
  getBudgetAnalytics,
  getBudgetsByProject,
  getBudgetsByStatus,
  getProjectBudgetsWithApprovals,
  createMasterBudget,
  getMasterBudgets,
  getBudgetHierarchy,
  syncProjectBudgets,
  checkBudgets,
  unapproveBudget,
  unrejectBudget
} from '../controllers/budgetController';
import { canManageBudgets, canApproveBudgets, canViewBudgets } from '../middleware/budgetAuth';

const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication to all budget routes
router.use(authenticateToken);

// General budget routes (not project-specific) - specific routes BEFORE dynamic :id
router.get('/all', canViewBudgets, getAllBudgets);
router.get('/pending', canViewBudgets, getPendingApprovals);
router.get('/analytics', canViewBudgets, getBudgetAnalytics);
router.get('/check', canViewBudgets, checkBudgets);
router.get('/project/:projectId', canViewBudgets, getBudgetsByProject);
router.get('/status/:status', canViewBudgets, getBudgetsByStatus);
router.post('/create', canManageBudgets, createBudget);
router.post('/sync-projects', canApproveBudgets, syncProjectBudgets);
router.get('/:id', canViewBudgets, getBudgetById);
router.put('/:id', canManageBudgets, updateBudget);
router.delete('/:id', canManageBudgets, deleteBudget);

// Approval routes
router.post('/:id/approve', canApproveBudgets, approveBudget);
router.post('/:id/reject', canApproveBudgets, rejectBudget);
router.post('/:id/unapprove', canApproveBudgets, unapproveBudget);
router.post('/:id/unreject', canApproveBudgets, unrejectBudget);
router.post('/:id/submit', canManageBudgets, submitForApproval);

// Project budget routes - nested under projects/:id/budget
router.get('/', canViewBudgets, getProjectBudgetsWithApprovals);
router.get('/:budgetId', canViewBudgets, getBudgetById);
router.post('/', canManageBudgets, createBudget);
router.put('/:budgetId', canManageBudgets, updateBudget);
router.delete('/:budgetId', canManageBudgets, deleteBudget);
router.post('/:budgetId/approve', canApproveBudgets, approveBudget);
router.post('/:budgetId/reject', canApproveBudgets, rejectBudget);
router.post('/:budgetId/unapprove', canApproveBudgets, unapproveBudget);
router.post('/:budgetId/unreject', canApproveBudgets, unrejectBudget);
router.post('/:budgetId/submit', canManageBudgets, submitForApproval);

// Master budget routes
router.post('/master', canManageBudgets, createMasterBudget);
router.get('/master', canViewBudgets, getMasterBudgets);
router.get('/hierarchy', canViewBudgets, getBudgetHierarchy);

export default router;