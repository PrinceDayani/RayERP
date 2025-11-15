import express from 'express';
import { exportBillsPDF, sendBillReminders, processRecurringBills, getActivityTransactions, getHistoricalCashFlow } from '../controllers/billsController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/export/pdf', exportBillsPDF);
router.post('/reminders/send', sendBillReminders);
router.post('/recurring/process', processRecurringBills);
router.get('/activity-transactions', getActivityTransactions);
router.get('/historical-cashflow', getHistoricalCashFlow);

export default router;
