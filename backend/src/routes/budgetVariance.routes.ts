import express from 'express';
import { authenticateToken as authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/budgetAuth';
import { varianceLimiter } from '../middleware/rateLimiter.middleware';
const { body, param } = require('express-validator');
import { validateRequest } from '../middleware/validation.middleware';
import {
  generateVarianceReport,
  getBudgetVarianceReports,
  getVarianceReportById,
  getVarianceSummary,
  compareVarianceTrends
} from '../controllers/budgetVarianceController';

const router = express.Router();

router.use(authenticate);

// Generate variance report (requires track permission)
router.post('/budget/:budgetId/generate',
  varianceLimiter,
  param('budgetId').isMongoId().withMessage('Invalid budget ID'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('periodType').optional().isIn(['monthly', 'quarterly', 'yearly', 'custom']),
  validateRequest,
  requirePermission('budgets.track'),
  generateVarianceReport
);

// Get all variance reports for a budget (requires view permission)
router.get('/budget/:budgetId', requirePermission('budgets.view'), getBudgetVarianceReports);

// Get variance summary (requires view permission)
router.get('/budget/:budgetId/summary', requirePermission('budgets.view'), getVarianceSummary);

// Compare variance trends (requires view permission)
router.get('/budget/:budgetId/trends', requirePermission('budgets.view'), compareVarianceTrends);

// Get variance report by ID (requires view permission)
router.get('/:varianceId', requirePermission('budgets.view'), getVarianceReportById);

export default router;
