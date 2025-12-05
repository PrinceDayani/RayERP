import express from 'express';
import { authenticateToken as authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/budgetAuth';
import { forecastLimiter } from '../middleware/rateLimiter.middleware';
const { body, param } = require('express-validator');
import { validateRequest } from '../middleware/validation.middleware';
import {
  generateBudgetForecast,
  getBudgetForecasts,
  getForecastById,
  compareForecastAccuracy,
  getForecastSummary
} from '../controllers/budgetForecastController';

const router = express.Router();

router.use(authenticate);

// Generate forecast (requires track permission)
router.post('/budget/:budgetId/generate',
  forecastLimiter,
  param('budgetId').isMongoId().withMessage('Invalid budget ID'),
  body('forecastType').optional().isIn(['linear', 'seasonal', 'exponential', 'ml']),
  body('forecastPeriod').optional().isInt({ min: 1, max: 24 }),
  validateRequest,
  requirePermission('budgets.track'),
  generateBudgetForecast
);

// Get all forecasts for a budget (requires view permission)
router.get('/budget/:budgetId', requirePermission('budgets.view'), getBudgetForecasts);

// Get forecast summary (requires view permission)
router.get('/budget/:budgetId/summary', requirePermission('budgets.view'), getForecastSummary);

// Get forecast by ID (requires view permission)
router.get('/:forecastId', requirePermission('budgets.view'), getForecastById);

// Compare forecast accuracy (requires track permission)
router.post('/:forecastId/accuracy', requirePermission('budgets.track'), compareForecastAccuracy);

export default router;
