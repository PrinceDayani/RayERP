import express from 'express';
import { getProfitLoss, getBalanceSheet, getCashFlow, exportReport, getComparativeReport, getAccountTransactions } from '../controllers/financialReportController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/profit-loss', protect, getProfitLoss);
router.get('/balance-sheet', protect, getBalanceSheet);
router.get('/cash-flow', protect, getCashFlow);
router.get('/export', protect, exportReport);
router.get('/comparative', protect, getComparativeReport);
router.get('/account-transactions/:accountId', protect, getAccountTransactions);

export default router;
