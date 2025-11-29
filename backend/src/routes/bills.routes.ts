import express from 'express';
import { createBill, getBills, getBillById, updateBill, deleteBill, makePayment, getBillPayments, getBillsSummary } from '../controllers/billsController';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.post('/', createBill);
router.get('/', getBills);
router.get('/summary', getBillsSummary);
router.get('/:id', getBillById);
router.put('/:id', updateBill);
router.delete('/:id', deleteBill);
router.post('/:id/payments', makePayment);
router.get('/:id/payments', getBillPayments);

export default router;
