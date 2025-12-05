import express from 'express';
import {
  createApprovalWorkflow,
  getWorkflow,
  approveLevel,
  rejectLevel,
  getPendingApprovals
} from '../controllers/budgetApprovalWorkflowController';
import { requirePermission } from '../middleware/budgetAuth';

const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Workflow routes
router.post('/create', requirePermission('budgets.create'), createApprovalWorkflow);
router.get('/budget/:budgetId', requirePermission('budgets.view'), getWorkflow);
router.post('/budget/:budgetId/level/:level/approve', requirePermission('budgets.approve'), approveLevel);
router.post('/budget/:budgetId/level/:level/reject', requirePermission('budgets.approve'), rejectLevel);
router.get('/pending', requirePermission('budgets.approve'), getPendingApprovals);

export default router;
