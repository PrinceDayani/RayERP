import express from 'express';
import { authenticateToken as authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/budgetAuth';
import {
  getDashboardOverview,
  getBudgetsByStatus,
  getBudgetsByDepartment,
  getUtilizationTrends,
  getTopBudgets,
  getAlertsSummary,
  getTransferActivity,
  getApprovalStats,
  getFiscalYearComparison,
  getBudgetHealthScore
} from '../controllers/budgetDashboardController';

const router = express.Router();

router.use(authenticate);
router.use(requirePermission('budgets.view'));

// Dashboard overview
router.get('/overview', getDashboardOverview);

// Budgets by status
router.get('/by-status', getBudgetsByStatus);

// Budgets by department
router.get('/by-department', getBudgetsByDepartment);

// Utilization trends
router.get('/utilization-trends', getUtilizationTrends);

// Top budgets
router.get('/top-budgets', getTopBudgets);

// Alerts summary
router.get('/alerts-summary', getAlertsSummary);

// Transfer activity
router.get('/transfer-activity', getTransferActivity);

// Approval stats
router.get('/approval-stats', getApprovalStats);

// Fiscal year comparison
router.get('/fiscal-year-comparison', getFiscalYearComparison);

// Budget health score
router.get('/health-score', getBudgetHealthScore);

export default router;
