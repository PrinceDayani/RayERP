import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createMilestoneBilling,
  getBillingsByProject,
  getBillingById,
  updateBilling,
  submitForApproval,
  approveBilling,
  rejectBilling,
  generateInvoice,
  recordPayment,
  addPaymentSchedule,
  updatePaymentSchedule,
  getBillingAnalytics
} from '../controllers/billingController';

const router = express.Router();

router.post('/', protect, createMilestoneBilling);
router.get('/project/:projectId', protect, getBillingsByProject);
router.get('/project/:projectId/analytics', protect, getBillingAnalytics);
router.get('/:id', protect, getBillingById);
router.put('/:id', protect, updateBilling);
router.post('/:id/submit', protect, submitForApproval);
router.post('/:id/approve', protect, approveBilling);
router.post('/:id/reject', protect, rejectBilling);
router.post('/:id/invoice', protect, generateInvoice);
router.post('/:id/payment', protect, recordPayment);
router.post('/:id/schedules', protect, addPaymentSchedule);
router.put('/:id/schedules/:scheduleId', protect, updatePaymentSchedule);

export default router;
