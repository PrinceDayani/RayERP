import express from 'express';
import {
  getFinanceDashboard,
  getTrialBalance,
  getBalanceSheet,
  getProfitLoss,
  getCashFlow,
  getAccountLedger,
  getBudgetVsActual,
  getFinancialHealth
} from '../controllers/financeController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Dashboard and Summary
router.get('/dashboard', requirePermission('finance.view'), getFinanceDashboard);
router.get('/health', requirePermission('finance.view'), getFinancialHealth);

// Financial Reports
router.get('/trial-balance', requirePermission('finance.view'), getTrialBalance);
router.get('/balance-sheet', requirePermission('finance.view'), getBalanceSheet);
router.get('/profit-loss', requirePermission('finance.view'), getProfitLoss);
router.get('/cash-flow', requirePermission('finance.view'), getCashFlow);

// Account Operations
router.get('/ledger/:accountId', requirePermission('finance.view'), getAccountLedger);

// Budget Reports
router.get('/budget-vs-actual', requirePermission('finance.view'), getBudgetVsActual);

export default router;