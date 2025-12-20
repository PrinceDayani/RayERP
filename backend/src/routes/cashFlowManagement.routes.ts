import express from 'express';
import {
  getEntriesNeedingReview,
  overrideCategory,
  batchUpdateCategories,
  createCashFlowRule,
  getCashFlowRules,
  updateCashFlowRule,
  deleteCashFlowRule,
  getCashFlowReconciliation,
  getCategoryStatistics,
  applyRuleToHistoricalData,
  getVarianceAnalysis,
  exportCashFlowReport
} from '../controllers/cashFlowManagementController';
import { protect } from '../middleware/auth.middleware';
import {
  validateCategoryOverride,
  validateBatchUpdate,
  validateCashFlowRule,
  validateReconciliation
} from '../middleware/cashFlowValidation.middleware';
import { cashFlowLimiter, cashFlowWriteLimiter, batchOperationLimiter } from '../middleware/rateLimiter.middleware';

const router = express.Router();

// Apply rate limiting
router.use(cashFlowLimiter);

// Ledger category management
router.get('/entries/needs-review', protect, getEntriesNeedingReview);
router.patch('/entries/:ledgerId/override', protect, cashFlowWriteLimiter, validateCategoryOverride, overrideCategory);
router.patch('/entries/batch-update', protect, batchOperationLimiter, validateBatchUpdate, batchUpdateCategories);

// Rules management
router.post('/rules', protect, cashFlowWriteLimiter, validateCashFlowRule, createCashFlowRule);
router.get('/rules', protect, getCashFlowRules);
router.patch('/rules/:ruleId', protect, cashFlowWriteLimiter, updateCashFlowRule);
router.delete('/rules/:ruleId', protect, cashFlowWriteLimiter, deleteCashFlowRule);
router.post('/rules/:ruleId/apply', protect, batchOperationLimiter, applyRuleToHistoricalData);

// Reports
router.get('/reconciliation', protect, validateReconciliation, getCashFlowReconciliation);
router.get('/statistics', protect, getCategoryStatistics);
router.get('/variance-analysis', protect, validateReconciliation, getVarianceAnalysis);
router.get('/export', protect, validateReconciliation, exportCashFlowReport);

export default router;
