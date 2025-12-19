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
import { financeRateLimiter, reportRateLimiter } from '../middleware/financeRateLimit.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = express.Router();

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(financeRateLimiter);

// Dashboard and Summary (with caching)
router.get('/dashboard', requirePermission('finance.view'), cacheMiddleware(180), getFinanceDashboard);
router.get('/health', requirePermission('finance.view'), cacheMiddleware(60), getFinancialHealth);

// Financial Reports (with caching and report rate limit)
router.get('/trial-balance', requirePermission('finance.view'), reportRateLimiter, cacheMiddleware(300), getTrialBalance);
router.get('/balance-sheet', requirePermission('finance.view'), reportRateLimiter, cacheMiddleware(300), getBalanceSheet);
router.get('/profit-loss', requirePermission('finance.view'), reportRateLimiter, cacheMiddleware(300), getProfitLoss);
router.get('/cash-flow', requirePermission('finance.view'), reportRateLimiter, cacheMiddleware(300), getCashFlow);

// Account Operations (with caching)
router.get('/ledger/:accountId', requirePermission('finance.view'), cacheMiddleware(180), getAccountLedger);

// Budget Reports (with caching)
router.get('/budget-vs-actual', requirePermission('finance.view'), cacheMiddleware(180), getBudgetVsActual);

export default router;