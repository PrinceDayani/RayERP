import express from 'express';
import {
  recordProjectExpense,
  getIntegratedDashboard,
  syncAllBudgets,
  getBudgetVarianceAnalysis,
  generateFinancialReport,
  getBudgetAlerts,
  getAccountBalancesWithProjects,
  getBudgetMonitoringStatus
} from '../controllers/integratedFinanceController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Record project expense with real-time sync
router.post('/projects/:projectId/expenses', recordProjectExpense);

// Get integrated financial dashboard
router.get('/projects/:projectId/dashboard', getIntegratedDashboard);

// Sync all project budgets with ledger data
router.post('/budgets/sync', syncAllBudgets);

// Get budget variance analysis
router.get('/projects/:projectId/variance', getBudgetVarianceAnalysis);

// Generate comprehensive financial report
router.get('/projects/:projectId/report', generateFinancialReport);

// Get real-time budget alerts
router.get('/alerts', getBudgetAlerts);

// Get account balances with project breakdown
router.get('/accounts/:accountCode/balances', getAccountBalancesWithProjects);

// Get budget monitoring status
router.get('/monitoring/status', getBudgetMonitoringStatus);

export default router;