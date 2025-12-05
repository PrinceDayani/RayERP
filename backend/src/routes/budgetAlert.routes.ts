import express from 'express';
import {
  getBudgetAlerts,
  getActiveAlerts,
  acknowledgeAlert,
  triggerAlertCheck,
  getAlertStats
} from '../controllers/budgetAlertController';
import { requirePermission } from '../middleware/budgetAuth';

const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Alert routes
router.get('/budget/:budgetId', requirePermission('budgets.view'), getBudgetAlerts);
router.get('/active', requirePermission('budgets.view'), getActiveAlerts);
router.post('/:alertId/acknowledge', requirePermission('budgets.view'), acknowledgeAlert);
router.post('/budget/:budgetId/check', requirePermission('budgets.track'), triggerAlertCheck);
router.get('/stats', requirePermission('budgets.track'), getAlertStats);

export default router;
