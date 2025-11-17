import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getProfitLoss,
  getBalanceSheet,
  getCashFlow,
  getFinancialSummary,
  exportReport
} from '../controllers/financialReportController';

const router = express.Router();

router.use(authenticateToken);

router.get('/profit-loss', getProfitLoss);
router.get('/balance-sheet', getBalanceSheet);
router.get('/cash-flow', getCashFlow);
router.get('/summary', getFinancialSummary);
router.get('/project/:projectId/profit-loss', getProfitLoss);
router.get('/project/:projectId/balance-sheet', getBalanceSheet);
router.get('/project/:projectId/cash-flow', getCashFlow);
router.get('/project/:projectId/summary', getFinancialSummary);
router.get('/export', exportReport);

export default router;