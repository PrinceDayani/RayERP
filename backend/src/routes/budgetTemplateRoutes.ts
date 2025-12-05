import express from 'express';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
} from '../controllers/budgetTemplateController';
import { authenticateToken } from '../middleware/auth.middleware';
import { canManageBudgets, canViewBudgets } from '../middleware/budgetAuth';

const router = express.Router();

router.get('/', authenticateToken, canViewBudgets, getAllTemplates);
router.get('/:id', authenticateToken, canViewBudgets, getTemplateById);
router.post('/', authenticateToken, canManageBudgets, createTemplate);
router.put('/:id', authenticateToken, canManageBudgets, updateTemplate);
router.delete('/:id', authenticateToken, canManageBudgets, deleteTemplate);

export default router;