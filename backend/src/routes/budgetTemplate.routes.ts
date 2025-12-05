import express from 'express';
import { authenticateToken as authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/budgetAuth';
const { body, param } = require('express-validator');
import { validateRequest } from '../middleware/validation.middleware';
import {
  createTemplate,
  createTemplateFromBudget,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  cloneBudgetFromTemplate,
  cloneBudget,
  getPopularTemplates
} from '../controllers/budgetTemplateController';

const router = express.Router();

router.use(authenticate);

// Create template from scratch (requires create permission)
router.post('/',
  body('templateName').notEmpty().withMessage('Template name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').isIn(['department', 'project', 'special', 'custom']),
  body('structure').notEmpty().withMessage('Structure is required'),
  validateRequest,
  requirePermission('budgets.create'),
  createTemplate
);

// Create template from existing budget (requires create permission)
router.post('/from-budget/:budgetId',
  param('budgetId').isMongoId().withMessage('Invalid budget ID'),
  body('templateName').notEmpty().withMessage('Template name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  validateRequest,
  requirePermission('budgets.create'),
  createTemplateFromBudget
);

// Get all templates (requires view permission)
router.get('/',
  requirePermission('budgets.view'),
  getAllTemplates
);

// Get popular templates (requires view permission)
router.get('/popular',
  requirePermission('budgets.view'),
  getPopularTemplates
);

// Get template by ID (requires view permission)
router.get('/:templateId',
  param('templateId').isMongoId().withMessage('Invalid template ID'),
  validateRequest,
  requirePermission('budgets.view'),
  getTemplateById
);

// Update template (requires create permission)
router.put('/:templateId',
  param('templateId').isMongoId().withMessage('Invalid template ID'),
  validateRequest,
  requirePermission('budgets.create'),
  updateTemplate
);

// Delete template (requires delete permission)
router.delete('/:templateId',
  param('templateId').isMongoId().withMessage('Invalid template ID'),
  validateRequest,
  requirePermission('budgets.delete'),
  deleteTemplate
);

// Clone budget from template (requires create permission)
router.post('/:templateId/clone',
  param('templateId').isMongoId().withMessage('Invalid template ID'),
  body('budgetName').optional().notEmpty(),
  body('fiscalYear').optional().notEmpty(),
  validateRequest,
  requirePermission('budgets.create'),
  cloneBudgetFromTemplate
);

// Clone existing budget (requires create permission)
router.post('/budget/:budgetId/clone',
  param('budgetId').isMongoId().withMessage('Invalid budget ID'),
  body('budgetName').optional().notEmpty(),
  body('fiscalYear').optional().notEmpty(),
  validateRequest,
  requirePermission('budgets.create'),
  cloneBudget
);

export default router;
