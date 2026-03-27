import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getAllBillings,
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
  getBillingAnalytics,
  reconcilePayment,
  getAuditTrail
} from '../controllers/billingController';

const router = express.Router();

router.get('/all', protect, getAllBillings);
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
router.post('/:id/payment/:paymentId/reconcile', protect, reconcilePayment);
router.post('/:id/schedules', protect, addPaymentSchedule);
router.put('/:id/schedules/:scheduleId', protect, updatePaymentSchedule);
router.get('/:id/audit-trail', protect, getAuditTrail);

export default router;
