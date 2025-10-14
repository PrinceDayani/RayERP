import express from 'express';
import {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  approveBudget,
  rejectBudget,
  createMasterBudget,
  getMasterBudgets,
  getBudgetHierarchy
} from '../controllers/budgetController';
import { canManageBudgets, canApproveBudgets, canViewBudgets } from '../middleware/budgetAuth';

const router = express.Router({ mergeParams: true });

// Project budget routes - nested under projects/:id/budget
router.get('/', canViewBudgets, getBudgets);
router.get('/:budgetId', canViewBudgets, getBudgetById);
router.post('/', canManageBudgets, createBudget);
router.put('/:budgetId', canManageBudgets, updateBudget);
router.delete('/:budgetId', canManageBudgets, deleteBudget);

// Approval routes
router.post('/:budgetId/approve', canApproveBudgets, approveBudget);
router.post('/:budgetId/reject', canApproveBudgets, rejectBudget);

// Master budget routes
router.post('/master', canManageBudgets, createMasterBudget);
router.get('/master', canViewBudgets, getMasterBudgets);
router.get('/hierarchy', canViewBudgets, getBudgetHierarchy);

export default router;