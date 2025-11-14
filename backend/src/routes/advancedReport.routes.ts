import express from 'express';
import { getAdvancedProfitLoss, getAdvancedBalanceSheet, getCashFlowStatement, getVoucherRegister } from '../controllers/advancedReportController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/profit-loss', getAdvancedProfitLoss);
router.get('/balance-sheet', getAdvancedBalanceSheet);
router.get('/cash-flow', getCashFlowStatement);
router.get('/voucher-register', getVoucherRegister);

export default router;
