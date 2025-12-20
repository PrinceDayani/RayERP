import express from 'express';
import { 
  getProfitLoss, 
  getBalanceSheet, 
  getCashFlow, 
  exportReport, 
  getComparativeReport, 
  getAccountTransactions, 
  getMultiPeriodPL, 
  getPLForecast,
  clearPLCache,
  getPLSummary,
  getMultiPeriodComparison,
  getDepartmentPL,
  getTrialBalance,
  getGeneralLedger,
  getAccountsReceivable,
  getAccountsPayable,
  getExpenseReport,
  getRevenueReport
} from '../controllers/financialReportController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/profit-loss', protect, getProfitLoss);
router.get('/profit-loss/summary', protect, getPLSummary);
router.get('/profit-loss/multi-period', protect, getMultiPeriodComparison);
router.get('/profit-loss/by-department', protect, getDepartmentPL);
router.get('/balance-sheet', protect, getBalanceSheet);
router.get('/cash-flow', protect, getCashFlow);
router.get('/trial-balance', protect, getTrialBalance);
router.get('/general-ledger', protect, getGeneralLedger);
router.get('/accounts-receivable', protect, getAccountsReceivable);
router.get('/accounts-payable', protect, getAccountsPayable);
router.get('/expense-report', protect, getExpenseReport);
router.get('/revenue-report', protect, getRevenueReport);
router.get('/export', protect, exportReport);
router.get('/comparative', protect, getComparativeReport);
router.get('/multi-period', protect, getMultiPeriodPL);
router.get('/forecast', protect, getPLForecast);
router.get('/account-transactions/:accountId', protect, getAccountTransactions);
router.post('/clear-cache', protect, clearPLCache);

export default router;
