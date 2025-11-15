import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePaymentStatus,
  approvePayment,
  processRefund,
  raiseDispute,
  reconcilePayment,
  createJournalEntry,
  getPaymentAnalytics,
  batchPayments,
  sendReminder
} from '../controllers/paymentController';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createPayment);
router.post('/batch', batchPayments);
router.get('/', getPayments);
router.get('/analytics', getPaymentAnalytics);
router.get('/:id', getPaymentById);
router.put('/:id/status', updatePaymentStatus);
router.post('/:id/approve', approvePayment);
router.post('/:id/refund', processRefund);
router.post('/:id/dispute', raiseDispute);
router.post('/:id/reconcile', reconcilePayment);
router.post('/:id/journal-entry', createJournalEntry);
router.post('/:id/reminder', sendReminder);

export default router;